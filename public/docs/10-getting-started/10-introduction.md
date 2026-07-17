---
title: 简介
---

## 开始之前

> [!NOTE] 如果你刚接触 Svelte 或 SvelteKit，我们推荐先学习[交互式教程](/tutorial/kit)。
>
> 如果遇到问题，可以在 [Discord 聊天室](/chat) 寻求帮助。

## 什么是 SvelteKit？

SvelteKit 是一个用于快速开发健壮、高性能 Web 应用的框架，基于 [Svelte](../svelte) 构建。如果你来自 React，SvelteKit 类似于 Next；如果你来自 Vue，SvelteKit 类似于 Nuxt。

要了解更多关于你可以用 SvelteKit 构建的应用类型，请参阅[关于项目类型的文档](project-types)。

## 什么是 Svelte？

简而言之，Svelte 是一种编写用户界面组件的方式——比如导航栏、评论区或联系表单——用户在浏览器中看到并与它们交互。Svelte 编译器将你的组件转换为可运行的 JavaScript，用于渲染页面的 HTML，以及为页面添加样式的 CSS。理解本指南的其余部分不需要了解 Svelte，但了解它会有所帮助。如果你想了解更多，请查看 [Svelte 教程](/tutorial)。

## SvelteKit 与 Svelte

Svelte 负责渲染 UI 组件。你可以用 Svelte 组合这些组件并渲染整个页面，但要编写完整的应用，光靠 Svelte 还不够。

SvelteKit 帮助你构建 Web 应用，同时遵循现代最佳实践，并提供常见开发挑战的解决方案。它提供从基础功能——比如点击链接时更新 UI 的[路由器](glossary#Routing)——到更高级的能力。其丰富的功能列表包括：[构建优化](https://vitejs.dev/guide/features.html#build-optimizations)（仅加载最小必需的代码）；[离线支持](service-workers)；在用户导航前[预加载](link-options#data-sveltekit-preload-data)页面；[可配置渲染](page-options)，通过 [SSR](glossary#SSR) 在服务器上、通过[客户端渲染](glossary#CSR) 在浏览器中，或在构建时通过[预渲染](glossary#Prerendering) 来处理应用的不同部分；[图片优化](images)；以及更多。用所有现代最佳实践构建应用极其复杂，但 SvelteKit 为你完成了所有繁琐的工作，让你专注于创造性的部分。

它利用 [Vite](https://vitejs.dev/) 和 [Svelte 插件](https://github.com/sveltejs/vite-plugin-svelte) 实现[热模块替换（HMR）](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/config.md#hot)，在浏览器中即时反映代码的更改，从而提供极快且功能丰富的开发体验。
