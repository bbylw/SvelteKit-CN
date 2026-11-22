---
title: 迁移到 SvelteKit v3
---

SvelteKit 3 移除了一些遗留功能，将配置从 `svelte.config.js` 移到 Vite 插件中，并提高了某些依赖的最低版本。对于其中的许多破坏性变更，你可以自动迁移：

```bash
npx sv migrate sveltekit-3
```

我们建议在升级到 3.0 之前先升级到最新的 2.x 版本，以便利用有针对性的弃用警告。

## 更新的依赖

SvelteKit 3 要求以下最低版本：

- Node v22.17
- TypeScript v6
- Svelte v5.57.1
- Vite v8.0.12（第一个捆绑稳定版 `rolldown` v1 的 Vite 8 版本）
- `@sveltejs/vite-plugin-svelte` v7

更新你 `package.json` 中的版本，并运行包管理器的安装命令。

## 配置

### 不再支持 svelte.config.js

项目配置不再在 `svelte.config.js` 中声明，而必须传给 `vite.config.js` 中的 `sveltekit` Vite 插件。以前位于 `config.kit.*` 下的选项现在成为顶层的插件选项，与 `compilerOptions` 等内容并列：

```js
// @errors: 2307 ignore adapter auto types missing
/// file: vite.config.js
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-auto';

export default defineConfig({
	plugins: [
+++		sveltekit({
			compilerOptions: { experimental: { async: true }},
			adapter: adapter()
		})+++
	]
});
```

更多示例请参阅[配置文档](@sveltejs-kit-vite)。

### 移除的选项

以下选项已经过时，应从你的 `vite.config.js` 中移除：

- `files.lib`（[详情](#$lib-is-now-lib)）
- 不再需要 `experimental.handleRenderingErrors`（[详情](#Error-handling-Rendering-errors-are-now-handled)）
- 不再需要 `experimental.instrumentation`（[详情](#Observability)）
- `experimental.tracing` 现在是顶层的 `tracing` 选项（[详情](#Observability)）
- 移除了 `vitePlugin` —— 请改为将 `inspector` 等 `vite-plugin-svelte` 选项直接传给插件
- 移除了 `preloadStrategy` —— `modulepreload` 现在在所有地方都受支持，因此始终使用它
- 移除了 `prerender.origin`，改为使用 `paths.origin`
- 移除了 `csrf.checkOrigin`，改为使用 `csrf.trustedOrigins`

### 新增的选项

- `output.linkHeaderPreload` 决定是否使用 `Link` HTTP 头来预加载 `.js` 和 `.css` 等资源，而不是在渲染的 HTML 中注入 `<link>` 元素。当头变得太大时这可能会引发问题，因此 SvelteKit 3 默认改用 `<link>` 元素。
- `csrf.trustedOrigins` 允许你指定允许提交表单的外部源。
- `paths.origin` 取代 `prerender.origin`，如果无法可靠地从请求头派生（例如因为它位于反向代理后面），它应该反映你应用的公共源。它将用于表单提交和远程函数调用时的 CSRF 检查。如果使用 `adapter-node`，它的优先级高于 `ORIGIN` 环境变量。

### 更改的选项

- `version.pollInterval` 现在默认是一小时，这意味着 SvelteKit 会定期检查新部署并相应地设置 [`updated.current`]($app-state#updated) 为 `true`。以前默认不进行轮询。

## `$lib` 现在是 `#lib`

SvelteKit 不再自动生成 `$lib` 别名。它被你在 `package.json` 的 [`imports`](https://nodejs.org/api/packages.html#subpath-imports) 字段中声明的 `#lib` 别名取代，利用 Node 内置的子路径导入（Vite 和 TypeScript 会原生解析它）。将以下内容添加到你的 `package.json`……

```json
/// file: package.json
{
	"imports": {
		"#lib": "./src/lib/index.js",
		"#lib/*": "./src/lib/*"
	}
}
```

……并在你的代码库中将 `$lib` 替换为 `#lib`。注意，你还必须为这些导入添加模块扩展名（例如 `.js` 或 `.ts`）。

```js
// @errors: 2307 imported module has no types
---import { foo } from '$lib/foo';---
+++import { foo } from '#lib/foo.js';+++
```

## `$app/environment`（已重命名）

`$app/environment` 模块已重命名为 [`$app/env`]($app-env)。现在它可以在你的 service worker 内部导入，而以前如果你需要访问 `version`，你会使用现已移除的 [`$service-worker`](<#$service-worker-(removed)>) 模块。

## `$app/forms`

使用 [`use:enhance`]($app-forms#enhance) 且 `action` 指定在其他页面上的表单，在提交后会导航到该页面，而不是停留在当前页面。这确保增强后的行为更贴近原生的、未增强的行为。

## `$app/manifest`

新的 [`$app/manifest`]($app-manifest) 模块让你可以访问关于应用的元数据。你可以在应用中的任何地方导入它，包括在 service worker 中用于离线缓存，而以前你会使用现已移除的 [`$service-worker`](<#$service-worker-(removed)>) 模块。

## `$app/navigation`

### 浅路由的变更

对于[浅路由](shallow-routing)，`pushState`/`replaceState` 已被弃用，改用 [`goto`]($app-navigation#goto)：

```js
const state = {};
import { goto } from '$app/navigation';
// ---cut---
// 而不是这样……
---pushState('/foo', state);---
---replaceState('/bar', state);---

// ……这样做：
+++goto('/foo', { shallow: true, state });+++
+++goto('/bar', { shallow: true, replace: true, state });+++
```

新的 `persistState: true` 选项会使 `page.state` 在页面重新加载后被重新应用。

浅路由现在会触发导航钩子（[`beforeNavigate`]($app-navigation#beforeNavigate)、[`onNavigate`]($app-navigation#onNavigate) 和 [`afterNavigate`]($app-navigation#afterNavigate)）。你可以通过检查传给这些导航钩子的对象的 `shallow` 属性来过滤它们。

### `invalidateAll` 已弃用，改用 `refreshAll`

`invalidateAll` 已弃用，改用 [`refreshAll`]($app-navigation#refreshAll)。区别在于 `refreshAll` _不会_将 `page.state` 重置为空对象，在使用[浅路由](shallow-routing) 时这通常是你想要的。

此外，在导航进行中调用 `invalidateAll()` 或 `invalidate(...)` 不再中止该导航。

### `goto` 的选项已更新

除了[上面](#$app-navigation-Changes-to-shallow-routing) 描述的新 `shallow` 选项外，各种 [`goto`]($app-navigation#goto) 选项也已更改：

- `invalidateAll` 现在是 `refreshAll`，以对应[上面的变更](#$app-navigation-invalidateAll-is-deprecated-in-favour-of-refreshAll)
- `keepFocus: true` 和 `noScroll: true` 已合并为 `reset: false`
- `replaceState` 现在是 `replace`

### `goto` 会拒绝无法解析到路由的 URL

`goto(...)` 现在在传入的 URL 无法解析到应用内的路由时会拒绝，这与外部 URL 的现有行为一致。要导航到外部 URL，请使用 `window.location.href = url`。

### `delta` 仅存在于 `popstate` 导航中

导航事件（[`beforeNavigate`]($app-navigation#beforeNavigate)、[`onNavigate`]($app-navigation#onNavigate) 和 [`afterNavigate`]($app-navigation#afterNavigate)）上的 `delta` 属性现在仅存在于 `popstate` 导航（后退/前进）中。对于所有其他导航类型，它为 `undefined`。

### `preloadData` 可能返回 `error` 结果

当目标页面加载失败时，`preloadData(...)` 现在返回 `{ type: 'error', status, error }`，而不是返回状态码为 200 的 `{ type: 'loaded' }`。`'redirect'` 结果现在也包含正确的 `status`。请在使用该结果的任何代码中添加 `error` 分支：

```js
import { preloadData } from '$app/navigation';
const url = '/somewhere';
// ---cut---
const result = await preloadData(url);

if (result.type === 'loaded') {
	// ...
+++} else if (result.type === 'error') {
	// 出错时做点什么
}+++
```

## `$app/paths`

### 移除 `base`、`assets` 和 `resolveRoute`

已弃用的 `base`、`assets` 和 `resolveRoute` 导出已从 [`$app/paths`]($app-paths) 中移除。请改用 [`asset`]($app-paths#asset) 和 [`resolve`]($app-paths#resolve)：

```js
let base = '';
let assets = '';
let slug = '';
import { asset, resolve } from '$app/paths';
// ---cut---
// 而不是这样……
---const pathname = base + resolveRoute('/blog/[slug]', { slug });---
---const file = assets + '/foo.png';---

// ……这样做：
+++const pathname = resolve('/blog/[slug]', { slug });+++
+++const file = asset('foo.png');+++
```

`Pathname` 和 `Asset` 类型也已重命名为 `Path` 和 `AssetPath`，并且这些类型开头的 `/` 已被移除——因此 `asset('/foo.png')` 现在应写成 `asset('foo.png')`，传给 `resolve` 的路径名也不再以 `/` 开头（例如 `resolve('blog/hello-world')`）。现在只有路由 ID 以 `/` 开头。

### Service worker 现在可以导入 `$app/paths`

以前，你需要从现已移除的 [`$service-worker`](<#$service-worker-(removed)>) 模块导入 `base`。现在你可以使用 `$app/paths` 中的 [`asset(...)`]($app-paths#asset) 和 [`resolve(...)`]($app-paths#resolve)。

## `$app/service-worker`

新的 [`$app/service-worker`]($app-service-worker) 在你的 `src/service-worker/index.ts` 中提供对 service worker 执行上下文的类型安全访问，前提是你有一个继承 [`$app/tsconfig/service-worker`](#$app-tsconfig-service-worker) 的 `src/service-worker/tsconfig.json`。

## `$app/state`

### `page.url` 现在是只读的

`page.url` 现在被类型化为带有 `ReadonlyURLSearchParams` 的 `ReadonlyURL`，因此修改它——例如 `page.url.searchParams.set(...)` 或给 `page.url.pathname` 赋值——现在是类型错误。如果你需要一个可变的 URL，请先复制它：

```js
const url = +++new URL(page.url.href);+++
url.searchParams.set('q', 'svelte');
```

### `updated` 会自动更新

当 SvelteKit 检测到应用的新版本已部署时，`updated.current` 属性会变为 `true`。以前，这只会在手动调用 `updated.check()` 之后或导航失败之后发生。在 SvelteKit 3 中，它会更频繁地发生：

- 在任何导致从服务器获取数据的导航中
- 在任何远程函数调用中
- 当窗口变为可见或获得焦点时（例如从另一个标签页切回来时）
- 在轮询间隔之后（现在默认为一小时）

请注意，如果你使用 Vercel 的[版本偏差保护（skew protection）](adapter-vercel#Skew-protection) 之类的功能，导航和远程函数上的被动检测可能会报告假阴性，因为请求将由较早的部署处理。轮询和基于事件的检查仍然有效，因为它们绕过了版本偏差保护。

## `$app/stores`（已移除）

`$app/stores` 模块（导出 `$page`、`$navigating` 和 `$updated` store）已被移除。请改用 [`$app/state`]($app-state)，它提供细粒度的 Svelte 5 [状态](../svelte/$state)，并在读取值时移除 `$` 前缀（即 `page` 而不是 `$page`）：

```svelte
<script>
	import { page } from +++'$app/state'+++;
</script>

<p>当前路径名：{page.url.pathname}</p>
```

## `$app/tsconfig`

你项目的 `tsconfig.json` 现在应该继承 `$app/tsconfig` 而不是 `./.svelte-kit/tsconfig.json`。它还应该指定 `include` 和 `exclude` 数组，因为 `$app/tsconfig` 不指定这些：

```json
/// file: tsconfig.json
{
	"extends": "$app/tsconfig",
	"include": ["src", "test", "*"],
	"exclude": ["src/service-worker"]
}
```

`$app/tsconfig` 中包含一些必要的 `compilerOptions`（`isolatedModules` 和 `verbatimModuleSyntax`），以及许多强烈推荐但可以在你自己的配置中覆盖的选项。

## `$app/tsconfig/service-worker`

你的 service worker 需要属于一个单独的 TypeScript 项目，否则 `fetch` 事件等类型将不正确。为此，请从项目根的 `tsconfig.json` 中排除 service worker，并添加一个继承 `$app/tsconfig/service-worker` 的 `src/service-worker/tsconfig.json`：

```json
/// file: src/service-worker/tsconfig.json
{
	"extends": "$app/tsconfig/service-worker"
}
```

## `$env/...`（已弃用）

各种 `$env/...` 模块已被弃用，改用 `$app/env/private` 和 `$app/env/public` —— 详见[环境变量](environment-variables)。

## `$service-worker`（已移除）

`$service-worker` 模块已被移除。请改为从 [`$app/env`]($app-env) 导入 `version`，从 [`$app/manifest`]($app-manifest) 导入 `assets`、`immutable` 和 `prerendered`，以及从 [`$app/paths`]($app-paths) 导入 `resolved`。

## `@sveltejs/kit`

### `error`、`isHttpError`、`redirect` 和 `isRedirect` 指向公共类型

`error`、`isHttpError`、`redirect` 和 `isRedirect` 现在指向公共类型而不是内部类。如果你之前从 `@sveltejs/kit/internal` 导入内部的 `HttpError`/`Redirect` 类，或对它们进行 `instanceof` 检查，请改用 `@sveltejs/kit` 中的 `isHttpError`/`isRedirect`。

### `json` 和 `text` 已弃用

用于生成响应的 `json(...)` 和 `text(...)` 辅助函数已弃用。请改用 `Response.json(...)` 和 `new Response(text)`。

### `defineParams` 移到 `@sveltejs/kit/params`

用于创建[参数匹配器](advanced-routing#Matching) 的 `defineParams` 函数以及相关类型现在位于 [`@sveltejs/kit/params`](@sveltejs-kit-params)。

### 与环境变量相关的类型移到 `@sveltejs/kit/env`

与 [`defineEnvVars`](@sveltejs-kit-env#defineEnvVars) 钩子一起使用的 `EnvVarConfig` 等类型现在位于 `@sveltejs/kit/env`。

### 与钩子相关的类型移到 `@sveltejs/kit/hooks`

定义 [`handle`](hooks#handle) 钩子类型的 `Handle` 等类型现在位于 `@sveltejs/kit/hooks`。

### 远程函数类型移到 `$app/server`

描述远程函数的类型，如 `RemoteQuery`、`RemoteForm` 和 `RemoteCommand`，现在与函数本身一起位于 `$app/server`。

## `@sveltejs/kit/hooks`

`defineEnvVars` 函数已从 `@sveltejs/kit/hooks` 移到 `@sveltejs/kit/env`。

## `@sveltejs/kit/node`

[`getRequest`](@sveltejs-kit-node#getRequest) 和 [`setResponse`](@sveltejs-kit-node#setResponse) 辅助函数现在是同步的，不再返回 Promise。请从自定义 Node 服务器或适配器中的调用中移除 `await`。

## `@sveltejs/kit/node/polyfills`（已移除）

`@sveltejs/kit/node/polyfills` 模块（以及 `adapter-node` 和 `adapter-netlify` 中的 Node 全局 shim）适用于不再受支持的 Node 版本。请从你的自定义服务器代码中移除任何 `import '@sveltejs/kit/node/polyfills'` 语句。

## 安全

### `csrf.checkOrigin` 由 `csrf.trustedOrigins` 取代

已弃用的 `csrf.checkOrigin` 选项已被移除。CSRF 保护始终开启；不要用 `checkOrigin: false` 禁用它，而应使用 `csrf.trustedOrigins` 允许受信任的跨源主机。

```js
/// file: vite.config.js
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
// ---cut---
export default defineConfig({
	plugins: [
		sveltekit({
			csrf: {
				---checkOrigin: false---
				+++trustedOrigins: ['https://trusted-site.com']+++
			}
		})
	]
});
```

### 跨源表单提交需要 `Content-Type` 头

省略 `Content-Type` 头的跨源变更请求现在会作为 CSRF 被拒绝。请确保跨源表单提交包含 `Content-Type` 头，或将源添加到 `csrf.trustedOrigins`。

### 开发环境中静态资源的 CORS 由 Vite 处理

SvelteKit 不再在开发环境中为每个静态资源请求设置 `access-control-allow-origin: *`。CORS 现在委托给 Vite 的内置中间件。如果你在开发中依赖对静态资源的跨源访问，请在 Vite 配置中进行配置：

```js
/// file: vite.config.js
import { defineConfig } from 'vite';
// ---cut---
export default defineConfig({
	server: {
+++		cors: { origin: '*' }+++
	}
});
```

## Cookie

### 更新到 `cookie` v2

SvelteKit 现在使用 [`cookie`](https://npmx.dev/package/cookie) v2，这涉及某些变更：

- cookie 名称只能包含 ASCII 字符。非 ASCII 字符（包括像 `á` 这样的 Latin-1 补充字符）会被拒绝
- `CookieSerializeOptions` 类型已重命名为 `SerializeOptions`
- `CookieParseOptions` 类型已重命名为 `ParseOptions`

### 路径默认为 `'/'`

当设置 cookie 而未显式指定 `path` 时（以前这是禁止的），路径默认为 `'/'` 而不是当前请求路径，这意味着 cookie 适用于整个站点。这符合大多数开发者的预期。如有必要，你可以传入显式的 `path`：

```ts
declare const cookies: import('@sveltejs/kit').Cookies;
declare const name: string;
declare const value: string;
// ---cut---
cookies.set(name, value, +++{ path: '/some/path' }+++);
```

## 错误处理

### `App.Error` 始终包含 `status`

`App.Error` 对象（例如 `+error.svelte` 组件的 `error` prop）除了 `message` 和你在 [`app.d.ts`](types#app.d.ts) 文件中定义的任何属性外，还有一个反映导致该错误的 HTTP 状态的 `status` 属性（例如 Not Found 错误为 404，或通用内部错误为 500）。

### `error(...)` 的参数已更改

以前，[`error(...)`](@sveltejs-kit#error) 的第二个参数可以是要作为 `string` 的 `message`，或者是包含 `message` 以及 `app.d.ts` 中定义的任何附加属性（如跟踪 `code`）的对象。

现在，第二个参数必须始终是 `string`。如果有附加属性，必须作为第三个参数传入。

### `handleValidationError` 已移除

校验错误现在会以 `kind: 'validation'` 传给 [`handleError`](hooks#handleError)。通用的 `{ status, message }` `error` 对象可以安全返回，而校验 `issues` 会单独提供，以便记录或自定义处理。

### `handleError` 接收所有错误

在 SvelteKit 2 中，对于_预期_错误（即使用 [`error(...)`](@sveltejs-kit#error) 辅助函数创建的错误），不会调用 `handleError`。在 SvelteKit 3 中，_所有_错误都会传给 `handleError`。更多信息请参阅[文档](hooks#handleError)。

### `handleError` 可以影响状态码

如果你需要在出错时控制用于渲染页面的 HTTP 状态码，可以从 `handleError` 返回一个 `status` 属性，以及 `App.Error` 的任何其他必需属性。

### 渲染错误现在会被处理

渲染期间抛出的错误现在始终会经过 `handleError`，然后传给最近的[错误边界](../svelte/svelte-boundary)。你的每个 `+error.svelte` 组件都会自动创建错误边界。

如果你在 `hooks.client.ts` 中有异步的 `handleError` 钩子，请在 Vite 配置的 `sveltekit(...)` 插件选项中启用 `compilerOptions.experimental.async`，以便它在渲染期间可以被 await。

### 表单操作响应使用 `fail` 状态码

增强后的表单操作响应现在使用传给 `fail(...)` 的 HTTP 状态码，而不是始终返回 `200`。如果你在增强的表单提交中检查状态码（例如在 `use:enhance` 回调或测试中），它们现在会反映传给 `fail` 的值。

### 应用 sourcemap

默认会生成 sourcemap，并在发生错误时应用于堆栈跟踪。要在生产环境中（而不是 `vite preview` 中）生效，适配器需要避免任何破坏性改动（例如在不生成额外且正确的 sourcemap 的情况下重新打包）。对于第一方适配器，这仍在进行中。

## 参数

[参数匹配器](advanced-routing#Matching) 不再是 `src/params` 目录中的文件。请使用 `defineParams` 辅助函数在单个 `src/params.ts`（或 `src/params.js`）文件中声明所有匹配器。匹配器可以是返回解析后值的函数（如果参数不匹配则返回 `undefined`），或者是 [Standard Schema](https://standardschema.dev)。

```js
/// file: src/params.js
import { defineParams } from '@sveltejs/kit/params';
import * as v from 'valibot';

export const params = defineParams({
	// schema 变体
	integer: v.pipe(v.string(), v.toNumber()),

	// 函数变体
	fruit: (param) => {
		if (param === 'apple' || param === 'orange') {
			return param;
		}
	}
});
```

## 可观测性

如果存在 `src/instrumentation.server.js` 文件，服务器端[插桩](observability) 现在会自动进行。

要选择启用 [OpenTelemetry](https://opentelemetry.io/) 追踪，请添加 `tracing.server` 配置：

```js
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
/// file: vite.config.js
// ---cut---
export default defineConfig({
	plugins: [
		sveltekit({
			+++tracing: { server: true }+++
		})
	]
});
```

## 适配器

所有第一方适配器现在都要求 SvelteKit 3，同时还有以下适配器特有的变更：

### `adapter-cloudflare`

Cloudflare 特有的 API 不再在 `platform` 上可用。相反，请在你预期的地方于 Cloudflare worker 中找到它们：

- `env`、`ctx.waitUntil` 和其他 `ctx` 属性应从 `cloudflare:workers` 导入：
```js
// @filename: ambient.d.ts
declare module 'cloudflare:workers' {
	export const env: { KV: { get(): Promise<unknown> } };
	export function waitUntil(promise: Promise<any>): void;
}
// ---cut---
import { env, waitUntil } from 'cloudflare:workers';

const value = await env.KV.get('key');
```
- `cf` 现在是 `Request` 对象的属性：
```js
/// file: src/routes/cf/+server.js
// @filename: ambient.d.ts
interface Request {
  cf: import('@cloudflare/workers-types').IncomingRequestCfProperties;
}
// @filename: index.js
// @errors: 7031
// ---cut---
export async function GET({ request }) {
	const { country } = request.cf;
}
```
- `caches` 现在是全局变量：
```js
/// file: src/routes/cache/+server.js
let request = new Request('');
// ---cut---
const myCache = await caches.open('foo');
await myCache.match(request);
```

- 要让这些类型对你的应用可用，请安装 [`wrangler`](https://www.npmjs.com/package/wrangler) 并运行 [`wrangler types`](https://developers.cloudflare.com/workers/languages/typescript/)。

- `wrangler` 的最低版本现在是 `^4.67.0`
- `@cloudflare/workers-types` 已升级

### `adapter-node`

- 现在使用 `rolldown` 进行打包
- 静态资源从构建时记录的列表提供；之后添加到输出目录的文件不会被提供，被替换的文件会保留它们旧的大小和 `ETag`（运行时配置请使用环境变量）
- 静态资源的 `ETag` 是内容哈希，不再发送 `Last-Modified`
- 只有 `GET` 和 `HEAD` 请求会提供静态资源；其他方法会得到 405 响应

### `adapter-netlify`

- 输出现在符合稳定的 [Netlify Frameworks API](https://docs.netlify.com/build/frameworks/frameworks-api/)
- 使用 Netlify CLI 部署/预览需要 `v17.31.0` 或更高版本（`npm i -g netlify-cli@latest`）
- 边缘函数的构建目标是 `es2022`
- 发布目录现在是适配器的选项，而不是从 `netlify.toml` 文件中读取

### `adapter-vercel`

- 不再支持 `edge` 运行时

### 适配器 API 的变更

对于适配器作者，还有一些额外的变更：

- 适配器可以向 Vite 配置中添加额外的插件
- `builder.config.kit` 不再存在——配置现在位于顶层
- 移除了 `builder.createEntries`——请直接使用 `builder.writeClient`、`builder.writeServer` 和 `builder.writePrerendered`
- `builder.compress` 返回一个压缩文件列表
- `builder.mkdirp` 和 `builder.rimraf` 已弃用，改用 `node:fs` 方法
- 移除了 `builder.generateManifest`——请使用 `builder.generateServerInstance` 替代，并使用 `builder.manifest` 访问清单
- 从服务器输出导出的 `Server` 类已弃用——请使用由 `builder.generateServerInstance` 写入的 `server` 对象

#### 服务器插桩

使用 `builder.instrument` 的适配器现在必须在任何打包步骤之前生成一个环境初始化器，在该步骤中将返回的模块作为入口点包含进去，并将其最终路径传给 `builder.instrument`：

```js
// @filename: ambient.d.ts
import { Builder } from '@sveltejs/kit';

declare global {
	const builder: Builder;
	const temporary_directory: string;
	const entrypoint: string;
	const instrumentation: string;
}

export {};

// @filename: index.js
// ---cut---
const initializer = builder.createInstrumentationInitializer({ outputDirectory: temporary_directory });

// 在此处的任何打包或文件追踪中包含 `initializer`

builder.instrument({
	entrypoint,
	instrumentation,
	initializer
});
```

对于不通过 `process.env` 暴露环境变量的运行时，请传入一个模块的内容，其默认导出是平台环境：

```js
// @filename: ambient.d.ts
import { Builder } from '@sveltejs/kit';

declare global {
	const builder: Builder;
	const temporary_directory: string;
}

export {};

// @filename: index.js
// ---cut---
const initializer = builder.createInstrumentationInitializer({
	outputDirectory: temporary_directory,
	environment: `import { env } from 'cloudflare:workers';\nexport default env;`
});
```

## 响应

### 204 响应不返回内容

从 `+server.js` 处理程序返回 `204`（或任何空的 `2xx`）响应现在会按照 HTTP 规范返回没有响应体的响应，而不是 SvelteKit 信封格式。消费此类响应体的代码需要处理空响应体。

### `resolve` 始终返回 `Promise`

传给 [`handle`](hooks#handle) 的 `resolve` 函数现在的类型始终返回 `Promise<Response>`，而不是 `MaybePromise<Response>`。

## 仅服务器模块

### 文件

仅服务器模块现在由文件名中包含 `server` 段来指定，而不是 `.server.` 中缀——换句话说，`stuff.server.ts`、`stuff.server.test.ts` 和 `server.ts` 都被视为仅服务器模块，而 `server.ts` 以前不是。

### 目录

以前，`src/lib/server` 内的任何模块都被视为仅服务器。现在这种处理适用于项目中_任何_ `server` 目录，但 `src/routes` 和你的 `static` 目录除外。

## 远程函数

远程函数仍被视为实验性的——通过 `experimental.remoteFunctions` 标志以及 `compilerOptions.experimental.async` 启用：

```js
/// file: vite.config.js
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
// ---cut---
export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				experimental: {
					+++async: true+++
				}
			},
			experimental: {
				+++remoteFunctions: true+++
			}
		})
	]
});
```

### 远程模块文件名

与仅服务器模块一样，文件名中的 `remote` 段表示远程模块——`stuff.remote.ts`、`stuff.remote.test.ts` 和 `remote.ts` 都是远程模块。

如果未启用 `experimental.remoteFunctions`，这些文件的存在会导致错误。

### 在查询内部无法访问 `event.url`、`event.params` 和 `event.route`

在远程 `query` 函数内部访问 `event.url`、`event.params` 或 `event.route` 现在会抛出错误。这些属性在远程函数的上下文中没有意义（远程函数可以从任何地方调用）。请将你需要的任何值显式地作为参数传给函数。

### 错误类型为 `App.Error | undefined`

远程函数资源（查询、实时查询、表单、预渲染函数）上的 `error` 属性现在类型为 `App.Error | undefined` 而不是 `any`，因为错误始终由 `handleError` 转换。

### 表单提交需要 `field.as(...)`

表单控件必须使用与当前 `form` 对象关联的字段的属性：

```svelte
<input {...myform.fields.message.as('text')}>
```

手动指定名称（`<input name="message">`）将导致提交被拒绝。

## 其他

### 指向当前页面的链接会触发刷新

如果用户点击指向当前位置的链接，SvelteKit 将执行 `refreshAll()` 而不是什么都不做。

### `data-sveltekit-*` 使用 `false` 而不是 `'off'`

`data-sveltekit-*` 链接属性的 `'off'` 值已被移除，改用 `false`。

```svelte
---<a href="..." data-sveltekit-preload-data="off">---
+++<a href="..." data-sveltekit-preload-data="false">+++
```

### 外部重定向必须显式选择启用

要 [`redirect`](@sveltejs-kit#redirect) 到外部 URL，你现在必须传入 `external` 选项——要么传 `true` 以允许任何外部 URL（`javascript:` URL 除外，它们仍然被阻止），要么传一个允许源的数组（_可以_包含 `javascript:` URL）。

```js
import { redirect } from '@sveltejs/kit';
// ---cut---
redirect(307, 'https://example.com', +++{ external: true }+++);
```

### 通用 `config` 优先于服务器 `config`

从通用 `+page.js` 或 `+layout.js` 导出的路由 `config` 现在优先于从相应的 `+page.server.js` 或 `+layout.server.js` 导出的 `config`，这与其他页面选项的解析方式一致。如果你从两处都导出 `config`，请将规范导出移到通用文件，或合并它们。

### Service worker 注册使用 `type: 'module'`

模块 service worker 现在已被广泛支持。因此，SvelteKit 会将你的 service worker 作为模块打包和注册，而不是作为脚本。
