---
title: 页面选项
---

默认情况下，SvelteKit 会先在服务器上渲染（或[预渲染](glossary#Prerendering)）任何组件，然后将其作为 HTML 发送到客户端。之后它会在浏览器中再次渲染该组件，使其在一个称为[_水合（hydration）_](glossary#Hydration) 的过程中变得可交互。因此，你需要确保组件可以同时在这两个地方运行。随后 SvelteKit 会初始化一个[_路由器_](routing)，接管后续的导航。

你可以通过从 [`+page.js`](routing#page-page.js) 或 [`+page.server.js`](routing#page-page.server.js) 导出选项，来逐页控制这些行为；或者使用共享的 [`+layout.js`](routing#layout-layout.js) 或 [`+layout.server.js`](routing#layout-layout.server.js) 来控制一组页面。要为整个应用定义某个选项，请从根布局中导出它。子布局与子页面会覆盖父布局中设置的值，因此——例如——你可以为整个应用启用预渲染，然后为需要动态渲染的页面禁用它。

你可以在应用的不同区域混合搭配这些选项。例如，你可以预渲染你的营销页面以获得最快速度，服务器端渲染你的动态页面以改善 SEO 和可访问性，并通过仅在客户端渲染将你的管理后台部分变成一个 SPA。这使 SvelteKit 非常灵活。

## prerender

很可能你应用中的至少某些路由可以表示为在构建时生成的简单 HTML 文件。这些路由可以被[_预渲染_](glossary#Prerendering)。

```js
/// file: +page.js/+page.server.js/+server.js
export const prerender = true;
```

或者，你可以在根 `+layout.js` 或 `+layout.server.js` 中设置 `export const prerender = true`，并预渲染除被明确标记为_不_可预渲染的页面之外的所有内容：

```js
/// file: +page.js/+page.server.js/+server.js
export const prerender = false;
```

带有 `prerender = true` 的路由会被排除在用于动态 SSR 的清单（manifest）之外，从而让你的服务器（或无服务器/边缘函数）更小。在某些情况下，你可能想预渲染某个路由，同时又将其包含在清单中（例如，对于像 `/blog/[slug]` 这样的路由，你希望预渲染你最新/最受欢迎的内容，但又要服务器端渲染长尾内容）——对于这些场景，还有第三种选择 `'auto'`：

```js
/// file: +page.js/+page.server.js/+server.js
export const prerender = 'auto';
```

> [!NOTE] 如果你的整个应用都适合预渲染，你可以使用 [`adapter-static`](adapter-static)，它会输出适用于任何静态 Web 服务器的文件。

预渲染器会从你应用的根开始，为它发现的任何可预渲染页面或 `+server.js` 路由生成文件。每个页面都会被扫描以查找指向其他可预渲染候选页面的 `<a>` 元素——因此，你通常不需要指定应该访问哪些页面。如果你_确实_需要指定预渲染器应该访问哪些页面，可以通过 [`config.prerender.entries`](configuration#prerender)，或者从动态路由导出一个 [`entries`](#entries) 函数来实现。

在预渲染期间，从 [`$app/env`]($app-env) 导入的 `building` 的值将为 `true`。

### 预渲染服务器路由

与其他页面选项不同，`prerender` 也适用于 `+server.js` 文件。这些文件_不_受布局影响，但会从从中获取数据的页面继承默认值（如果有的话）。例如，如果一个 `+page.js` 包含这样的 `load` 函数……

```js
/// file: +page.js
export const prerender = true;

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	const res = await fetch('/my-server-route.json');
	return await res.json();
}
```

……那么 `src/routes/my-server-route.json/+server.js` 将被视为可预渲染的，前提是它不包含自己的 `export const prerender = false`。

### 何时不要预渲染

基本规则是：对于一个页面要可预渲染，任何两位直接访问它的用户都必须从服务器获得相同的内容。

> [!NOTE] 并非所有页面都适合预渲染。任何被预渲染的内容都会被所有用户看到。你当然可以在预渲染页面的 `onMount` 中获取个性化数据，但这可能会导致较差的用户体验，因为它会涉及空白的初始内容或加载指示器。

注意，你仍然可以预渲染那些基于页面参数加载数据的页面，例如 `src/routes/blog/[slug]/+page.svelte` 路由。

在预渲染期间访问 [`url.searchParams`](load#Using-URL-data-url) 是被禁止的。如果你需要使用它，请确保只在浏览器中（例如在 `onMount` 中）这样做。

带有[操作（actions）](form-actions) 的页面不能被预渲染，因为服务器必须能够处理操作的 `POST` 请求。

### 路由冲突

由于预渲染会写入文件系统，因此不可能有两个端点会导致目录和文件同名。例如，`src/routes/foo/+server.js` 和 `src/routes/foo/bar/+server.js` 会尝试创建 `foo` 和 `foo/bar`，这是不可能的。

正因如此，建议你始终包含文件扩展名——`src/routes/foo.json/+server.js` 和 `src/routes/foo/bar.json/+server.js` 会生成 `foo.json` 和 `foo/bar.json` 文件，两者和谐地并存。

对于_页面_，我们通过写入 `foo/index.html` 而不是 `foo` 来规避这个问题。

### 故障排除

如果你遇到类似 “以下路由被标记为可预渲染，但未被预渲染” 的错误，这是因为相关路由（或者如果它是页面，则是其父布局）有 `export const prerender = true`，但该页面未被预渲染爬虫访问到，因而未被预渲染。

由于这些路由无法被动态服务器端渲染，当人们尝试访问相关路由时会导致错误。有几种方法可以修复它：

* 确保 SvelteKit 能通过从 [`config.prerender.entries`](configuration#prerender) 或 [`entries`](#entries) 页面选项跟踪链接来找到该路由。如果动态路由（即带有 `[参数]` 的页面）无法通过爬取其他入口点找到，请将它们添加到此选项中，否则它们不会被预渲染，因为 SvelteKit 不知道参数应该取什么值。未被标记为可预渲染的页面将被忽略，并且它们到其他页面的链接也不会被爬取，即使其中某些页面可能是可预渲染的。
* 确保 SvelteKit 能通过从你的其他启用了服务器端渲染的预渲染页面中发现指向它的链接来找到该路由。
* 将 `export const prerender = true` 改为 `export const prerender = 'auto'`。带有 `'auto'` 的路由可以进行动态服务器端渲染。

## entries

SvelteKit 会从_入口点_开始并爬取它们，自动发现要预渲染的页面。默认情况下，你所有的非动态路由都被视为入口点——例如，如果你有以下路由……

```sh
/             # 非动态
/blog         # 非动态
/blog/[slug]  # 动态，因为 `[slug]`
```

……SvelteKit 会预渲染 `/` 和 `/blog`，并在此过程中发现像 `<a href="/blog/hello-world">` 这样的链接，从而得到新的页面进行预渲染。

大多数时候，这就足够了。在某些情况下，指向像 `/blog/hello-world` 这样页面的链接可能不存在（或者在预渲染页面上不存在），在这种情况下我们需要告诉 SvelteKit 它们的存在。

这可以通过 [`config.prerender.entries`](configuration#prerender)，或者从属于动态路由的 `+page.js`、`+page.server.js` 或 `+server.js` 导出一个 `entries` 函数来完成：

```js
/// file: src/routes/blog/[slug]/+page.server.js
/** @type {import('./$types').EntryGenerator} */
export function entries() {
	return [
		{ slug: 'hello-world' },
		{ slug: 'another-blog-post' }
	];
}

export const prerender = true;
```

`entries` 可以是一个 `async` 函数，允许你（例如）从 CMS 或数据库中检索帖子列表，如上例所示。

## ssr

通常，SvelteKit 会在将 HTML 发送到客户端（在那里进行[水合](glossary#Hydration)）之前，先在服务器上渲染你的页面。这也正是预渲染以保存页面完整内容所必需的。

如果你将 `ssr` 设为 `false`，它会改为渲染一个空的 “外壳” 页面。如果你的页面无法在服务器上渲染（例如因为你使用了像 `document` 这样仅限浏览器的全局变量），这会很有用，但在大多数情况下不推荐这样做（[参见附录](glossary#SSR)）。

```js
/// file: +page.js
export const ssr = false;
// 如果 `ssr` 和 `csr` 都为 `false`，则什么都不会被渲染！
```

如果你在根 `+layout.js` 中添加 `export const ssr = false`，你的整个应用将只在客户端渲染——这本质上意味着你将应用变成了一个 [SPA](glossary#SPA)。如果你的目标是构建一个[静态生成的站点](glossary#SSG)，你不应该这样做。

> [!NOTE] 如果你的所有页面选项都是布尔值或字符串字面量值，SvelteKit 会静态地评估它们。如果不是，它会在服务器上导入你的 `+page.js` 或 `+layout.js` 文件（在构建时，以及如果你的应用不是完全静态的话，在运行时），以便能够评估这些选项。在第二种情况下，浏览器专属代码在模块加载时不得运行。实际上，这意味着你应该改为在 `+page.svelte` 或 `+layout.svelte` 文件中导入浏览器专属代码。

## csr

通常，SvelteKit 会将你的服务器端渲染的 HTML [水合](glossary#Hydration) 为一个可交互的客户端渲染（CSR）页面。有些页面完全不需要 JavaScript——许多博客文章和 “关于” 页面就属于这一类。在这些情况下你可以禁用 CSR：

```js
/// file: +page.js
export const csr = false;
// 如果 `csr` 和 `ssr` 都为 `false`，则什么都不会被渲染！
```

禁用 CSR 不会向客户端发送任何 JavaScript。这意味着：

* 网页应该仅使用 HTML 和 CSS 即可工作。
* 所有 Svelte 组件中的 `<script>` 标签都会被移除。
* `<form>` 元素无法被[渐进增强](form-actions#Progressive-enhancement)。
* 链接由浏览器通过整页导航来处理。
* 热模块替换（HMR）将被禁用。

你可以在开发期间启用 `csr`（例如为了利用 HMR），如下所示：

```js
/// file: +page.js
import { dev } from '$app/env';

export const csr = dev;
```

## trailingSlash

默认情况下，SvelteKit 会从 URL 中移除尾部斜杠——如果你访问 `/about/`，它会以重定向到 `/about` 作为响应。你可以通过 `trailingSlash` 选项更改此行为，它可以是 `'never'`（默认）、`'always'` 或 `'ignore'` 之一。

与其他页面选项一样，你可以从 `+layout.js` 或 `+layout.server.js` 导出此值，它将应用于所有子页面。你也可以从 `+server.js` 文件导出该配置。

```js
/// file: src/routes/+layout.js
export const trailingSlash = 'always';
```

此选项也会影响[预渲染](#prerender)。如果 `trailingSlash` 是 `always`，像 `/about` 这样的路由将生成 `about/index.html` 文件，否则它将创建 `about.html`，这与静态 Web 服务器的约定一致。

> [!NOTE] 不建议忽略尾部斜杠——两种情况下相对路径的语义不同（从 `/x` 出发的 `./y` 是 `/y`，但从 `/x/` 出发则是 `/x/y`），并且 `/x` 和 `/x/` 被视为独立的 URL，这对 SEO 是有害的。

## config

借助[适配器](adapters) 的概念，SvelteKit 能够在各种平台上运行。其中每个平台可能都有特定的配置来进一步调整部署——例如在 Vercel 上，你可以选择将应用的某些部分部署在边缘，而其他部分部署在无服务器环境中。

`config` 是一个顶层带有键值对的对象。除此之外，其具体形态取决于你所使用的适配器。每个适配器都应该提供一个 `Config` 接口供导入，以获得类型安全。有关更多信息，请查阅你的适配器的文档。

```js
// @filename: ambient.d.ts
declare module 'some-adapter' {
	export interface Config { runtime: string }
}

// @filename: index.js
// ---cut---
/// file: src/routes/+page.js
/** @type {import('some-adapter').Config} */
export const config = {
	runtime: 'edge'
};
```

`config` 对象在顶层被合并（但_不_在更深层合并）。这意味着如果你只想覆盖上层 `+layout.js` 中的某些值，就不需要在 `+page.js` 中重复所有值。例如，这个布局配置……

```js
/// file: src/routes/+layout.js
export const config = {
	runtime: 'edge',
	regions: 'all',
	foo: {
		bar: true
	}
}
```

……被这个页面配置覆盖……

```js
/// file: src/routes/+page.js
export const config = {
	regions: ['us1', 'us2'],
	foo: {
		baz: true
	}
}
```

……从而为该页面得到配置值 `{ runtime: 'edge', regions: ['us1', 'us2'], foo: { baz: true } }`。

## 延伸阅读

- [教程：页面选项](/tutorial/kit/page-options)
