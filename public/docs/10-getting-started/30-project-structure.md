---
title: 项目结构
---

一个典型的 SvelteKit 项目看起来像这样：

```tree
my-project/
├ src/
│ ├ lib/
│ │ └ [你的库文件]
│ ├ params/
│ │ └ [你的参数匹配器]
│ ├ routes/
│ │ └ [你的路由]
│ ├ app.html
│ ├ error.html
│ ├ hooks.client.js
│ ├ hooks.server.js
│ ├ service-worker.js
│ └ instrumentation.server.js
├ static/
│ └ [你的静态资源]
├ tests/
│ └ [你的测试]
├ package.json
├ tsconfig.json
└ vite.config.js
```

你还会找到常见文件，如 `.gitignore` 和 `.npmrc`（以及 `.prettierrc` 和 `eslint.config.js` 等，如果你在运行 `npx sv create` 时选择了这些选项的话）。

## 项目文件

### src

`src` 目录包含了你项目的核心内容。除了 `src/routes` 和 `src/app.html` 之外，其余都是可选的。

- `lib` 包含你的库代码（工具函数和组件），可以通过 [`#lib`]($lib) 别名导入，或使用 [`svelte-package`](packaging) 打包分发
  - 任意深度的名为 `server` 的目录，会将其中的任何代码标记为[仅服务器端](server-only-modules)。SvelteKit 会阻止你在客户端代码中导入这些内容。
- `params` 包含你的应用所需的任何[参数匹配器](advanced-routing#Matching)
- `routes` 包含你应用的[路由](routing)。你也可以将仅在单个路由内使用的其他组件放在这里
- `app.html` 是你的页面模板——一个包含以下占位符的 HTML 文档：
  - `%sveltekit.head%` —— 应用所需的 `<link>` 和 `<script>` 元素，加上任何 `<svelte:head>` 内容
  - `%sveltekit.body%` —— 已渲染页面的标记。它应该位于 `<div>` 或其他元素内部，而不是直接位于 `<body>` 内，以防止浏览器扩展注入元素后又被水合（hydration）过程销毁所导致的 bug。如果不是这样，SvelteKit 会在开发时向你发出警告
  - `%sveltekit.assets%` —— 要么是 [`paths.assets`](configuration#paths)（如果指定了），要么是相对于 [`paths.base`](configuration#paths) 的路径
  - `%sveltekit.nonce%` —— 用于手动包含的链接和脚本的 [CSP](configuration#csp) 随机数（nonce），如果使用了的话
  - `%sveltekit.env.[NAME]%` —— 这将在渲染时替换为 `[NAME]` 环境变量，该变量必须以 [`publicPrefix`](configuration#env)（通常是 `PUBLIC_`）开头，或者在使用 [`experimental.explicitEnvironmentVariables`](environment-variables) 时在 `src/env` 中定义为公共变量。如果不匹配，将回退为 `''`。
  - `%sveltekit.version%` —— 应用版本，可以通过 [`version`](configuration#version) 配置指定
- `error.html` 是在其他一切失败时渲染的页面。它可以包含以下占位符：
  - `%sveltekit.status%` —— HTTP 状态码
  - `%sveltekit.error.message%` —— 错误信息
- `hooks.client.js` 包含你的客户端[钩子](hooks)
- `hooks.server.js` 包含你的服务器端[钩子](hooks)
- `service-worker.js` 包含你的[服务工作者](service-workers)
- `instrumentation.server.js` 包含你的[可观测性](observability) 设置和 instrumentation 代码
  - 需要适配器的支持。如果你的适配器支持，它保证会在加载和运行你的应用代码之前运行。

（项目中包含的是 `.js` 还是 `.ts` 文件，取决于你在创建项目时是否选择使用 TypeScript。）

如果你在设置项目时添加了 [Vitest](https://vitest.dev)，你的单元测试将以 `.test.js` 扩展名存放在 `src` 目录中。

### static

任何应该保持文件名不变地提供服务的静态资源——比如 `robots.txt`——都放在这里。通常最好尽量减少 `static/` 中的资源数量，转而使用 `import` 导入它们。使用 `import` 可以让 [Vite 的内置处理](images#Vite's-built-in-handling) 根据资源内容的哈希为其生成唯一名称，以便进行缓存。

### tests

如果你在设置项目时添加了 [Playwright](https://playwright.dev/) 用于浏览器测试，测试将存放在此目录中。

### package.json

你的 `package.json` 文件必须将 `@sveltejs/kit`、`svelte` 和 `vite` 作为 `devDependencies`。

当你使用 `npx sv create` 创建项目时，你还会注意到 `package.json` 中包含了 `"type": "module"`。这意味着 `.js` 文件会被解释为带有 `import` 和 `export` 关键字的原生 JavaScript 模块。旧的 CommonJS 文件需要 `.cjs` 文件扩展名。

### vite.config.js

SvelteKit 项目实际上只是一个使用 [`@sveltejs/kit/vite`](@sveltejs-kit-vite) 插件以及任何其他 [Vite 配置](https://vitejs.dev/config/) 的 [Vite](https://vitejs.dev) 项目。该插件接受你的 Svelte 和 SvelteKit [配置](configuration)。

### tsconfig.json

如果你在 `npx sv create` 时添加了类型检查，这个文件（或者如果你更喜欢类型检查的 `.js` 文件而非 `.ts` 文件，则是 `jsconfig.json`）用于配置 TypeScript。由于 SvelteKit 依赖某些以特定方式设置的配置，它会生成自己的 `.svelte-kit/tsconfig.json` 文件，你自己的配置会 `extends`（继承）它。要更改 `include` 和 `exclude` 等顶层选项，我们推荐继承生成的配置；更多详情请参阅 [`typescript.config` 设置](configuration#typescript)。

## 其他文件

### .svelte-kit

在你开发和构建项目时，SvelteKit 会在 `.svelte-kit` 目录中生成文件（可通过 [`outDir`](configuration#outDir) 配置）。你可以忽略其内容，并随时删除它们（它们会在你下次运行 `dev` 或 `build` 时重新生成）。
