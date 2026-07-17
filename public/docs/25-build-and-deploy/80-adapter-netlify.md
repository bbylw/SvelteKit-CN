---
title: Netlify
---

要部署到 Netlify，请使用 [`adapter-netlify`](https://github.com/sveltejs/kit/tree/main/packages/adapter-netlify)。

当你使用 [`adapter-auto`](adapter-auto) 时，这个适配器会默认被安装，但将其添加到你的项目中允许你指定特定于 Netlify 的选项。

## 用法

用 `npm i -D @sveltejs/adapter-netlify` 安装，然后将适配器添加到你的 `vite.config.js`：

```js
// @errors: 2307
/// file: vite.config.js
import adapter from '@sveltejs/adapter-netlify';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter({
				// 如果为 true，将创建 Netlify Edge Function 而不是
				// 使用标准的基于 Node 的函数
				edge: false,

				// 如果为 true，将把你的应用拆分成多个函数，
				// 而不是为整个应用创建一个函数。
				// 如果 `edge` 为 true，则不能使用此选项
				split: false
			})
		})
	]
});
```

然后，确保你在项目根目录中有一个 [netlify.toml](https://docs.netlify.com/configure-builds/file-based-configuration) 文件。这将根据 `build.publish` 设置决定在哪里写入静态资源，如下面的示例配置所示：

```toml
[build]
	command = "npm run build"
	publish = "build"
```

如果 `netlify.toml` 文件或 `build.publish` 值缺失，将使用默认值 `"build"`。请注意，如果你在 Netlify UI 中将发布目录设置为了其他值，那么你也需要将其设置在 `netlify.toml` 中，或者使用默认值 `"build"`。

### Node 版本

新项目默认会使用当前的 Node LTS 版本。然而，如果你正在升级一个很久以前创建的项目，它可能会停留在较旧的版本上。有关手动指定当前 Node 版本的详细信息，请参阅 [Netlify 文档](https://docs.netlify.com/configure-builds/manage-dependencies/#node-js-and-javascript)。

## Netlify Edge Functions

SvelteKit 支持 [Netlify Edge Functions](https://docs.netlify.com/build/edge-functions/overview/)。如果你将 `edge: true` 选项传给 `adapter` 函数，服务器端渲染将发生在一个基于 Deno 的、部署在离站点访客很近的边缘函数中。如果设为 `false`（默认值），站点将部署到基于 Node 的 Netlify Functions。

```js
// @errors: 2307
/// file: vite.config.js
import adapter from '@sveltejs/adapter-netlify';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter({
				// 将创建基于 Deno 的 Netlify Edge Function
				// 而不是使用标准的基于 Node 的函数
				edge: true
			})
		})
	]
});
```

## SvelteKit 功能的 Netlify 替代方案

你可以直接使用由 SvelteKit 提供的功能来构建你的应用，而无需依赖任何 Netlify 功能。使用这些功能的 SvelteKit 版本将允许它们在开发模式下被使用、用集成测试进行测试，并且如果你将来决定切换到其他适配器，也能与其他适配器一起工作。然而，在某些场景下，你可能会发现使用这些功能的 Netlify 版本更有利。一个例子是，如果你正在将一个已经托管在 Netlify 上的应用迁移到 SvelteKit。

### `_headers` 和 `_redirects`

特定于 Netlify 的 [`_headers`](https://docs.netlify.com/routing/headers/#syntax-for-the-headers-file) 和 [`_redirects`](https://docs.netlify.com/routing/redirects/redirect-options/) 文件可以用于静态资源响应（如图像），方法是将它们放在项目根文件夹中。你也可以在你的 `netlify.toml` 中使用 [`[[redirects]]`](https://docs.netlify.com/routing/redirects/#syntax-for-the-netlify-configuration-file)。

### Netlify Forms

1. 按[此处](https://docs.netlify.com/forms/setup/#html-forms) 所述创建你的 Netlify HTML 表单，例如作为 `/routes/contact/+page.svelte`。（不要忘记添加隐藏的 `form-name` 输入元素！）
2. Netlify 的构建机器人会在部署时解析你的 HTML 文件，这意味着你的表单必须作为 HTML [预渲染](page-options#prerender)。你可以要么将 `export const prerender = true` 添加到你的 `contact.svelte` 以仅预渲染该页面，要么设置 `prerender.force: true` 选项以预渲染所有页面。
3. 如果你的 Netlify 表单有一个[自定义成功消息](https://docs.netlify.com/forms/setup/#success-messages)，如 `<form netlify ... action="/success">`，那么确保相应的 `/routes/success/+page.svelte` 存在并且已被预渲染。

### Netlify Functions

使用此适配器，SvelteKit 端点被托管为 [Netlify Functions](https://docs.netlify.com/functions/overview/)。Netlify 函数处理程序有额外的上下文，包括 [Netlify Identity](https://docs.netlify.com/visitor-access/identity/) 信息。你可以通过在你的钩子以及 `+page.server` 或 `+layout.server` 端点中的 `event.platform.context` 字段访问此上下文。当适配器配置中的 `edge` 属性为 `false` 时，这些是[无服务器函数](https://docs.netlify.com/functions/overview/)；当它为 `true` 时，这些是[边缘函数](https://docs.netlify.com/edge-functions/overview/#app)。

```js
// @errors: 2339
// @filename: ambient.d.ts
/// <reference types="@sveltejs/adapter-netlify" />
// @filename: +page.server.js
// ---cut---
/// file: +page.server.js
/** @type {import('./$types').PageServerLoad} */
export const load = async (event) => {
	const context = event.platform?.context;
	console.log(context); // 显示在 Netlify 应用中的函数日志里
};
```

此外，你可以通过为它们创建一个目录并将配置添加到你的 `netlify.toml` 文件，来添加你自己的 Netlify 函数。例如：

```toml
[build]
	command = "npm run build"
	publish = "build"

[functions]
	directory = "functions"
```

## 故障排除

### 访问文件系统

你不能在边缘部署中使用 `fs`。

你_可以_在无服务器部署中使用它，但它不会按预期工作，因为文件不会从你的项目复制到你的部署中。相反，请使用来自 `$app/server` 的 [`read`]($app-server#read) 函数来访问你的文件。它也可以通过在边缘部署中从已部署的公共资源位置获取文件来工作。

或者，你可以[预渲染](page-options#prerender) 相关的路由。
