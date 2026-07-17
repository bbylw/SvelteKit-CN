---
title: 静态站点生成
---

要将 SvelteKit 用作静态站点生成器（SSG），请使用 [`adapter-static`](https://github.com/sveltejs/kit/tree/main/packages/adapter-static)。

这会将你的整个站点预渲染为一组静态文件。如果你只想预渲染部分页面并动态服务器端渲染其他页面，你将需要使用一个不同的适配器，配合[`prerender` 选项](page-options#prerender)。

## 用法

用 `npm i -D @sveltejs/adapter-static` 安装，然后将适配器添加到你的 `vite.config.js`：

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
				// 显示的是默认选项。在某些平台上
				// 这些选项会自动设置——见下文
				pages: 'build',
				assets: 'build',
				fallback: undefined,
				precompress: false,
				strict: true
			})
		})
	]
});
```

……并向你的根布局添加 [`prerender`](page-options#prerender) 选项：

```js
/// file: src/routes/+layout.js
// 如果你正在使用回退（即 SPA 模式），你不需要通过在这里设置
// 来预渲染所有页面，但应该尽可能多地预渲染，以避免
// 产生巨大的性能和 SEO 影响
export const prerender = true;
```

> [!NOTE] 你必须确保 SvelteKit 的 [`trailingSlash`](page-options#trailingSlash) 选项为你的环境设置得当。如果你的主机在收到对 `/a` 的请求时不渲染 `/a.html`，那么你将需要在你的根布局中设置 `trailingSlash: 'always'` 来创建 `/a/index.html`。

> [!NOTE] 你必须确保 SvelteKit 的 [`ssr`](page-options#ssr) 选项没有被设为 `false`。否则，预渲染将保存一个空的 “外壳” 页面，而不是完整渲染的内容。

## 零配置支持

某些平台有零配置支持（未来会有更多）：

- [Vercel](https://vercel.com)

在这些平台上，你应该省略适配器选项，以便 `adapter-static` 能够提供最优配置：

```js
// @errors: 2307
/// file: vite.config.js
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter(---{...}---)
		})
	]
});
```

## 选项

### pages

写入预渲染页面的目录。默认为 `build`。

### assets

写入静态资源（来自 `static` 的内容，加上 SvelteKit 生成的客户端 JS 和 CSS）的目录。通常这应该与 `pages` 相同，并且它会默认为 `pages` 的值，但在极少数情况下，你可能需要将页面和资源输出到不同的位置。

### fallback

要创建一个[单页应用（SPA）](single-page-apps)，你必须指定由 SvelteKit 生成的回退页面的名称，它用作尚未被预渲染的 URL 的入口点。这通常是 `200.html`，但可能会根据你的部署平台而有所不同。你应该尽可能避免使用 `index.html`，以免与预渲染的主页冲突。

> [!NOTE] 这个选项有巨大的负面性能和 SEO 影响。它只在某些特定情况下被推荐，例如将站点包装在移动应用中。更多细节和替代方案请参阅[单页应用](single-page-apps) 文档。

### precompress

如果为 `true`，使用 brotli 和 gzip 预压缩文件。这将生成 `.br` 和 `.gz` 文件。

### strict

默认情况下，`adapter-static` 会检查你的应用的所有页面和端点（如果有的话）是否都已预渲染，或者你是否设置了 `fallback` 选项。这个检查的存在是为了防止你意外发布一个某些部分不可访问的应用，因为它们没有包含在最终输出中。如果你知道这没问题（例如当某个页面只在某些情况下存在时），你可以将 `strict` 设为 `false` 来关闭这个检查。

## GitHub Pages

当为 [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages) 构建时，如果你的仓库名不等同于 `your-username.github.io`，请确保更新 [`config.paths.base`](configuration#paths) 以匹配你的仓库名。这是因为站点将从 `https://your-username.github.io/your-repo-name` 提供，而不是从根目录提供。

你还会想要生成一个回退的 `404.html` 页面，以替换 GitHub Pages 显示的默认 404 页面。

GitHub Pages 的配置可能如下所示：

```js
// @errors: 2307 2322
/// file: vite.config.js
import process from 'node:process';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter({
				fallback: '404.html'
			}),
			paths: {
				base: process.argv.includes('dev') ? '' : process.env.BASE_PATH
			},
		})
	]
});
```

你可以使用 GitHub Actions，在你做出更改时自动将你的站点部署到 GitHub Pages。下面是一个示例工作流：

```yaml
### file: .github/workflows/deploy.yml
name: 部署到 GitHub Pages

on:
  push:
    branches: 'main'

jobs:
  build_site:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v7

      # 如果你正在使用 pnpm，添加此步骤，然后将下面的命令和缓存键
      # 改为使用 `pnpm`
      # - name: 安装 pnpm
      #   uses: pnpm/action-setup@v6
      #   with:
      #     version: 8

      - name: 安装 Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 20
          cache: npm

      - name: 安装依赖
        run: npm i

      - name: 构建
        env:
          BASE_PATH: '/${{ github.event.repository.name }}'
        run: |
          npm run build

      - name: 上传制品
        uses: actions/upload-pages-artifact@v5
        with:
          # 这应该与你的 adapter-static 选项中的 `pages` 选项匹配
          path: 'build/'

  deploy:
    needs: build_site
    runs-on: ubuntu-latest

    permissions:
      pages: write
      id-token: write

    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: 部署
        id: deployment
        uses: actions/deploy-pages@v5
```

如果你不是使用 GitHub Actions 来部署你的站点（例如，你正在将构建好的站点推送到它自己的仓库），在你的 `static` 目录中添加一个空的 `.nojekyll` 文件，以防止 Jekyll 干扰。
