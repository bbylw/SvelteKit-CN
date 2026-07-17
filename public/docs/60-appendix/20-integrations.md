---
title: 集成
---

## `vitePreprocess`

[`vitePreprocess`](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/preprocess.md) 预处理 `.svelte` 文件中的 `<style>` 和 `<script>` 标签。

```js
// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			preprocess: vitePreprocess({
				style: true,      // default value
				script: false     // default value
			})
		})
	]
});
```

### `style`

使用 `vitePreprocess()` 来启用 `<style>` 标签中的 CSS 预处理器：PostCSS、SCSS、Less、Stylus 和 SugarSS。

### `script`

在以下情况下使用 `vitePreprocess({ script: true })`：
- 你的项目在 Svelte 5 之前
- 你正在使用会发出代码的进阶 TypeScript 特性 _(查看 [`vitePreprocess`](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/preprocess.md) 文档)_

> [!NOTE]
> TypeScript 在 Svelte 5 中原生支持，因此如果你使用的是 Svelte 5，且不需要使用会发出代码的进阶 TypeScript 特性，你可能不需要使用 `vitePreprocess`。

## 附加组件（Add-ons）

运行 [`npx sv add`](/docs/cli/sv-add) 可以用单个命令设置许多不同的复杂集成，包括：
- prettier（格式化）
- eslint（linting）
- vitest（单元测试）
- playwright（e2e 测试）
- better-auth（鉴权）
- tailwind（CSS）
- drizzle（DB）
- paraglide（i18n）
- mdsvex（markdown）
- storybook（前端工作坊）
- adapters（托管）
- mcp（LLM 工具）

## 包（Packages）

查看 [包页面](/packages) 获取一组精心策划的高质量 Svelte 包。你也可以在 [sveltesociety.dev](https://sveltesociety.dev/) 上找到额外的库、模板和资源。

## 其他集成

### `svelte-preprocess`

`svelte-preprocess` 有一些 `vitePreprocess` 中没有的额外功能，例如对 Pug、Babel 和全局样式的支持。不过，`vitePreprocess` 可能更快且需要的配置更少，因此默认使用它。注意 CoffeeScript 不被 SvelteKit [支持](https://github.com/sveltejs/kit/issues/2920#issuecomment-996469815)。

你需要用 `npm i -D svelte-preprocess` 安装 `svelte-preprocess` 并[将其添加到你的 `vite.config.js`](https://github.com/sveltejs/svelte-preprocess/blob/main/docs/usage.md#with-svelte-config) 中。之后，你通常还需要[安装相应的库](https://github.com/sveltejs/svelte-preprocess/blob/main/docs/getting-started.md)，例如 `npm i -D sass` 或 `npm i -D less`。

## Vite 插件

由于 SvelteKit 项目是用 Vite 构建的，你可以使用 Vite 插件来增强你的项目。在 [`vitejs/awesome-vite`](https://github.com/vitejs/awesome-vite?tab=readme-ov-file#plugins) 查看可用插件列表。

## 集成常见问题

[The SvelteKit FAQ](./faq) 回答了许多关于如何用 SvelteKit 做 X 的问题，如果你还有疑问，它可能会有帮助。
