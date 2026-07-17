---
title: 常见问题
---

## 其他资源

也请参阅[ Svelte FAQ](../svelte/faq) 和 [`vite-plugin-svelte` FAQ](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/faq.md) 以获取来自这些库的相关问题解答。

## 我可以用 SvelteKit 制作什么？

更多细节请参阅[关于项目类型的文档](project-types)。

## 如何在我的应用中包含来自 package.json 的详情？

如果你想在应用中包含应用的版本号或 `package.json` 中的其他信息，你可以像这样加载 JSON：

```ts
// @errors: 2732
/// file: vite.config.js
import pkg from './package.json' with { type: 'json' };
```

## 我该如何修复在尝试引入某个包时遇到的错误？

大多数与引入库相关的问题都源于不正确的打包方式。你可以通过将其输入到 [publint 网站](https://publint.dev/) 来检查一个库的打包方式是否与 Node.js 兼容。

在检查一个库是否被正确打包时，有几点需要记住：

- `exports` 优先于其他入口点字段，如 `main` 和 `module`。添加 `exports` 字段可能与旧版本不兼容，因为它会阻止深层导入（deep imports）。
- ESM 文件应以 `.mjs` 结尾，除非设置了 `"type": "module"`；在任何情况下，CommonJS 文件都应以 `.cjs` 结尾。
- 如果未定义 `exports`，则应该定义 `main`。它应该是 CommonJS 或 ESM 文件，并遵循上一条。如果定义了 `module` 字段，它应该指向一个 ESM 文件。
- Svelte 组件应该以未编译的 `.svelte` 文件形式分发，包中的任何 JS 都应只写成 ESM。像 TypeScript 和 SCSS 这样的自定义脚本和样式语言，应分别被预处理为原生 JS 和 CSS。我们建议使用 [`svelte-package`](./packaging) 来打包 Svelte 库，它会替你完成这些工作。

库在浏览器中与 Vite 配合使用时，分发 ESM 版本效果最好，尤其是当它们是某个 Svelte 组件库的依赖时。你可能希望建议库作者提供 ESM 版本。不过，CommonJS（CJS）依赖也应该可以工作，因为默认情况下，[`vite-plugin-svelte` 会让 Vite 使用 `rolldown` 预打包它们](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/faq.md#what-is-going-on-with-vite-and-pre-bundling-dependencies) 以将它们转换为 ESM。

如果你仍然遇到问题，我们建议同时搜索 [Vite 的问题跟踪器](https://github.com/vitejs/vite/issues) 和相关库的问题跟踪器。有时可以通过调整 [`optimizeDeps`](https://vitejs.dev/config/#dep-optimization-options) 或 [`ssr`](https://vitejs.dev/config/#ssr-options) 配置值来绕过问题，尽管我们仅建议将此作为短期变通方案，而优先修复相关库本身。

## 我该如何使用视图过渡（view transitions）API？

虽然 SvelteKit 没有与 [view transitions](https://developer.chrome.com/docs/web-platform/view-transitions/) 的任何特定集成，但你可以在 [`onNavigate`]($app-navigation#onNavigate) 中调用 `document.startViewTransition` 来在每次客户端导航时触发视图过渡。

```js
// @errors: 2339 2810
import { onNavigate } from '$app/navigation';

onNavigate((navigation) => {
	if (!document.startViewTransition) return;

	return new Promise((resolve) => {
		document.startViewTransition(async () => {
			resolve();
			await navigation.complete;
		});
	});
});
```

更多内容，请参阅 Svelte 博客上的["解锁视图过渡"](/blog/view-transitions)。

## 我该如何设置数据库？

把查询数据库的代码放在一个[服务端路由](./routing#server)中——不要直接在 .svelte 文件中查询数据库。你可以创建一个 `db.js` 或类似文件，在启动时立即建立连接，并将客户端作为单例在整个应用中可用。你可以在 `hooks.server.js` 中执行任何一次性设置代码，并将你的数据库辅助函数导入到任何需要它们的端点中。

你可以使用 [Svelte CLI](/docs/cli/overview) 来自动设置数据库集成。

## 我该如何使用访问 `document` 或 `window` 的客户端库？

如果你需要访问 `document` 或 `window` 变量，或者以其他方式需要代码仅在客户端运行，你可以将其包裹在一个 `browser` 检查中：

```js
/// <reference types="@sveltejs/kit" />
// ---cut---
import { browser } from '$app/env';

if (browser) {
	// client-only code here
}
```

如果你希望在组件首次渲染到 DOM 之后运行代码，你也可以在 `onMount` 中运行：

```js
// @filename: ambient.d.ts
// @lib: ES2015
declare module 'some-browser-only-library';

// @filename: index.js
// ---cut---
import { onMount } from 'svelte';

onMount(async () => {
	const { method } = await import('some-browser-only-library');
	method('hello world');
});
```

如果你想要使用的库是无副作用的，你也可以静态导入它，它会在服务端构建中被 tree-shake（摇树优化）掉，其中 `onMount` 会被自动替换为一个空操作（no-op）：

```js
// @filename: ambient.d.ts
// @lib: ES2015
declare module 'some-browser-only-library';

// @filename: index.js
// ---cut---
import { onMount } from 'svelte';
import { method } from 'some-browser-only-library';

onMount(() => {
	method('hello world');
});
```

最后，你也可以考虑使用 `{#await}` 块：
```svelte
<!--- file: index.svelte --->
<script>
	import { browser } from '$app/env';

	const promise = browser
		? import('./BrowserComponent.svelte')
		: import('./ServerComponent.svelte');
</script>

{#await promise}
	<p>Loading...</p>
{:then module}
	<module.default />
{:catch error}
	<p>Something went wrong: {error.message}</p>
{/await}
```

## 我该如何使用不同的后端 API 服务器？

你可以使用 [`event.fetch`](./load#Making-fetch-requests) 从外部 API 服务器请求数据，但要注意你需要处理 [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)，这会导致诸如通常需要预检（preflight）请求从而导致更高延迟等复杂情况。对单独子域的请求也可能因额外的 DNS 查找、TLS 设置等而增加延迟。如果你想使用这种方法，你可能会发现 [`handleFetch`](./hooks#Server-hooks-handleFetch) 很有帮助。

另一种方法是设置一个代理来绕过 CORS 的麻烦。在生产环境中，你会将像 `/api` 这样的路径重写到 API 服务器；对于本地开发，请使用 Vite 的 [`server.proxy`](https://vitejs.dev/config/server-options.html#server-proxy) 选项。

如何在生产环境中设置重写取决于你的部署平台。如果重写不是一个选项，你也可以添加一个 [API 路由](./routing#server)：

```js
/// file: src/routes/api/[...path]/+server.js
/** @type {import('./$types').RequestHandler} */
export function GET({ params, url }) {
	return fetch(`https://example.com/${params.path + url.search}`);
}
```

（注意，你可能还需要代理 `POST`/`PATCH` 等请求，并根据需要转发 `request.headers`。）

## 我该如何使用中间件（middleware）？

`@sveltejs/adapter-node` 会构建一个中间件，你可以在生产模式中与自己的服务器一起使用。在开发模式下，你可以通过使用 Vite 插件向 Vite 添加中间件。例如：

```js
// @errors: 2307
/// file: vite.config.js
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

+++/** @type {import('vite').Plugin} */
const myPlugin = {
	name: 'log-request-middleware',
	configureServer(server) {
		server.middlewares.use((req, res, next) => {
			console.log(`Got request ${req.url}`);
			next();
		});
	}
};+++

export default defineConfig({
	plugins: [
		+++myPlugin,+++
		sveltekit({
			adapter: adapter()
		})
	]
});
```

更多细节（包括如何控制顺序）请参阅 [Vite 的 `configureServer` 文档](https://vitejs.dev/guide/api-plugin.html#configureserver)。

## 我该如何使用 Yarn？

### 它能与 Yarn 2 一起工作吗？

算是可以。Plug'n'Play 特性（即 'pnp'）是坏的（它偏离了 Node 的模块解析算法，并且[尚不能与原生 JavaScript 模块一起工作](https://github.com/yarnpkg/berry/issues/638)，而 SvelteKit——以及[越来越多的包](https://github.com/wooorm/npm-esm-vs-cjs)——都使用原生 JavaScript 模块）。你可以在 [`.yarnrc.yml`](https://yarnpkg.com/configuration/yarnrc#nodeLinker) 文件中使用 `nodeLinker: 'node-modules'` 来禁用 pnp，但直接使用 npm 或 [pnpm](https://pnpm.io/) 可能更简单，它们同样快速高效，却没有兼容性上的麻烦。

### 我该如何与 Yarn 3 一起使用？

目前最新版 Yarn（3 版本）中的 ESM 支持被认为是[实验性的](https://github.com/yarnpkg/berry/pull/2161)。

下面的方法似乎可行，不过你的结果可能有所不同。首先创建一个新应用：

```sh
yarn create svelte myapp
cd myapp
```

并启用 Yarn Berry：

```sh
yarn set version berry
yarn install
```

Yarn Berry 一个更有趣的特性是能够拥有一个全局的包缓存，而不是在磁盘上为每个项目保留多份副本。然而，将 `enableGlobalCache` 设为 true 会导致构建失败，因此建议将以下内容添加到 `.yarnrc.yml` 文件中：

```yaml
nodeLinker: node-modules
```

这会将包下载到本地的 node_modules 目录中，同时避免了上述问题，在现阶段这是你使用 Yarn 3 的最佳选择。
