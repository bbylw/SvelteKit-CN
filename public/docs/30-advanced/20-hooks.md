---
title: Hooks
---

「Hooks」是你声明的应用级函数，SvelteKit 会响应特定事件调用它们，让你能够对框架的行为进行精细控制。

有三个 hooks 文件，都是可选的：

- `src/hooks.server.js` — 你应用的服务器 hooks
- `src/hooks.client.js` — 你应用的客户端 hooks
- `src/hooks.js` — 你应用中同时在客户端和服务器上运行的 hooks

这些模块中的代码会在应用启动时运行，因此它们适合用来初始化数据库客户端等。

## 服务器 hooks

以下 hooks 可以添加到 `src/hooks.server.js` 中：

### handle

每当 SvelteKit 服务器接收到[请求](web-standards#Fetch-APIs-Request)时，该函数就会运行 —— 无论这发生在应用运行时还是在[预渲染](page-options#prerender)期间 —— 并决定[响应](web-standards#Fetch-APIs-Response)。它接收一个表示请求的 `event` 对象和一个名为 `resolve` 的函数，后者渲染路由并生成一个 `Response`。这让你能够修改响应头或响应体，或完全绕过 SvelteKit（例如以编程方式实现路由）。

```js
/// file: src/hooks.server.js
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	if (event.url.pathname.startsWith('/custom')) {
		return new Response('custom response');
	}

	const response = await resolve(event);
	return response;
}
```

> [!NOTE] 对静态资源的请求 —— 包括已经预渲染的页面 —— *不会*由 SvelteKit 处理。

如果 `handle` hook 是作为客户端发起的远程函数请求的一部分运行的，那么 `route`、`params` 和 `url` 关联的是调用该远程函数的页面，而*不是* SvelteKit 为该远程函数创建的端点 URL。永远不要用它们来判断用户是否有权访问某些数据，因为这些值是请求的一部分，可能被篡改。此外，当用户导航时，查询不会重新运行（除非查询的参数因导航而改变），因此你应当留意如何使用这些值。

如果未实现，默认为 `({ event, resolve }) => resolve(event)`。

在预渲染期间，SvelteKit 会爬取你页面中的链接并渲染它找到的每个路由。渲染路由会调用 `handle` 函数（以及所有其他路由依赖，如 `load`）。如果你需要将某些代码排除在此阶段之外，请先检查应用是否正处于 [`building`]($app-env#building) 状态。

### locals

要将自定义数据添加到请求中（该数据会传递给 `+server.js` 中的处理器和服务器 `load` 函数），可以填充 `event.locals` 对象，如下所示。

```js
/// file: src/hooks.server.js
// @filename: ambient.d.ts
type User = {
	name: string;
}

declare namespace App {
	interface Locals {
		user: User;
	}
}

const getUserInformation: (cookie: string | void) => Promise<User>;

// @filename: index.js
// ---cut---
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	event.locals.user = await getUserInformation(event.cookies.get('sessionid'));

	const response = await resolve(event);

	// Note that modifying response headers isn't always safe.
	// Response objects can have immutable headers
	// (e.g. Response.redirect() returned from an endpoint).
	// Modifying immutable headers throws a TypeError.
	// In that case, clone the response or avoid creating a
	// response object with immutable headers.
	response.headers.set('x-custom-header', 'potato');

	return response;
}
```

你可以定义多个 `handle` 函数，并使用 [`sequence` 辅助函数](@sveltejs-kit-hooks)来执行它们。

`resolve` 还支持第二个可选参数，让你能更好地控制响应的渲染方式。该参数是一个对象，可以包含以下字段：

- `transformPageChunk(opts: { html: string, done: boolean }): MaybePromise<string | undefined>` — 对 HTML 应用自定义转换。如果 `done` 为 true，则这是最后一个块。块不保证是格式良好的 HTML（例如可能包含某个元素的开始标签但不包含其结束标签），但它们总是会在合理的边界处切分，如 `%sveltekit.head%` 或布局/页面组件。
- `filterSerializedResponseHeaders(name: string, value: string): boolean` — 决定当 `load` 函数用 `fetch` 加载资源时，哪些响应头应包含在序列化响应中。默认情况下，不包含任何响应头。
- `preload(input: { type: 'js' | 'css' | 'font' | 'asset', path: string }): boolean` — 决定哪些文件应被预加载。文件通过添加到 `<head>` 标签的 `<link>` 标签进行预加载；如果启用了 [`output.linkHeaderPreload`](configuration#output)，动态渲染的页面会改用 [`Link` 响应头](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Link)。该方法会在构建代码块时，对构建时找到的每个文件调用 —— 因此，如果你在 `+page.svelte` 中有 `import './styles.css`，那么访问该页面时会用解析后的 CSS 文件路径调用 `preload`。请注意，在开发模式下*不会*调用 `preload`，因为它依赖于构建时进行的分析。预加载可以通过更早地下载资源来提升性能，但如果下载了太多不必要的内容，也可能损害性能。默认情况下，`js` 和 `css` 文件会被预加载。`asset` 文件目前完全不会被预加载，但我们可能会在评估反馈后再添加这一功能。

```js
/// file: src/hooks.server.js
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('old', 'new'),
		filterSerializedResponseHeaders: (name) => name.startsWith('x-'),
		preload: ({ type, path }) => type === 'js' || path.includes('/important/')
	});

	return response;
}
```

请注意，`resolve(...)` 永远不会抛出错误，它总是返回一个带有相应状态码的 `Promise<Response>`。如果在 `handle` 期间的其他地方抛出错误，它会被视为致命错误，SvelteKit 会根据 `Accept` 头以错误的 JSON 表示或回退错误页面（可通过 `src/error.html` 自定义）进行响应。你可以在[这里](errors)阅读更多关于错误处理的内容。

### handleFetch

该函数允许你修改（或替换）在服务器上（或预渲染期间）运行的 [`event.fetch`](load#Making-fetch-requests) 调用的结果，这些调用发生在端点、`load`、`action`、`handle`、`handleError` 或 `reroute` 内部。

例如，当用户在客户端导航到相应页面时，你的 `load` 函数可能会向类似 `https://api.yourapp.com` 的公共 URL 发起请求，但在 SSR 期间，直接访问 API（绕过它与公共互联网之间的任何代理和负载均衡器）可能更合理。

```js
/// file: src/hooks.server.js
/** @type {import('@sveltejs/kit').HandleFetch} */
export async function handleFetch({ request, fetch }) {
	if (request.url.startsWith('https://api.yourapp.com/')) {
		// clone the original request, but change the URL
		request = new Request(
			request.url.replace('https://api.yourapp.com/', 'http://localhost:9999/'),
			request
		);
	}

	return fetch(request);
}
```

使用 `event.fetch` 发起的请求遵循浏览器的凭据模型 —— 对于同源请求，除非 `credentials` 选项设置为 `"omit"`，否则会转发 `cookie` 和 `authorization` 头。对于跨源请求，如果请求 URL 属于应用的子域，则会包含 `cookie` —— 例如，如果你的应用在 `my-domain.com` 上，而你的 API 在 `api.my-domain.com` 上，那么 cookie 将会包含在请求中。

有一个需要注意的地方：如果你的应用和 API 位于同级子域上 —— 例如 `www.my-domain.com` 和 `api.my-domain.com` —— 那么属于共同父域（如 `my-domain.com`）的 cookie *不会*被包含，因为 SvelteKit 无从得知该 cookie 属于哪个域。在这些情况下，你需要使用 `handleFetch` 手动包含该 cookie：

```js
/// file: src/hooks.server.js
// @errors: 2345
/** @type {import('@sveltejs/kit').HandleFetch} */
export async function handleFetch({ event, request, fetch }) {
	if (request.url.startsWith('https://api.my-domain.com/')) {
		request.headers.set('cookie', event.request.headers.get('cookie'));
	}

	return fetch(request);
}
```

### handleValidationError

当调用远程函数时传入的参数与提供的 [Standard Schema](https://standardschema.dev/) 不匹配时，会调用此 hook。它必须返回一个符合 [`App.Error`](types#Error) 形状的对象。

假设你有一个期望字符串作为参数的远程函数……

```js
/// file: todos.remote.js
import * as v from 'valibot';
import { query } from '$app/server';

export const getTodo = query(v.string(), (id) => {
	// implementation...
});
```

……但它被传入了不符合 schema 的东西 —— 例如一个数字（如 `await getTodos(1)`）—— 那么验证将失败，服务器会以 [400 状态码](https://http.dog/400)响应，并且该函数会抛出消息 'Bad Request'。

要自定义此消息并向错误对象添加额外属性，请实现 `handleValidationError`：

```js
/// file: src/hooks.server.js
/** @type {import('@sveltejs/kit').HandleValidationError} */
export function handleValidationError({ issues }) {
	return {
		message: 'No thank you'
	};
}
```

请谨慎考虑在这里暴露哪些信息，因为验证失败的最可能原因是有人正在向你的服务器发送恶意请求。

## 共享 hooks

以下 hooks 可以添加到 `src/hooks.server.js` *和* `src/hooks.client.js` 中：

### handleError

如果在加载、渲染或从端点抛出[意外错误](errors#Unexpected-errors)，此函数将被调用，并接收 `error`、`event`、`status` 码和 `message`。这允许两件事：

- 你可以记录错误
- 你可以生成可以安全展示给用户的错误自定义表示，省略敏感细节（如消息和堆栈跟踪）。返回值默认为 `{ message }`，成为 `page.error` 的值。

对于从你的代码（或你的代码调用的库代码）抛出的错误，状态将为 500，消息将为 "Internal Error"。虽然 `error.message` 可能包含不应暴露给用户的敏感信息，但 `message` 是安全的（尽管对普通用户而言毫无意义）。

要以类型安全的方式向 `page.error` 对象添加更多信息，你可以通过声明 `App.Error` 接口来自定义期望的形状（该接口必须包含 `message: string`，以保证合理的回退行为）。这样，你可以 —— 例如 —— 附加一个跟踪 ID，供用户在与你的技术支持人员沟通时引用：

```ts
/// file: src/app.d.ts
declare global {
	namespace App {
		interface Error {
			message: string;
			errorId: string;
		}
	}
}

export {};
```

```js
/// file: src/hooks.server.js
// @errors: 2322 2353
// @filename: ambient.d.ts
declare module '@sentry/sveltekit' {
	export const init: (opts: any) => void;
	export const captureException: (error: any, opts: any) => void;
}

// @filename: index.js
// ---cut---
import * as Sentry from '@sentry/sveltekit';

Sentry.init({/*...*/})

/** @type {import('@sveltejs/kit').HandleServerError} */
export async function handleError({ error, event, status, message }) {
	const errorId = crypto.randomUUID();

	// example integration with https://sentry.io/
	Sentry.captureException(error, {
		extra: { event, errorId, status }
	});

	return {
		message: 'Whoops!',
		errorId
	};
}
```

```js
/// file: src/hooks.client.js
// @errors: 2322 2353
// @filename: ambient.d.ts
declare module '@sentry/sveltekit' {
	export const init: (opts: any) => void;
	export const captureException: (error: any, opts: any) => void;
}

// @filename: index.js
// ---cut---
import * as Sentry from '@sentry/sveltekit';

Sentry.init({/*...*/})

/** @type {import('@sveltejs/kit').HandleClientError} */
export async function handleError({ error, event, status, message }) {
	const errorId = crypto.randomUUID();

	// example integration with https://sentry.io/
	Sentry.captureException(error, {
		extra: { event, errorId, status }
	});

	return {
		message: 'Whoops!',
		errorId
	};
}
```

> [!NOTE] 在 `src/hooks.client.js` 中，`handleError` 的类型是 `HandleClientError` 而不是 `HandleServerError`，并且 `event` 是 `NavigationEvent` 而不是 `RequestEvent`。

对于*预期*错误（那些用从 `@sveltejs/kit` 导入的 [`error`](@sveltejs-kit#error) 函数抛出的错误），不会调用此函数。

在开发期间，如果因为你 Svelte 代码中的语法错误而发生错误，传入的错误会附加一个 `frame` 属性，用于突出显示错误的位置。

> [!NOTE] 确保 `handleError` *永远不会*抛出错误

### init

此函数运行一次，在服务器创建或应用在浏览器中启动时运行，是执行异步工作（如初始化数据库连接）的有用位置。

> [!NOTE] 如果你的环境支持顶层 await，`init` 函数与在模块顶层编写初始化逻辑其实没有区别，但某些环境 —— 最著名的是 Safari —— 并不支持。

```js
// @errors: 2307
/// file: src/hooks.server.js
import * as db from '#lib/server/database';

/** @type {import('@sveltejs/kit').ServerInit} */
export async function init() {
	await db.connect();
}
```

> [!NOTE]
> 在浏览器中，`init` 里的异步工作会延迟 hydration，所以请留意你放在其中的内容。

## 通用 hooks

以下 hooks 可以添加到 `src/hooks.js` 中。通用 hooks 同时在服务器和客户端上运行（不要与共享 hooks 混淆，后者是特定于环境的）。

### reroute

此函数在 `handle` 之前运行，允许你改变 URL 如何转换为路由。返回的路径名（默认为 `url.pathname`）用于选择路由及其参数。

例如，你可能有一个 `src/routes/[[lang]]/about/+page.svelte` 页面，它应该可以通过 `/en/about` 或 `/de/ueber-uns` 或 `/fr/a-propos` 访问。你可以用 `reroute` 来实现：

```js
// @errors: 2345 2304
/// file: src/hooks.js

/** @type {Record<string, string>} */
const translated = {
	'/en/about': '/en/about',
	'/de/ueber-uns': '/de/about',
	'/fr/a-propos': '/fr/about',
};

/** @type {import('@sveltejs/kit').Reroute} */
export function reroute({ url }) {
	if (url.pathname in translated) {
		return translated[url.pathname];
	}
}
```

`lang` 参数将从返回的路径名中正确推导出来。

使用 `reroute` *不会*改变浏览器地址栏的内容，也不会改变 `event.url` 的值。

自 2.18 版本起，`reroute` hook 可以是异步的，允许它（例如）从你的后端获取数据来决定重定向到哪里。谨慎使用并确保它足够快，否则它会延迟导航。如果你需要获取数据，请使用作为参数提供的 `fetch`。它拥有与提供给 `load` 函数的 `fetch` [相同的优势](load#Making-fetch-requests)，但需要注意的是，`params` 和 `id` 对 [`handleFetch`](#Server-hooks-handleFetch) 不可用，因为此时路由尚不可知。

```js
// @errors: 2345 2304
/// file: src/hooks.js

/** @type {import('@sveltejs/kit').Reroute} */
export async function reroute({ url, fetch }) {
	// Ask a special endpoint within your app about the destination
	if (url.pathname === '/api/reroute') return;

	const api = new URL('/api/reroute', url);
	api.searchParams.set('pathname', url.pathname);

	const result = await fetch(api).then(r => r.json());
	return result.pathname;
}
```


> [!NOTE] `reroute` 被视为一个纯的、幂等的函数。因此，对于相同的输入它必须始终返回相同的输出，并且不能有副作用。在这些假设下，SvelteKit 会在客户端缓存 `reroute` 的结果，因此对每个唯一 URL 只调用一次。

### transport

这是一个*传输器（transporters）*的集合，允许你在服务器/客户端边界之间传递自定义类型 —— 这些类型从 `load` 和表单操作返回。每个传输器包含一个 `encode` 函数，它在服务器上编码值（对于任何不是该类型实例的东西返回一个假值），以及一个对应的 `decode` 函数：

```js
// @errors: 2307
/// file: src/hooks.js
import { Vector } from '#lib/math';

/** @type {import('@sveltejs/kit').Transport} */
export const transport = {
	Vector: {
		encode: (value) => value instanceof Vector && [value.x, value.y],
		decode: ([x, y]) => new Vector(x, y)
	}
};
```


## 延伸阅读

- [教程：Hooks](/tutorial/kit/handle)
