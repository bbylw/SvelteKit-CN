---
title: Vercel
---

要部署到 Vercel，请使用 [`adapter-vercel`](https://github.com/sveltejs/kit/tree/main/packages/adapter-vercel)。

如果你想在 Vercel 上试用 SvelteKit，可以从某个 [Vercel SvelteKit 模板](https://vercel.com/templates/svelte?search=SvelteKit) 开始。

当你使用 [`adapter-auto`](adapter-auto) 时，这个适配器会默认被安装，但将其添加到你的项目中允许你指定特定于 Vercel 的选项。

## 用法

运行 [`npx sv add sveltekit-adapter="adapter:vercel"`](/docs/cli/sveltekit-adapter)，或者用 `npm i -D @sveltejs/adapter-vercel` 安装，然后将适配器添加到你的 `vite.config.js`：

```js
// @errors: 2554
/// file: vite.config.js
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter({
				// 见下文可在此设置的选项
			})
		})
	]
});
```

## 部署配置

要控制你的路由如何作为函数部署到 Vercel，你可以指定部署配置，既可以通过上面所示的选项，也可以通过 `+server.js`、`+page(.server).js` 和 `+layout(.server).js` 文件内部的 [`export const config`](page-options#config)。

例如，你可以将一个特定的路由部署为一个独立的无服务器函数，与你的应用的其他部分分开：

```js
/// file: about/+page.js
/** @type {import('@sveltejs/adapter-vercel').Config} */
export const config = {
	split: true
};
```

你可以设置以下选项：

- `runtime`：Node 版本（例如 `'nodejs22.x'`、`'nodejs24.x'`、`'nodejs26.x'`）、`bun1.x` 或 `bun1.4.x`。默认情况下，适配器会选择用于构建的运行时，它与你项目在 Vercel 仪表板上配置使用的 Node 版本相对应，除非你[使用 Bun 构建应用](https://bun.com/docs/guides/ecosystem/vite)
- `regions`：[边缘网络区域](https://vercel.com/docs/concepts/edge-network/regions) 的数组（默认为 `["iad1"]`）。请注意，无服务器函数的多个区域仅在 Enterprise 套餐上受支持
- `split`：如果为 `true`，会导致一个路由被部署为一个独立的函数。如果在适配器级别将 `split` 设为 `true`，所有路由都将被部署为独立的函数
- `memory`：函数可用的内存量。默认为 `1024` Mb，可以降到 `128` Mb，或在 Pro 或 Enterprise 账户上[增加到](https://vercel.com/docs/concepts/limits/overview#serverless-function-memory) 以 64Mb 为增量最高到 `3008` Mb
- `maxDuration`：函数的[最大执行时长](https://vercel.com/docs/functions/runtimes#max-duration)。Hobby 账户默认为 `10` 秒，Pro 为 `15` 秒，Enterprise 为 `900` 秒
- `isr`：增量静态再生配置，如下所述

在布局中设置的配置适用于该布局之下的所有路由，除非在更细粒度级别被覆盖。

如果你的函数需要访问特定区域中的数据，建议将它们部署在相同的区域（或靠近它）以获得最佳性能。

## 图片优化

你可以设置 `images` 配置来控制 Vercel 如何构建你的图片。有关完整细节，请参阅 [image 配置参考](https://vercel.com/docs/build-output-api/v3/configuration#images)。例如，你可以设置：

```js
// @errors: 2554
/// file: vite.config.js
import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter({
				images: {
					sizes: [640, 828, 1200, 1920, 3840],
					formats: ['image/avif', 'image/webp'],
					minimumCacheTTL: 300,
					domains: ['example-app.vercel.app'],
				}
			})
		})
	]
});
```

## 增量静态再生

Vercel 支持 [增量静态再生（ISR）](https://vercel.com/docs/incremental-static-regeneration)，它提供了预渲染内容的性能和成本优势，以及动态渲染内容的灵活性。

> [!NOTE] 只在每个访客都应该看到相同内容的路由上使用 ISR（就像你预渲染时一样）。如果有任何特定于用户的情况发生（如会话 cookie），它们应该仅通过 JavaScript 在客户端发生，以免在多次访问之间泄露敏感信息

要向一个路由添加 ISR，请在你的 `config` 对象中包含 `isr` 属性：

```js
// @filename: env.d.ts
declare module '$app/env/private' {
	export const BYPASS_TOKEN: string;
}
// @filename: +page.server.js
// ---cut---
import { BYPASS_TOKEN } from '$app/env/private';

/** @type {import('@sveltejs/adapter-vercel').Config} */
export const config = {
	isr: {
		expiration: 60,
		bypassToken: BYPASS_TOKEN,
		allowQuery: ['search']
	}
};
```

> [!NOTE] 在带有 `export const prerender = true` 的路由上使用 ISR 不会有任何效果，因为该路由是在构建时被预渲染的

`expiration` 属性是必需的；所有其他属性都是可选的。这些属性将在下文更详细地讨论。

### expiration

缓存资源在被调用无服务器函数重新生成之前的过期时间（以秒为单位）。将该值设为 `false` 意味着它永不过期。在这种情况下，你可能想要定义一个 bypass token 来按需重新生成。

### bypassToken

一个随机 token，可用于两件事：

- 草稿模式（Draft mode），它会绕过缓存，因此你可以在编辑时查看来自 CMS 的实时内容。在 `__prerender_bypass=<token>` cookie 中发送该 token，即可在请求时渲染该路由。更多详情请参阅 [Vercel 的草稿模式文档](https://vercel.com/docs/draft-mode?framework=sveltekit)。
- 重新验证（Revalidation），它会清空该路由的 ISR 缓存，并为未来的访客重新填充。为此，请发送一个带有 `x-prerender-revalidate: <token>` 头的 `GET` 或 `HEAD` 请求。

`BYPASS_TOKEN` 在构建时保存；在应用构建后再设置或更改它需要重新部署。

请注意，`BYPASS_TOKEN` 字符串必须至少 32 个字符长。你可以通过 JavaScript 控制台像这样生成一个：

```js
crypto.randomUUID();
```

通过在 Vercel 上登录并进入你的项目，然后 Settings > Environment Variables（设置 > 环境变量），将此字符串设置为 Vercel 上的一个环境变量。对于 “Key”（键）填入 `BYPASS_TOKEN`，对于 “value”（值）使用上面生成的字符串，然后点击 “Save”（保存）。

要在本地开发中让这个键被识别，你可以在本地运行 `vercel env pull` 来使用 [Vercel CLI](https://vercel.com/docs/cli/env)：

```sh
vercel env pull .env.development.local
```

### allowQuery

一个对缓存键有贡献的有效查询参数列表。其他参数（如 utm 跟踪代码）将被忽略，确保它们不会导致内容被不必要地重新生成。默认情况下，查询参数被忽略。

> [!NOTE] [预渲染](page-options#prerender) 的页面将忽略 ISR 配置。

## 环境变量

Vercel 提供了一组[部署特定的环境变量](https://vercel.com/docs/concepts/projects/environment-variables#system-environment-variables)。像其他环境变量一样，如果在 `src/env.ts` 中显式定义，这些变量可以从 `$app/env/private` 访问。要从客户端访问其中一个变量：

```js
/// file: +layout.server.js
// @filename: env.d.ts
declare module '$app/env/private' {
	export const VERCEL_COMMIT_REF: string;
}
// @filename: +layout.server.js
// ---cut---
import { VERCEL_COMMIT_REF } from '$app/env/private';

/** @type {import('./$types').LayoutServerLoad} */
export function load() {
	return {
		deploymentGitBranch: VERCEL_COMMIT_REF
	};
}
```

```svelte
<!--- file: +layout.svelte --->
<script>
	/** @type {import('./$types').LayoutProps} */
	let { data } = $props();
</script>

<p>这个预发布环境是从 {data.deploymentGitBranch} 部署的。</p>
```

由于所有这些变量在 Vercel 上构建时和运行时之间是不变的，我们建议将这个变量配置为 `static: true`——这将静态地替换这些变量，从而启用像死代码消除这样的优化。

## 偏差保护

当你的应用的新版本被部署时，属于之前版本的资产可能不再可访问。如果用户在发生这种情况时正在活跃地使用你的应用，这会在他们导航时导致错误——这被称为_版本偏差（version skew）_。SvelteKit 通过检测由版本偏差导致的错误并触发硬刷新以获取应用的最新版本来减轻这个问题，但这会导致任何客户端状态丢失。（你也可以通过观察来自 `$app/state` 的 [`updated.current`]($app-state#updated) 来主动减轻它，它会告诉客户端何时部署了新版本。）

[偏差保护（Skew protection）](https://vercel.com/docs/deployments/skew-protection) 是一个 Vercel 功能，它将客户端请求路由到它们原始的部署。当用户访问你的应用时，会设置一个带有部署 ID 的 cookie，并且任何后续请求都将被路由到该部署，只要偏差保护处于活动状态。当他们重新加载页面时，他们将获得最新的部署。（`updated.current` 不受此行为影响，因此会继续报告新的部署。）要启用它，请访问 Vercel 上你项目设置的 Advanced（高级）部分。

基于 cookie 的偏差保护带有一个注意事项：如果用户有多个版本的应用在多个标签页中打开，来自旧版本的请求将被路由到较新的版本，这意味着它们会回退到 SvelteKit 内置的偏差保护。

## 注意事项

### Vercel 工具

如果你需要像 `waitUntil` 这样特定于 Vercel 的工具，请使用包 [`@vercel/functions`](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package)。

### Vercel 函数

如果你在项目根目录的 `api` 目录中有 Vercel 函数，任何对 `/api/*` 的请求都将_不会_由 SvelteKit 处理。你应该改为将它们实现为你 SvelteKit 应用中的 [API 路由](routing#server)，除非你需要使用非 JavaScript 语言，在这种情况下你需要确保你应用中的任何 `/api/*` 路由都不存在。

### Node 版本

在某个日期之前创建的项目可能默认使用比 SvelteKit 当前要求的更旧的 Node 版本。你可以[在你的项目设置中更改 Node 版本](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js#node.js-version)。

### 更多信息

你可以在 [Vercel 文档](https://vercel.com/docs/frameworks/full-stack/sveltekit) 中找到关于如何在 Vercel 上使用 SvelteKit 的更多信息。

## 故障排除

### 访问文件系统

直接在无服务器函数中使用 `node:fs` 很可能不会按你的预期工作，因为文件不会从你的项目复制到你的部署中。相反，请使用来自 `$app/server` 的 [`read`]($app-server#read) 函数来访问你的文件。

或者，你可以[预渲染](page-options#prerender) 相关的路由。
