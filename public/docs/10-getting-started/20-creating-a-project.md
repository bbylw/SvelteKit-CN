---
title: 创建项目
---

启动 SvelteKit 应用最简单的方法是运行 `npx sv create`：

```sh
npx sv create my-app
cd my-app
npm run dev
```

第一条命令会在 `my-app` 目录中搭建一个新项目，并询问是否要设置一些基础工具，比如 TypeScript。关于这些选项的更多信息，请参阅 [CLI 文档](/docs/cli/overview)；关于设置额外工具的指导，请参阅[集成页面](./integrations)。然后 `npm run dev` 会在 [localhost:5173](http://localhost:5173) 启动开发服务器——如果在创建项目时没有安装依赖，请确保在运行前先安装。

有两个基本概念：

- 应用的每个页面都是一个 [Svelte](../svelte) 组件
- 你通过在项目的 `src/routes` 目录中添加文件来创建页面。这些页面会进行服务器端渲染，以便用户首次访问应用时尽可能快，随后由客户端应用接管

尝试编辑这些文件，感受一下一切是如何工作的。

## 编辑器设置

我们推荐使用 [Visual Studio Code（简称 VS Code）](https://code.visualstudio.com/download) 配合 [Svelte 扩展](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)，但也[支持众多其他编辑器](https://sveltesociety.dev/collection/editor-support-c85c080efc292a34)。
