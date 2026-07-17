---
title: 术语表
---

SvelteKit 的核心提供了一个高度可配置的渲染引擎。本节描述了讨论渲染时使用的一些术语。上面文档中提供了设置这些选项的参考。

## CSR

客户端渲染（CSR）是使用 JavaScript 在 Web 浏览器中生成页面内容。

在 SvelteKit 中，默认会使用客户端渲染，但你可以通过 [the `csr = false` page option](page-options#csr) 关闭 JavaScript。

## Edge

在边缘（edge）渲染指的是在靠近用户的 content delivery network（CDN）中渲染应用。边缘渲染让页面的请求和响应传输更短的距离，从而改善延迟。

## Hybrid app

SvelteKit 默认使用混合渲染模式：它从服务器加载初始 HTML（SSR），然后在后续导航中通过客户端渲染（CSR）更新页面内容。

## Hydration

Svelte 组件会存储一些状态，并在状态更新时更新 DOM。在 SSR 期间获取数据时，默认情况下 SvelteKit 会存储这些数据，并将其与服务器渲染的 HTML 一起传输到客户端。然后组件可以在客户端用该数据初始化，而无需再次调用相同的 API 端点。Svelte 然后会检查 DOM 是否处于预期状态，并附加事件监听器，这个过程称为 hydration（注水/激活）。一旦组件被完全激活，它们就可以像任何新创建的 Svelte 组件一样对其属性的变化做出反应。

在 SvelteKit 中，页面默认会被激活，但你可以通过 [the `csr = false` page option](page-options#csr) 关闭 JavaScript。

## ISR

增量静态再生（ISR）允许你在访客请求页面时生成你站点上的静态页面，而无需重新部署。与具有大量页面的 [SSG](#SSG) 站点相比，这可能会减少构建时间。你可以通过 [adapter-vercel 使用 ISR](adapter-vercel#Incremental-Static-Regeneration)。

## MPA

传统的在服务器上渲染每个页面视图的应用——例如那些用 JavaScript 以外的语言编写的应用——通常被称为多页应用（MPA）。

## Prerendering

预渲染意味着在构建时计算页面的内容并保存 HTML 以供显示。这种方法与传统服务端渲染的页面有相同的好处，但避免为每个访客重新计算页面，因此随着访客数量的增加几乎可以免费扩展。权衡之处在于构建过程开销更大，并且预渲染的内容只能通过构建和部署新版本的应用来更新。

为了使内容可预渲染，任何两个直接访问它的用户都必须从服务器获得相同的内容，并且该页面不能包含 [actions](form-actions)。注意，你仍然可以预渲染基于页面参数加载的内容，只要所有用户看到的都是相同的预渲染内容。预渲染你所有的页面也称为 [Static Site Generation](#SSG)。

预渲染的页面不限于静态内容。如果用户特定的数据是在客户端获取并渲染的，你可以构建个性化页面。但这有一个注意事项，即你将遭遇如上所述不对这些内容进行 SSR 的缺点。

在 SvelteKit 中，你可以通过 [the `prerender` page option](page-options#prerender) 以及 `vite.config.js` 中 SvelteKit 插件的 [`prerender` config](configuration#prerender) 来控制预渲染。

## PWA

渐进式 Web 应用（PWA）是一个使用 Web API 和技术构建的应用，但功能上像一个移动或桌面应用。[作为 PWA 提供的站点可以被安装](https://web.dev/learn/pwa/installation)，允许你在启动器、主屏幕或开始菜单中添加该应用的快捷方式。许多 PWA 会利用 [service workers](service-workers) 来构建离线能力。

## Routing

默认情况下，当你导航到一个新页面时（通过点击链接或使用浏览器的前进或后退按钮），SvelteKit 会拦截这次尝试的导航并处理它，而不是让浏览器向服务器发送请求以获取目标页面。然后 SvelteKit 会通过渲染新页面的组件来在客户端更新显示的内容，该组件反过来可以调用必要的 API 端点。这种在客户端响应尝试导航而更新页面的过程称为客户端路由。

在 SvelteKit 中，默认会使用客户端路由，但你可以通过 [`data-sveltekit-reload`](link-options#data-sveltekit-reload) 跳过它。

## SPA

单页应用（SPA）是一个这样的应用：所有对服务器的请求都加载一个单一的 HTML 文件，然后该文件根据请求的 URL 进行客户端渲染。所有导航都在客户端处理，这个过程称为客户端路由，其中每个页面的内容被更新，而常见的布局元素基本保持不变。在本站中，当我们提到 SPA 时，我们使用这个定义，即 SPA 在初始请求时只提供一个空的壳。它不应与 [hybrid app](#Hybrid-app) 混淆，后者在初始请求时提供 HTML。它通过在渲染可以开始之前强制进行两次网络往返而产生很大的性能影响。由于 SPA 模式有巨大的负面性能和 SEO 影响，建议仅在非常有限的情况下使用，例如被包裹在移动应用中时。

在 SvelteKit 中，你可以 [用 `adapter-static` 构建 SPA](single-page-apps)。

## SSG

静态站点生成（SSG）是一个术语，指的是一个站点中每个页面都被预渲染。完全预渲染一个站点的一个好处是你不需要维护或付费使用执行 SSR 的服务器。一旦生成，站点就可以从 CDN 提供，带来极佳的"首字节时间"性能。这种交付模式通常被称为 JAMstack。

在 SvelteKit 中，你可以通过使用 [`adapter-static`](adapter-static) 或通过配置每个页面使用 [the `prerender` page option](page-options#prerender) 或 `vite.config.js` 中 SvelteKit 插件的 [`prerender` config](configuration#prerender) 进行[预渲染](#Prerendering) 来做静态站点生成。

## SSR

服务端渲染（SSR）是在服务器上生成页面内容。通过 SSR 或预渲染从服务器返回页面内容在性能和 SEO 上是高度被青睐的。它通过避免引入 SPA 中必要的额外往返，显著改善了性能，并且如果你的 JavaScript 失败或被禁用（这种情况[比你想象的更常见](https://kryogenix.org/code/browser/everyonehasjs.html)），它让你的应用对用户可用。虽然一些搜索引擎可以索引在客户端动态生成的内容，但即使在这些情况下也可能需要更长时间。

在 SvelteKit 中，页面默认是服务端渲染的。你可以通过 [the `ssr` page option](page-options#ssr) 禁用 SSR。
