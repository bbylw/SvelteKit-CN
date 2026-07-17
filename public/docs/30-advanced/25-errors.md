---
title: 错误处理
---

错误是软件开发中不可避免的事实。SvelteKit 会根据错误发生的位置、错误的类型以及传入请求的性质，以不同的方式处理错误。

## 错误对象

SvelteKit 区分预期错误和意外错误，两者默认都表示为简单的 `{ status: number, message: string }` 对象。

你可以添加额外的属性，比如 `code` 或跟踪 `id`，如下面的示例所示。（使用 TypeScript 时，这需要你按照[类型安全](errors#Type-safety)中描述的方式重新定义 `Error` 类型。）

## 预期错误

*预期*错误是使用从 `@sveltejs/kit` 导入的 [`error`](@sveltejs-kit#error) 辅助函数创建的错误：

```js
/// file: src/routes/blog/[slug]/+page.server.js
// @filename: ambient.d.ts
declare module '#lib/server/database' {
	export function getPost(slug: string): Promise<{ title: string, content: string } | undefined>
}

// @filename: index.js
// ---cut---
import { error } from '@sveltejs/kit';
import * as db from '#lib/server/database';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	const post = await db.getPost(params.slug);

	if (!post) {
		error(404, 'Not found');
	}

	return { post };
}
```

这会抛出一个 SvelteKit 会捕获的异常，使其将响应状态码设置为 404，并渲染一个 [`+error.svelte`](routing#error) 组件，其中 `error` 是一个带有所提供的 `status` 和 `message` 的 `App.Error` 对象。

```svelte
<!--- file: src/routes/+error.svelte --->
<script>
	let { error } = $props();
</script>

<h1>{error.message}</h1>
```

如果需要，你可以向错误对象添加额外属性：

```js
// @filename: ambient.d.ts
declare global {
	namespace App {
		interface Error {
			message: string;
			code: string;
		}
	}
}
export {}

// @filename: index.js
import { error } from '@sveltejs/kit';
// ---cut---
error(404, 'Not found', {
	+++code: 'NOT_FOUND'+++
});
```

> [!NOTE] [在 SvelteKit 1.x 中](migrating-to-sveltekit-2#redirect-and-error-are-no-longer-thrown-by-you)，你必须自己 `throw` 这个 `error`

## 意外错误

*意外*错误是处理请求时发生的任何其他异常。由于这些错误可能包含敏感信息，意外错误的消息和堆栈跟踪不会暴露给用户。

默认情况下，意外错误会被打印到控制台（或在生产环境中打印到你的服务器日志），而暴露给用户的错误则具有通用形状：

```json
{ "status": 500, "message": "Internal Error" }
```

意外错误会经过 [`handleError`](hooks#Shared-hooks-handleError) hook，你可以在其中添加自己的错误处理 —— 例如，将错误发送到报告服务，或返回一个自定义错误对象，该对象会成为传递给 `+error.svelte` 的 `error` prop。

你可以通过返回一个 `status` 属性来覆盖响应中使用的 HTTP 状态码：

```js
/// file: src/hooks.server.js
// Assuming you have this ...
class NotFound extends Error {}

/** @type {import('@sveltejs/kit').HandleServerError} */
export function handleError({ error, event, status, message }) {
	// ... you can do this
	if (error instanceof NotFound) {
		return {
			status: 404,
			message: 'Not found'
		};
	}

	return { message: 'Something went wrong' };
}
```

## 错误边界

在 `load` 或渲染期间（例如在组件的 `<script>` 块或模板内部）发生的错误，会冒泡到最近的 `+error.svelte` 组件。要以更细粒度的级别处理错误，你可以使用 [`<svelte:boundary>`](../svelte/svelte-boundary)：

```svelte
<svelte:boundary>
	...
	{#snippet failed(error: App.Error)}
		<!-- error went through the `handleError` hook and is of type `App.Error` -->
		{error.message}
	{/snippet}
</svelte:boundary>
```

## 响应

如果错误发生在 `handle` 内部或 [`+server.js`](routing#server) 请求处理器内部，SvelteKit 会根据请求的 `Accept` 头，以回退错误页面或错误对象的 JSON 表示进行响应。

你可以通过添加 `src/error.html` 文件来自定义回退错误页面：

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<title>%sveltekit.error.message%</title>
	</head>
	<body>
		<h1>My custom error page</h1>
		<p>Status: %sveltekit.status%</p>
		<p>Message: %sveltekit.error.message%</p>
	</body>
</html>
```

SvelteKit 会将 `%sveltekit.status%` 和 `%sveltekit.error.message%` 替换为其对应的值。

如果错误发生在渲染页面时的 `load` 函数内部，SvelteKit 会渲染离错误发生位置最近的 [`+error.svelte`](routing#error) 组件。如果错误发生在 `+layout(.server).js` 的 `load` 函数内部，树中最近的错误边界是该布局*上方*的一个 `+error.svelte` 文件（而不是与其相邻的）。

例外情况是错误发生在根 `+layout.js` 或 `+layout.server.js` 内部时，因为根布局通常会*包含* `+error.svelte` 组件。在这种情况下，SvelteKit 使用回退错误页面。

## 类型安全

如果你使用 TypeScript 并需要自定义错误的形状，可以通过在应用中声明 `App.Error` 接口来实现（按照惯例，放在 `src/app.d.ts` 中，不过它可以放在任何 TypeScript 能「看到」的地方）：

```ts
/// file: src/app.d.ts
declare global {
	namespace App {
		interface Error {
+++			code: string;
			id: string;+++
		}
	}
}

export {};
```

该接口始终包含 `status: number` 和 `message: string` 属性。

## 延伸阅读

- [教程：错误与重定向](/tutorial/kit/error-basics)
- [教程：Hooks](/tutorial/kit/handle)
