---
title: 路由
---

SvelteKit 的核心是一个_基于文件系统的路由器_。你应用的路由——即用户可以访问的 URL 路径——由你代码库中的目录定义：

- `src/routes` 是根路由
- `src/routes/about` 创建一个 `/about` 路由
- `src/routes/blog/[slug]` 创建一个带有_参数_ `slug` 的路由，该参数可用于在用户请求像 `/blog/hello-world` 这样的页面时动态加载数据

> [!NOTE] 你可以通过编辑[项目配置](configuration) 将 `src/routes` 改为不同的目录。

每个路由目录都包含一个或多个_路由文件_，可以通过它们的 `+` 前缀来识别。

我们稍后会更详细地介绍这些文件，但这里有几个简单的规则可以帮助你记住 SvelteKit 的路由是如何工作的：

* 所有文件都可以在服务器上运行
* 除了 `+server` 文件外，所有文件都在客户端运行
* `+layout` 和 `+error` 文件既适用于它们所在的目录，也适用于子目录

## +page

### +page.svelte

一个 `+page.svelte` 组件定义了你应用的一个页面。默认情况下，页面会先在服务器上渲染（[SSR](glossary#SSR)）以响应初始请求，然后在浏览器中渲染（[CSR](glossary#CSR)）以响应后续导航。

```svelte
<!--- file: src/routes/+page.svelte --->
<h1>你好，欢迎来到我的站点！</h1>
<a href="/about">关于我的站点</a>
```

```svelte
<!--- file: src/routes/about/+page.svelte --->
<h1>关于本站点</h1>
<p>TODO...</p>
<a href="/">首页</a>
```

> [!NOTE] SvelteKit 使用 `<a>` 元素在路由之间导航，而不是使用框架特定的 `<Link>` 组件。

页面可以通过 `data` 属性从 `load` 函数接收数据。

```svelte
<!--- file: src/routes/blog/[slug]/+page.svelte --->
<script>
	/** @type {import('./$types').PageProps} */
	let { data } = $props();
</script>

<h1>{data.title}</h1>
<div>{@html data.content}</div>
```

从 2.24 开始，页面还会接收一个基于路由参数类型化的 `params` 属性。这在配合[远程函数](remote-functions) 时特别有用：

```svelte
<!--- file: src/routes/blog/[slug]/+page.svelte --->
<script>
	import { getPost } from '../blog.remote';

	/** @type {import('./$types').PageProps} */
	let { params } = $props();

	const post = $derived(await getPost(params.slug));
</script>

<h1>{post.title}</h1>
<div>{@html post.content}</div>
```

> [!LEGACY]
> `PageProps` 是在 2.16.0 中添加的。在早期版本中，你必须使用 `PageData` 手动为 `data` 属性添加类型，请参见 [$types](#\$types)。
>
> 在 Svelte 4 中，你需要改用 `export let data`。

### +page.js

通常，一个页面需要先加载一些数据才能渲染。为此，我们添加一个导出 `load` 函数的 `+page.js` 模块：

```js
/// file: src/routes/blog/[slug]/+page.js
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	if (params.slug === 'hello-world') {
		return {
			title: 'Hello world!',
			content: '欢迎来到我们的博客。Lorem ipsum dolor sit amet...'
		};
	}

	error(404, '未找到');
}
```

这个函数与 `+page.svelte` 一起运行，这意味着它在服务器端渲染期间在服务器上运行，在客户端导航期间在浏览器中运行。有关该 API 的完整细节，请参阅 [`load`](load)。

除了 `load`，`+page.js` 还可以导出配置页面行为的各种值：

- `export const prerender = true` 或 `false` 或 `'auto'`
- `export const ssr = true` 或 `false`
- `export const csr = true` 或 `false`

你可以在[页面选项](page-options) 中找到关于这些的更多信息。

### +page.server.js

如果你的 `load` 函数只能在服务器上运行——例如，如果它需要从一个数据库获取数据，或者你需要访问像 API 密钥这样的私有[环境变量](environment-variables)——那么你可以将 `+page.js` 重命名为 `+page.server.js`，并将 `PageLoad` 类型改为 `PageServerLoad`。

```js
/// file: src/routes/blog/[slug]/+page.server.js

// @filename: ambient.d.ts
declare global {
	const getPostFromDatabase: (slug: string) => {
		title: string;
		content: string;
	}
}

export {};

// @filename: index.js
// ---cut---
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	const post = await getPostFromDatabase(params.slug);

	if (post) {
		return post;
	}

	error(404, '未找到');
}
```

在客户端导航期间，SvelteKit 会从服务器加载这些数据，这意味着返回值必须能够使用 [devalue](https://github.com/rich-harris/devalue) 进行序列化。有关该 API 的完整细节，请参阅 [`load`](load)。

与 `+page.js` 一样，`+page.server.js` 可以导出[页面选项](page-options)——`prerender`、`ssr` 和 `csr`。

`+page.server.js` 文件还可以导出_操作（actions）_。如果说 `load` 让你可以从服务器读取数据，那么 `actions` 让你可以使用 `<form>` 元素将数据写_入_服务器。要了解如何使用它们，请参阅[表单操作](form-actions) 部分。

## +error

如果在 `load` 期间发生错误，SvelteKit 会渲染一个默认错误页面。你可以通过添加一个 `+error.svelte` 文件来逐路由自定义这个错误页面：

```svelte
<!--- file: src/routes/blog/[slug]/+error.svelte --->
<script>
	import { page } from '$app/state';
</script>

<h1>{page.status}: {page.error.message}</h1>
```

SvelteKit 会 “沿着树向上走”，寻找最接近的错误边界——如果上面的文件不存在，它会先尝试 `src/routes/blog/+error.svelte`，然后尝试 `src/routes/+error.svelte`，最后才渲染默认错误页面。如果_那_也失败了（或者错误是从位于根 `+error` “上方” 的根 `+layout` 的 `load` 函数中抛出的），SvelteKit 会退出并渲染一个静态的回退错误页面，你可以通过创建一个 `src/error.html` 文件来自定义它。

如果错误发生在 `+layout(.server).js` 的 `load` 函数内部，树中最接近的错误边界是_位于该布局上方_的 `+error.svelte` 文件（而不是与之相邻的文件）。

如果找不到任何路由（404），将使用 `src/routes/+error.svelte`（如果该文件不存在，则使用默认错误页面）。

> [!NOTE] 当错误发生在 [`handle`](hooks#Server-hooks-handle) 或 [+server.js](#server) 请求处理程序内部时，_不会_使用 `+error.svelte`。

你可以在[此处](errors) 了解更多关于错误处理的信息。

## +layout

到目前为止，我们一直将页面视为完全独立的组件——在导航时，现有的 `+page.svelte` 组件会被销毁，新的组件会取代它的位置。

但在许多应用中，有些元素应该在_每个_页面上都可见，例如顶层导航或页脚。与其在每个 `+page.svelte` 中重复它们，我们可以将它们放在_布局_中。

### +layout.svelte

要创建一个适用于每个页面的布局，创建一个名为 `src/routes/+layout.svelte` 的文件。默认布局（如果你不自己提供，SvelteKit 使用的那个）看起来像这样……

```svelte
<script>
	let { children } = $props();
</script>

{@render children()}
```

……但我们可以添加任何我们想要的标记、样式和行为。唯一的要求是该组件包含用于页面内容的 `@render` 标签。例如，让我们添加一个导航栏：

```svelte
<!--- file: src/routes/+layout.svelte --->
<script>
	let { children } = $props();
</script>

<nav>
	<a href="/">首页</a>
	<a href="/about">关于</a>
	<a href="/settings">设置</a>
</nav>

{@render children()}
```

如果我们为 `/`、`/about` 和 `/settings` 创建页面……

```html
/// file: src/routes/+page.svelte
<h1>首页</h1>
```

```html
/// file: src/routes/about/+page.svelte
<h1>关于</h1>
```

```html
/// file: src/routes/settings/+page.svelte
<h1>设置</h1>
```

……导航栏将始终可见，在三个页面之间点击只会导致 `<h1>` 被替换。

布局可以是_嵌套_的。假设我们不只有一个单独的 `/settings` 页面，而是有像 `/settings/profile` 和 `/settings/notifications` 这样带有共享子菜单的嵌套页面（现实例子见 [github.com/settings](https://github.com/settings)）。

我们可以创建一个只适用于 `/settings` 以下页面的布局（同时继承带有顶层导航的根布局）：

```svelte
<!--- file: src/routes/settings/+layout.svelte --->
<script>
	/** @type {import('./$types').LayoutProps} */
	let { data, children } = $props();
</script>

<h1>设置</h1>

<div class="submenu">
	{#each data.sections as section}
		<a href="/settings/{section.slug}">{section.title}</a>
	{/each}
</div>

{@render children()}
```

> [!LEGACY]
> `LayoutProps` 是在 2.16.0 中添加的。在早期版本中，你必须[手动为属性添加类型](#\$types)。

你可以通过查看下面下一节中的 `+layout.js` 示例来了解 `data` 是如何被填充的。

默认情况下，每个布局都会继承它上方的布局。有时这不是你想要的——在这种情况下，[高级布局](advanced-routing#Advanced-layouts) 可以帮到你。

### +layout.js

就像 `+page.svelte` 从 `+page.js` 加载数据一样，你的 `+layout.svelte` 组件可以从 `+layout.js` 中的 [`load`](load) 函数获取数据。

```js
/// file: src/routes/settings/+layout.js
/** @type {import('./$types').LayoutLoad} */
export function load() {
	return {
		sections: [
			{ slug: 'profile', title: '个人资料' },
			{ slug: 'notifications', title: '通知' }
		]
	};
}
```

如果 `+layout.js` 导出了[页面选项](page-options)——`prerender`、`ssr` 和 `csr`——它们将作为子页面的默认值。

从布局的 `load` 函数返回的数据也对其所有子页面可用：

```svelte
<!--- file: src/routes/settings/profile/+page.svelte --->
<script>
	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	console.log(data.sections); // [{ slug: 'profile', title: 'Profile' }, ...]
</script>
```

> [!NOTE] 通常，在页面之间导航时布局数据不会变化。SvelteKit 会在必要时智能地重新运行 [`load`](load) 函数。

### +layout.server.js

要在服务器上运行你的布局的 `load` 函数，将其移动到 `+layout.server.js`，并将 `LayoutLoad` 类型改为 `LayoutServerLoad`。

与 `+layout.js` 一样，`+layout.server.js` 可以导出[页面选项](page-options)——`prerender`、`ssr` 和 `csr`。

## +server

除了页面，你还可以用 `+server.js` 文件（有时称为 “API 路由” 或 “端点”）定义路由，它让你完全控制响应。你的 `+server.js` 文件导出与 HTTP 动词（如 `GET`、`POST`、`PATCH`、`PUT`、`DELETE`、`OPTIONS` 和 `HEAD`）对应的函数，这些函数接受 [`RequestEvent`](@sveltejs-kit#RequestEvent) 参数并返回一个 [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) 对象。

例如，我们可以用一个 `GET` 处理程序创建一个 `/api/random-number` 路由：

```js
/// file: src/routes/api/random-number/+server.js
import { error } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export function GET({ url }) {
	const min = Number(url.searchParams.get('min') ?? '0');
	const max = Number(url.searchParams.get('max') ?? '1');

	const d = max - min;

	if (isNaN(d) || d < 0) {
		error(400, 'min 和 max 必须是数字，且 min 必须小于 max');
	}

	const random = min + Math.random() * d;

	return new Response(String(random));
}
```

`Response` 的第一个参数可以是一个 [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)，使得流式传输大量数据或创建服务器发送事件（server-sent events）成为可能（除非部署到会缓冲响应的平台上，如 AWS Lambda）。

你可以为了方便使用来自 `@sveltejs/kit` 的 [`error`](@sveltejs-kit#error)、[`redirect`](@sveltejs-kit#redirect) 和 [`json`](@sveltejs-kit#json) 方法（但不一定非要用）。

如果抛出了错误（无论是 `error(...)` 还是意外错误），响应将是该错误的 JSON 表示或回退错误页面——后者可以通过 `src/error.html` 自定义——具体取决于 `Accept` 头。[`+error.svelte`](#error) 组件在这种情况下_不会_被渲染。你可以在[此处](errors) 了解更多关于错误处理的信息。

> [!NOTE] 创建 `OPTIONS` 处理程序时，请注意 Vite 会注入 `Access-Control-Allow-Origin` 和 `Access-Control-Allow-Methods` 头——除非你自行添加，否则这些头在生产环境中不会出现。

> [!NOTE] `+layout` 文件对 `+server.js` 文件没有影响。如果你想在每个请求之前运行某些逻辑，请将其添加到服务器端 [`handle`](hooks#Server-hooks-handle) 钩子中。

### 接收数据

通过导出 `POST`/`PUT`/`PATCH`/`DELETE`/`OPTIONS`/`HEAD` 处理程序，`+server.js` 文件可用于创建完整的 API：

```svelte
<!--- file: src/routes/add/+page.svelte --->
<script>
	let a = $state(0);
	let b = $state(0);
	let total = $state(0);

	async function add() {
		const response = await fetch('/api/add', {
			method: 'POST',
			body: JSON.stringify({ a, b }),
			headers: {
				'content-type': 'application/json'
			}
		});

		total = await response.json();
	}
</script>

<input type="number" bind:value={a}> +
<input type="number" bind:value={b}> =
{total}

<button onclick={add}>计算</button>
```

```js
/// file: src/routes/api/add/+server.js
import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { a, b } = await request.json();
	return json(a + b);
}
```

> [!NOTE] 一般来说，[表单操作](form-actions) 是从浏览器向服务器提交数据的更好方式。

> [!NOTE] 如果导出了 `GET` 处理程序，那么 `HEAD` 请求将返回 `GET` 处理程序响应体的 `content-length`。

### 回退方法处理程序

导出 `fallback` 处理程序将匹配任何未处理请求方法，包括像 `MOVE` 这样在 `+server.js` 中没有专门导出的方法。

```js
/// file: src/routes/api/add/+server.js
import { json, text } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { a, b } = await request.json();
	return json(a + b);
}

// 这个处理程序将响应 PUT、PATCH、DELETE 等。
/** @type {import('./$types').RequestHandler} */
export async function fallback({ request }) {
	return text(`我捕获了你的 ${request.method} 请求！`);
}
```

> [!NOTE] 对于 `HEAD` 请求，`GET` 处理程序优先于 `fallback` 处理程序。

### 内容协商

`+server.js` 文件可以与 `+page` 文件放在同一目录中，允许同一路由既可以是页面也可以是 API 端点。为了确定是哪个，SvelteKit 应用以下规则：

- `PUT`/`PATCH`/`DELETE`/`OPTIONS` 请求总是由 `+server.js` 处理，因为它们不适用于页面
- `GET`/`POST`/`HEAD` 请求，如果 `accept` 头优先 `text/html`（换句话说，是一个浏览器页面请求），则被视为页面请求，否则由 `+server.js` 处理
- 对 `GET` 请求的响应将包含 `Vary: Accept` 头，以便代理和浏览器分别缓存 HTML 和 JSON 响应

## $types

在上面的所有示例中，我们一直在从 `$types.d.ts` 文件导入类型。这是 SvelteKit 在隐藏目录中为你创建的一个文件（如果你使用 TypeScript 或带有 JSDoc 类型注解的 JavaScript），以便在处理你的根文件时提供类型安全。

例如，用 `PageProps`（对于 `+page.svelte` 文件）或 `LayoutProps`（对于 `+layout.svelte` 文件）注解 `let { data } = $props()`，会告诉 TypeScript，`data` 的类型就是 `load` 返回的类型：

```svelte
<!--- file: src/routes/blog/[slug]/+page.svelte --->
<script>
	/** @type {import('./$types').PageProps} */
	let { data } = $props();
</script>
```

> [!NOTE]
> 在 2.16.0 中添加的 `PageProps` 和 `LayoutProps` 类型，是直接将 `data` 属性类型化为 `PageData` 或 `LayoutData`（以及 `form` 等页面属性、`children` 等布局属性）的快捷方式。在早期版本中，你必须手动为这些属性添加类型。例如，对于页面：
>
> ```js
> /// file: +page.svelte
> /** @type {{ data: import('./$types').PageData, form: import('./$types').ActionData }} */
> let { data, form } = $props();
> ```
>
> 或者，对于布局：
>
> ```js
> /// file: +layout.svelte
> /** @type {{ data: import('./$types').LayoutData, children: Snippet }} */
> let { data, children } = $props();
> ```

反过来，用 `PageLoad`、`PageServerLoad`、`LayoutLoad` 或 `LayoutServerLoad`（分别对应于 `+page.js`、`+page.server.js`、`+layout.js` 和 `+layout.server.js`）注解 `load` 函数，可以确保 `params` 和返回值被正确类型化。

如果你使用的是 VS Code 或任何支持语言服务器协议和 TypeScript 插件的 IDE，那么你可以_完全_省略这些类型！Svelte 的 IDE 工具会为你插入正确的类型，因此你无需亲自编写就能获得类型检查。它也与我们的命令行工具 `svelte-check` 兼容。

你可以在我们关于它的[博客文章](/blog/zero-config-type-safety) 中阅读更多关于省略 `$types` 的内容。

## 其他文件

路由目录中的任何其他文件都会被 SvelteKit 忽略。这意味着你可以将组件和实用模块与需要它们的路由放在一起。

如果多个路由需要这些组件和模块，最好将它们放在 [`#lib`]($lib) 中。

## 延伸阅读

- [教程：路由](/tutorial/kit/pages)
- [教程：API 路由](/tutorial/kit/get-handlers)
- [文档：高级路由](advanced-routing)
