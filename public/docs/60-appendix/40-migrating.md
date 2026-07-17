---
title: 从 Sapper 迁移
rank: 1
---

SvelteKit 是 Sapper 的继任者，并在许多设计元素上与其共享。

如果你有一个现有的 Sapper 应用计划迁移到 SvelteKit，你需要做许多更改。在迁移时，查看[一些示例](additional-resources#Examples)可能会有所帮助。

## package.json

### type: "module"

将 `"type": "module"` 添加到你的 `package.json` 中。如果你使用的是 Sapper 0.29.3 或更新版本，可以单独执行此步骤作为增量迁移的一部分。

### dependencies

移除 `polka` 或 `express`（如果你在使用其中之一），以及任何中间件，如 `sirv` 或 `compression`。

### devDependencies

从 `devDependencies` 中移除 `sapper`，并将其替换为 `@sveltejs/kit` 以及你计划使用的任何 [adapter](adapters)（见[下一节](migrating#Project-files-Configuration)）。

### scripts

任何引用 `sapper` 的脚本都应该被更新：

- `sapper build` 应该变成使用 Node [adapter](adapters) 的 `vite build`
- `sapper export` 应该变成使用 static [adapter](adapters) 的 `vite build`
- `sapper dev` 应该变成 `vite dev`
- `node __sapper__/build` 应该变成 `node build`

## 项目文件

你的应用主体部分，在 `src/routes` 中，可以保持在原处，但有几个项目文件需要被移动或更新。

### Configuration

你的 `webpack.config.js` 或 `rollup.config.js` 应该被替换为 `vite.config.js`，如[此处](configuration)所述。Svelte 预处理器选项应该移动到 SvelteKit 插件的 `config.preprocess` 设置中。

你将需要添加一个 [adapter](adapters)。`sapper build` 大致等同于 [adapter-node](adapter-node)，而 `sapper export` 大致等同于 [adapter-static](adapter-static)，尽管你可能更倾向使用为你要部署的平台设计的适配器。

如果你之前为 Vite 不自动处理的文件类型使用了插件，你将需要找到 Vite 的等价物并将它们添加到 [Vite 配置](project-structure#Project-files-vite.config.js) 中。

### src/client.js

这个文件在 SvelteKit 中没有等价物。任何自定义逻辑（超出 `sapper.start(...)` 的部分）应该表达在你的 `+layout.svelte` 文件中的 `onMount` 回调里。

### src/server.js

当使用 `adapter-node` 时，等价物是一个 [custom server](adapter-node#Custom-server)。否则，这个文件没有直接等价物，因为 SvelteKit 应用可以运行在无服务器（serverless）环境中。

### src/service-worker.js

来自 `@sapper/service-worker` 的大多数导入在 [`$service-worker`]($service-worker) 中都有等价物：

- `files` 不变
- `routes` 已被移除
- `shell` 现在是 `build`
- `timestamp` 现在是 `version`

### src/template.html

`src/template.html` 文件应该重命名为 `src/app.html`。

移除 `%sapper.base%`、`%sapper.scripts%` 和 `%sapper.styles%`。将 `%sapper.head%` 替换为 `%sveltekit.head%`，将 `%sapper.html%` 替换为 `%sveltekit.body%`。`<div id="sapper">` 不再需要。

### src/node_modules

Sapper 应用中一个常见的模式是将你的内部库放在 `src/node_modules` 内的一个目录中。这在 Vite 中不起作用，因此我们改用 [`src/lib`]($lib)。

## Pages and layouts

### 重命名的文件

路由现在完全由文件夹名称构成以去除歧义，通向 `+page.svelte` 的文件夹名称对应于路由。概览请参阅[路由文档](routing)。下面显示了新旧路由结构的对比：

| Old                       | New                       |
| ------------------------- | ------------------------- |
| routes/about/index.svelte | routes/about/+page.svelte |
| routes/about.svelte       | routes/about/+page.svelte |

你的自定义错误页面组件应该从 `_error.svelte` 重命名为 `+error.svelte`。任何 `_layout.svelte` 文件同样应该重命名为 `+layout.svelte`。[任何其他文件都会被忽略](routing#Other-files)。

### Imports

来自 `@sapper/app` 的 `goto`、`prefetch` 和 `prefetchRoutes` 导入应该分别替换为来自 [`$app/navigation`]($app-navigation) 的 `goto`、`preloadData` 和 `preloadCode` 导入。

来自 `@sapper/app` 的 `stores` 导入应该被替换——请参阅下面的 [Stores](migrating#Pages-and-layouts-Stores) 部分。

你之前从 `src/node_modules` 中目录导入的任何文件都需要被替换为 [`#lib`]($lib) 导入。

### Preload

和以前一样，页面和布局可以导出一个函数，允许在渲染发生前加载数据。

这个函数已从 `preload` 重命名为 [`load`](load)，它现在位于与其 `+page.svelte`（或 `+layout.svelte`）相邻的 `+page.js`（或 `+layout.js`）中，并且它的 API 已经改变。它不再是 `page` 和 `session` 两个参数，而是只有一个 `event` 参数。

不再有 `this` 对象，因此也没有 `this.fetch`、`this.error` 或 `this.redirect`。相反，你可以从输入方法中获取 [`fetch`](load#Making-fetch-requests)，而 [`error`](load#Errors) 和 [`redirect`](load#Redirects) 现在都是被抛出的。

### Stores

在 Sapper 中，你会像这样获取对提供 stores 的引用：

```js
// @filename: ambient.d.ts
declare module '@sapper/app';

// @filename: index.js
// ---cut---
import { stores } from '@sapper/app';
const { preloading, page, session } = stores();
```

`page` store 仍然存在；`preloading` 已被替换为包含 `from` 和 `to` 属性的 `navigating` store。`page` 现在有了 `url` 和 `params` 属性，但没有 `path` 或 `query`。

你在 SvelteKit 中以不同的方式访问它们。`stores` 现在是 `getStores`，但在大多数情况下它是不必要的，因为你可以直接从 [`$app/stores`]($app-stores) 导入 `navigating` 和 `page`。如果你使用的是 Svelte 5 以及 SvelteKit 2.12 或更高版本，考虑改用 [`$app/state`]($app-state)。

### Routing

不再支持正则路由。请改用[高级路由匹配](advanced-routing#Matching)。

### Segments

以前，布局组件会接收一个指示子段的 `segment` prop。这已被移除；你应该使用更灵活的 `$page.url.pathname`（或 `page.url.pathname`）值来推导出你感兴趣的段。

### URLs

在 Sapper 中，所有相对 URL 都是相对于基础 URL 解析的——通常是 `/`，除非使用了 `basepath` 选项——而不是相对于当前页面。

这导致了问题，在 SvelteKit 中不再是这样。相反，相对 URL 是相对于当前页面（或对于 `load` 函数中的 `fetch` URL，是目标页面）解析的。在大多数情况下，使用根相对（即以 `/` 开头）的 URL 更容易，因为它们的含义不依赖于上下文。

### &lt;a&gt; 属性

- `sapper:prefetch` 现在是 `data-sveltekit-preload-data`
- `sapper:noscroll` 现在是 `data-sveltekit-noscroll`

## Endpoints

在 Sapper 中，[服务端路由](routing#server) 接收由 Node 的 `http` 模块（或 Polka 和 Express 等框架提供的增强版本）暴露的 `req` 和 `res` 对象。

SvelteKit 被设计为对应用运行的位置不可知——它可能在 Node 服务器上运行，但也可能同样地运行在无服务器平台或 Cloudflare Worker 中。因此，你不再直接与 `req` 和 `res` 交互。你的端点需要更新以匹配新的签名。

为了支持这种环境无关的行为，`fetch` 现在在全局上下文中可用，因此你不需要导入 `node-fetch`、`cross-fetch` 或类似的服务端 fetch 实现来使用它。

## Integrations

有关集成的详细信息，请参阅 [integrations](./integrations)。

### HTML minifier

Sapper 默认包含 `html-minifier`。SvelteKit 不包含这个，但你可以将它作为生产依赖添加，然后通过一个 [hook](hooks#Server-hooks-handle) 来使用它：

```js
// @filename: ambient.d.ts
/// <reference types="@sveltejs/kit" />
declare module 'html-minifier';

// @filename: index.js
// ---cut---
import { minify } from 'html-minifier';
import { building } from '$app/env';

const minification_options = {
	collapseBooleanAttributes: true,
	collapseWhitespace: true,
	conservativeCollapse: true,
	decodeEntities: true,
	html5: true,
	ignoreCustomComments: [/^#/],
	minifyCSS: true,
	minifyJS: false,
	removeAttributeQuotes: true,
	removeComments: false, // some hydration code needs comments, so leave them in
	removeOptionalTags: true,
	removeRedundantAttributes: true,
	removeScriptTypeAttributes: true,
	removeStyleLinkTypeAttributes: true,
	sortAttributes: true,
	sortClassName: true
};

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	let page = '';

	return resolve(event, {
		transformPageChunk: ({ html, done }) => {
			page += html;
			if (done) {
				return building ? minify(page, minification_options) : page;
			}
		}
	});
}
```

注意，当使用 `vite preview` 测试站点的生产构建时，`prerendering` 是 `false`，因此要验证 minify 的结果，你需要直接检查构建出来的 HTML 文件。
