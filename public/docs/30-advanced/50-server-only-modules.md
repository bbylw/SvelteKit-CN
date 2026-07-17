---
title: 仅服务器模块
---

就像一个好朋友，SvelteKit 会为你保守秘密。当你在同一个仓库中编写后端和前端时，很容易不小心将敏感数据导入到前端代码中（例如包含 API 密钥的环境变量）。SvelteKit 提供了一种完全防止这种情况的方法：仅服务器模块。

## 私有环境变量

[`$app/env/private`](environment-variables) 模块只能被导入到仅在服务器上运行的模块中，例如 [`hooks.server.js`](hooks#Server-hooks) 或 [`+page.server.js`](routing#page-page.server.js)。

## 仅服务器工具

[`$app/server`]($app-server) 模块包含一个用于从文件系统读取资源的 [`read`]($app-server#read) 函数，同样只能被在服务器上运行的代码导入。

## 你自己的模块

你可以通过两种方式将你自己的模块设为仅服务器：

- 对于单个模块，在文件名中添加 `.server`，例如 `secrets.server.js`。这适用于项目目录中的*任何*文件。
- 项目中任何位置（`src/routes` 或资源目录内部除外）名为 `server` 的目录，会将其中的*所有*代码标记为仅服务器，例如 `src/lib/server/config.js` 或 `src/lib/data/server/user/profile.js`。（在 SvelteKit 2 中，这仅适用于 `src/lib` 文件夹。）

> [!NOTE] 你工作目录之外的模块以及 `node_modules` 内部的模块（例如来自 npm 的包）*不*受这些规则约束。如果你想发布一个带有仅服务器模块的包，请在该文件顶部添加 `import '$app/server'`。

## 工作原理

每当你有面向公众的代码（直接或间接）导入仅服务器代码时……

```js
// @errors: 7005
/// file: #lib/server/secrets.js
export const atlantisCoordinates = [/* redacted */];
```

```js
// @errors: 2307 7006 7005
/// file: src/routes/utils.js
export { atlantisCoordinates } from '#lib/server/secrets.js';

export const add = (a, b) => a + b;
```

```html
/// file: src/routes/+page.svelte
<script>
	import { add } from './utils.js';
</script>
```

……SvelteKit 会报错：

```
Cannot import #lib/server/secrets.ts into code that runs in the browser, as this could leak sensitive information.

 src/routes/+page.svelte imports
  src/routes/utils.js imports
   #lib/server/secrets.ts

If you're only using the import as a type, change it to `import type`.
```

尽管面向公众的代码 —— `src/routes/+page.svelte` —— 只使用了 `add` 导出而没有使用秘密的 `atlantisCoordinates` 导出，但秘密代码最终可能会出现在浏览器下载的 JavaScript 中，因此这条导入链被视为不安全。

此功能也适用于动态导入，甚至是插值形式的导入，如 ``await import(`./${foo}.js`)``。

> [!NOTE] 像 Vitest 这样的单元测试框架不区分仅服务器代码和面向公众的代码。因此，运行测试时会禁用非法导入检测，这由 `process.env.TEST === 'true'` 决定。

## 延伸阅读

- [教程：环境变量](/tutorial/kit/env-static-private)
