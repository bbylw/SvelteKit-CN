---
title: 配置
---

你项目的配置位于项目根目录的 `vite.config.js` 文件中。你可以将配置连同 Svelte 编译器选项一起传递给 `sveltekit` 插件：

```js
// TODO: remove this and install @sveltejs/adapter-auto in svelte.dev to get the types
// @filename: ambient.d.ts
declare module '@sveltejs/adapter-auto' {
	const plugin: () => import('@sveltejs/kit').Adapter;
	export default plugin;
}

// @filename: index.js
// ---cut---
/// file: vite.config.js
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				experimental: {
					async: true
				}
			},
			adapter: adapter(),
			experimental: {
				remoteFunctions: true
			}
		})
	]
});
```

除了 SvelteKit 之外，该插件的选项也会被其他与 Svelte 集成的工具（如编辑器扩展）使用。

任何不属于 SvelteKit 的选项都会透传给 [`vite-plugin-svelte`](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/config.md)，因此你也可以在这里设置 `inspector` 等选项。`experimental` 命名空间是共享的——SvelteKit 读取自己的标志，并将其余部分转发。

> [!LEGACY]
> 在 SvelteKit 3 之前，配置位于 `svelte.config.js` 文件中，该文件已不再被支持。通过 `vite.config.js` 配置 SvelteKit 的能力是在 2.62 版本中添加的。

## KitConfig

对 [`vite-plugin-svelte` 的选项](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/config.md#config-file) 的扩展。

> EXPANDED_TYPES: Configuration#KitConfig
