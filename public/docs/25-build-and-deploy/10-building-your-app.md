---
title: 构建你的应用
---

构建 SvelteKit 应用分为两个阶段，这两个阶段都发生在你运行 `vite build`（通常通过 `npm run build`）时。

首先，Vite 会为你的服务器代码、浏览器代码以及你的服务工作者（如果你有的话）创建一个优化的生产构建。[预渲染](page-options#prerender) 在这个阶段执行（如果适用的话）。

其次，一个_适配器_获取这个生产构建并为你的目标环境进行调整——在接下来的页面中有更多关于此的内容。

## 构建期间

SvelteKit 会在构建期间加载你的 `+page/layout(.server).js` 文件（以及它们导入的所有文件）以进行分析。任何_不应_在这个阶段执行的代码必须检查来自 [`$app/env`]($app-env) 的 `building` 是否为 `false`：

```js
+++import { building } from '$app/env';+++
import { initialiseDatabase } from '#lib/server/database';

+++if (!building) {+++
	initialiseDatabase();
+++}+++

export function load() {
	// ...
}
```

## 预览你的应用

构建完成后，你可以通过 `vite preview`（通过 `npm run preview`）在本地查看你的生产构建。请注意，这会在 Node 中运行应用，因此并不是对你已部署应用的完美复现——特定于适配器的调整（如 [`platform` 对象](adapters#Platform-specific-context)）不适用于预览。
