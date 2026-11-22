---
title: Cloudflare
---

要部署到 [Cloudflare Workers](https://workers.cloudflare.com/)，请使用 [`adapter-cloudflare`](https://github.com/sveltejs/kit/tree/main/packages/adapter-cloudflare)。

当你使用 [`adapter-auto`](adapter-auto) 时，这个适配器会默认被安装。如果你打算继续使用 Cloudflare，可以从 [`adapter-auto`](adapter-auto) 切换为直接使用此适配器，这样在本地开发期间会模拟 `cloudflare:workers`，类型声明会自动应用，并且可以设置 Cloudflare 特有的选项。

## 对比

- `adapter-cloudflare` —— 支持所有 SvelteKit 功能；为 Cloudflare Workers Static Assets 构建
- `adapter-cloudflare-workers` —— 已弃用。支持所有 SvelteKit 功能；为 Cloudflare Workers Sites 构建
- `adapter-static` —— 只生成客户端静态资源；兼容 Cloudflare Workers Static Assets 和 Cloudflare Pages

## 用法

运行 [`npx sv add sveltekit-adapter="adapter:cloudflare"`](/docs/cli/sveltekit-adapter)，或者用 `npm i -D @sveltejs/adapter-cloudflare` 安装，然后将适配器添加到你的 `vite.config.js`：

```js
// @errors: 2307
/// file: vite.config.js
import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter({
				// 见下文对这些选项的说明
				config: undefined,
				platformProxy: {
					configPath: undefined,
					environment: undefined,
					persist: undefined
				},
				worker: true
			})
		})
	]
});
```

## 选项

### config

指向你的 [Wrangler 配置文件](https://developers.cloudflare.com/workers/wrangler/configuration/) 的路径。如果你想使用的 Wrangler 配置文件名不是 `wrangler.jsonc`、`wrangler.json` 或 `wrangler.toml`，你可以用这个选项来指定它。

### platformProxy

模拟的 `env` 本地绑定的偏好设置。有关选项的完整列表，请参阅 [getPlatformProxy](https://developers.cloudflare.com/workers/wrangler/api/#parameters-1) Wrangler API 文档。

### worker

是否构建 Worker。默认为 `true`。如果你只想部署静态资源，请将其设置为 `false`。在这种情况下，[`assets.not_found_handling`](https://developers.cloudflare.com/workers/static-assets/#routing-behavior) 会被设置为 `"404-page"`（如果尚未设置的话）。

## 部署

你可以使用 Wrangler CLI 通过运行 `npx wrangler deploy` 来部署你的应用，或者使用 [Cloudflare Git 集成](https://developers.cloudflare.com/workers/ci-cd/builds/) 在推送时自动构建和部署。

## 运行时 API

[`env`](https://developers.cloudflare.com/workers/runtime-apis/fetch-event#parameters) 对象包含你项目的 [bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/)（绑定），它们由 KV/DO 命名空间等组成。它可以通过 [`cloudflare:workers`](https://developers.cloudflare.com/workers/runtime-apis/bindings/#importing-env-as-a-global) 模块访问。

```js
/// file: +server.js
// @filename: ambient.d.ts
declare module 'cloudflare:workers' {
	export const env: {
		YOUR_DURABLE_OBJECT_NAMESPACE: import('@cloudflare/workers-types').DurableObjectNamespace;
	};
}
// @filename: +server.js
// ---cut---
// @errors: 2355 2322
import { env } from 'cloudflare:workers';

/** @type {import('./$types').RequestHandler} */
export async function POST() {
	const x = env.YOUR_DURABLE_OBJECT_NAMESPACE.idFromName('x');
}
```

> [!NOTE] 对于环境变量，应该优先使用 SvelteKit 内置的 [`$app/env/*` 模块](environment-variables)。

要让这些类型对你的应用可用，请安装 [`wrangler`](https://www.npmjs.com/package/wrangler) 并运行 [`wrangler types`](https://developers.cloudflare.com/workers/languages/typescript/)。

### 本地测试

特定于 Cloudflare 的值在开发（dev）和预览（preview）模式下被模拟。本地 [bindings](https://developers.cloudflare.com/workers/wrangler/configuration/#bindings) 是基于你的 [Wrangler 配置文件](https://developers.cloudflare.com/workers/wrangler/) 创建的，并用于在开发和预览期间填充 `env`。使用适配器配置 [`platformProxy` 选项](#Options-platformProxy) 来更改你对绑定的偏好。

> [!NOTE] [Durable Objects](https://developers.cloudflare.com/durable-objects/) 和 [Workflows](https://developers.cloudflare.com/workflows/) 需要从你的 worker 中导出自定义类，目前尚不支持。

要测试构建，你应该使用 [Wrangler](https://developers.cloudflare.com/workers/wrangler/) 第 4 版。一旦你构建了站点，运行 `wrangler dev`。

## 请求头与重定向

特定于 Cloudflare 的 [`_headers`](https://developers.cloudflare.com/workers/static-assets/headers/) 和 [`_redirects`](https://developers.cloudflare.com/workers/static-assets/redirects/) 文件可以用于静态资源响应（如图像），方法是将它们放在项目根文件夹中。

然而，它们对 SvelteKit 动态渲染的响应没有影响——这些响应应通过[服务器端点](routing#server) 或使用 [`handle`](hooks#handle) 钩子返回自定义头或重定向响应。

## 故障排除

### Worker 大小限制

如果在压缩后你的 Worker 文件超过了[大小限制](https://developers.cloudflare.com/workers/platform/limits/#worker-size)，部署你的应用将会失败。通常你不太会碰到这个限制，但一些大型库可能会导致这种情况发生。在这种情况下，你可以尝试通过只在客户端导入此类库来减小你的 worker 的大小。更多信息请参阅 [FAQ](./faq#How-do-I-use-a-client-side-library-accessing-document-or-window)。

### 访问文件系统

你不能在 Cloudflare Workers 中使用 `fs`。

请改为使用来自 `$app/server` 的 [`read`]($app-server#read) 函数来访问你的文件。它的工作原理是从已部署的公共资源位置获取文件。

或者，你可以[预渲染](page-options#prerender) 相关的路由。

## 从 Workers Sites 迁移

Cloudflare 不再推荐使用 [Workers Sites](https://developers.cloudflare.com/workers/configuration/sites/configuration/)，而是推荐使用 [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)。要迁移，请将 `@sveltejs/adapter-cloudflare-workers` 替换为 `@sveltejs/adapter-cloudflare`，并从你的 Wrangler 配置文件中移除 `main` 以及所有 `site` 配置设置。

```js
// @errors: 2307
/// file: vite.config.js
+++import adapter from '@sveltejs/adapter-cloudflare';+++
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			+++adapter: adapter()+++
		})
	]
});
```

### wrangler.toml

```toml
/// file: wrangler.toml
---site.bucket = ".cloudflare/public"---
```

### wrangler.jsonc

```jsonc
/// file: wrangler.jsonc
{
---	"site": {
		"bucket": ".cloudflare/public"
	}---
}
```

## 从 Cloudflare Pages 迁移

要迁移到 Cloudflare Workers：

1. 从你的 Wrangler 配置中移除 `pages_build_output_dir`。
2. 移除适配器的 `routes` 选项以及任何 `_routes.json` 文件。
3. 将 `wrangler pages dev` 和 `wrangler pages deploy` 分别替换为 `wrangler dev` 和 `wrangler deploy`。对于自动部署，请使用 [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) 而不是 Pages Git 集成。

有关支持功能的对比，请参阅 Cloudflare 的 [Workers 与 Pages 兼容性矩阵](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/#compatibility-matrix)。
