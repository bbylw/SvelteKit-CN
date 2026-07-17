---
title: 图标
---

## CSS

使用图标的一个绝佳方式是完全通过 CSS 来定义它们。Iconify 支持[许多流行的图标集](https://icon-sets.iconify.design/)，并且[可以通过 CSS 引入](https://iconify.design/docs/usage/css/)。借助 Iconify 的 [Tailwind CSS 插件](https://iconify.design/docs/usage/css/tailwind/) 或 [UnoCSS 插件](https://iconify.design/docs/usage/css/unocss/)，这个方法也可以与流行的 CSS 框架一起使用。与基于 Svelte 组件的库不同，它不需要将每个图标都导入到你的 `.svelte` 文件中。

## Svelte

有许多[面向 Svelte 的图标库](/packages#icons)。在选择图标库时，建议避免使用那些为每个图标都提供一个 `.svelte` 文件的库，因为这些库可能有成千上万个 `.svelte` 文件，会严重拖慢 [Vite 的依赖优化](https://vite.dev/guide/dep-pre-bundling.html)。如果图标同时通过总括式导入（umbrella import）和子路径导入方式引入，情况会尤其糟糕，[正如 `vite-plugin-svelte` 的 FAQ 所述](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/faq.md#what-is-going-on-with-vite-and-pre-bundling-dependencies)。
