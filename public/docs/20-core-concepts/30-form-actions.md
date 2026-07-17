---
title: 表单操作
---

一个 `+page.server.js` 文件可以导出_操作（actions）_，它允许你使用 `<form>` 元素将数据 `POST` 到服务器。

使用 `<form>` 时，客户端 JavaScript 是可选的，但你可以轻松地用 JavaScript 对你的表单交互进行_渐进增强_，以提供最佳用户体验。

## 默认操作

在最简单的情况下，一个页面声明一个 `default` 操作：

```js
/// file: src/routes/login/+page.server.js
/** @satisfies {import('./$types').Actions} */
export const actions = {
	default: async (event) => {
		// TODO 让用户登录
	}
};
```

要从 `/login` 页面调用此操作，只需添加一个 `<form>`——无需 JavaScript：

```svelte
<!--- file: src/routes/login/+page.svelte --->
<form method="POST">
	<label>
		邮箱
		<input name="email" type="email">
	</label>
	<label>
		密码
		<input name="password" type="password">
	</label>
	<button>登录</button>
</form>
```

如果有人点击按钮，浏览器会通过 `POST` 请求将表单数据发送到服务器，运行默认操作。

> [!NOTE] 操作始终使用 `POST` 请求，因为 `GET` 请求绝不应该产生副作用。

我们也可以通过添加指向该页面的 `action` 属性，从其他页面调用该操作（例如，如果根布局的导航中有一个登录小部件）：

```html
/// file: src/routes/+layout.svelte
<form method="POST" action="/login">
	<!-- 内容 -->
</form>
```

## 命名操作

除了一个 `default` 操作，一个页面可以根据需要拥有任意多个命名操作：

```js
/// file: src/routes/login/+page.server.js
/** @satisfies {import('./$types').Actions} */
export const actions = {
---	default: async (event) => {---
+++	login: async (event) => {+++
		// TODO 让用户登录
	},
+++	register: async (event) => {
		// TODO 注册用户
	}+++
};
```

要调用一个命名操作，添加一个以 `/` 字符为前缀的查询参数：

```svelte
<!--- file: src/routes/login/+page.svelte --->
<form method="POST" action="?/register">
```

```svelte
<!--- file: src/routes/+layout.svelte --->
<form method="POST" action="/login?/register">
```

除了 `action` 属性，我们还可以使用按钮上的 `formaction` 属性，将相同的表单数据 `POST` 到与父级 `<form>` 不同的操作：

```svelte
/// file: src/routes/login/+page.svelte
<form method="POST" +++action="?/login"+++>
	<label>
		邮箱
		<input name="email" type="email">
	</label>
	<label>
		密码
		<input name="password" type="password">
	</label>
	<button>登录</button>
	+++<button formaction="?/register">注册</button>+++
</form>
```

> [!NOTE] 我们不能在命名操作旁边使用默认操作，因为如果你 POST 到一个命名操作而没有重定向，查询参数会保留在 URL 中，这意味着下一次默认 POST 会经过之前那个命名操作。

## 操作的结构

每个操作都接收一个 `RequestEvent` 对象，让你可以通过 `request.formData()` 读取数据。在处理请求之后（例如，通过设置 cookie 让用户登录），该操作可以用数据进行响应，这些数据将通过相应页面上的 `form` 属性以及全局范围内的 `page.form` 可用，直到下一次更新。

```js
/// file: src/routes/login/+page.server.js
// @filename: ambient.d.ts
declare module '#lib/server/db';

// @filename: index.js
// ---cut---
import * as db from '#lib/server/db';

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies }) {
	const user = await db.getUserFromSession(cookies.get('sessionid'));
	return { user };
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
	login: async ({ cookies, request }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');

		const user = await db.getUser(email);
		cookies.set('sessionid', await db.createSession(user), { path: '/' });

		return { success: true };
	},
	register: async (event) => {
		// TODO 注册用户
	}
};
```

```svelte
<!--- file: src/routes/login/+page.svelte --->
<script>
	/** @type {import('./$types').PageProps} */
	let { data, form } = $props();
</script>

{#if form?.success}
	<!-- 这条消息是临时的；它存在是因为页面是作为
	       对表单提交的响应而渲染的。如果用户刷新，它会消失 -->
	<p>登录成功！欢迎回来，{data.user.name}</p>
{/if}
```

> [!LEGACY]
> `PageProps` 是在 2.16.0 中添加的。在早期版本中，你必须分别为 `data` 和 `form` 属性添加类型：
> ```js
> /// file: +page.svelte
> /** @type {{ data: import('./$types').PageData, form: import('./$types').ActionData }} */
> let { data, form } = $props();
> ```
>
> 在 Svelte 4 中，你需要改用 `export let data` 和 `export let form` 来声明属性。

### 校验错误

如果由于数据无效而无法处理请求，你可以将校验错误——连同之前提交的表单值一起——返回给用户，以便他们重试。`fail` 函数让你可以返回一个 HTTP 状态码（在出现校验错误的情况下通常是 400 或 422）以及数据。状态码通过 `page.status` 可用，数据通过 `form` 可用：

当使用 `use:enhance`（或者发起一个带有 `accept: application/json` 头的 `fetch` 请求）时，HTTP 响应状态码将与传给 `fail` 的状态码一致。当操作返回数据时，响应状态码为 200；当它不返回任何内容（即 `undefined`）时，响应状态码为 204。这使得使用可观测性工具来跟踪表单提交结果变得更加容易。

```js
/// file: src/routes/login/+page.server.js
// @filename: ambient.d.ts
declare module '#lib/server/db';

// @filename: index.js
// ---cut---
+++import { fail } from '@sveltejs/kit';+++
import * as db from '#lib/server/db';

/** @satisfies {import('./$types').Actions} */
export const actions = {
	login: async ({ cookies, request }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');

+++		if (!email) {
			return fail(400, { email, missing: true });
		}+++

		const user = await db.getUser(email);

+++		if (!user || user.password !== db.hash(password)) {
			return fail(400, { email, incorrect: true });
		}+++

		cookies.set('sessionid', await db.createSession(user), { path: '/' });

		return { success: true };
	},
	register: async (event) => {
		// TODO 注册用户
	}
};
```

> [!NOTE] 请注意，作为一种预防措施，我们只将邮箱返回给页面——而不是密码。

```svelte
/// file: src/routes/login/+page.svelte
<form method="POST" action="?/login">
+++	{#if form?.missing}<p class="error">邮箱字段为必填项</p>{/if}
	{#if form?.incorrect}<p class="error">凭据无效！</p>{/if}+++
	<label>
		邮箱
		<input name="email" type="email" +++value={form?.email ?? ''}+++>
	</label>
	<label>
		密码
		<input name="password" type="password">
	</label>
	<button>登录</button>
	<button formaction="?/register">注册</button>
</form>
```

返回的数据必须可序列化为 JSON。除此之外，结构完全由你决定。例如，如果你在页面上有多个表单，你可以用一个 `id` 属性或类似的东西来区分返回的 `form` 数据指的是哪个 `<form>`。

### 重定向

重定向（和错误）的工作方式与 [`load`](load#Redirects) 中完全相同：

```js
// @errors: 2345
/// file: src/routes/login/+page.server.js
// @filename: ambient.d.ts
declare module '#lib/server/db';

// @filename: index.js
// ---cut---
import { fail, +++redirect+++ } from '@sveltejs/kit';
import * as db from '#lib/server/db';

/** @satisfies {import('./$types').Actions} */
export const actions = {
	login: async ({ cookies, request, +++url+++ }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');

		const user = await db.getUser(email);
		if (!user) {
			return fail(400, { email, missing: true });
		}

		if (user.password !== db.hash(password)) {
			return fail(400, { email, incorrect: true });
		}

		cookies.set('sessionid', await db.createSession(user), { path: '/' });

+++		if (url.searchParams.has('redirectTo')) {
			redirect(303, url.searchParams.get('redirectTo'));
		}+++

		return { success: true };
	},
	register: async (event) => {
		// TODO 注册用户
	}
};
```

## 加载数据

操作运行后，页面将被重新渲染（除非发生重定向或意外错误），操作返回值作为 `form` 属性对页面可用。这意味着你的页面的 `load` 函数将在操作完成后运行。

请注意，`handle` 在操作被调用之前运行，并且不会在 `load` 函数之前重新运行。这意味着，例如，如果你使用 `handle` 基于 cookie 填充 `event.locals`，那么当你在操作中设置或删除 cookie 时，你必须更新 `event.locals`：

```js
/// file: src/hooks.server.js
// @filename: ambient.d.ts
declare namespace App {
	interface Locals {
		user: {
			name: string;
		} | null
	}
}

// @filename: global.d.ts
declare global {
	function getUser(sessionid: string | undefined): {
		name: string;
	};
}

export {};

// @filename: index.js
// ---cut---
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	event.locals.user = await getUser(event.cookies.get('sessionid'));
	return resolve(event);
}
```

```js
/// file: src/routes/account/+page.server.js
// @filename: ambient.d.ts
declare namespace App {
	interface Locals {
		user: {
			name: string;
		} | null
	}
}

// @filename: index.js
// ---cut---
/** @type {import('./$types').PageServerLoad} */
export function load(event) {
	return {
		user: event.locals.user
	};
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
	logout: async (event) => {
		event.cookies.delete('sessionid', { path: '/' });
		event.locals.user = null;
	}
};
```

## 渐进增强

在前面的章节中，我们构建了一个[无需客户端 JavaScript 即可工作](https://kryogenix.org/code/browser/everyonehasjs.html) 的 `/login` 操作——看不到一个 `fetch`。这很棒，但当 JavaScript_可用_时，我们可以对表单交互进行渐进增强，以提供更好的用户体验。

### use:enhance

渐进增强表单最简单的方法是添加 `use:enhance` 操作：

```svelte
/// file: src/routes/login/+page.svelte
<script>
	+++import { enhance } from '$app/forms';+++

	/** @type {import('./$types').PageProps} */
	let { form } = $props();
</script>

<form method="POST" +++use:enhance+++>
```

> [!NOTE] `use:enhance` 只能用于带有 `method="POST"` 且指向在 `+page.server.js` 文件中定义的表单操作。它不适用于 `method="GET"`，那是未指定方法时表单的默认值。尝试在不带 `method="POST"` 的表单上使用 `use:enhance`，或 POST 到一个 `+server.js` 端点，都会导致错误。

> [!NOTE] 是的，`enhance` 操作和 `<form action>` 都被称为 “action”，这有点令人困惑。这些文档充满了 action。抱歉。

不带参数时，`use:enhance` 会模拟浏览器原生的行为，只是没有整页重新加载。它会：

- 在成功或无效的响应上更新 `form` 属性、`page.form` 和 `page.status`，但仅当该操作位于你提交所在的同一页面时。例如，如果你的表单看起来像 `<form action="/somewhere/else" ..>`，那么 `form` 属性和 `page.form` 状态将_不会_被更新。这是因为在原生表单提交的情况下，你将被重定向到该操作所在的页面。如果你希望无论如何都更新它们，请使用 [`applyAction`](#Progressive-enhancement-Customising-use:enhance)
- 重置 `<form>` 元素
- 在成功响应上使用 `invalidateAll` 使所有数据失效
- 在重定向响应上调用 `goto`
- 如果发生错误，渲染最近的 `+error` 边界
- [重置焦点](accessibility#Focus-management) 到适当的元素

### 自定义 use:enhance

要自定义行为，你可以提供一个 `SubmitFunction`，它在表单提交之前立即运行，并（可选）返回一个在收到 `ActionResult` 时运行的回调。

```svelte
<form
	method="POST"
	use:enhance={({ formElement, formData, action, cancel, submitter }) => {
		// `formElement` 是这个 `<form>` 元素
		// `formData` 是它即将被提交的 `FormData` 对象
		// `action` 是表单被提交到的 URL
		// 调用 `cancel()` 会阻止提交
		// `submitter` 是导致表单被提交的 `HTMLElement`

		return async ({ result, update }) => {
			// `result` 是一个 `ActionResult` 对象
			// `update` 是一个函数，它会触发在没有设置此回调时本应触发的默认逻辑
		};
	}}
>
```

你可以用这些函数显示和隐藏加载 UI，等等。

如果你返回一个回调，你将覆盖默认的提交后行为。要恢复它，调用 `update`，它接受 `invalidateAll` 和 `reset` 参数，或者在结果上使用 `applyAction`：

```svelte
/// file: src/routes/login/+page.svelte
<script>
	import { enhance, +++applyAction+++ } from '$app/forms';

	/** @type {import('./$types').PageProps} */
	let { form } = $props();
</script>

<form
	method="POST"
	use:enhance={({ formElement, formData, action, cancel }) => {
		return async ({ result }) => {
			// `result` 是一个 `ActionResult` 对象
+++			if (result.type === 'redirect') {
				goto(result.location);
			} else {
				await applyAction(result);
			}+++
		};
	}}
>
```

`applyAction(result)` 的行为取决于 `result.type`：

- `success`、`failure` —— 将 `page.status` 设为 `result.status`，并将 `form` 和 `page.form` 更新为 `result.data`（无论你从哪里提交，这与 `enhance` 的 `update` 不同）
- `redirect` —— 调用 `goto(result.location, { invalidateAll: true })`
- `error` —— 用 `result.error` 渲染最近的 `+error` 边界

在所有情况下，[焦点都会被重置](accessibility#Focus-management)。

### 自定义事件监听器

我们也可以自己实现渐进增强，而无需 `use:enhance`，只需在 `<form>` 上添加一个普通的事件监听器：

```svelte
<!--- file: src/routes/login/+page.svelte --->
<script>
	import { refreshAll, goto } from '$app/navigation';
	import { applyAction, deserialize } from '$app/forms';

	/** @type {import('./$types').PageProps} */
	let { form } = $props();

	/** @param {SubmitEvent & { currentTarget: EventTarget & HTMLFormElement}} event */
	async function handleSubmit(event) {
		event.preventDefault();
		const data = new FormData(event.currentTarget, event.submitter);

		const response = await fetch(event.currentTarget.action, {
			method: 'POST',
			body: data
		});

		/** @type {import('@sveltejs/kit').ActionResult} */
		const result = deserialize(await response.text());

		if (result.type === 'success') {
			// 在成功更新后，重新运行所有 `load` 函数和查询
			await refreshAll();
		}

		applyAction(result);
	}
</script>

<form method="POST" onsubmit={handleSubmit}>
	<!-- 内容 -->
</form>
```

请注意，在使用 `$app/forms` 中的相应方法进一步处理响应之前，你需要先对响应进行 `deserialize`。`JSON.parse()` 是不够的，因为表单操作——就像 `load` 函数一样——也支持返回 `Date` 或 `BigInt` 对象。

如果你在 `+page.server.js` 旁边还有一个 `+server.js`，`fetch` 请求默认会被路由到那里。要改为 `POST` 到 `+page.server.js` 中的操作，请使用自定义的 `x-sveltekit-action` 头：

```js
// @errors: 2532 2304
const response = await fetch(this.action, {
	method: 'POST',
	body: data,
+++	headers: {
		'x-sveltekit-action': 'true'
	}+++
});
```

## 替代方案

表单操作是向服务器发送数据的首选方式，因为它们可以进行渐进增强，但你也可以使用 [`+server.js`](routing#server) 文件来暴露（例如）一个 JSON API。下面是这种交互可能的样子：

```svelte
<!--- file: src/routes/send-message/+page.svelte --->
<script>
	function rerun() {
		fetch('/api/ci', {
			method: 'POST'
		});
	}
</script>

<button onclick={rerun}>重新运行 CI</button>
```

```js
// @errors: 2355 1360 2322
/// file: src/routes/api/ci/+server.js
/** @type {import('./$types').RequestHandler} */
export function POST() {
	// 做一些事情
}
```

## GET 与 POST

正如我们所见，要调用表单操作，你必须使用 `method="POST"`。

有些表单不需要向服务器 `POST` 数据——例如搜索输入框。对于这些，你可以使用 `method="GET"`（或者等价地，完全不使用 `method`），SvelteKit 会将它们视为 `<a>` 元素，使用客户端路由器而不是整页导航：

```html
<form action="/search">
	<label>
		搜索
		<input name="q">
	</label>
</form>
```

提交此表单将导航到 `/search?q=...` 并调用你的 load 函数，但_不会_调用操作。与 `<a>` 元素一样，你可以在 `<form>` 上设置 [`data-sveltekit-reload`](link-options#data-sveltekit-reload)、[`data-sveltekit-replacestate`](link-options#data-sveltekit-replacestate)、[`data-sveltekit-keepfocus`](link-options#data-sveltekit-keepfocus) 和 [`data-sveltekit-noscroll`](link-options#data-sveltekit-noscroll) 属性来控制路由器的行为。

## 延伸阅读

- [教程：表单](/tutorial/kit/the-form-element)
