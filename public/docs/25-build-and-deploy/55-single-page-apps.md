---
title: 单页应用
---

你可以通过指定一个_回退页面_，将 SvelteKit 应用变成一个完全客户端渲染的单页应用（SPA）。对于无法通过其他方式（例如返回一个预渲染页面）提供服务的任何 URL，都会提供这个页面。

> [!NOTE] SPA 模式有较大的负面性能影响，因为它在内容可以显示之前，强制进行多次网络往返（先请求空白 HTML 文档，然后请求 JavaScript，然后再请求页面所需的任何数据）。除非你是从本地网络提供应用（例如一个包装了本地提供服务的 SPA 的移动应用），否则这会延迟启动，尤其是在考虑到移动设备的延迟时。它还经常通过导致站点因性能问题被降权（SPA 更有可能无法通过 [Core Web Vitals](https://web.dev/explore/learn-core-web-vitals)）来损害 SEO，排除了不渲染 JS 的搜索引擎，并使你的站点从这些引擎获得更不频繁的更新。最后，如果 JavaScript 失败或被禁用（这发生的[频率可能超出你的想象](https://kryogenix.org/code/browser/everyonehasjs.html)），它会让你的应用对用户不可访问。
>
> 你可以通过在使用 SPA 模式时[尽可能多地预渲染](#Prerendering-individual-pages)页面（尤其是你的主页）来避免这些缺点。如果你可以预渲染所有页面，你可以简单地使用[静态站点生成](adapter-static) 而不是 SPA。否则，你应该强烈考虑使用一个支持服务器端渲染的适配器。SvelteKit 有官方支持的适配器，适用于各种提供慷慨免费额度的提供商。

## 用法

首先，对你不想预渲染的页面禁用 SSR。这些页面将通过回退页面提供；例如，要默认通过回退提供所有页面，你可以如下所示更新根布局。你应该在可能的情况下[重新选择为单个页面和目录启用预渲染](#Prerendering-individual-pages)。

```js
/// file: src/routes/+layout.js
export const ssr = false;
```

如果你没有任何服务器端逻辑（即 `+page.server.js`、`+layout.server.js` 或 `+server.js` 文件），你可以使用 [`adapter-static`](adapter-static) 来创建你的 SPA。用 `npm i -D @sveltejs/adapter-static` 安装 `adapter-static`，并使用 `fallback` 选项将其添加到你的 `vite.config.js`：

```js
// @errors: 2307
/// file: vite.config.js
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter({
				fallback: '200.html' // 可能因主机而异
			})
		})
	]
});
```

`fallback` 页面是 SvelteKit 从你的页面模板（例如 `app.html`）创建的一个 HTML 页面，它会加载你的应用并导航到正确的路由。例如 [Surge](https://surge.sh/help/adding-a-200-page-for-client-side-routing) 这个静态 Web 主机，允许你添加一个 `200.html` 文件，它将处理任何与静态资源或预渲染页面不对应的请求。

在某些主机上，它可能完全是另一个名字——请参阅你平台的文档。我们建议尽可能避免使用 `index.html`，因为它可能与预渲染冲突。

> [!NOTE] 请注意，无论 [`paths.relative`](configuration#paths) 的值如何，回退页面将始终包含绝对资源路径（即以 `/` 而不是 `.` 开头），因为它用于响应对任意路径的请求。

## 预渲染单个页面

如果你希望某些页面被预渲染，你可以仅为应用的这些部分重新启用 `ssr` 和 `prerender`：

```js
/// file: src/routes/my-prerendered-page/+page.js
export const prerender = true;
export const ssr = true;
```

你不需要 Node 服务器或能够运行 JavaScript 的服务器来部署这个页面。它只会在构建项目时服务器渲染你的页面，以便输出一个可以从任何静态 Web 主机提供服务的 `.html` 页面。

## Apache

要在 [Apache](https://httpd.apache.org/) 上运行 SPA，你应该添加一个 `static/.htaccess` 文件，将请求路由到回退页面：

```
<IfModule mod_rewrite.c>
	RewriteEngine On
	RewriteBase /
	RewriteRule ^200\.html$ - [L]
	RewriteCond %{REQUEST_FILENAME} !-f
	RewriteCond %{REQUEST_FILENAME} !-d
	RewriteRule . /200.html [L]
</IfModule>
```
