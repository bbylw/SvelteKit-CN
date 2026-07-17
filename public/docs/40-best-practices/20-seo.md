---
title: SEO
---

SEO 最重要的方面是创造高质量的内容，并被来自网络各处广泛链接。不过，在构建排名良好的站点时，还有一些技术上的考量。

## 开箱即用

### SSR

虽然近年来搜索引擎在索引由客户端 JavaScript 渲染的内容方面变得更好了，但服务端渲染的内容被索引得更频繁、更可靠。SvelteKit 默认采用 SSR，虽然你可以在 [`handle`](hooks#Server-hooks-handle) 中禁用它，但除非你有充分的理由，否则应该保持开启。

> [!NOTE] SvelteKit 的渲染是高度可配置的，如有必要，你可以实现[动态渲染](https://developers.google.com/search/docs/advanced/javascript/dynamic-rendering)。一般不推荐这样做，因为 SSR 除了 SEO 之外还有其他好处。

### 性能

[Core Web Vitals](https://web.dev/vitals/#core-web-vitals) 等信号会影响搜索引擎排名。由于 Svelte 和 SvelteKit 引入了最小的开销，它们让你更容易构建高性能站点。你可以使用 Google 的 [PageSpeed Insights](https://pagespeed.web.dev/) 或 [Lighthouse](https://developers.google.com/web/tools/lighthouse) 来测试你站点的性能。只需采取一些关键行动，如使用 SvelteKit 默认的[混合渲染](glossary#Hybrid-app)模式和[优化你的图片](images)，你就能极大提升站点的速度。更多细节请阅读[性能页面](performance)。

### 规范化 URL

SvelteKit 会将带有尾部斜杠的路径名重定向到不带斜杠的版本（或反之，取决于你的[配置](page-options#trailingSlash)），因为重复的 URL 对 SEO 不友好。

## 手动设置

### &lt;title&gt; 和 &lt;meta&gt;

每个页面都应该有编写良好且唯一的 `<title>` 和 `<meta name="description">` 元素，放在 [`<svelte:head>`](../svelte/svelte-head) 中。关于如何编写描述性的标题和描述，以及让搜索引擎理解内容的其他建议，可以在 Google 的 [Lighthouse SEO 审计](https://web.dev/lighthouse-seo/)文档中找到。

> [!NOTE] 一种常见的模式是从页面 [`load`](load) 函数返回与 SEO 相关的 `data`，然后在你的根 [layout](routing#layout) 的 `<svelte:head>` 中将其用作 [`page.data`]($app-state)。

### 站点地图（Sitemaps）

[站点地图](https://developers.google.com/search/docs/advanced/sitemaps/build-sitemap) 帮助搜索引擎在你站点内对页面排序，尤其是当你有大量内容时。你可以使用一个端点动态地创建站点地图：

```js
/// file: src/routes/sitemap.xml/+server.js
export async function GET() {
	return new Response(
		`
		<?xml version="1.0" encoding="UTF-8" ?>
		<urlset
			xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
			xmlns:xhtml="http://www.w3.org/1999/xhtml"
			xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
			xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
			xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
			xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
		>
			<!-- <url> elements go here -->
		</urlset>`.trim(),
		{
			headers: {
				'Content-Type': 'application/xml'
			}
		}
	);
}
```

### AMP

现代 Web 开发有一个令人遗憾的现实：有时有必要创建你站点的 [Accelerated Mobile Pages (AMP)](https://amp.dev/) 版本。在 SvelteKit 中，这可以通过设置 [`inlineStyleThreshold`](configuration#inlineStyleThreshold) 选项来实现……

```js
/// file: vite.config.js
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		sveltekit({
			// since <link rel="stylesheet"> isn't
			// allowed, inline all styles
			inlineStyleThreshold: Infinity
		})
	]
});
```

……在你的根 `+layout.js`/`+layout.server.js` 中禁用 `csr`……

```js
/// file: src/routes/+layout.server.js
export const csr = false;
```

……在你的 `app.html` 中添加 `amp`

```html
<html amp>
...
```

……并使用从 `@sveltejs/amp` 导入的 `transform` 配合 `transformPageChunk` 来转换 HTML：

```js
/// file: src/hooks.server.js
import * as amp from '@sveltejs/amp';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	let buffer = '';
	return await resolve(event, {
		transformPageChunk: ({ html, done }) => {
			buffer += html;
			if (done) return amp.transform(buffer);
		}
	});
}
```

为了防止因转换页面为 amp 而发送任何未使用的 CSS，我们可以使用 [`dropcss`](https://www.npmjs.com/package/dropcss)：

```js
// @filename: ambient.d.ts
declare module 'dropcss';

// @filename: index.js
// ---cut---
/// file: src/hooks.server.js
// @errors: 2307
import * as amp from '@sveltejs/amp';
import dropcss from 'dropcss';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	let buffer = '';

	return await resolve(event, {
		transformPageChunk: ({ html, done }) => {
			buffer += html;

			if (done) {
				let css = '';
				const markup = amp
					.transform(buffer)
					.replace('⚡', 'amp') // dropcss can't handle this character
					.replace(/<style amp-custom([^>]*?)>([^]+?)<\/style>/, (match, attributes, contents) => {
						css = contents;
						return `<style amp-custom${attributes}></style>`;
					});

				css = dropcss({ css, html: markup }).css;
				return markup.replace('</style>', `${css}</style>`);
			}
		}
	});
}

```

> [!NOTE] 使用 `handle` 钩子通过 `amphtml-validator` 验证转换后的 HTML 是个好主意，但仅当你在预渲染页面时才这样做，因为它非常慢。
