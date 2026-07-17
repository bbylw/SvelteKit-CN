---
title: Web 标准
---

在本文档中，你会看到对 SvelteKit 所基于的标准 [Web APIs](https://developer.mozilla.org/en-US/docs/Web/API) 的引用。我们没有重复造轮子，而是_利用平台本身_，这意味着你现有的 Web 开发技能也适用于 SvelteKit。反过来，花在学习 SvelteKit 上的时间也有助于你在其他地方成为更好的 Web 开发者。

这些 API 在所有现代浏览器以及许多非浏览器环境中都可用，比如 Cloudflare Workers、Deno 和 Vercel Functions。在开发期间，以及在用于基于 Node 环境（包括 AWS Lambda）的[适配器](adapters) 中，它们会通过 polyfill（必要填充）在需要时被提供（目前是这样——Node 正在迅速添加对更多 Web 标准的支持）。

特别是，你会对以下内容感到熟悉：

## Fetch API

SvelteKit 使用 [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) 从网络获取数据。它在[钩子](hooks)、[服务器路由](routing#server) 以及浏览器中都可用。

> [!NOTE] 在 [`load`](load) 函数、[服务器钩子](hooks#Server-hooks)、[API 路由](routing#server) 和[远程函数](remote-functions) 中，有一个特殊的 `fetch` 版本可用，用于在服务器端渲染期间直接调用端点，而无需发起 HTTP 请求，同时保留凭据。（要在 `load` 之外的服务器端代码中进行带凭据的 fetch，你必须显式传递 `cookie` 和/或 `authorization` 头。）它还允许你发起相对请求，而服务器端 `fetch` 通常需要完整的 URL。

除了 `fetch` 本身，[Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) 还包含以下接口：

### Request

[`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) 的实例在[钩子](hooks) 和[服务器路由](routing#server) 中作为 `event.request` 可访问。它包含有用的方法，如 `request.json()` 和 `request.formData()`，用于获取发布到端点的数据。

### Response

[`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) 的实例从 `await fetch(...)` 以及 `+server.js` 文件中的处理程序返回。从根本上说，SvelteKit 应用就是一台将 `Request` 转换为 `Response` 的机器。

### Headers

[`Headers`](https://developer.mozilla.org/en-US/docs/Web/API/Headers) 接口允许你读取传入的 `request.headers` 并设置传出的 `response.headers`。例如，你可以如下所示获取 `request.headers`，并使用 [`json` 便捷函数](@sveltejs-kit#json) 发送修改后的 `response.headers`：

```js
// @errors: 2461
/// file: src/routes/what-is-my-user-agent/+server.js
import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export function GET({ request }) {
	// 记录所有请求头
	console.log(...request.headers);

	// 使用我们收到的请求头创建一个 JSON 响应
	return json({
		// 获取特定的请求头
		userAgent: request.headers.get('user-agent')
	}, {
		// 在响应上设置一个请求头
		headers: { 'x-custom-header': 'potato' }
	});
}
```

## FormData

在处理 HTML 原生表单提交时，你会使用 [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) 对象。

```js
// @errors: 2461
/// file: src/routes/hello/+server.js
import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST(event) {
	const body = await event.request.formData();

	// 记录所有字段
	console.log([...body]);

	return json({
		// 获取特定字段的值
		name: body.get('name') ?? 'world'
	});
}
```

## Stream API

大多数情况下，你的端点会像上面的 `userAgent` 示例一样返回完整数据。有时，你可能需要返回一个太大而无法一次性放入内存，或者是分块传递的响应，为此平台提供了[流（streams）](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)——[ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)、[WritableStream](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream) 和 [TransformStream](https://developer.mozilla.org/en-US/docs/Web/API/TransformStream)。

## URL API

URL 由 [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL) 接口表示，它包含诸如 `origin` 和 `pathname`（以及在浏览器中的 `hash`）等有用属性。这个接口会出现在各个地方——在[钩子](hooks) 和[服务器路由](routing#server) 中的 `event.url`，[页面](routing#page) 中的 [`page.url`]($app-state)，[`beforeNavigate` 和 `afterNavigate`]($app-navigation) 中的 `from` 和 `to`，等等。

### URLSearchParams

无论在哪里遇到 URL，你都可以通过 `url.searchParams` 访问查询参数，它是 [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) 的实例：

```js
// @filename: ambient.d.ts
declare global {
	const url: URL;
}

export {};

// @filename: index.js
// ---cut---
const foo = url.searchParams.get('foo');
```

## Web Crypto

[Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) 通过 `crypto` 全局对象提供。它在内部用于[内容安全策略（CSP）](configuration#csp) 请求头，但你也可以用它来做诸如生成 UUID 之类的事情：

```js
const uuid = crypto.randomUUID();
```
