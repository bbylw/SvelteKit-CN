---
title: 可观测性
---

<blockquote class="since note">
	<p>自 2.31 起可用</p>
</blockquote>

有时，你可能需要观察应用的行为方式，以便改进性能或找到令人头疼的 bug 的根本原因。为帮助解决这个问题，SvelteKit 可以为以下内容发出服务器端的 [OpenTelemetry](https://opentelemetry.io) span：

- [`handle`](hooks#Server-hooks-handle) hook 以及在 [`sequence`](@sveltejs-kit-hooks#sequence) 中运行的 `handle` 函数（这些会显示为彼此以及根 `handle` hook 的子级）
- 服务器 [`load`](load) 函数，以及在服务器上运行的通用 `load` 函数
- [表单操作](form-actions)
- [远程函数](remote-functions)

不过，仅仅让 SvelteKit 发出 span 并不能让你走得太远 —— 你需要实际将它们收集到某个地方才能查看它们。SvelteKit 提供了 `src/instrumentation.server.ts` 作为编写追踪设置和插桩代码的地方。如果此文件存在，它会在你的应用代码之前加载（前提是你的部署平台支持它，且你的适配器能识别它）。

要启用 SvelteKit 的内置 span 发射，请在 `vite.config.js` 中将 SvelteKit 插件的 `tracing.server` 选项设为 `true`：

```js
/// file: vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			+++tracing: {
				server: true
			}+++
		})
	]
});
```

> [!NOTE] 追踪 —— 更重要的是，可观测性插桩 —— 可能带来不小的开销。在你全面投入追踪之前，请考虑你是否真的需要它，或者仅在开发和预览环境中开启它是否更为合适。

## 增强内置追踪

SvelteKit 在请求事件上提供了对 `root` span 和 `current` span 的访问。root span 是与你的根 `handle` 函数相关联的那个，而 current span 可能与 `handle`、`load`、表单操作或远程函数相关联，具体取决于上下文。你可以用任何你希望记录的属性来标注这些 span：

```js
/// file: #lib/authenticate.ts

// @filename: ambient.d.ts
declare module '#lib/auth-core' {
	export function getAuthenticatedUser(): Promise<{ id: string }>
}

// @filename: index.js
// ---cut---
import { getRequestEvent } from '$app/server';
import { getAuthenticatedUser } from '#lib/auth-core';

async function authenticate() {
	const user = await getAuthenticatedUser();
	const event = getRequestEvent();
	event.tracing.root.setAttribute('userId', user.id);
}
```

## 开发快速入门

要查看你的第一个追踪，你需要设置一个本地收集器。本例中我们将使用 [Jaeger](https://www.jaegertracing.io/docs/getting-started/)，因为它们提供了一个易于使用的快速入门命令。一旦你的收集器在本地运行：

- 如前所述在你的 `vite.config.js` 文件中启用追踪，并创建 `src/instrumentation.server.js`（SvelteKit 会自动加载它）
- 使用你的包管理器安装你需要的依赖：
  ```sh
  npm i @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-proto import-in-the-middle
  ```
- 用以下内容创建 `src/instrumentation.server.js`：

```js
// @errors: 2307
/// file: src/instrumentation.server.js
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { register } from 'import-in-the-middle/register-hooks.mjs';

register();

const sdk = new NodeSDK({
	serviceName: 'test-sveltekit-tracing',
	traceExporter: new OTLPTraceExporter(),
	instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start();
```

现在，服务器端请求将开始生成追踪，你可以在 Jaeger 的 web 控制台 [localhost:16686](http://localhost:16686) 查看它们。

> [!NOTE] `import-in-the-middle/register-hooks.mjs` 通过 [`module.registerHooks()`](https://nodejs.org/api/module.html#moduleregisterhooksoptions) 注册加载器，它在应用线程上同步运行钩子。这避免了基于旧的 `module.register()` 的设置所需的线程间消息通道。
>
> 同步加载器需要 Node.js 22.22.3+、24.11.1+、25.1.0+ 或 26.0.0+。`register()` 在更旧的 Node.js 版本上会抛出错误。如果你需要支持它们，请回退到异步加载器：
>
> ```js
> // @errors: 2307
> /// file: src/instrumentation.server.js
> import { NodeSDK } from '@opentelemetry/sdk-node';
> import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
> import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
> import { register, supportsSyncHooks } from 'import-in-the-middle/register-hooks.mjs';
> import { createAddHookMessageChannel } from 'import-in-the-middle';
> import { register as registerAsync } from 'node:module';
>
> if (supportsSyncHooks()) {
> 	register();
> } else {
> 	const { registerOptions } = createAddHookMessageChannel();
> 	registerAsync('import-in-the-middle/hook.mjs', import.meta.url, registerOptions);
> }
>
> const sdk = new NodeSDK({
> 	serviceName: 'test-sveltekit-tracing',
> 	traceExporter: new OTLPTraceExporter(),
> 	instrumentations: [getNodeAutoInstrumentations()]
> });
>
> sdk.start();
> ```
>
> 异步的 `module.register()` API 在 Node.js 25.9.0 中已被弃用，并从 26.0.0 起发出运行时弃用警告，因此只要你的 Node.js 版本支持，请优先使用同步路径。

## `@opentelemetry/api`

SvelteKit 使用 `@opentelemetry/api` 来生成它的 span。它被声明为一个可选的 peer dependency，这样不需要追踪的用户就不会在安装体积或运行时性能上受到影响。在大多数情况下，如果你正在配置应用来收集 SvelteKit 的 span，你最终会安装像 `@opentelemetry/sdk-node` 或 `@vercel/otel` 这样的库，它们又依赖于 `@opentelemetry/api`，这也会满足 SvelteKit 的依赖。如果你看到 SvelteKit 报错说找不到 `@opentelemetry/api`，可能只是因为你还没有设置追踪收集。如果你*已经*设置了但仍然看到该错误，你可以自己安装 `@opentelemetry/api`。
