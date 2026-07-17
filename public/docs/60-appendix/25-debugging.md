---
title: 断点调试
---

除了 [`@debug`](../svelte/@debug) 标签外，你也可以使用各种工具和开发环境中的断点来调试 Svelte 和 SvelteKit 项目。这包括前端和后端代码。

以下指南假定你的 JavaScript 运行时环境是 Node.js。

## Visual Studio Code

借助内置的调试终端，你可以在 VSCode 中的源文件里设置断点。

1. 打开命令面板：`CMD/Ctrl` + `Shift` + `P`。
2. 找到并启动 "Debug: JavaScript Debug Terminal"（调试：JavaScript 调试终端）。
3. 使用调试终端启动你的项目。例如：`npm run dev`。
4. 在你的客户端或服务端源代码中设置一些断点。
5. 触发断点。

### 通过调试面板启动

你也可以选择在项目中设置一个 `.vscode/launch.json`。要自动设置：

1. 进入 "Run and Debug"（运行和调试）面板。
2. 在 "Run" 选择菜单中，选择 "Node.js..."。
3. 选择与你项目对应的 "run script"（运行脚本），例如 "Run script: dev"。
4. 按下 "Start debugging"（开始调试）播放按钮，或按 `F5` 开始断点调试。

这里是一个 `launch.json` 示例：

```json
{
	"version": "0.2.0",
	"configurations": [
		{
			"command": "npm run dev",
			"name": "Run development server",
			"request": "launch",
			"type": "node-terminal"
		}
	]
}
```

延伸阅读：<https://code.visualstudio.com/docs/editor/debugging>。

## 其他编辑器

如果你使用不同的编辑器，这些社区指南可能对你有用：

- [WebStorm Svelte：调试你的应用](https://www.jetbrains.com/help/webstorm/svelte.html#ws_svelte_debug)
- [在 Neovim 中调试 JavaScript 框架](https://theosteiner.de/debugging-javascript-frameworks-in-neovim)

## Google Chrome 和 Microsoft Edge 开发者工具

可以使用基于浏览器的调试器来调试 Node.js 应用。

> [!NOTE] 注意这仅适用于调试客户端 SvelteKit 源映射。

1. 在使用 Node.js 启动 Vite 服务器时运行 `--inspect` 标志。例如：`NODE_OPTIONS="--inspect" npm run dev`
2. 在新标签页中打开你的站点。通常在 `localhost:5173`。
3. 打开你浏览器的开发者工具，并点击左上角附近的 "Open dedicated DevTools for Node.js"（为 Node.js 打开专用 DevTools）图标。它应该显示 Node.js 的 logo。
4. 设置断点并调试你的应用。

你也可以通过在 Google Chrome 中导航到 `chrome://inspect`，或在 Microsoft Edge 中导航到 `edge://inspect` 来打开调试器开发者工具。

## 参考

- [调试 Node.js](https://nodejs.org/en/learn/getting-started/debugging)
