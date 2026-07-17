---
title: 适配器
---

在你部署 SvelteKit 应用之前，你需要为你的部署目标_适配_它。适配器是一些小插件，它们将构建好的应用作为输入，并生成用于部署的输出。

官方适配器适用于各种平台——这些在以下页面中有文档说明：

- 用于 Cloudflare Workers 和 Cloudflare Pages 的 [`@sveltejs/adapter-cloudflare`](adapter-cloudflare)
- 用于 Netlify 的 [`@sveltejs/adapter-netlify`](adapter-netlify)
- 用于 Node 服务器的 [`@sveltejs/adapter-node`](adapter-node)
- 用于静态站点生成（SSG）的 [`@sveltejs/adapter-static`](adapter-static)
- 用于 Vercel 的 [`@sveltejs/adapter-vercel`](adapter-vercel)

还存在用于其他平台的[社区提供的适配器](/packages#sveltekit-adapters)。

## 使用适配器

你的适配器在 `vite.config.js` 中指定：

```js
/// file: vite.config.js
// @filename: ambient.d.ts
declare module 'svelte-adapter-foo' {
	const adapter: (opts?: any) => import('@sveltejs/kit').Adapter;
	export default adapter;
}

// @errors: 2554
// @filename: index.js
// ---cut---
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
+++import adapter from 'svelte-adapter-foo';+++

export default defineConfig({
	plugins: [
		sveltekit({
			+++adapter: adapter()+++
		})
	]
});
```

## 平台特定的上下文

某些适配器可能可以访问有关请求的额外信息。例如，Cloudflare Workers 可以访问一个包含 KV 命名空间等的 `env` 对象。这可以通过 `platform` 属性传递给 [hooks](hooks) 和 [服务器路由](routing#server) 中使用的 `RequestEvent` ——请参阅每个适配器的文档以了解更多。
