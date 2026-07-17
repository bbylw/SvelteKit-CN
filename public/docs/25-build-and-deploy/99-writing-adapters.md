---
title: 编写适配器
---

如果你偏好的环境还没有适配器，你可以自己构建。我们建议[查看与你平台类似的适配器的源码](https://github.com/sveltejs/kit/tree/main/packages)，并将其作为起点复制。

适配器包实现了以下 API，它创建一个 `Adapter`：

```js
// @errors: 2322
// @filename: ambient.d.ts
type AdapterSpecificOptions = any;

// @filename: index.js
// ---cut---
/** @param {AdapterSpecificOptions} options */
export default function (options) {
	/** @type {import('@sveltejs/kit').Adapter} */
	const adapter = {
		name: 'adapter-package-name',
		async adapt(builder) {
			// 适配器实现
		},
		async emulate() {
			return {
				async platform({ config, prerender }) {
					// 返回的对象在开发、构建和预览期间成为 `event.platform`。
					// 它的形状是 `App.Platform` 的形状
				}
			}
		},
		supports: {
			read: ({ config, route }) => {
				// 如果具有给定 `config` 的路由可以在生产环境中
				// 使用来自 `$app/server` 的 `read`，则返回 `true`；
				// 如果不能，则返回 `false`。
				// 或者抛出一个描述如何配置部署的说明性错误
			},
			instrumentation: () => {
				// 如果此适配器支持加载 `instrumentation.server.js`，则返回 `true`。
				// 如果不能，则返回 `false`，或者抛出一个说明性错误。
			}
		},
		vite: {
			plugins: [
				// 在此添加插件以与 Vite 集成
			]
		}
	};

	return adapter;
}
```

其中，`name` 和 `adapt` 是必需的。`emulate`、`vite.plugins` 和 `supports` 是可选的。

在 `adapt` 方法中，适配器应该做以下几件事：

- 清空构建目录
- 用 `builder.writeClient`、`builder.writeServer` 和 `builder.writePrerendered` 写入 SvelteKit 输出
- 输出代码，该代码：
	- 从 `${builder.getServerDirectory()}/index.js` 导入 `Server`
	- 用 `builder.generateManifest({ relativePath })` 生成的清单实例化应用
	- 监听来自平台的请求，如有必要将其转换为标准的 [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)，调用 `server.respond(request, { getClientAddress })` 函数以生成 [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) 并对其作出响应
	- 通过传给 `server.respond` 的 `platform` 选项，将任何平台特定的信息暴露给 SvelteKit
- 如有必要，打包输出，以避免需要在目标平台上安装依赖
- 将用户的静态文件和生成的 JS/CSS 放在目标平台的正确位置

在可能的情况下，我们建议将适配器输出放在 `build/` 目录下，任何中间输出放在 `.svelte-kit/[adapter-name]` 下。
