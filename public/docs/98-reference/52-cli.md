---
title: 命令行接口
---

SvelteKit 项目使用 [Vite](https://vitejs.dev)，这意味着你主要会使用它的 CLI（尽管是通过 `npm run dev/build/preview` 脚本）：

- `vite dev` — 启动开发服务器
- `vite build` — 构建你应用的生产版本
- `vite preview` — 在本地运行生产版本

不过，SvelteKit 包含了它自己的用于初始化项目的 CLI：

## svelte-kit sync

`svelte-kit sync` 为你的项目创建 `tsconfig.json` 以及所有生成的类型（你可以在路由文件中以 `./$types` 导入它们）。当你创建一个新项目时，它被列为 `prepare` 脚本，并将作为 npm 生命周期的一部分自动运行，因此你通常不需要手动运行此命令。
