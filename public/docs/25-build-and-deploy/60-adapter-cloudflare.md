---
title: Cloudflare
---

要部署到 [Cloudflare Workers](https://workers.cloudflare.com/) 或 [Cloudflare Pages](https://pages.cloudflare.com/)，请使用 [`adapter-cloudflare`](https://github.com/sveltejs/kit/tree/main/packages/adapter-cloudflare)。

当你使用 [`adapter-auto`](adapter-auto) 时，这个适配器会默认被安装。如果你打算继续使用 Cloudflare，你可以从 [`adapter-auto`](adapter-auto) 切换到直接使用这个适配器，这样 `event.platform` 会在本地开发期间被模拟、类型声明会被自动应用，并且能够提供设置特定于 Cloudflare 的选项的能力。

## 对比

- `adapter-cloudflare` – 支持所有 SvelteKit 功能；为 Cloudflare Workers Static Assets 和 Cloudflare Pages 构建
- `adapter-cloudflare-workers` – 已弃用。支持所有 SvelteKit 功能；为 Cloudflare Workers Sites 构建
- `adapter-static` – 只生成客户端静态资源；与 Cloudflare Workers Static Assets 和 Cloudflare Pages 兼容

## 用法

用 `npm i -D @sveltejs/adapter-cloudflare` 安装，然后将适配器添加到你的 `vite.config.js`：

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
				// 请见下文对这些选项的解释
				config: undefined,
				platformProxy: {
					configPath: undefined,
					environment: undefined,
					persist: undefined
				},
				fallback: 'plaintext',
				routes: {
					include: ['/*'],
					exclude: ['<all>']
				}
			})
		})
	]
});
```

## 选项

### config

指向你的 [Wrangler 配置文件](https://developers.cloudflare.com/workers/wrangler/configuration/) 的路径。如果你想使用的 Wrangler 配置文件名不是 `wrangler.jsonc`、`wrangler.json` 或 `wrangler.toml`，你可以用这个选项来指定它。

### platformProxy

模拟的 `platform.env` 本地绑定的偏好设置。有关选项的完整列表，请参阅 [getPlatformProxy](https://developers.cloudflare.com/workers/wrangler/api/#parameters-1) Wrangler API 文档。

### fallback

是否为不匹配的资源请求渲染一个纯文本的 404.html 页面，或一个已渲染的 SPA 回退页面。

对于 Cloudflare Workers，默认行为是为不匹配的资源请求返回一个空主体的 404 状态响应。然而，如果 [`assets.not_found_handling`](https://developers.cloudflare.com/workers/static-assets/routing/#2-not_found_handling) Wrangler 配置设置被设为 `"404-page"`，当请求未能匹配一个资源时，就会提供这个页面。如果 `assets.not_found_handling` 被设为 `"single-page-application"`，无论指定了什么 `fallback` 选项，适配器都会渲染一个 SPA 回退 `index.html` 页面。

对于 Cloudflare Pages，只有当一个匹配 `routes.exclude` 中某项的请求未能匹配一个资源时，这个页面才会被提供。

大多数情况下 `plaintext` 就足够了，但如果你正在使用 `routes.exclude` 来手动排除一组预渲染页面而不超过 100 条路由限制，你可能希望改用 `spa`，以避免向用户显示一个无样式的 404 页面。

有关更多信息，请参阅 Cloudflare Pages 的 [Not Found 行为](https://developers.cloudflare.com/pages/configuration/serving-pages/#not-found-behavior)。

### routes

仅适用于 Cloudflare Pages。允许你自定义由 `adapter-cloudflare` 生成的 [`_routes.json`](https://developers.cloudflare.com/pages/functions/routing/#create-a-_routesjson-file) 文件。

- `include` 定义了将调用函数的路由，默认为 `['/*']`
- `exclude` 定义了将_不_调用函数的路由——这是为你的应用的静态资源提供服务的一种更快且更便宜的方式。这个数组可以包含以下特殊值：
	- `<build>` 包含你应用的构建产物（由 Vite 生成的文件）
	- `<files>` 包含你的 `static` 目录的内容
	- `<redirects>` 包含你根目录中 [`_redirects` 文件](https://developers.cloudflare.com/pages/configuration/redirects/) 中的路径名列表
	- `<prerendered>` 包含预渲染页面的列表
	- `<all>`（默认）包含以上所有

你最多可以有 100 条 `include` 和 `exclude` 规则的组合。通常你可以省略 `routes` 选项，但如果（例如）你的 `<prerendered>` 路径超过了这个限制，你可能会发现手动创建一个包含 `'/articles/*'` 而不是自动生成的 `['/articles/foo', '/articles/bar', '/articles/baz', ...]` 的 `exclude` 列表会很有帮助。

## Cloudflare Workers

### 基础配置

当为 Cloudflare Workers 构建时，此适配器期望在项目根目录中找到一份 [Wrangler 配置文件](https://developers.cloudflare.com/workers/configuration/sites/configuration/)。它应该看起来像这样：

```jsonc
/// file: wrangler.jsonc
{
	"name": "<任何你想要的名称>",
	"main": ".svelte-kit/cloudflare/_worker.js",
	"compatibility_flags": ["nodejs_als"],
	"compatibility_date": "<YYYY-MM-DD>",
	"assets": {
		"binding": "ASSETS",
		"directory": ".svelte-kit/cloudflare",
	}
}
```

### 部署

你可以使用 Wrangler CLI 通过运行 `npx wrangler deploy` 来部署你的应用，或者使用 [Cloudflare Git 集成](https://developers.cloudflare.com/workers/ci-cd/builds/) 来在推送时启用自动构建和部署。

## Cloudflare Pages

### 部署

请遵循 Cloudflare Pages 的 [入门指南](https://developers.cloudflare.com/pages/get-started/) 开始。

如果你正在使用 [Git 集成](https://developers.cloudflare.com/pages/get-started/git-integration/)，你的构建设置应该看起来像这样：

- 框架预设 – SvelteKit
- 构建命令 – `npm run build` 或 `vite build`
- 构建输出目录 – `.svelte-kit/cloudflare`

一旦配置好，进入你项目设置的 **Runtime**（运行时）部分，并添加 `nodejs_als` 兼容性标志以启用 [Node.js AsyncLocalStorage](https://developers.cloudflare.com/workers/configuration/compatibility-flags/#nodejs-asynclocalstorage)。或者，在你的 wrangler 配置中使用 `compatibility_flags` 数组来做到这一点。

### 延伸阅读

你可能想参考 [Cloudflare 关于在 Cloudflare Pages 上部署 SvelteKit 站点的文档](https://developers.cloudflare.com/pages/framework-guides/deploy-a-svelte-kit-site/)。

### 注意事项

位于项目根目录 [`/functions` 目录](https://developers.cloudflare.com/pages/functions/routing/) 中的函数将_不会_被包含在部署中。相反，函数应该实现为你 SvelteKit 应用中的[服务器端点](routing#server)，它会被编译为一个[单独的 `_worker.js` 文件](https://developers.cloudflare.com/pages/functions/advanced-mode/)。

## 运行时 API

[`env`](https://developers.cloudflare.com/workers/runtime-apis/fetch-event#parameters) 对象包含你项目的 [bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/)（绑定），它们由 KV/DO 命名空间等组成。它与 [`ctx`](https://developers.cloudflare.com/workers/runtime-apis/context/)、[`caches`](https://developers.cloudflare.com/workers/runtime-apis/cache/) 和 [`cf`](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties) 一起通过 `platform` 属性传递给 SvelteKit，这意味着你可以在钩子和端点中访问它：

```js
// @filename: ambient.d.ts
import { DurableObjectNamespace } from '@cloudflare/workers-types';

declare global {
	namespace App {
		interface Platform {
			env: {
				YOUR_DURABLE_OBJECT_NAMESPACE: DurableObjectNamespace;
			};
		}
	}
}
// @filename: +server.js
// ---cut---
// @errors: 2355 2322
/// file: +server.js
/** @type {import('./$types').RequestHandler} */
export async function POST({ request, platform }) {
	const x = platform?.env.YOUR_DURABLE_OBJECT_NAMESPACE.idFromName('x');
}
```

> [!NOTE] 对于环境变量，应该优先使用 SvelteKit 内置的 [`$app/env/*` 模块](environment-variables)。

要让这些类型对你的应用可用，请安装 [`@cloudflare/workers-types`](https://www.npmjs.com/package/@cloudflare/workers-types) 并在你的 `src/app.d.ts` 中引用它们：

```ts
/// file: src/app.d.ts
+++import { KVNamespace, DurableObjectNamespace } from '@cloudflare/workers-types';+++

declare global {
	namespace App {
		interface Platform {
+++			env: {
				YOUR_KV_NAMESPACE: KVNamespace;
				YOUR_DURABLE_OBJECT_NAMESPACE: DurableObjectNamespace;
			};+++
		}
	}
}

export {};
```

### 本地测试

`platform` 属性中特定于 Cloudflare 的值在开发（dev）和预览（preview）模式下被模拟。本地 [bindings](https://developers.cloudflare.com/workers/wrangler/configuration/#bindings) 是基于你的 [Wrangler 配置文件](https://developers.cloudflare.com/workers/wrangler/) 创建的，并用于在开发和预览期间填充 `platform.env`。使用适配器配置 [`platformProxy` 选项](#Options-platformProxy) 来更改你对绑定的偏好。

要测试构建，你应该使用 [Wrangler](https://developers.cloudflare.com/workers/wrangler/) 第 4 版。一旦你构建了站点，如果你在测试 Cloudflare Workers，运行 `wrangler dev .svelte-kit/cloudflare/_worker.js`；如果你在测试 Cloudflare Pages，运行 `wrangler pages dev .svelte-kit/cloudflare`。

## 头与重定向

特定于 Cloudflare 的 [`_headers`](https://developers.cloudflare.com/pages/configuration/headers/) 和 [`_redirects`](https://developers.cloudflare.com/pages/configuration/redirects/) 文件可以通过将它们放在项目根文件夹中，用于静态资源响应（如图像）。

然而，它们对由 SvelteKit 动态渲染的响应没有任何效果，后者应该从[服务器端点](routing#server) 或使用 [`handle`](hooks#Server-hooks-handle) 钩子返回自定义头或重定向响应。

## 故障排除

### Node.js 兼容性

如果你想启用 [Node.js 兼容性](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)，你可以将 `nodejs_compat` 兼容性标志添加到你的 Wrangler 配置文件中：

```jsonc
/// file: wrangler.jsonc
{
	"compatibility_flags": ["nodejs_compat"]
}
```

### Worker 大小限制

在部署你的应用时，由 SvelteKit 生成的服务器被打包进一个单独的文件。如果在压缩后它超过了[大小限制](https://developers.cloudflare.com/workers/platform/limits/#worker-size)，Wrangler 将无法发布你的 worker。通常你不太会碰到这个限制，但一些大型库可能会导致这种情况发生。在这种情况下，你可以尝试通过只在客户端导入此类库来减小你的 worker 的大小。更多信息请参阅 [FAQ](./faq#How-do-I-use-a-client-side-library-accessing-document-or-window)。

### 访问文件系统

你不能在 Cloudflare Workers 中使用 `fs`。

相反，请使用来自 `$app/server` 的 [`read`]($app-server#read) 函数来访问你的文件。它通过从已部署的公共资源位置获取文件来工作。

或者，你可以[预渲染](page-options#prerender) 相关的路由。

## 从 Workers Sites 迁移

Cloudflare 不再推荐使用 [Workers Sites](https://developers.cloudflare.com/workers/configuration/sites/configuration/)，而是推荐使用 [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)。要迁移，请将 `@sveltejs/adapter-cloudflare-workers` 替换为 `@sveltejs/adapter-cloudflare`，并从你的 Wrangler 配置文件中移除所有 `site` 配置设置，然后添加 `assets.directory` 和 `assets.binding` 配置设置：

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
+++assets.directory = ".cloudflare/public"
assets.binding = "ASSETS" # 如果你没有配置 `main` 键，则排除此项。+++
```

### wrangler.jsonc

```jsonc
/// file: wrangler.jsonc
{
---	"site": {
		"bucket": ".cloudflare/public"
	},---
+++	"assets": {
		"directory": ".cloudflare/public",
		"binding": "ASSETS" // 如果你没有配置 `main` 键，则排除此项。
	}+++
}
```
