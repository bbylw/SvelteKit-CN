---
title: 项目类型
---

SvelteKit 提供可配置的渲染方式，允许你以多种不同的方式构建和部署项目。你可以用 SvelteKit 构建上述所有类型的应用以及更多。渲染设置并不互斥，你可以为应用的不同部分选择最优的渲染方式。

如果你还没有想好要用哪种方式构建应用，不用担心！应用的构建、部署和渲染方式由你所选的适配器以及少量配置控制，这些都可以稍后更改。无论你选择哪种项目类型，[项目结构](project-structure) 和[路由](glossary#Routing) 都是相同的。

## 默认渲染

默认情况下，当用户访问站点时，SvelteKit 会使用[服务器端渲染（SSR）](glossary#SSR) 渲染首页，并使用[客户端渲染（CSR）](glossary#CSR) 渲染后续页面。对初始渲染使用 SSR 可以改善 SEO 和首屏加载的感知性能。随后客户端渲染接管，无需重新渲染公共组件就能更新页面，这通常更快，并消除了页面间导航时的闪烁。使用这种混合渲染方式构建的应用也被称为[过渡式应用（transitional apps）](https://www.youtube.com/watch?v=860d8usGC0o)。

## 静态站点生成

你可以将 SvelteKit 用作[静态站点生成器（SSG）](glossary#SSG)，使用 [`adapter-static`](adapter-static) 通过静态渲染完整[预渲染](glossary#Prerendering) 你的站点。你也可以[使用预渲染选项](page-options#prerender) 仅预渲染部分页面，然后选择不同的适配器来动态服务器端渲染其他页面。

专门用于静态站点生成的工具在渲染大量页面时，可能会更高效地进行预渲染。在处理非常大的静态生成站点时，如果使用的是 `adapter-vercel`，你可以通过[增量静态再生（ISR）](adapter-vercel#Incremental-Static-Regeneration) 避免漫长的构建时间。与专用的 SSG 不同，SvelteKit 允许你在不同页面上优雅地混合搭配不同的渲染类型。

## 单页应用

[单页应用（SPA）](glossary#SPA) 仅使用[客户端渲染（CSR）](glossary#CSR)。你可以用 SvelteKit [构建单页应用（SPA）](single-page-apps)。与所有类型的 SvelteKit 应用一样，你可以用 SvelteKit 或[其他语言或框架](#Separate-backend) 编写后端。如果你正在构建一个没有后端或[独立后端](#Separate-backend) 的应用，可以跳过并忽略文档中讨论 `server` 文件的部分。

## 多页应用

SvelteKit 通常不用于构建[传统的多页应用](glossary#MPA)。不过，你可以使用 [`data-sveltekit-reload`](link-options#data-sveltekit-reload)，通过 `<body data-sveltekit-reload>` 在服务器上渲染所有链接，或者将其放在更具体的地方来渲染特定链接。这并不会移除客户端路由器，但如果你在某个页面上不需要 JavaScript，可以使用 [`csr = false`](page-options#csr) 移除页面上的所有 JavaScript，这也会在点击时于服务器上渲染任何链接。

## 独立后端

如果你的后端是用 Go、Java、PHP、Ruby、Rust 或 C# 等其他语言编写的，有几种方式可以部署你的应用。最推荐的方式是使用 `adapter-node` 或无服务器适配器，将 SvelteKit 前端与后端分开部署。一些用户不喜欢管理独立进程，决定将其应用作为由其后端服务器提供服务的[单页应用（SPA）](single-page-apps) 部署，但请注意单页应用的 SEO 和性能特性较差。

如果你使用的是外部后端，可以简单地跳过并忽略文档中讨论 `server` 文件的部分。你可能还想参考[关于如何调用独立后端的常见问题解答](faq#How-do-I-use-a-different-backend-API-server)。

## 无服务器应用

SvelteKit 应用很容易在无服务器平台上运行。[默认的零配置适配器](adapter-auto) 会自动在你的多个受支持平台上运行应用，或者你可以使用 [`adapter-vercel`](adapter-vercel)、[`adapter-netlify`](adapter-netlify) 或 [`adapter-cloudflare`](adapter-cloudflare) 来提供平台特定的配置。此外，[社区适配器](/packages#sveltekit-adapters) 允许你将应用部署到几乎任何无服务器环境。其中一些适配器（如 [`adapter-vercel`](adapter-vercel) 和 [`adapter-netlify`](adapter-netlify)）提供 `edge` 选项，以支持[边缘渲染](glossary#Edge) 以降低延迟。

## 自己的服务器

你可以使用 [`adapter-node`](adapter-node) 部署到你自己的服务器或 VPS。

## 容器

你可以使用 [`adapter-node`](adapter-node) 在容器（如 Docker 或 LXC）中运行 SvelteKit 应用。

## 库

你可以在运行 [`sv create`](/docs/cli/sv-create) 时选择库选项，通过 SvelteKit 的 [`@sveltejs/package`](packaging) 插件创建一个供其他 Svelte 应用使用的库。

## 离线应用

SvelteKit 全面支持[服务工作者](service-workers)，允许你构建多种类型的应用，如离线应用和[渐进式 Web 应用（PWA）](glossary#PWA)。

## 移动应用

你可以使用 [Tauri](https://v2.tauri.app/start/frontend/sveltekit/) 或 [Capacitor](https://capacitorjs.com/solution/svelte) 将 [SvelteKit SPA](single-page-apps) 转变为移动应用。像相机、地理位置和推送通知等移动功能在两个平台上都可通过插件获得。

这些移动开发平台通过启动一个本地 Web 服务器，然后像静态主机一样在你的手机上提供应用。你可能会发现 [`bundleStrategy: 'single'`](configuration#output) 是一个有用的选项，可以限制发出的请求数量。例如，在撰写本文时，Capacitor 本地服务器使用 HTTP/1，这会限制并发连接的数量。

## 桌面应用

你可以使用 [Tauri](https://v2.tauri.app/start/frontend/sveltekit/)、[Wails](https://wails.io/docs/guides/sveltekit/) 或 [Electron](https://www.electronjs.org/) 将 [SvelteKit SPA](single-page-apps) 转变为桌面应用。

## 浏览器扩展

你可以使用 [`adapter-static`](adapter-static) 或专为浏览器扩展定制的[社区适配器](/packages#sveltekit-adapters) 构建浏览器扩展。

## 嵌入式设备

由于其高效的渲染，Svelte 可以在低功耗设备上运行。微控制器和电视等嵌入式设备可能会限制并发连接的数量。为了减少并发请求的数量，在这种部署配置中，你可能会发现 [`bundleStrategy: 'single'`](configuration#output) 是一个有用的选项。
