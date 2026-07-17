---
title: 性能
---

开箱即用，SvelteKit 做了大量工作来让你的应用尽可能高性能：

- 代码分割（code-splitting），以便只加载当前页面所需的代码
- 资源预加载，以防止"瀑布流"（文件请求其他文件的情况）
- 文件哈希，以便你的资源可以被永久缓存
- 请求合并（request coalescing），以便从独立的服务端 `load` 函数中获取的数据被合并为一个 HTTP 请求
- 并行加载，以便独立的 universal `load` 函数同时获取数据
- 数据内联，以便服务器渲染期间用 `fetch` 发出的请求可以在浏览器中重放，而无需发起新请求
- 保守的失效机制，以便 `load` 函数仅在必要时重新运行
- 预渲染（可按路由配置，如有必要），以便不含动态数据的页面可以即时提供
- 链接预加载，以便提前预备好客户端导航所需的数据和代码要求

尽管如此，我们（目前）还无法消除所有导致缓慢的来源。为了榨取最大性能，你应该留意以下建议。

## 诊断问题

Google 的 [PageSpeed Insights](https://pagespeed.web.dev/) 以及（用于更深入分析的）[WebPageTest](https://www.webpagetest.org/) 是了解已部署到互联网上的站点性能特征的绝佳方式。

你的浏览器也包含有用的开发者工具来分析你的站点，无论它是否已部署还是在本地运行：

* Chrome - [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview#devtools)、[Network](https://developer.chrome.com/docs/devtools/network) 和 [Performance](https://developer.chrome.com/docs/devtools/performance) 开发者工具
* Edge - [Lighthouse](https://learn.microsoft.com/en-us/microsoft-edge/devtools-guide-chromium/lighthouse/lighthouse-tool)、[Network](https://learn.microsoft.com/en-us/microsoft-edge/devtools-guide-chromium/network/) 和 [Performance](https://learn.microsoft.com/en-us/microsoft-edge/devtools-guide-chromium/evaluate-performance/) 开发者工具
* Firefox - [Network](https://firefox-source-docs.mozilla.org/devtools-user/network_monitor/) 和 [Performance](https://hacks.mozilla.org/2022/03/performance-tool-in-firefox-devtools-reloaded/) 开发者工具
* Safari - [增强网页性能](https://developer.apple.com/library/archive/documentation/NetworkingInternetWeb/Conceptual/Web_Inspector_Tutorial/EnhancingyourWebpagesPerformance/EnhancingyourWebpagesPerformance.html)

注意，在 `dev` 模式下本地运行的站点会表现出与生产应用不同的行为，因此你应该在构建后于 [preview](building-your-app#Preview-your-app) 模式下进行性能测试。

### 插桩（Instrumenting）

如果你在浏览器的网络标签页中看到一个 API 调用耗时很长，并想了解原因，你可以考虑使用 [OpenTelemetry](https://opentelemetry.io/) 或 [Server-Timing 响应头](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server-Timing) 之类的工具对你的后端进行插桩。

## 优化资源

### 图片

缩小图片文件大小通常是你能对站点性能做出的最有影响力的改动之一。Svelte 提供了 `@sveltejs/enhanced-img` 包（在 [images](images) 页面有详细说明）来让这件事更简单。此外，Lighthouse 对找出最影响性能的因素很有帮助。

### 视频

视频文件可能非常庞大，因此应格外注意确保它们经过优化：

- 使用 [Handbrake](https://handbrake.fr/) 等工具压缩视频。考虑将视频转换为对 Web 友好的格式，如 `.webm` 或 `.mp4`。
- 你可以用 `preload="none"` 来[懒加载](https://web.dev/articles/lazy-loading-video)位于首屏以下的视频（不过请注意，这会在用户_确实_开始播放时拖慢播放速度）。
- 使用 [FFmpeg](https://ffmpeg.org/) 等工具将静音视频的音轨剥离出来。

### 字体

SvelteKit 在用户访问页面时会自动预加载关键的 `.js` 和 `.css` 文件，但默认_不会_预加载字体，因为这可能导致下载不必要的文件（例如被你的 CSS 引用但当前页面并未实际使用的字重）。话虽如此，正确地预加载字体可以对你站点的"速度感"产生很大影响。在你的 [`handle`](hooks#Server-hooks-handle) 钩子中，你可以调用 `resolve` 并传入一个包含你字体的 `preload` 过滤器。

你可以通过[子集化](https://web.dev/learn/performance/optimize-web-fonts#subset_your_web_fonts)字体来减小字体文件的大小。

## 减小代码体积

### Svelte 版本

我们建议运行最新版本的 Svelte。Svelte 5 比 Svelte 4 更小更快，而 Svelte 4 又比 Svelte 3 更小更快。

### 包

[`rollup-plugin-visualizer`](https://www.npmjs.com/package/rollup-plugin-visualizer) 有助于识别哪些包对站点体积的贡献最大。你也可以通过手动检查构建输出来找到移除代码的机会（在你的 [Vite 配置](https://vitejs.dev/config/build-options.html#build-minify) 中使用 `build: { minify: false }` 让输出可读，但记得在部署应用前撤销该设置），或通过浏览器开发者工具的网络标签页。

### 外部脚本

尽量减少浏览器中运行的第三方脚本数量。例如，与其使用基于 JavaScript 的分析，不如考虑使用服务端实现，例如许多带有 SvelteKit 适配器的平台所提供的，包括 [Cloudflare](https://www.cloudflare.com/web-analytics/)、[Netlify](https://docs.netlify.com/monitor-sites/site-analytics/) 和 [Vercel](https://vercel.com/docs/analytics)。

要在 Web Worker 中运行第三方脚本（以避免阻塞主线程），请使用 [Partytown 的 SvelteKit 集成](https://partytown.builder.io/sveltekit)。

### 选择性加载

用静态 `import` 声明导入的代码会自动与页面的其余部分打包在一起。如果你只在某个条件满足时才需要某段代码，请使用动态的 `import(...)` 形式来按需懒加载该组件。

## 导航

### 预加载

你可以通过急切地预加载必要的代码和数据来加速客户端导航，使用[链接选项](link-options)。当你创建新的 SvelteKit 应用时，这是 `<body>` 元素上的默认配置。

### 非必要数据

对于不需要立即加载的慢速数据，`load` 函数返回的对象可以包含 promise 而非数据本身。对于服务端 `load` 函数，这将导致数据在导航（或初始页面加载）之后[流式传输](load#Streaming-with-promises)进来。

### 防止瀑布流

性能最大的杀手之一被称为_瀑布流_，即一系列按顺序发起的请求。这可能发生在服务端或浏览器中，但当涉及到需要传输更远或经过更慢网络的数据时（例如移动用户向远端服务器发起调用），代价尤其高昂。

在浏览器中，当你的 HTML 触发请求链时就会出现瀑布流，例如请求 JS，JS 又请求 CSS，CSS 再请求背景图片和 Web 字体。SvelteKit 会通过添加 [`modulepreload`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/modulepreload) 标签或响应头来在很大程度上为你解决这类问题，但你应当[查看开发者工具中的网络标签页](#Diagnosing-issues)来检查是否需要预加载额外的资源。
- 如果你使用[Web 字体](#Optimizing-assets-Fonts)，请特别留意，因为它们需要手动处理。
- 启用[单页应用（SPA）模式](single-page-apps)会导致此类瀑布流。在 SPA 模式下，会生成一个空页面，它再去获取 JavaScript，最终加载并渲染页面。这会导致在显示第一个像素之前产生额外的网络往返。

瀑布流也可能发生在对后端的调用中，无论这些调用来自浏览器还是服务端。例如，如果一个 universal `load` 函数调用 API 来获取当前用户，然后用该响应中的细节去获取已保存项的列表，再用_那个_响应去获取每个项的细节，浏览器最终会发起多个连续的请求。这对性能是致命的，尤其是对于物理位置远离你后端的用户。
- 通过使用[服务端 `load` 函数](load#Universal-vs-server)来从服务端而非浏览器向作为依赖的后端服务发起请求，可以避免这个问题。不过请注意，服务端 `load` 函数也并非对瀑布流免疫（尽管代价要小得多，因为它们很少涉及高延迟的往返）。例如，如果你查询数据库获取当前用户，然后用该数据发起第二次查询以获取已保存项的列表，那么使用带有数据库连接的单个查询通常会性能更好。

## 托管

你的前端应该与后端位于同一个数据中心，以最小化延迟。对于没有中心后端的站点，许多 SvelteKit 适配器支持部署到_边缘_（edge），这意味着由就近的服务器来处理每个用户的请求。这可以显著减少加载时间。有些适配器甚至支持[按路由配置部署](page-options#config)。你还应考虑从 CDN（通常就是边缘网络）提供图片——许多 SvelteKit 适配器的托管方会自动这样做。

确保你的托管方使用 HTTP/2 或更新版本。Vite 的代码分割会创建大量小文件以改善可缓存性，这会带来极佳的性能，但这确实假定你的文件可以通过 HTTP/2 并行加载。

## 延伸阅读

在大多数情况下，构建一个高性能的 SvelteKit 应用与构建任何高性能 Web 应用是一样的。你应该能够将来自通用性能资源（如 [Core Web Vitals](https://web.dev/explore/learn-core-web-vitals)）的信息应用到你构建的任何 Web 体验中。
