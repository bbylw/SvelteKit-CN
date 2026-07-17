---
title: 状态管理
---

如果你习惯于构建仅限客户端的应用，那么在跨越服务器和客户端的应用中进行状态管理可能看起来令人生畏。本节提供了一些避免常见陷阱的提示。

## 避免在服务器上共享状态

浏览器是_有状态的_——状态在用户与应用交互时存储在内存中。另一方面，服务器是_无状态的_——响应的内容完全由请求的内容决定。

从概念上说是这样。实际上，服务器通常是长期运行并被多个用户共享的。因此，重要的是不要将数据存储在共享变量中。例如，考虑这段代码：

```js
// @errors: 7034 7005
/// file: +page.server.js
let user;

/** @type {import('./$types').PageServerLoad} */
export function load() {
	return { user };
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		// 千万不要这样做！
		user = {
			name: data.get('name'),
			embarrassingSecret: data.get('secret')
		};
	}
}
```

`user` 变量被连接到此服务器的所有人共享。如果 Alice 提交了一个尴尬的秘密，而 Bob 在她之后访问了页面，Bob 就会知道 Alice 的秘密。此外，当 Alice 当天晚些时候回到站点时，服务器可能已经重启，丢失了她的数据。

相反，你应该使用 [`cookies`](load#Cookies) 对用户进行_身份验证_，并将数据持久化到数据库。

## load 中不要有副作用

出于同样的原因，你的 `load` 函数应该是_纯_的——没有副作用（也许偶尔的 `console.log(...)` 除外）。例如，你可能会想在 `load` 函数中写入一个 store 或全局状态，以便可以在组件中使用该值：

```js
/// file: +page.js
// @filename: ambient.d.ts
declare module '#lib/user' {
	export const user: { set: (value: any) => void };
}

// @filename: index.js
// ---cut---
import { user } from '#lib/user';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	const response = await fetch('/api/user');

	// 千万不要这样做！
	user.set(await response.json());
}
```

与前面的例子一样，这将一个用户的信息放在了_所有_用户共享的地方。相反，只需返回数据……

```js
/// file: +page.js
/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	const response = await fetch('/api/user');

+++	return {
		user: await response.json()
	};+++
}
```

……并将其传递给需要它的组件，或者使用 [`page.data`](load#page.data)。

如果你不使用 SSR，那么就不存在意外将一个用户的数据暴露给另一个用户的风险。但你仍然应该避免在 `load` 函数中使用副作用——没有它们，你的应用会更容易推理。

## 使用状态与 store 配合 context

你可能想知道，如果我们不能使用全局状态，我们是如何能够使用 `page.data` 和其他[应用状态]($app-state) 的。答案是，服务器上的应用状态和 app store 使用了 Svelte 的 [context API](/tutorial/svelte/context-api)——状态（或 store）通过 `setContext` 附加到组件树上，而当你订阅时，你通过 `getContext` 检索它。我们对自己的状态也可以做同样的事情：

```svelte
<!--- file: src/routes/+layout.svelte --->
<script>
	import { setContext } from 'svelte';

	/** @type {import('./$types').LayoutProps} */
	let { data } = $props();

	// 将一个引用我们状态的函数传递给 context，
	// 供子组件访问
	setContext('user', () => data.user);
</script>
```

```svelte
<!--- file: src/routes/user/+page.svelte --->
<script>
	import { getContext } from 'svelte';

	// 从 context 中检索 user store
	const user = getContext('user');
</script>

<p>欢迎你，{user().name}</p>
```

> [!NOTE] 我们将一个函数传入 `setContext`，以跨边界保持响应性。更多信息请阅读[此处](/docs/svelte/$state#Passing-state-into-functions)

> [!LEGACY]
> 你也可以为此使用来自 `svelte/store` 的 store，但在使用 Svelte 5 时，建议改为利用 universal 响应性。

在页面通过 SSR 渲染时，在更深层的页面或组件中更新基于 context 的状态的值，不会影响父组件中的值，因为在状态值更新时它已经被渲染了。相比之下，在客户端（当启用了 CSR 时，这是默认情况）该值会被传播，层次结构中更高的组件、页面和布局会对新值做出反应。因此，为了避免在 hydration 期间状态更新时值 “闪烁”，通常建议将状态向下传递到组件，而不是向上。

如果你不使用 SSR（并且可以保证将来不需要使用 SSR），那么你可以安全地将状态保存在共享模块中，而无需使用 context API。

## 组件和页面状态会被保留

当你在应用中导航时，SvelteKit 会重用现有的布局和页面组件。例如，如果你有这样的路由……

```svelte
<!--- file: src/routes/blog/[slug]/+page.svelte --->
<script>
	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	// 这段代码有 bug！
	const wordCount = data.content.split(' ').length;
	const estimatedReadingTime = wordCount / 250;
</script>

<header>
	<h1>{data.title}</h1>
	<p>阅读时间：{Math.round(estimatedReadingTime)} 分钟</p>
</header>

<div>{@html data.content}</div>
```

……那么从 `/blog/my-short-post` 导航到 `/blog/my-long-post` 不会导致布局、页面以及其中任何其他组件被销毁并重新创建。相反，`data` 属性（以及由此延伸的 `data.title` 和 `data.content`）会更新（就像任何其他 Svelte 组件一样），并且，由于代码不会重新运行，像 `onMount` 和 `onDestroy` 这样的生命周期方法不会重新运行，`estimatedReadingTime` 也不会被重新计算。

相反，我们需要让这个值[_响应式_](/tutorial/svelte/state)：

```svelte
/// file: src/routes/blog/[slug]/+page.svelte
<script>
	/** @type {import('./$types').PageProps} */
	let { data } = $props();

+++	let wordCount = $derived(data.content.split(' ').length);
	let estimatedReadingTime = $derived(wordCount / 250);+++
</script>
```

> [!NOTE] 如果你的 `onMount` 和 `onDestroy` 中的代码必须在导航后再次运行，你可以分别使用 [afterNavigate]($app-navigation#afterNavigate) 和 [beforeNavigate]($app-navigation#beforeNavigate)。

像这样重用组件意味着像侧边栏滚动状态这样的内容会被保留，并且你可以轻松地在变化的值之间进行动画。如果你确实需要在导航时完全销毁并重新挂载一个组件，可以使用这种模式：

```svelte
<script>
	import { page } from '$app/state';
</script>

{#key page.url.pathname}
	<BlogPost title={data.title} content={data.title} />
{/key}
```

## 将状态存储在 URL 中

如果你有应该在刷新后保留和/或影响 SSR 的状态，例如表格上的筛选器或排序规则，URL 搜索参数（如 `?sort=price&order=ascending`）是存放它们的好地方。你可以将它们放在 `<a href="...">` 或 `<form action="...">` 属性中，或者通过 `goto('?key=value')` 以编程方式设置它们。它们可以在 `load` 函数内通过 `url` 参数访问，也可以在组件内通过 `page.url.searchParams` 访问。

## 在快照中存储临时状态

某些 UI 状态，例如 “手风琴是否展开？”，是可丢弃的——如果用户导航离开或刷新页面，状态丢失了也没关系。在某些情况下，你_确实_希望数据在用户导航到不同页面再返回时持久保存，但将状态存储在 URL 或数据库中就太过了。为此，SvelteKit 提供了 [snapshots](snapshots)，它让你可以将组件状态与历史记录条目关联起来。
