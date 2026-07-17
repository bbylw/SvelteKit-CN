---
title: 加载数据
---

在 [`+page.svelte`](routing#page-page.svelte) 组件（及其包含的 [`+layout.svelte`](routing#layout-layout.svelte) 组件）能够被渲染之前，我们经常需要获取一些数据。这是通过定义 `load` 函数来完成的。

## 页面数据

一个 `+page.svelte` 文件可以有一个同级的 `+page.js`，它导出一个 `load` 函数，其返回值通过 `data` 属性对页面可用：

```js
/// file: src/routes/blog/[slug]/+page.js
/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	return {
		post: {
			title: `适用于 ${params.slug} 的标题放在这里`,
			content: `适用于 ${params.slug} 的内容放在这里`
		}
	};
}
```

```svelte
<!--- file: src/routes/blog/[slug]/+page.svelte --->
<script>
	/** @type {import('./$types').PageProps} */
	let { data } = $props();
</script>

<h1>{data.post.title}</h1>
<div>{@html data.post.content}</div>
```

> [!LEGACY]
> 在 2.16.0 版本之前，页面和布局的属性必须单独添加类型：
> ```js
> /// file: +page.svelte
> /** @type {{ data: import('./$types').PageData }} */
> let { data } = $props();
> ```
>
> 在 Svelte 4 中，你需要改用 `export let data`。

得益于生成的 `$types` 模块，我们获得了完整的类型安全。

`+page.js` 文件中的 `load` 函数在服务器和浏览器中都会运行（除非与 `export const ssr = false` 结合使用，在这种情况下它会[只在浏览器中运行](page-options#ssr)）。如果你的 `load` 函数应该_始终_在服务器上运行（例如，因为它使用了私有环境变量，或者访问了一个数据库），那么它应该放在 `+page.server.js` 中。

你的博客文章 `load` 函数一个更现实的版本，只在服务器上运行并从数据库提取数据，可能看起来像这样：

```js
/// file: src/routes/blog/[slug]/+page.server.js
// @filename: ambient.d.ts
declare module '#lib/server/database' {
	export function getPost(slug: string): Promise<{ title: string, content: string }>
}

// @filename: index.js
// ---cut---
import * as db from '#lib/server/database';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	return {
		post: await db.getPost(params.slug)
	};
}
```

注意类型从 `PageLoad` 变成了 `PageServerLoad`，因为服务器 `load` 函数可以访问额外的参数。要了解何时使用 `+page.js` 以及何时使用 `+page.server.js`，请参阅[通用 vs 服务器](load#Universal-vs-server)。

## 布局数据

你的 `+layout.svelte` 文件也可以通过 `+layout.js` 或 `+layout.server.js` 加载数据。

```js
/// file: src/routes/blog/[slug]/+layout.server.js
// @filename: ambient.d.ts
declare module '#lib/server/database' {
	export function getPostSummaries(): Promise<Array<{ title: string, slug: string }>>
}

// @filename: index.js
// ---cut---
import * as db from '#lib/server/database';

/** @type {import('./$types').LayoutServerLoad} */
export async function load() {
	return {
		posts: await db.getPostSummaries()
	};
}
```

```svelte
<!--- file: src/routes/blog/[slug]/+layout.svelte --->
<script>
	/** @type {import('./$types').LayoutProps} */
	let { data, children } = $props();
</script>

<main>
	<!-- +page.svelte 在这里被 `@render` -->
	{@render children()}
</main>

<aside>
	<h2>更多文章</h2>
	<ul>
		{#each data.posts as post}
			<li>
				<a href="/blog/{post.slug}">
					{post.title}
				</a>
			</li>
		{/each}
	</ul>
</aside>
```

> [!LEGACY]
> `LayoutProps` 是在 2.16.0 中添加的。在早期版本中，属性必须单独添加类型：
> ```js
> /// file: +layout.svelte
> /** @type {{ data: import('./$types').LayoutData, children: Snippet }} */
> let { data, children } = $props();
> ```

从布局 `load` 函数返回的数据，对子级 `+layout.svelte` 组件以及 `+page.svelte` 组件和它 “所属” 的布局都可用。

```svelte
/// file: src/routes/blog/[slug]/+page.svelte
<script>
	+++import { page } from '$app/state';+++

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

+++	// 我们可以访问 `data.posts`，因为它从父级布局的
	// `load` 函数返回
	let index = $derived(data.posts.findIndex(post => post.slug === page.params.slug));
	let next = $derived(data.posts[index + 1]);+++
</script>

<h1>{data.post.title}</h1>
<div>{@html data.post.content}</div>

+++{#if next}
	<p>下一篇文章：<a href="/blog/{next.slug}">{next.title}</a></p>
{/if}+++
```

> [!NOTE] 如果多个 `load` 函数返回带有相同键的数据，最后一个 “胜出”——一个返回 `{ a: 1, b: 2 }` 的布局 `load` 和一个返回 `{ b: 3, c: 4 }` 的页面 `load`，其结果将是 `{ a: 1, b: 3, c: 4 }`。

## page.data

`+page.svelte` 组件，以及它上面的每个 `+layout.svelte` 组件，都可以访问它自己的数据以及来自其所有父级的数据。

在某些情况下，我们可能需要相反的情况——一个父级布局可能需要访问页面数据或来自子级布局的数据。例如，根布局可能想要访问从 `+page.js` 或 `+page.server.js` 中的 `load` 函数返回的 `title` 属性。这可以通过 `page.data` 来完成：

```svelte
<!--- file: src/routes/+layout.svelte --->
<script>
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.data.title}</title>
</svelte:head>
```

`page.data` 的类型信息由 `App.PageData` 提供。

## 通用 vs 服务器

正如我们所见，有两类 `load` 函数：

* `+page.js` 和 `+layout.js` 文件导出在服务器和浏览器中都会运行的_通用_ `load` 函数
* `+page.server.js` 和 `+layout.server.js` 文件导出只在服务器端运行的_服务器_ `load` 函数

从概念上讲，它们是同一回事，但有一些重要的区别需要注意。

### 哪个 load 函数在何时运行？

服务器 `load` 函数_始终_在服务器上运行。

默认情况下，通用 `load` 函数在用户首次访问你的页面时，在 SSR 期间于服务器上运行。然后它们会在 hydration 期间再次运行，重用来自 [fetch 请求](#Making-fetch-requests) 的任何响应。所有后续对通用 `load` 函数的调用都发生在浏览器中。你可以通过[页面选项](page-options) 自定义此行为。如果你禁用了[服务器端渲染](page-options#ssr)，你将获得一个 SPA，通用 `load` 函数_始终_在客户端运行。

如果一个路由同时包含通用和服务器 `load` 函数，服务器 `load` 会先运行。

除非你[预渲染](page-options#prerender) 了页面，否则 `load` 函数会在运行时被调用——在这种情况下，它会在构建时被调用。

### 输入

通用和服务器 `load` 函数都可以访问描述请求的属性（`params`、`route` 和 `url`）以及各种函数（`fetch`、`setHeaders`、`parent`、`depends` 和 `untrack`）。这些将在以下小节中描述。

服务器 `load` 函数使用 `ServerLoadEvent` 调用，它从 `RequestEvent` 继承了 `clientAddress`、`cookies`、`locals`、`platform` 和 `request`。

通用 `load` 函数使用 `LoadEvent` 调用，它有一个 `data` 属性。如果你在 `+page.js` 和 `+page.server.js`（或 `+layout.js` 和 `+layout.server.js`）中都有 `load` 函数，那么服务器 `load` 函数的返回值就是通用 `load` 函数参数的 `data` 属性。

### 输出

通用 `load` 函数可以返回一个包含任意值的对象，包括自定义类和组件构造函数之类的东西。

服务器 `load` 函数必须返回可以使用 [devalue](https://github.com/rich-harris/devalue) 序列化的数据——任何可以表示为 JSON 的东西，加上像 `BigInt`、`Date`、`Map`、`Set` 和 `RegExp` 这样的东西，或者重复/循环引用——以便它可以通过网络传输。你的数据可以包含[带有 promise 的流式传输](#Streaming-with-promises)，在这种情况下它将被流式传输到浏览器。如果你需要序列化/反序列化自定义类型，请使用[传输钩子](hooks#Universal-hooks-transport)。

### 何时使用哪个

当你需要直接从数据库或文件系统访问数据，或者需要使用私有环境变量时，服务器 `load` 函数很方便。

当你需要从外部 API `fetch` 数据且不需要私有凭据时，通用 `load` 函数很有用，因为 SvelteKit 可以直接从 API 获取数据，而不是经由你的服务器。当你需要返回无法序列化的东西（例如 Svelte 组件构造函数）时，它们也很有用。

在极少数情况下，你可能需要两者一起使用——例如，你可能需要返回一个用来自你的服务器的数据初始化的自定义类的实例。当两者一起使用时，服务器 `load` 的返回值_不会_直接传递给页面，而是传递给通用 `load` 函数（作为 `data` 属性）：

```js
/// file: src/routes/+page.server.js
/** @type {import('./$types').PageServerLoad} */
export async function load() {
	return {
		serverMessage: '来自服务器 load 函数的问候'
	};
}
```

```js
/// file: src/routes/+page.js
// @errors: 18047
/** @type {import('./$types').PageLoad} */
export async function load({ data }) {
	return {
		serverMessage: data.serverMessage,
		universalMessage: '来自通用 load 函数的问候'
	};
}
```

## 使用 URL 数据

`load` 函数常常以某种方式依赖于 URL。为此，`load` 函数为你提供了 `url`、`route` 和 `params`。

### url

一个 [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL) 的实例，包含诸如 `origin`、`hostname`、`pathname` 和 `searchParams`（它将解析后的查询字符串包含为 [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) 对象）等属性。`url.hash` 在 `load` 期间无法访问，因为它在服务器上不可用。

> [!NOTE] 在某些环境中，这是在服务器端渲染期间从请求头派生的。例如，如果你使用的是 [adapter-node](adapter-node)，你可能需要配置该适配器以使 URL 正确。

### route

包含当前路由目录的名称，相对于 `src/routes`：

```js
/// file: src/routes/a/[b]/[...c]/+page.js
/** @type {import('./$types').PageLoad} */
export function load({ route }) {
	console.log(route.id); // '/a/[b]/[...c]'
}
```

### params

`params` 是从 `url.pathname` 和 `route.id` 派生的。

给定一个 `route.id` 为 `/a/[b]/[...c]` 且 `url.pathname` 为 `/a/x/y/z`，`params` 对象将如下所示：

```json
{
	"b": "x",
	"c": "y/z"
}
```

## 发起 fetch 请求

要从外部 API 或 `+server.js` 处理程序获取数据，你可以使用提供的 `fetch` 函数，它的行为与原生 [`fetch` Web API](https://developer.mozilla.org/en-US/docs/Web/API/fetch) 相同，并具有一些额外的特性：

- 它可以用于在服务器上发起带凭据的请求，因为它继承了页面请求的 `cookie` 和 `authorization` 头。
- 它可以在服务器上发起相对请求（通常，`fetch` 在服务器上下文中使用时需要一个带有 origin 的 URL）。
- 内部请求（例如针对 `+server.js` 路由）在服务器上运行时会直接转到处理程序函数，而无需 HTTP 调用的开销。
- 在服务器端渲染期间，响应将被捕获并内联到渲染的 HTML 中，方法是挂钩到 `Response` 对象的 `text`、`json` 和 `arrayBuffer` 方法。请注意，除非通过 [`filterSerializedResponseHeaders`](hooks#Server-hooks-handle) 显式包含，否则头_不会_被序列化。
- 在 hydration 期间，响应将从 HTML 中读取，保证一致性并防止额外的网络请求——如果你在使用浏览器 `fetch` 而不是 `load` `fetch` 时在浏览器控制台收到警告，原因就在于此。

```js
/// file: src/routes/items/[id]/+page.js
/** @type {import('./$types').PageLoad} */
export async function load({ fetch, params }) {
	const res = await fetch(`/api/items/${params.id}`);
	const item = await res.json();

	return { item };
}
```

## Cookies

服务器 `load` 函数可以像下面所示那样获取 [`cookies`](@sveltejs-kit#Cookies)。设置 cookie 时，SvelteKit 为 `httpOnly`、`secure` 和 `path` 提供默认值——如 [API 文档](@sveltejs-kit#Cookies) 中所述——以改善安全性和开发体验。

```js
/// file: src/routes/+layout.server.js
// @filename: ambient.d.ts
declare module '#lib/server/database' {
	export function getUser(sessionid: string | undefined): Promise<{ name: string, avatar: string }>
}

// @filename: index.js
// ---cut---
import * as db from '#lib/server/database';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ cookies }) {
	const sessionid = cookies.get('sessionid');

	return {
		user: await db.getUser(sessionid)
	};
}
```

只有当目标主机与 SvelteKit 应用相同或者是其更具体的子域时，cookie 才会通过提供的 `fetch` 函数传递。

例如，如果 SvelteKit 正在为 my.domain.com 提供服务：
- domain.com 将_不会_收到 cookie
- my.domain.com 将收到 cookie
- api.domain.com 将_不会_收到 cookie
- sub.my.domain.com 将收到 cookie

当设置了 `credentials: 'include'` 时，其他 cookie 也不会被传递，因为 SvelteKit 不知道哪个 cookie 属于哪个域（浏览器不会传递此信息），所以转发它们中的任何一个都不安全。请使用 [handleFetch 钩子](hooks#Server-hooks-handleFetch) 来解决此问题。

## Headers

服务器和通用 `load` 函数都可以访问一个 `setHeaders` 函数，当在服务器上运行时，它可以为响应设置头。（在浏览器中运行时，`setHeaders` 没有效果。）例如，如果你想缓存页面，这会很有用：

```js
// @errors: 2322 1360
/// file: src/routes/products/+page.js
/** @type {import('./$types').PageLoad} */
export async function load({ fetch, setHeaders }) {
	const url = `https://cms.example.com/products.json`;
	const response = await fetch(url);

	// 头只在 SSR 期间设置，将页面的 HTML 缓存与
	// 底层数据相同长度的时长。
	setHeaders({
		age: response.headers.get('age'),
		'cache-control': response.headers.get('cache-control')
	});

	return response.json();
}
```

多次设置同一个头（即使是在单独的 `load` 函数中）是一个错误。你只能使用 `setHeaders` 函数设置给定头一次。你不能使用 `setHeaders` 添加 `set-cookie` 头——请改用 `cookies.set(name, value, options)`。

## 使用父级数据

偶尔，一个 `load` 函数访问来自父级 `load` 函数的数据会很有用，这可以通过 `await parent()` 来完成：

```js
/// file: src/routes/+layout.js
/** @type {import('./$types').LayoutLoad} */
export function load() {
	return { a: 1 };
}
```

```js
/// file: src/routes/abc/+layout.js
/** @type {import('./$types').LayoutLoad} */
export async function load({ parent }) {
	const { a } = await parent();
	return { b: a + 1 };
}
```

```js
/// file: src/routes/abc/+page.js
/** @type {import('./$types').PageLoad} */
export async function load({ parent }) {
	const { a, b } = await parent();
	return { c: a + b };
}
```

```svelte
<!--- file: src/routes/abc/+page.svelte --->
<script>
	/** @type {import('./$types').PageProps} */
	let { data } = $props();
</script>

<!-- 渲染 `1 + 2 = 3` -->
<p>{data.a} + {data.b} = {data.c}</p>
```

> [!NOTE] 注意 `+page.js` 中的 `load` 函数接收到的是来自两个布局 `load` 函数的合并数据，而不仅仅是直接父级。

在 `+page.server.js` 和 `+layout.server.js` 内部，`parent` 返回来自父级 `+layout.server.js` 文件的数据。

在 `+page.js` 或 `+layout.js` 中，它将返回来自父级 `+layout.js` 文件的数据。然而，缺失的 `+layout.js` 被视为一个 `({ data }) => data` 函数，这意味着它也会返回未被 `+layout.js` 文件 “遮蔽” 的父级 `+layout.server.js` 文件的数据。

使用 `await parent()` 时要注意不要引入瀑布流。例如，这里的 `getData(params)` 不依赖于调用 `parent()` 的结果，所以我们应该先调用它，以避免延迟渲染。

```js
/// file: +page.js
// @filename: ambient.d.ts
declare function getData(params: Record<string, string>): Promise<{ meta: any }>

// @filename: index.js
// ---cut---
/** @type {import('./$types').PageLoad} */
export async function load({ params, parent }) {
	---const parentData = await parent();---
	const data = await getData(params);
	+++const parentData = await parent();+++

	return {
		...data,
		meta: { ...parentData.meta, ...data.meta }
	};
}
```

## 错误

如果在 `load` 期间抛出了错误，将渲染最近的 [`+error.svelte`](routing#error)。对于[_预期_](errors#Expected-errors) 的错误，请使用来自 `@sveltejs/kit` 的 `error` 辅助函数来指定 HTTP 状态码和可选的消息：

```js
/// file: src/routes/admin/+layout.server.js
// @filename: ambient.d.ts
declare namespace App {
	interface Locals {
		user?: {
			name: string;
			isAdmin: boolean;
		}
	}
}

// @filename: index.js
// ---cut---
import { error } from '@sveltejs/kit';

/** @type {import('./$types').LayoutServerLoad} */
export function load({ locals }) {
	if (!locals.user) {
		error(401, '未登录');
	}

	if (!locals.user.isAdmin) {
		error(403, '不是管理员');
	}
}
```

调用 `error(...)` 会抛出一个异常，使得从辅助函数内部轻松停止执行变得容易。

如果抛出了[_意外_](errors#Unexpected-errors) 错误，SvelteKit 将调用 [`handleError`](hooks#Shared-hooks-handleError) 并将其视为 500 内部错误。

> [!NOTE] [在 SvelteKit 1.x 中](migrating-to-sveltekit-2#redirect-and-error-are-no-longer-thrown-by-you)，你必须自己 `throw` 错误

## 重定向

要重定向用户，请使用来自 `@sveltejs/kit` 的 `redirect` 辅助函数，以指定他们应被重定向到的位置以及 `3xx` 状态码。与 `error(...)` 一样，调用 `redirect(...)` 会抛出一个异常，使得从辅助函数内部轻松停止执行变得容易。

```js
/// file: src/routes/user/+layout.server.js
// @filename: ambient.d.ts
declare namespace App {
	interface Locals {
		user?: {
			name: string;
		}
	}
}

// @filename: index.js
// ---cut---
import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').LayoutServerLoad} */
export function load({ locals }) {
	if (!locals.user) {
		redirect(307, '/login');
	}
}
```

> [!NOTE] 不要将 `redirect()` 放在 `try {...}` 块内，因为重定向会立即触发 catch 语句。

在浏览器中，你也可以使用来自 [`$app.navigation`]($app-navigation) 的 [`goto`]($app-navigation#goto) 在 `load` 函数之外以编程方式导航。

> [!NOTE] [在 SvelteKit 1.x 中](migrating-to-sveltekit-2#redirect-and-error-are-no-longer-thrown-by-you)，你必须自己 `throw` 重定向

## 使用 promise 进行流式传输

当使用服务器 `load` 时，promise 将在它们 resolve 时被流式传输到浏览器。如果你有缓慢的、非必要的数据，这会很有用，因为你可以在所有数据可用之前开始渲染页面：

```js
/// file: src/routes/blog/[slug]/+page.server.js
// @filename: ambient.d.ts
declare global {
	const loadPost: (slug: string) => Promise<{ title: string, content: string }>;
	const loadComments: (slug: string) => Promise<{ content: string }>;
}

export {};

// @filename: index.js
// ---cut---
/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	return {
		// 确保 `await` 发生在最后，否则在加载完文章之前
		// 我们无法开始加载评论
		comments: loadComments(params.slug),
		post: await loadPost(params.slug)
	};
}
```

这对于创建骨架加载状态很有用，例如：

```svelte
<!--- file: src/routes/blog/[slug]/+page.svelte --->
<script>
	/** @type {import('./$types').PageProps} */
	let { data } = $props();
</script>

<h1>{data.post.title}</h1>
<div>{@html data.post.content}</div>

{#await data.comments}
	正在加载评论...
{:then comments}
	{#each comments as comment}
		<p>{comment.content}</p>
	{/each}
{:catch error}
	<p>加载评论出错：{error.message}</p>
{/await}
```

在流式传输数据时，要小心正确处理 promise 拒绝。更具体地说，如果一个延迟加载的 promise 在渲染开始之前（此时它会被捕获）失败，并且没有以某种方式处理错误，服务器可能会因 “未处理的 promise 拒绝” 错误而崩溃。当在 `load` 函数中直接使用 SvelteKit 的 `fetch` 时，SvelteKit 会为你处理这种情况。对于其他 promise，给 promise 附加一个 noop-`catch` 以将其标记为已处理就足够了。

```js
/// file: src/routes/+page.server.js
/** @type {import('./$types').PageServerLoad} */
export function load({ fetch }) {
	const ok_manual = Promise.reject();
	ok_manual.catch(() => {});

	return {
		ok_manual,
		ok_fetch: fetch('/fetch/that/could/fail'),
		dangerous_unhandled: Promise.reject()
	};
}
```

> [!NOTE] 在不支持流式传输的平台上，如 AWS Lambda 或 Firebase，响应将被缓冲。这意味着页面只会在所有 promise 都 resolve 后才渲染。如果你使用的是代理（例如 NGINX），请确保它不会缓冲来自被代理服务器的响应。

> [!NOTE] 流式传输数据只有在启用 JavaScript 时才会工作。如果页面是服务器端渲染的，你应该避免从通用 `load` 函数返回 promise，因为这些 promise_不会_被流式传输——相反，当函数在浏览器中重新运行时，promise 会被重新创建。

> [!NOTE] 一旦响应开始流式传输，响应的头和状态码就无法更改，因此你不能在流式传输的 promise 内部 `setHeaders` 或抛出重定向。

> [!NOTE] [在 SvelteKit 1.x 中](migrating-to-sveltekit-2#Top-level-promises-are-no-longer-awaited)，顶层 promise 会被自动 await，只有嵌套的 promise 才会被流式传输。

## 并行加载

在渲染（或导航到）一个页面时，SvelteKit 会并发运行所有 `load` 函数，避免请求的瀑布流。在客户端导航期间，调用多个服务器 `load` 函数的结果被分组到单个响应中。一旦所有 `load` 函数都返回，页面就被渲染。

## 重新运行 load 函数

SvelteKit 跟踪每个 `load` 函数的依赖关系，以避免在导航期间不必要的重新运行。

例如，给定这样一对 `load` 函数……

```js
/// file: src/routes/blog/[slug]/+page.server.js
// @filename: ambient.d.ts
declare module '#lib/server/database' {
	export function getPost(slug: string): Promise<{ title: string, content: string }>
}

// @filename: index.js
// ---cut---
import * as db from '#lib/server/database';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	return {
		post: await db.getPost(params.slug)
	};
}
```

```js
/// file: src/routes/blog/[slug]/+layout.server.js
// @filename: ambient.d.ts
declare module '#lib/server/database' {
	export function getPostSummaries(): Promise<Array<{ title: string, slug: string }>>
}

// @filename: index.js
// ---cut---
import * as db from '#lib/server/database';

/** @type {import('./$types').LayoutServerLoad} */
export async function load() {
	return {
		posts: await db.getPostSummaries()
	};
}
```

……当我们从 `/blog/trying-the-raw-meat-diet` 导航到 `/blog/i-regret-my-choices` 时，`+page.server.js` 中的那个会重新运行，因为 `params.slug` 改变了。`+layout.server.js` 中的那个则不会，因为数据仍然有效。换句话说，我们不会第二次调用 `db.getPostSummaries()`。

调用了 `await parent()` 的 `load` 函数，如果父级 `load` 函数重新运行，也会重新运行。

依赖跟踪在 `load` 函数返回_之后_不适用——例如，在嵌套的 [promise](#Streaming-with-promises) 内部访问 `params.x` 不会导致该函数在 `params.x` 改变时重新运行。（别担心，如果你不小心这样做了，开发时会收到警告。）相反，请在你的 `load` 函数主体中访问该参数。

搜索参数与 url 的其余部分是独立跟踪的。例如，在 `load` 函数内部访问 `event.url.searchParams.get("x")` 会使该 `load` 函数在从 `?x=1` 导航到 `?x=2` 时重新运行，但当从 `?x=1&y=1` 导航到 `?x=1&y=2` 时则不会。

### 取消依赖跟踪

在极少数情况下，你可能希望将某些东西排除在依赖跟踪机制之外。你可以用提供的 `untrack` 函数来实现：

```js
/// file: src/routes/+page.js
/** @type {import('./$types').PageLoad} */
export async function load({ untrack, url }) {
	// 取消对 url.pathname 的跟踪，这样路径变化不会触发重新运行
	if (untrack(() => url.pathname === '/')) {
		return { message: '欢迎！' };
	}
}
```

### 手动失效

你也可以使用 [`invalidate(url)`]($app-navigation#invalidate) 重新运行适用于当前页面的 `load` 函数，它会重新运行所有依赖于 `url` 的 `load` 函数；以及 [`refreshAll()`]($app-navigation#refreshAll)，它会重新运行每个 `load` 函数和所有活动的查询。服务器 `load` 函数永远不会自动依赖于被 fetch 的 `url`，以避免将机密泄漏给客户端。

> [!NOTE] 与已弃用的前身 `invalidateAll` 不同，`refreshAll`_不会_重置 `page.state`。

如果 `load` 函数调用了 `fetch(url)` 或 `depends(url)`，它就依赖于 `url`。请注意，`url` 可以是一个以 `[a-z]:` 开头的自定义标识符：

```js
/// file: src/routes/random-number/+page.js
/** @type {import('./$types').PageLoad} */
export async function load({ fetch, depends }) {
	// 当调用 `invalidate('https://api.example.com/random-number')` 时，load 重新运行……
	const response = await fetch('https://api.example.com/random-number');

	// ……或者当调用 `invalidate('app:random')` 时
	depends('app:random');

	return {
		number: await response.json()
	};
}
```

```svelte
<!--- file: src/routes/random-number/+page.svelte --->
<script>
	import { invalidate, refreshAll } from '$app/navigation';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	function rerunLoadFunction() {
		// 这些中的任何一个都会导致 `load` 函数重新运行
		invalidate('app:random');
		invalidate('https://api.example.com/random-number');
		invalidate(url => url.href.includes('random-number'));
		refreshAll();
	}
</script>

<p>随机数：{data.number}</p>
<button onclick={rerunLoadFunction}>更新随机数</button>
```

### load 函数何时重新运行？

总结一下，在以下情况下 `load` 函数会重新运行：

- 它引用了一个值已改变的 `params` 属性
- 它引用了一个值已改变的 `url` 属性（如 `url.pathname` 或 `url.search`）。`request.url` 中的属性_不会_被跟踪
- 它调用了 `url.searchParams.get(...)`、`url.searchParams.getAll(...)` 或 `url.searchParams.has(...)`，并且相关的参数发生了变化。访问 `url.searchParams` 的其他属性将产生与访问 `url.search` 相同的效果。
- 它调用了 `await parent()` 且父级 `load` 函数重新运行了
- 一个子级 `load` 函数调用了 `await parent()` 且正在重新运行，并且父级是服务器 `load` 函数
- 它通过 [`fetch`](#Making-fetch-requests)（仅通用 load）或 [`depends`](@sveltejs-kit#LoadEvent) 声明了对特定 URL 的依赖，并且该 URL 已被 [`invalidate(url)`]($app-navigation#invalidate) 标记为失效
- 所有活动的 `load` 函数都被 [`refreshAll()`]($app-navigation#refreshAll) 强制重新运行

`params` 和 `url` 可以响应 `<a href="..">` 链接点击、[`<form>` 交互](form-actions#GET-vs-POST)、[`goto`]($app-navigation#goto) 调用或 [`redirect`](@sveltejs-kit#redirect) 而改变。

请注意，重新运行 `load` 函数会更新相应 `+layout.svelte` 或 `+page.svelte` 内部的 `data` 属性；它_不会_导致组件被重新创建。因此，内部状态会被保留。如果这不是你想要的，你可以在 [`afterNavigate`]($app-navigation#afterNavigate) 回调中重置你需要重置的任何东西，和/或将你的组件包装在 [`{#key ...}`](../svelte/key) 块中。

## 对身份验证的影响

加载数据的几个特性对身份验证检查有重要影响：
- 布局 `load` 函数不会在每次请求时都运行，例如在子路由之间的客户端导航期间。[（load 函数何时重新运行？）](load#Rerunning-load-functions-When-do-load-functions-rerun)
- 布局和页面 `load` 函数会并发运行，除非调用了 `await parent()`。如果布局 `load` 抛出了错误，页面 `load` 函数会运行，但客户端不会收到返回的数据。

有几种可能的策略来确保受保护的代码之前会发生身份验证检查。

为了阻止数据瀑布流并保留布局 `load` 缓存：
- 在任何 `load` 函数运行之前，使用[钩子](hooks) 保护多个路由
- 在 `+page.server.js` 的 `load` 函数中直接使用身份验证守卫进行路由特定的保护

将身份验证守卫放在 `+layout.server.js` 中，要求所有子页面在受保护的代码之前调用 `await parent()`。除非每个子页面都依赖于从 `await parent()` 返回的数据，否则其他选项的性能会更好。

## 使用 `getRequestEvent`

在运行服务器 `load` 函数时，作为参数传递给该函数的 `event` 对象也可以通过 [`getRequestEvent`]($app-server#getRequestEvent) 检索。这允许共享逻辑（如身份验证守卫）访问有关当前请求的信息，而无需将其四处传递。

例如，你可能有一个要求用户登录的函数，如果未登录则将其重定向到 `/login`：

```js
/// file: src/lib/server/auth.js
// @filename: ambient.d.ts
interface User {
	name: string;
}

declare namespace App {
	interface Locals {
		user?: User;
	}
}

// @filename: index.ts
// ---cut---
import { redirect } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';

export function requireLogin() {
	const { locals, url } = getRequestEvent();

	// 假设 `locals.user` 在 `handle` 中被填充
	if (!locals.user) {
		const redirectTo = url.pathname + url.search;
		const params = new URLSearchParams({ redirectTo });

		redirect(303, `/login?${params}`);
	}

	return locals.user;
}
```

现在，你可以在任何 `load` 函数（或例如[表单操作](form-actions)）中调用 `requireLogin`，以保证用户已登录：

```js
/// file: +page.server.js
// @filename: ambient.d.ts

declare module '#lib/server/auth' {
	interface User {
		name: string;
	}

	export function requireLogin(): User;
}

// @filename: index.ts
// ---cut---
import { requireLogin } from '#lib/server/auth';

export function load() {
	const user = requireLogin();

	// `user` 在这里保证是一个用户对象，因为否则
	// `requireLogin` 会抛出一个重定向，我们不会到达这里
	return {
		message: `你好 ${user.name}！`
	};
}
```

## 延伸阅读

- [教程：加载数据](/tutorial/kit/page-data)
- [教程：错误与重定向](/tutorial/kit/error-basics)
- [教程：高级加载](/tutorial/kit/await-parent)
