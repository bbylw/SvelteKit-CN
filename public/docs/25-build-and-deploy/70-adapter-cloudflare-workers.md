---
title: Cloudflare Workers
---

> [!NOTE] `adapter-cloudflare-workers` 已被弃用，取而代之的是 [`adapter-cloudflare`](adapter-cloudflare)。我们推荐使用 `adapter-cloudflare` 配合 [Static Assets](https://developers.cloudflare.com/workers/static-assets/) 部署到 Cloudflare Workers，因为 Cloudflare Workers Sites 将被弃用以支持它。

要使用 [Workers Sites](https://developers.cloudflare.com/workers/configuration/sites/) 部署到 [Cloudflare Workers](https://workers.cloudflare.com/)，请使用 `adapter-cloudflare-workers`。

## 用法

用 `npm i -D @sveltejs/adapter-cloudflare-workers` 安装，然后将适配器添加到你的 `svelte.config.js`：

```js
// @errors: 2307
/// file: svelte.config.js
import adapter from '@sveltejs/adapter-cloudflare-workers';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// 见下文可在此设置的选项
		})
	}
};

export default config;
```

## 选项

### config

指向你的 [Wrangler 配置文件](https://developers.cloudflare.com/workers/wrangler/configuration/) 的路径。如果你想使用的 Wrangler 配置文件名不是 `wrangler.jsonc`、`wrangler.json` 或 `wrangler.toml`，你可以用这个选项来指定它。

### platformProxy

模拟的 `platform.env` 本地绑定的偏好设置。有关选项的完整列表，请参阅 [getPlatformProxy](https://developers.cloudflare.com/workers/wrangler/api/#parameters-1) Wrangler API 文档。

## 基础配置

此适配器期望在项目根目录中找到一份 [Wrangler 配置文件](https://developers.cloudflare.com/workers/configuration/sites/configuration/)。它应该看起来像这样：

```jsonc
/// file: wrangler.jsonc
{
	"name": "<你的服务名称>",
	"account_id": "<你的账户 ID>",
	"main": "./.cloudflare/worker.js",
	"site": {
		"bucket": "./.cloudflare/public"
	},
	"build": {
		"command": "npm run build"
	},
	"compatibility_date": "2021-11-12"
}
```

`<你的服务名称>` 可以是任何东西。`<你的账户 ID>` 可以通过使用 Wrangler CLI 工具运行 `wrangler whoami`，或者通过登录你的 [Cloudflare 仪表板](https://dash.cloudflare.com) 并从 URL 末尾获取：

```
https://dash.cloudflare.com/<你的账户 ID>/home
```

> [!NOTE] 你应该将 `.cloudflare` 目录（或者你为 `main` 和 `site.bucket` 指定的任何目录）以及 `.wrangler` 目录添加到你的 `.gitignore` 中。

你将需要安装 [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) 并登录（如果你还没有的话）：

```sh
npm i -D wrangler
wrangler login
```

然后，你可以构建你的应用并部署它：

```sh
wrangler deploy
```

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
+++			env?: {
				YOUR_KV_NAMESPACE: KVNamespace;
				YOUR_DURABLE_OBJECT_NAMESPACE: DurableObjectNamespace;
			};+++
		}
	}
}

export {};
```

### 本地测试

`platform` 属性中特定于 Cloudflare Workers 的值在开发（dev）和预览（preview）模式下被模拟。本地 [bindings](https://developers.cloudflare.com/workers/wrangler/configuration/#bindings) 是基于你的 [Wrangler 配置文件](https://developers.cloudflare.com/workers/wrangler/) 创建的，并用于在开发和预览期间填充 `platform.env`。使用适配器配置 [`platformProxy` 选项](#Options-platformProxy) 来更改你对绑定的偏好。

要测试构建，你应该使用 [Wrangler](https://developers.cloudflare.com/workers/wrangler/) 第 4 版。一旦你构建了站点，运行 `wrangler dev`。

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

你不能在 Cloudflare Workers 中使用 `fs`——你必须[预渲染](page-options#prerender) 相关的路由。
