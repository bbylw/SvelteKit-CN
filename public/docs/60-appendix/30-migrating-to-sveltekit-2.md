---
title: 迁移到 SvelteKit v2
---

从 SvelteKit 1 版本升级到 2 版本应该基本上是无缝的。这里列出了一些需要注意的破坏性变更。你可以使用 `npx sv migrate sveltekit-2` 来自动迁移其中一些更改。

我们强烈建议在升级到 2.0 之前先升级到最新的 1.x 版本，以便你能够利用有针对性的弃用警告。我们也建议[先更新到 Svelte 4](../svelte/v4-migration-guide)：SvelteKit 1.x 的后期版本支持它，而 SvelteKit 2.0 需要它。

## `redirect` 和 `error` 不再由你抛出

以前，你必须自己 `throw` 从 `error(...)` 和 `redirect(...)` 返回的值。在 SvelteKit 2 中不再是这样了——只需调用这些函数就足够了。

```js
import { error } from '@sveltejs/kit'

// ...
---throw error(500, 'something went wrong');---
+++error(500, 'something went wrong');+++
```

`svelte-migrate` 会自动为你做这些更改。

如果错误 or 重定向是在 `try {...}` 块内抛出的（提示：不要这样做！），你可以使用从 `@sveltejs/kit` 导入的 [`isHttpError`](@sveltejs-kit#isHttpError) 和 [`isRedirect`](@sveltejs-kit#isRedirect) 将它们与意外错误区分开。

## 设置 cookie 时 path 是必需的

当收到一个没有指定 `path` 的 `Set-Cookie` 响应头时，浏览器会[将 cookie 路径设置为](https://www.rfc-editor.org/rfc/rfc6265#section-5.1.4) 相关资源父级的路径。这种行为并不特别有帮助或直观，并且经常导致 bug，因为开发者期望 cookie 应用于整个域名。

从 SvelteKit 2.0 开始，你在调用 `cookies.set(...)`、`cookies.delete(...)` 或 `cookies.serialize(...)` 时需要设置一个 `path`，以避免产生歧义。大多数情况下，你可能想使用 `path: '/'`，但你可以将其设置为任何你喜欢的值，包括相对路径——`''` 表示"当前路径"，`'.'` 表示"当前目录"。

```js
/** @type {import('./$types').PageServerLoad} */
export function load({ cookies }) {
	cookies.set(name, value, +++{ path: '/' }+++);
	return { response }
}
```

`svelte-migrate` 会添加注释来高亮需要调整的的位置。

## 顶层 promise 不再被 await

在 SvelteKit 1 中，如果 `load` 函数返回的对象中的顶层属性是 promise，它们会被自动 await。随着[流式传输](/blog/streaming-snapshots-sveltekit)的引入，这种行为变得有些尴尬，因为它迫使你将流式数据嵌套一层深。

从 2 版本开始，SvelteKit 不再区分顶层和非顶层的 promise。要恢复阻塞行为，请使用 `await`（在适当的情况下配合 `Promise.all` 来防止瀑布流）：

```js
// @filename: ambient.d.ts
declare const url: string;

// @filename: index.js
// ---cut---
// If you have a single promise
/** @type {import('./$types').PageServerLoad} */
export +++async+++ function load({ fetch }) {
	const response = +++await+++ fetch(url).then(r => r.json());
	return { response }
}
```

```js
// @filename: ambient.d.ts
declare const url1: string;
declare const url2: string;

// @filename: index.js
// ---cut---
// If you have multiple promises
/** @type {import('./$types').PageServerLoad} */
export +++async+++ function load({ fetch }) {
---	const a = fetch(url1).then(r => r.json());---
---	const b = fetch(url2).then(r => r.json());---
+++	const [a, b] = await Promise.all([
		fetch(url1).then(r => r.json()),
		fetch(url2).then(r => r.json()),
	]);+++
	return { a, b };
}
```

## goto(...) 的变更

`goto(...)` 不再接受外部 URL。要导航到外部 URL，请使用 `window.location.href = url`。`state` 对象现在决定 `$page.state`，如果已声明，则必须遵循 `App.PageState` 接口。更多细节请参阅[浅层路由](shallow-routing)。

## 路径现在默认是相对的

在 SvelteKit 1 中，`app.html` 中的 `%sveltekit.assets%` 默认会被替换为相对路径（即 `.` 或 `..` 或 `../..` 等，取决于被渲染的路径），在服务器端渲染期间，除非 [`paths.relative`](configuration#paths) 配置选项被显式设置为 `false`。对于从 `$app/paths` 导入的 `base` 和 `assets` 也是同样的情况，但仅当 `paths.relative` 选项被显式设置为 `true` 时才是如此。

这种不一致性在 2 版本中得到了修复。路径要么始终是相对的，要么始终是绝对的，取决于 [`paths.relative`](configuration#paths) 的值。它默认为 `true`，因为这会生成更具可移植性的应用：如果 `base` 与应用的预期不同（例如[互联网档案馆](https://archive.org/) 上的情况），或在构建时未知（例如部署到 [IPFS](https://ipfs.tech/) 等情况），则更不容易出问题。

## 服务端 fetch 不再可追踪

以前可以追踪服务端 `fetch` 的 URL，以便重新运行 load 函数。这带来了潜在的安全风险（私有 URL 泄漏），因此它在 `dangerZone.trackServerFetches` 设置之后，而该设置现在已被移除。

## `preloadCode` 的参数必须以 `base` 为前缀

SvelteKit 暴露了两个函数：[`preloadCode`]($app-navigation#preloadCode) 和 [`preloadData`]($app-navigation#preloadData)，用于以编程方式加载与特定路径相关的代码和数据。在 1 版本中，存在一个微妙的不一致——传递给 `preloadCode` 的路径不需要以 `base` 路径为前缀（如果设置了的话），而传递给 `preloadData` 的路径则需要。

这一点在 SvelteKit 2 中得到了修复——在这两种情况下，如果设置了 `base`，路径都应该以 `base` 为前缀。

此外，`preloadCode` 现在接受单个参数而非 _n_ 个参数。

## `resolvePath` 已被移除

SvelteKit 1 包含一个名为 `resolvePath` 的函数，它允许你将路由 ID（如 `/blog/[slug]`）和一组参数（如 `{ slug: 'hello' }`）解析为路径名。遗憾的是，返回值不包含 `base` 路径，限制了它在设置了 `base` 的情况下的实用性。

因此，SvelteKit 2 用（命名稍好的）`resolveRoute` 函数替换了 `resolvePath`，该函数从 `$app/paths` 导入，并会考虑 `base`。

```js
---import { resolvePath } from '@sveltejs/kit';
import { base } from '$app/paths';---
+++import { resolveRoute } from '$app/paths';+++

---const path = base + resolvePath('/blog/[slug]', { slug });---
+++const path = resolveRoute('/blog/[slug]', { slug });+++
```

`svelte-migrate` 会替你做方法替换，不过如果你之后用 `base` 作为结果的前缀，你需要自己移除它。

## 改进了错误处理

在 SvelteKit 1 中，错误处理是不一致的。有些错误会触发 `handleError` 钩子，但没有好的方法来辨别它们的状态（例如，区分 404 和 500 的唯一方法是看 `event.route.id` 是否为 `null`），而另一些错误（例如对没有 action 的页面发起 `POST` 请求时的 405 错误）根本不会触发 `handleError`，但它们本应该触发。在后一种情况下，所产生的 `$page.error` 会偏离 [`App.Error`](types#Error) 类型（如果指定了的话）。

SvelteKit 2 通过用两个新属性调用 `handleError` 钩子来清理这个问题：`status` 和 `message`。对于从你的代码（或你的代码调用的库代码）抛出的错误，`status` 将是 `500`，`message` 将是 `Internal Error`。虽然 `error.message` 可能包含不应暴露给用户的敏感信息，但 `message` 是安全的。

## 动态环境变量不能在预渲染期间使用

`$env/dynamic/public` 和 `$env/dynamic/private` 模块提供对_运行时_环境变量的访问，这与 `$env/static/public` 和 `$env/static/private` 暴露的_构建时_环境变量不同。

在 SvelteKit 1 的预渲染期间，它们是同一回事。这意味着使用"动态"环境变量的预渲染页面实际上是在"固化"构建时的值，这是不正确的。更糟的是，如果用户碰巧在导航到动态渲染的页面之前登陆到一个预渲染页面，`$env/dynamic/public` 会用这些过时的值在浏览器中被填充。

因此，在 SvelteKit 2 中，动态环境变量在预渲染期间不能再被读取——你应该改用 `static` 模块。如果用户登陆到一个预渲染页面，SvelteKit 会向服务器请求 `$env/dynamic/public` 的最新值（默认来自一个名为 `/_app/env.js` 的模块），而不是从服务器渲染的 HTML 中读取它们。

## `form` 和 `data` 已从 `use:enhance` 回调中移除

如果你向 [`use:enhance`](form-actions#Progressive-enhancement-use:enhance) 提供一个回调，它会被调用并传入一个包含各种有用属性的对象。

在 SvelteKit 1 中，这些属性包含 `form` 和 `data`。这些在一段时间前已被弃用，改用 `formElement` 和 `formData`，并且在 SvelteKit 2 中已被完全移除。

## 包含文件输入框的表单必须使用 `multipart/form-data`

如果一个表单包含一个 `<input type="file">` 但没有 `enctype="multipart/form-data"` 属性，非 JS 的提交会省略该文件。SvelteKit 2 会在 `use:enhance` 提交过程中遇到这样的表单时抛出错误，以确保你的表单在没有 JavaScript 时也能正常工作。

## 生成的 `tsconfig.json` 更严格

以前，当你的 `tsconfig.json` 包含 `paths` 或 `baseUrl` 时，生成的 `tsconfig.json` 会尽力仍然产生一个多少有效的配置。在 SvelteKit 2 中，验证更加严格，当你在 `tsconfig.json` 中使用 `paths` 或 `baseUrl` 时会发出警告。这些设置用于生成路径别名，你应该改用 `vite.config.js` 中 SvelteKit 插件的 [the `alias` config](configuration#alias) 选项，以便也为打包工具创建相应的别名。

## `getRequest` 不再抛出错误

`@sveltejs/kit/node` 模块导出了在 Node 环境中使用的辅助函数，包括 `getRequest`，它将一个 Node [`ClientRequest`](https://nodejs.org/api/http.html#class-httpclientrequest) 转换为一个标准的 [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) 对象。

在 SvelteKit 1 中，如果 `Content-Length` 响应头超过了指定的大小限制，`getRequest` 可能会抛出错误。在 SvelteKit 2 中，错误不会被抛出，直到稍后读取请求体（如果有的话）时才会抛出。这样可以获得更好的诊断信息和更简洁的代码。

## `vitePreprocess` 不再从 `@sveltejs/kit/vite` 导出

由于 `@sveltejs/vite-plugin-svelte` 现在是一个 peer 依赖，SvelteKit 2 不再重新导出 `vitePreprocess`。你应该直接从 `@sveltejs/vite-plugin-svelte` 导入它。

## 更新了依赖要求

SvelteKit 2 需要 Node `18.13` 或更高版本，以及以下最低依赖版本：

- `svelte@4`
- `vite@5`
- `typescript@5`
- `@sveltejs/vite-plugin-svelte@3`（现在作为 SvelteKit 的 `peerDependency` 被需要——以前是直接依赖）
- `@sveltejs/adapter-cloudflare@3`（如果你在使用这些适配器）
- `@sveltejs/adapter-cloudflare-workers@2`
- `@sveltejs/adapter-netlify@3`
- `@sveltejs/adapter-node@2`
- `@sveltejs/adapter-static@3`
- `@sveltejs/adapter-vercel@4`

`svelte-migrate` 会替你更新 `package.json`。

作为 TypeScript 升级的一部分，生成的 `tsconfig.json`（你的 `tsconfig.json` 所继承的那个）现在使用 `"moduleResolution": "bundler"`（TypeScript 团队推荐的方式，因为它能正确解析带有 `exports` 映射的包中的类型）和 `verbatimModuleSyntax`（它替换了现有的 `importsNotUsedAsValues` 和 `preserveValueImports` 标志——如果你在 `tsconfig.json` 中有这些，请移除它们。`svelte-migrate` 会替你做这件事）。

## SvelteKit 2.12：`$app/stores` 已弃用

SvelteKit 2.12 引入了基于 [Svelte 5 runes API](/docs/svelte/what-are-runes) 的 `$app/state`。`$app/state` 提供了 `$app/stores` 所提供的全部内容，但在使用和调用方式上更具灵活性。最重要的是，`page` 对象现在是细粒度的，例如对 `page.state` 的更新不会使 `page.data` 失效，反之亦然。

因此，`$app/stores` 已被弃用，并可能在 SvelteKit 3 中被移除。我们建议你[升级到 Svelte 5](/docs/svelte/v5-migration-guide)（如果你还没升级的话），然后迁移离开 `$app/stores`。大多数替换应该相当简单：将 `$app/stores` 的导入替换为 `$app/state`，并从使用点移除 `$` 前缀。

```svelte
<script>
	---import { page } from '$app/stores';---
	+++import { page } from '$app/state';+++
</script>

---{$page.data}---
+++{page.data}+++
```

使用 `npx sv migrate app-state` 来自动迁移你 `.svelte` 组件中的大部分 `$app/stores` 用法。
