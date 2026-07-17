---
title: 远程函数
---

<blockquote class="since note">
	<p>自 2.27 起可用</p>
</blockquote>

远程函数（remote functions）是用于客户端与服务器之间类型安全通信的工具。它们可以在你应用的任何地方被_调用_，但始终在服务器上_运行_，这意味着它们可以安全地访问[仅服务器端模块](server-only-modules)，其中包含环境变量和数据库客户端等内容。

结合 Svelte 对 [`await`](/docs/svelte/await-expressions) 的实验性支持，它允许你直接在组件内部加载和操作数据。

此功能目前是实验性的，这意味着它可能包含 bug，并且可能会在未事先通知的情况下更改。你必须通过在 `vite.config.js` 中的 SvelteKit 插件添加 `compilerOptions.experimental.async` 和 `experimental.remoteFunctions` 选项来选择启用：

```js
/// file: vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			experimental: {
				+++remoteFunctions: true+++
			},
			compilerOptions: {
				experimental: {
					+++async: true+++
				}
			}
		})
	],
});
```

## 概述

远程函数从 `.remote.js` 或 `.remote.ts` 文件导出，有四种类型：`query`、`form`、`command` 和 `prerender`。在客户端，导出的函数被转换为 `fetch` 包装器，通过生成的 HTTP 端点调用它们在服务器上的对应函数。远程文件可以放在你 `src` 目录中的任何地方（除了 `src/lib/server` 目录内部），第三方库也可以提供它们。

## query

`query` 函数允许你从服务器读取动态数据。

> [!NOTE] 对于_静态_数据，请考虑改用 [`prerender`](#prerender) 函数。当整个页面被预渲染时（即 [`export const prerender = true`](page-options#prerender) 被应用于该页面或父级布局时），例如使用 [`adapter-static`](adapter-static) 时，查询无法使用。

```js
/// file: src/routes/blog/data.remote.js
// @filename: ambient.d.ts
declare module '#lib/server/database' {
	export function sql(strings: TemplateStringsArray, ...values: any[]): Promise<any[]>;
}
// @filename: index.js
// ---cut---
import { query } from '$app/server';
import * as db from '#lib/server/database';

export const getPosts = query(async () => {
	const posts = await db.sql`
		SELECT title, slug
		FROM post
		ORDER BY published_at
		DESC
	`;

	return posts;
});
```

> [!NOTE] 在本页中，你会看到像 `#lib/server/database` 和 `#lib/server/auth` 这样来自虚构模块的导入。它们纯粹是为了说明目的——你可以使用任何你喜欢的数据库客户端和身份验证设置。
>
> 上面的 `db.sql` 函数是一个[标签模板函数](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates)，它会转义任何被插值的值。

从 `getPosts` 返回的查询作为一个 [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) 工作，它 resolve 为 `posts`：

```svelte
<!--- file: src/routes/blog/+page.svelte --->
<script>
	import { getPosts } from './data.remote';
</script>

<h1>最新文章</h1>

<ul>
	{#each await getPosts() as { title, slug }}
		<li><a href="/blog/{slug}">{title}</a></li>
	{/each}
</ul>
```

直到 promise resolve —— 如果它出错 —— 最近的 [`<svelte:boundary>`](../svelte/svelte-boundary) 将被调用。

虽然推荐使用 `await`，但作为替代，查询也有 `loading`、`error` 和 `current` 属性：

```svelte
<!--- file: src/routes/blog/+page.svelte --->
<script>
	import { getPosts } from './data.remote';

	const query = getPosts();
</script>

<h1>最新文章</h1>

{#if query.error}
	<p>哎呀！</p>
{:else if query.loading}
	<p>加载中...</p>
{:else}
	<ul>
		{#each query.current as { title, slug }}
			<li><a href="/blog/{slug}">{title}</a></li>
		{/each}
	</ul>
{/if}
```

> [!NOTE] 在本文档的其余部分，我们将使用 `await` 形式。

### 查询参数

查询函数可以接受一个参数，例如单个文章的 `slug`：

```svelte
<!--- file: src/routes/blog/[slug]/+page.svelte --->
<script>
	import { getPost } from '../data.remote';

	let { params } = $props();

	const post = $derived(await getPost(params.slug));
</script>

<h1>{post.title}</h1>
<div>{@html post.content}</div>
```

由于 `getPost` 暴露了一个 HTTP 端点，验证这个参数以确保它是正确的类型是很重要的。为此，我们可以使用任何 [Standard Schema](https://standardschema.dev/) 校验库，如 [Zod](https://zod.dev/) 或 [Valibot](https://valibot.dev/)：

```js
/// file: src/routes/blog/data.remote.js
// @filename: ambient.d.ts
declare module '#lib/server/database' {
	export function sql(strings: TemplateStringsArray, ...values: any[]): Promise<any[]>;
}
// @filename: index.js
// ---cut---
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { query } from '$app/server';
import * as db from '#lib/server/database';

export const getPosts = query(async () => { /* ... */ });

export const getPost = query(v.string(), async (slug) => {
	const [post] = await db.sql`
		SELECT * FROM post
		WHERE slug = ${slug}
	`;

	if (!post) error(404, '未找到');
	return post;
});
```

参数和返回值都使用 [devalue](https://github.com/sveltejs/devalue) 进行序列化，它除了 JSON 之外还处理像 `Date` 和 `Map`（以及在你[传输钩子](hooks#Universal-hooks-transport) 中定义的自定义类型）这样的类型。

> [!NOTE] 对于 `query` 和 `prerender` 的参数（但不是返回值），对象、映射和集合会被排序，以便具有相同成员的不同实例产生相同的缓存键。例如，`getPosts({ limit: 10, offset: 10 })` 和 `getPosts({ offset: 10, limit: 10 })` 将产生相同的缓存键。如果顺序对你很重要，你必须使用数组。

### 去重

当你调用一个查询函数时，SvelteKit 会序列化你调用它时使用的参数，并将其用作缓存键。在服务器上，这用于创建一个请求作用域的缓存，以便同一个查询的多次调用只会导致工作发生一次。在客户端，SvelteKit 做了类似的事情：同一个查询的多个相同调用都指向同一个实例。

你可以在任何上下文中 `await` 一个查询——组件、事件处理程序、通用 `load` 函数、异步回调——SvelteKit 会与使用相同查询的其他消费者一起去重。例如：

```svelte
<script>
	import { getData } from './data.remote.js';

  // 在组件模板内部 await —— 填充缓存
  const data = getData();
</script>

<p>{await data}</p>

<!-- 这与上面的组件级使用去重；没有额外的请求 -->
<button onclick={async () => console.log(await getData())}>
	点我！
</button>
```

只要查询处于活跃使用中——在组件中渲染、当前正在 await，或以其他方式被引用——缓存就是共享的。一旦没有任何东西在使用它，缓存的值就会被释放。

### 刷新查询

任何查询都可以通过它的 `refresh` 方法重新获取，该方法从服务器检索最新的值：

```svelte
<button onclick={() => getPosts().refresh()}>
	检查新文章
</button>
```

> [!NOTE] 查询在位于页面上期间会被缓存，这意味着 `getPosts() === getPosts()`。这意味着你不需要像 `const posts = getPosts()` 这样的引用来更新查询。

## query.batch

`query.batch` 的工作方式类似于 `query`，不同之处在于它会批处理发生在同一个宏任务内的请求。这解决了所谓的 n+1 问题：例如，与其每个查询都导致一次单独的数据库调用，同时发生的查询会被分组在一起。

在服务器上，回调接收一个由函数被调用时所用参数组成的数组。它必须返回形式为 `(input: Input, index: number) => Output` 的函数。然后 SvelteKit 会针对每个输入参数调用它，用其结果来解析各个调用。

```js
/// file: weather.remote.js
// @filename: ambient.d.ts
declare module '#lib/server/database' {
	export function sql(strings: TemplateStringsArray, ...values: any[]): Promise<any[]>;
}
// @filename: index.js
// ---cut---
import * as v from 'valibot';
import { query } from '$app/server';
import * as db from '#lib/server/database';

export const getWeather = query.batch(v.string(), async (cityIds) => {
	const weather = await db.sql`
		SELECT * FROM weather
		WHERE city_id = ANY(${cityIds})
	`;
	const lookup = new Map(weather.map(w => [w.city_id, w]));

	return (cityId) => lookup.get(cityId);
});
```

```svelte
<!--- file: Weather.svelte --->
<script>
	import CityWeather from './CityWeather.svelte';
	import { getWeather } from './weather.remote';

	let { cities } = $props();
	let limit = $state(5);
</script>

<h2>天气</h2>

{#each cities.slice(0, limit) as city}
	<h3>{city.name}</h3>
	<CityWeather weather={await getWeather(city.id)} />
{/each}

{#if cities.length > limit}
	<button onclick={() => limit += 5}>
		加载更多
	</button>
{/if}
```

## query.live

`query.live` 用于从服务器访问实时数据。它的行为类似于 `query`，但回调——通常是一个异步 [generator 函数](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function*)——返回的是一个 `AsyncIterable`：

```js
import { query } from '$app/server';

export const getTime = query.live(async function* () {
	while (true) {
		yield new Date();
		await new Promise((f) => setTimeout(f, 1000));
	}
});
```

在服务器端渲染期间，`await getTime()` 返回第一个 yield 的值，然后关闭迭代器。这个初始值被序列化并在 hydration 期间被复用。

在客户端，只要查询在组件中被活跃使用，它就会保持连接。多个实例共享一个连接。当没有活跃使用剩余时，流会断开连接，服务器端迭代也会停止。

实时查询暴露了一个 `connected` 属性和 `reconnect()` 方法：

```svelte
<script>
	import { getTime } from './time.remote.js';

	const time = getTime();
</script>

<p>{await time}</p>
<p>已连接：{time.connected}</p>
<button onclick={() => time.reconnect()}>重新连接</button>
```

如果连接断开，`connected` 变为 `false`。SvelteKit 会尝试被动地以指数退避方式重新连接，并在 `navigator.onLine` 从 `false` 变为 `true` 时主动重新连接。

与 `query` 不同，实时查询没有 `refresh()` 方法，因为它们是自更新的。

如果你需要直接、命令式地访问底层的值流（而不是响应式的 `current` 属性），实时查询实例本身是可[异步迭代的](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of)。你可以直接对实例进行 `for await` 遍历：

```js
// @filename: time.remote.ts
import { RemoteLiveQueryFunction } from '@sveltejs/kit';
export declare const getTime: RemoteLiveQueryFunction<undefined, Date>;
// @errors: 2304
// @filename: index.js
import { getTime } from './time.remote.js';
// ---cut---
async function logTimes() {
	for await (const value of getTime()) {
		console.log(value);
		if (someCondition) break;
	}
}
```

同一个实时查询的多个消费者（无论是响应式的——通过 `await` 或 `current`——还是命令式的 `for await` 循环）共享一个底层连接。对 `for await` 迭代器 yield 的第一个值，是最近接收到的值（如果已经有一个可用的值），这镜像了直接 await 该资源的语义。后续的值会在每当从服务器到达一个新值时触发。如果值到达的速度快于消费者排空迭代器的速度，则只保留最新挂起的值——实时流不是事件日志。

在服务器上，`for await` 同样会加入一个针对每个请求的底层生成器的共享迭代，因此同一请求内的并发消费者不会多次运行用户定义的生成器。

> [!NOTE] 你绝对不能将实时查询响应缓存在服务工作者中，因为克隆的响应会在页面关闭后很久仍继续流式传输。请确保你的缓存逻辑排除任何带有包含 `no-store` 的 `Cache-Control` 头的响应。

## form

`form` 函数让向服务器写入数据变得容易。它接收一个接收从提交的 [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) 构造出的 `data` 的回调……

```ts
/// file: src/routes/blog/data.remote.js
// @filename: ambient.d.ts
declare module '#lib/server/database' {
	export function sql(strings: TemplateStringsArray, ...values: any[]): Promise<any[]>;
}

declare module '#lib/server/auth' {
	interface User {
		name: string;
	}

	/**
	 * 使用 `getRequestEvent` 从用户的 cookie 中获取用户信息
	 */
	export function getUser(): Promise<User | null>;
}
// @filename: index.js
// ---cut---
import * as v from 'valibot';
import { error, redirect } from '@sveltejs/kit';
import { query, form } from '$app/server';
import * as db from '#lib/server/database';
import * as auth from '#lib/server/auth';

export const getPosts = query(async () => { /* ... */ });

export const getPost = query(v.string(), async (slug) => { /* ... */ });

export const createPost = form(
	v.object({
		title: v.pipe(v.string(), v.nonEmpty()),
		content:v.pipe(v.string(), v.nonEmpty())
	}),
	async ({ title, content }) => {
		// 检查用户是否已登录
		const user = await auth.getUser();
		if (!user) error(401, '未授权');

		const slug = title.toLowerCase().replace(/ /g, '-');

		// 插入数据库
		await db.sql`
			INSERT INTO post (slug, title, content)
			VALUES (${slug}, ${title}, ${content})
		`;

		// 重定向到新创建的页面
		redirect(303, `/blog/${slug}`);
	}
);
```

……并返回一个可以展开（spread）到 `<form>` 元素上的对象。每当表单被提交时就会调用该回调。

```svelte
<!--- file: src/routes/blog/new/+page.svelte --->
<script>
	import { createPost } from '../data.remote';
</script>

<h1>创建新文章</h1>

<form {...createPost}>
	<!-- 表单内容放在这里 -->

	<button>发布！</button>
</form>
```

该 form 对象包含 `method` 和 `action` 属性，使它能够在没有 JavaScript 的情况下工作（即它提交数据并重新加载页面）。它还有一个 [attachment](/docs/svelte/@attach)，当 JavaScript 可用时会对表单进行渐进增强，提交数据*而无需*重新加载整个页面。

与 `query` 一样，如果回调使用了提交的 `data`，则应该通过将一个 [Standard Schema](https://standardschema.dev) 作为第一个参数传给 `form` 来[进行校验](#query-Query-arguments)。

### 字段

一个表单由一组_字段_组成，这些字段由 schema 定义。在 `createPost` 的例子中，我们有两个字段，`title` 和 `content`，它们都是字符串。要获取一个字段的属性，调用它的 `.as(...)` 方法，指定要使用哪种 [input 类型](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input#input_types)。对于大多数输入类型，你还可以传入第二个参数——`.as(type, value)`——来控制渲染的值：

```svelte
<form {...createPost}>
	<label>
		<h2>标题</h2>
		+++<input {...createPost.fields.title.as('text')} />+++
	</label>

	<label>
		<h2>撰写你的文章</h2>
		+++<textarea {...createPost.fields.content.as('text')}></textarea>+++
	</label>

	<button>发布！</button>
</form>
```

这些属性让 SvelteKit 能够设置正确的输入类型、设置一个用于构造传给处理程序的 `data` 的 `name`、填充表单的 `value`（例如在提交失败后，以节省用户重新输入所有内容），并设置 [`aria-invalid`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid) 状态。

向 `.as(...)` 传入第二个参数在从现有数据渲染表单时很有用，例如编辑表单或使用 [`for(...)`](#form-Multiple-instances-of-a-form) 创建的多个实例。除了在元素渲染时设置其值外，它还控制着表单重置时元素的值。`radio`、`submit` 和 `hidden` 输入始终需要这个值，`checkbox` 输入在表示数组字段中的一个选项时也需要它。`file` 输入不能以这种方式填充。

> [!NOTE] 生成的 `name` 属性使用 JS 对象表示法（例如 `nested.array[0].value`）。需要引号的字符串键（如 `object['nested-array'][0].value`）不受支持。在底层，布尔型 checkbox 和数字字段名分别以 `b:` 和 `n:` 为前缀，以提示 SvelteKit 在校验前将值从字符串强制转换。

字段可以嵌套在对象和数组中，它们的值可以是字符串、数字、布尔值或 `File` 对象。例如，如果你的 schema 看起来像这样……

```js
/// file: data.remote.js
import * as v from 'valibot';
import { form } from '$app/server';
// ---cut---
const datingProfile = v.object({
	name: v.string(),
	photo: v.file(),
	info: v.object({
		height: v.number(),
		likesDogs: v.optional(v.boolean(), false)
	}),
	attributes: v.array(v.string())
});

export const createProfile = form(datingProfile, (data) => { /* ... */ });
```

……你的表单可以看起来像这样：

```svelte
<script>
	import { createProfile } from './data.remote';

	const { name, photo, info, attributes } = createProfile.fields;
</script>

<form {...createProfile} enctype="multipart/form-data">
	<label>
		<input {...name.as('text')} /> 姓名
	</label>

	<label>
		<input {...photo.as('file')} /> 照片
	</label>

	<label>
		<input {...info.height.as('number')} /> 身高（厘米）
	</label>

	<label>
		<input {...info.likesDogs.as('checkbox')} /> 我喜欢狗
	</label>

	<h2>我最好的特质</h2>
	<input {...attributes[0].as('text')} />
	<input {...attributes[1].as('text')} />
	<input {...attributes[2].as('text')} />

	<button>提交</button>
</form>
```

因为我们的表单包含一个 `file` 输入，我们添加了 `enctype="multipart/form-data"` 属性。`info.height` 和 `info.likesDogs` 的值分别被强制转换为数字和布尔值。

> [!NOTE] 如果一个 `checkbox` 输入未被勾选，它的值不会包含在高亮 SvelteKit 从中构造数据的 [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) 对象中。因此，我们必须在 schema 中将该值设为可选。在 Valibot 中，这意味着使用 `v.optional(v.boolean(), false)` 而不是仅用 `v.boolean()`；而在 Zod 中，则意味着使用 `z.coerce.boolean<boolean>()`。

在属于同一个字段的 `radio` 和 `checkbox` 输入的情况下，`value` 必须作为 `.as(...)` 的第二个参数指定：

```js
/// file: constants.js
export const operatingSystems = /** @type {const} */ (['windows', 'mac', 'linux']);
export const languages = /** @type {const} */ (['html', 'css', 'js']);
```

```js
/// file: data.remote.js
// @filename: constants.js
export const operatingSystems = /** @type {const} */ (['windows', 'mac', 'linux']);
export const languages = /** @type {const} */ (['html', 'css', 'js']);
// @filename: index.js
import * as v from 'valibot';
import { form } from '$app/server';
// ---cut---
import { operatingSystems, languages } from './constants';

export const survey = form(
	v.object({
		operatingSystem: v.picklist(operatingSystems),
		languages: v.optional(v.array(v.picklist(languages)), []),
	}),
	(data) => { /* ... */ },
);
```

```svelte
<form {...survey}>
	<h2>你使用哪个操作系统？</h2>

	{#each operatingSystems as os}
		<label>
			<input {...survey.fields.operatingSystem.as('radio', os)}>
			{os}
		</label>
	{/each}

	<h2>你编写代码使用哪些语言？</h2>

	{#each languages as language}
		<label>
			<input {...survey.fields.languages.as('checkbox', language)}>
			{language}
		</label>
	{/each}

	<button>提交</button>
</form>
```

或者，你可以使用 `select` 和 `select multiple`：

```svelte
<form {...survey}>
	<h2>你使用哪个操作系统？</h2>

	<select {...survey.fields.operatingSystem.as('select')}>
		{#each operatingSystems as os}
			<option>{os}</option>
		{/each}
	</select>

	<h2>你编写代码使用哪些语言？</h2>

	<select {...survey.fields.languages.as('select multiple')}>
		{#each languages as language}
			<option>{language}</option>
		{/each}
	</select>

	<button>提交</button>
</form>
```

> [!NOTE] 与未勾选的 `checkbox` 输入一样，如果没有做出任何选择，那么数据将是 `undefined`。因此，`languages` 字段使用 `v.optional(v.array(...), [])` 而不是仅用 `v.array(...)`。

### 程序化校验

除了声明式 schema 校验，你还可以使用来自 `@sveltejs/kit` 的 `invalid` 辅助函数，在表单处理程序内部以编程方式将字段标记为无效。这对于在你尝试执行某些操作之前无法知道某些内容是否有效的情况很有用。

- 它就像 `redirect` 或 `error` 一样抛出
- 它接受多个参数，这些参数可以是字符串（用于与整个表单相关的问题——这些只会出现在 `fields.allIssues()` 中），或者是符合标准 schema 的问题（用于与特定字段相关的）。使用 `issue` 参数以类型安全的方式创建这样的问题：

```js
// @errors: 18046
/// file: src/routes/shop/data.remote.js
// @filename: ambient.d.ts
declare module '#lib/server/database' {
	export function buy(qty: number): Promise<void>
}
// @filename: index.js
// ---cut---
import * as v from 'valibot';
import { invalid } from '@sveltejs/kit';
import { form } from '$app/server';
import * as db from '#lib/server/database';

export const buyHotcakes = form(
	v.object({
		qty: v.pipe(
			v.number(),
			v.minValue(1, '你至少要买一个煎饼')
		)
	}),
	async (data, issue) => {
		try {
			await db.buy(data.qty);
		} catch (e) {
			if (e.code === 'OUT_OF_STOCK') {
				invalid(
					issue.qty(`我们没有足够的煎饼了`)
				);
			}
		}
	}
);
```

### 校验

如果提交的数据没有通过 schema，回调将不会运行。相反，每个无效字段的 `issues()` 方法将返回一个 `{ message: string }` 对象数组，`aria-invalid` 属性（从 `as(...)` 返回）将被设为 `true`：

```svelte
<form {...createPost}>
	<label>
		<h2>标题</h2>

+++		{#each createPost.fields.title.issues() as issue}
			<p class="issue">{issue.message}</p>
		{/each}+++

		<input {...createPost.fields.title.as('text')} />
	</label>

	<label>
		<h2>撰写你的文章</h2>

+++		{#each createPost.fields.content.issues() as issue}
			<p class="issue">{issue.message}</p>
		{/each}+++

		<textarea {...createPost.fields.content.as('text')}></textarea>
	</label>

	<button>发布！</button>
</form>
```

如果 `title` 有效，或尚未被校验，`createPost.fields.title.issues()` 将返回 `undefined`。

你不需要等到表单提交才校验数据——你可以以编程方式调用 `validate()`，例如在 `oninput` 回调（这将在每次按键时校验数据）或 `onchange` 回调中：

```svelte
<form {...createPost} oninput={() => createPost.validate()}>
	<!-- -->
</form>
```

默认情况下，如果问题属于尚未交互过的表单控件，它们将被忽略。要校验_所有_输入，请调用 `validate({ includeUntouched: true })`。

对于客户端校验，你可以指定一个_预检_（preflight）schema，如果数据未通过校验，它将填充 `issues()` 并阻止数据被发送到服务器：

```svelte
<script>
	import * as v from 'valibot';
	import { createPost } from '../data.remote';

	const schema = v.object({
		title: v.pipe(v.string(), v.nonEmpty()),
		content: v.pipe(v.string(), v.nonEmpty())
	});
</script>

<h1>创建新文章</h1>

<form {...+++createPost.preflight(schema)+++}>
	<!-- -->
</form>
```

> [!NOTE] 如果合适，预检 schema 可以与你的服务器端 schema 是同一个对象，尽管它无法做像 “这个值已存在于数据库中” 这样的服务器端检查。请注意，你不能从 `.remote.ts` 或 `.remote.js` 文件导出 schema，所以 schema 必须要么从一个共享模块导出，要么从包含 `<form>` 的组件中的 `<script module>` 块导出。

要获取_所有_问题的列表，而不仅仅属于单个字段的问题，你可以使用 `fields.allIssues()` 方法：

```svelte
{#each createPost.fields.allIssues() as issue}
	<p>{issue.message}</p>
{/each}
```

与单个字段一样，如果表单整体有效（或尚未被校验），`createPost.fields.allIssues()` 将返回 `undefined`。

### 获取/设置输入

每个字段都有一个 `value()` 方法，反映其当前值。随着用户与表单交互，它会自动更新：

```svelte
<form {...createPost}>
	<!-- -->
</form>

<div class="preview">
	<h2>{createPost.fields.title.value()}</h2>
	<div>{@html render(createPost.fields.content.value())}</div>
</div>
```

或者，`createPost.fields.value()` 会返回一个 `{ title, content }` 对象。

一个字段的 `value()` 在它被编辑或提交之前，_不会_反映作为 `as` 的第二个参数提供的默认值（如 `fields.title.as('text', '...')`）。你可以通过 `set(...)` 方法以编程方式更新一个字段（或一组字段）：

```svelte
<script>
	import { createPost } from '../data.remote';

	// 这个……
	createPost.fields.set({
		title: '我的新博客文章',
		content: 'Lorem ipsum dolor sit amet...'
	});

	// ……等价于这个：
	createPost.fields.title.set('我的新博客文章');
	createPost.fields.content.set('Lorem ipsum dolor sit amet');
</script>
```

### 处理敏感数据

在非渐进增强的表单提交情况下（即由于某种原因 JavaScript 不可用），如果提交的数据无效，`value()` 也会被填充，这样用户就不需要从头填写整个表单。

你可以通过使用带有前导下划线的名称，来防止敏感数据（如密码和信用卡号）被发送回用户：

```svelte
<form {...register}>
	<label>
		用户名
		<input {...register.fields.username.as('text')} />
	</label>

	<label>
		密码
		<input +++{...register.fields._password.as('password')}+++ />
	</label>

	<button>注册！</button>
</form>
```

在这个例子中，如果数据未通过校验，页面重新加载时只会填充第一个 `<input>`。

### 返回值与重定向

上面的例子使用了 [`redirect(...)`](@sveltejs-kit#redirect)，它将用户发送到新创建的页面。或者，回调可以返回数据，在这种情况下，它将作为 `createPost.result` 可用：

```ts
/// file: src/routes/blog/data.remote.js
// @filename: ambient.d.ts
declare module '#lib/server/database' {
	export function sql(strings: TemplateStringsArray, ...values: any[]): Promise<any[]>;
}

declare module '#lib/server/auth' {
	interface User {
		name: string;
	}

	/**
	 * 使用 `getRequestEvent` 从用户的 cookie 中获取用户信息
	 */
	export function getUser(): Promise<User | null>;
}
// @filename: index.js
import * as v from 'valibot';
import { error, redirect } from '@sveltejs/kit';
import { query, form } from '$app/server';
import * as db from '#lib/server/database';
import * as auth from '#lib/server/auth';

export const getPosts = query(async () => { /* ... */ });

export const getPost = query(v.string(), async (slug) => { /* ... */ });

// ---cut---
export const createPost = form(
	v.object({/* ... */}),
	async (data) => {
		// ...

		return { success: true };
	}
);
```

```svelte
<!--- file: src/routes/blog/new/+page.svelte --->
<script>
	import { createPost } from '../data.remote';
</script>

<h1>创建新文章</h1>

<form {...createPost}>
	<!-- -->
</form>

{#if createPost.result?.success}
	<p>发布成功！</p>
{/if}
```

这个值是_临时的_——如果你重新提交、导航离开或重新加载页面，它会消失。

> [!NOTE] `result` 值不一定表示成功——它也可以包含校验错误，以及任何应该在页面重新加载时重新填充表单的数据。

如果在提交期间发生错误，将渲染最近的 `+error.svelte` 页面。

### enhance

我们可以用 `enhance` 方法自定义表单提交时发生的事情：

```svelte
<!--- file: src/routes/blog/new/+page.svelte --->
<script>
	import { createPost } from '../data.remote';
	import { showToast } from '#lib/toast';
</script>

<h1>创建新文章</h1>

<form {...createPost.enhance(async (form) => {
	try {
		if (await form.submit()) {
			form.element.reset();

			showToast('发布成功！');
		} else {
			showToast('数据无效！');
		}
	} catch (error) {
		showToast('糟糕！出了点问题');
	}
})}>
	<!-- -->
</form>
```

> [!NOTE] 使用 `enhance` 时，`<form>` 不会自动重置——如果你想清除输入，必须调用 `form.element.reset()`。

回调接收一个表单实例的副本。它具有所有相同的属性和方法，除了 `enhance`；并且 `form.submit()` 直接执行提交，而不会重新运行 enhance 回调。在回调内部，`form.element` 始终是有定义的。

### 一个表单的多个实例

有些表单可能会作为列表的一部分重复出现。在这种情况下，你可以通过 `for(id)` 创建表单函数的独立实例以实现隔离。

当每个实例应该渲染不同的值时，将它们作为 `.as(...)` 的第二个参数传入：

```svelte
<!--- file: src/routes/todos/+page.svelte --->
<script>
	import { getTodos, modifyTodo } from '../data.remote';
</script>

<h1>待办事项</h1>

{#each await getTodos() as todo}
	{@const modify = modifyTodo.for(todo.id)}
	<form {...modify}>
		<input {...modify.fields.description.as('text', todo.description)} />
		<button disabled={!!modify.pending}>保存更改</button>
	</form>
{/each}
```

### 多个提交按钮

一个 `<form>` 可能拥有多个提交按钮。例如，你可能有一个单独的表单，根据你点击的按钮来让你登录或注册。

要完成这个，向你的 schema 添加一个用于按钮值的字段，并使用 `as('submit', value)` 来绑定它：

```svelte
<!--- file: src/routes/login/+page.svelte --->
<script>
	import { loginOrRegister } from '#lib/auth';
</script>

<form {...loginOrRegister}>
	<label>
		你的用户名
		<input {...loginOrRegister.fields.username.as('text')} />
	</label>

	<label>
		你的密码
		<input {...loginOrRegister.fields._password.as('password')} />
	</label>

	<button {...loginOrRegister.fields.action.as('submit', 'login')}>登录</button>
	<button {...loginOrRegister.fields.action.as('submit', 'register')}>注册</button>
</form>
```

在你的表单处理程序中，你可以检查点击了哪个按钮：

```js
/// file: #lib/auth.js
import * as v from 'valibot';
import { form } from '$app/server';

export const loginOrRegister = form(
	v.object({
		username: v.string(),
		_password: v.string(),
		action: v.picklist(['login', 'register'])
	}),
	async ({ username, _password, action }) => {
		if (action === 'login') {
			// 处理登录
		} else {
			// 处理注册
		}
	}
);
```

## command

`command` 函数，与 `form` 一样，允许你向服务器写入数据。与 `form` 不同的是，它不特定于某个元素，可以从任何地方调用。

> [!NOTE] 尽可能优先使用 `form`，因为如果 JavaScript 被禁用或加载失败，它能优雅降级。

与 `query` 和 `form` 一样，如果函数接受一个参数，它应该通过将一个 [Standard Schema](https://standardschema.dev) 作为第一个参数传给 `command` 来[进行校验](#query-Query-arguments)。

```ts
/// file: likes.remote.js
// @filename: ambient.d.ts
declare module '#lib/server/database' {
	export function sql(strings: TemplateStringsArray, ...values: any[]): Promise<any[]>;
}
// @filename: index.js
// ---cut---
import * as v from 'valibot';
import { query, command } from '$app/server';
import * as db from '#lib/server/database';

export const getLikes = query(v.string(), async (id) => {
	const [row] = await db.sql`
		SELECT likes
		FROM item
		WHERE id = ${id}
	`;

	return row.likes;
});

export const addLike = command(v.string(), async (id) => {
	await db.sql`
		UPDATE item
		SET likes = likes + 1
		WHERE id = ${id}
	`;
});
```

现在只需调用 `addLike`，例如从事件处理程序中：

```svelte
<!--- file: +page.svelte --->
<script>
	import { getLikes, addLike } from './likes.remote';
	import { showToast } from '#lib/toast';

	let { item } = $props();
</script>

<button
	onclick={async () => {
		try {
			await addLike(item.id);
		} catch (error) {
			showToast('出了点问题！');
		}
	}}
>
	点赞
</button>

<p>点赞数：{await getLikes(item.id)}</p>
```

> [!NOTE] 命令不能在渲染期间调用。

## 单程变更

[`form`](#form) 和 [`command`](#command) 两者的目的都是*变更数据*。在许多情况下，变更数据会使其他数据失效。默认情况下，`form` 通过在一次成功提交后自动使所有查询和 load 函数失效来处理这个问题，以模拟传统整页重新加载会发生的情况。而 `command` 则什么都不做。通常，这两个选项都不是理想的解决方案——使所有内容失效可能很浪费，因为一次表单提交不太可能改变你网页上显示的*所有*内容。在 `command` 的情况下，什么都不做可能会导致你的应用_失效不足_，留下陈旧的数据显示。在这两种情况下，通常需要进行两次到服务器的往返：一次运行变更，另一次在变更完成后，从你需要刷新的任何查询重新请求数据。

SvelteKit 通过*单程变更（single-flight mutations）* 解决了这两个问题：你的 `form` 提交或 `command` 调用可以在单个请求中刷新查询并将它们的结果传回客户端。

### 服务器驱动的刷新

在大多数情况下，服务器处理程序知道需要基于其参数更新哪些客户端数据：

```js
import * as v from 'valibot';
import { error, redirect } from '@sveltejs/kit';
import { query, form } from '$app/server';
const slug = '';
const post = { id: '' };
/** @type {any} */
const externalApi = '';
// ---cut---
export const getPosts = query(async () => { /* ... */ });

export const getPost = query(v.string(), async (slug) => { /* ... */ });

export const createPost = form(
	v.object({/* ... */}),
	async (data) => {
		// 表单逻辑放在这里……

		// 在服务器上刷新 `getPosts()`，并将数据随
		// `createPost` 的结果一起发回。
		// 丢弃来自 `refresh` 的 promise 是安全的，
		// 因为框架会在我们服务响应之前为我们 await 它
		+++void getPosts().refresh();+++

		// 重定向到新创建的页面
		redirect(303, `/blog/${slug}`);
	}
);

export const updatePost = form(
	v.object({ id: v.string() }),
	async (post) => {
		// 表单逻辑放在这里……
		const result = externalApi.update(post);

		// API 已经给了我们更新后的文章，
		// 无需刷新，我们可以直接设置它
		+++getPost(post.id).set(result);+++
	}
);
```

因为查询是基于它们的参数来键控的，服务器上的 `getPost(post.id).set(result)` 知道去查找客户端上匹配的 `getPost(id)` 来更新它。`getPosts().refresh()` 也是如此——它知道去查找客户端上不带参数的 `getPosts()`。

### 在变更中重连实时查询

单程变更也可以重连 `query.live` 实例。在 `form`/`command` 处理程序中，对你想要重连的实时查询资源调用 `.reconnect()`：

```js
import * as v from 'valibot';
import { form, query } from '$app/server';

export const getNotifications = query.live(v.string(), async function* (userId) {
	while (true) {
		yield await db.notifications(userId);
		await wait(1000);
	}
});

export const markAllRead = form(v.object({ userId: v.string() }), async ({ userId }) => {
	// 变更逻辑……
	+++getNotifications(userId).reconnect();+++
});
```

这会为匹配的活跃客户端实例安排一次重连，并将其作为变更响应的一部分应用（即与表单/命令结果在同一个航程中）。例如，如果命令修改了实时查询需要重启才能捕获的 cookie，你可能就需要这个。

### 客户端请求的刷新

不幸的是，生活并不总是像前面的例子那样简单。服务器总是知道要更新哪些查询_函数_，但它可能不知道要更新哪些特定的查询_实例_。例如，如果 `getPosts({ filter: 'author:santa' })` 在客户端渲染，在服务器处理程序中调用 `getPosts().refresh()` 不会更新它。你需要改为调用 `getPosts({ filter: 'author:santa' }).refresh()` ——但是你怎么能知道当前在客户端渲染了哪些具体的过滤器组合，尤其是如果你的查询参数比只有一个键的对象更复杂时？

SvelteKit 通过允许客户端_请求_服务器使用 `submit().updates`（对于 `form`）或 `myCommand().updates`（对于 `command`）来更新特定数据，使这变得容易：

```ts
import type { RemoteQueryUpdate, RemoteQuery } from '@sveltejs/kit';
interface Post {}
declare function submit(): Promise<any> & {
	updates(...updates: RemoteQueryUpdate[]): Promise<any>;
}

declare function getPosts(args: { filter: string }): RemoteQuery<Post[]>;
declare const newPost: Post;
// ---cut---
await submit().updates(
	// 请求 getPosts 的所有活跃实例
	getPosts,
	// 请求一个特定实例
	getPosts({ filter: 'author:santa' }),
	// 请求一个带有乐观覆盖的特定实例
	getPosts({ filter: 'author:santa' }).withOverride((posts) => [newPost, ...posts])
);
```

仅仅是向客户端请求更新是不够的——你还需要从服务器接受它们：

```js
import * as v from 'valibot';
import { error, redirect } from '@sveltejs/kit';
const slug = '';
const post = { id: '' };
/** @type {any} */
const externalApi = '';
// ---cut---
import { query, form, requested } from '$app/server';

export const getPosts = query(v.object({ filter: v.string() }), async ({ filter }) => { /* ... */ });

export const createPost = form(
	v.object({/* ... */}),
	async (data) => {
		// 表单逻辑放在这里……

		+++for (const { query } of requested(getPosts, 1)) {+++
		+++	void query.refresh();+++
		+++}+++

		// 重定向到新创建的页面
		redirect(303, `/blog/${slug}`);
	}
);
```

`requested` 让你访问客户端请求刷新的查询。每个条目都是一个 `{ arg, query }` 对象：`arg` 是查询的实现函数接收到的值——即 schema 校验后（并在适用时转换后）的参数——而 `query` 是一个已经绑定到客户端原始缓存键的 `RemoteQuery`，因此调用 `query.refresh()` / `query.set(...)` 会更新正确的客户端实例。如果解析参数失败，那个查询会出错，但整个命令不会失败。`requested` 的第二个参数 `limit` 是它将返回的最大条目数。超过此限制的刷新请求都将失败。

> [!NOTE] `limit` 是必需的，因为刷新请求列表由客户端控制——每个条目都会使服务器校验一个参数并通常会重新获取数据，所以一个无限制的列表是一个拒绝服务风险。选择一个反映你愿意为每个请求处理的最坏情况的限制。如果你已明确决定接受任意数量的刷新，你_可以_传入 `Infinity`，但不推荐这样做。

此外，当你想要做的只是刷新请求的查询实例时，`requested` 允许一个简单的简写：

```ts
import type { RemoteQueryFunction } from '@sveltejs/kit';
import { requested } from '$app/server';
declare const getPosts: RemoteQueryFunction<any, any>;
// ---cut---
// 这与遍历结果并调用 `void query.refresh()` 是相同的。
await requested(getPosts, 1).refreshAll();
```

> [!NOTE] 为什么命令必须具名它愿意刷新的每个查询？两个原因：
>
> - **包体积。** 如果一个命令可以隐式刷新你的应用中的*任何*查询，SvelteKit 就必须在命令的服务器包中包含每个查询的代码，因为它无法提前知道哪些会被调用。
> - **拒绝服务。** 任何恶意用户都可以检查他们的网络标签页，发现你的应用使用了哪些查询，然后 POST 一个带有客户端提供的数千次刷新列表的命令。唯一的防御办法是让服务器处理程序声明它愿意刷新哪些查询——以及刷新的数量（因此需要 `limit`）。

## prerender

`prerender` 函数类似于 `query`，不同之处在于它会在构建时被调用来预渲染结果。将此用于每次重新部署最多改变一次的数据。

```js
/// file: src/routes/blog/data.remote.js
// @filename: ambient.d.ts
declare module '#lib/server/database' {
	export function sql(strings: TemplateStringsArray, ...values: any[]): Promise<any[]>;
}
// @filename: index.js
// ---cut---
import { prerender } from '$app/server';
import * as db from '#lib/server/database';

export const getPosts = prerender(async () => {
	const posts = await db.sql`
		SELECT title, slug
		FROM post
		ORDER BY published_at
		DESC
	`;

	return posts;
});
```

你可以在其他情况下为动态的页面上使用 `prerender` 函数，从而允许对你的数据进行部分预渲染。这会实现非常快的导航，因为预渲染的数据可以与你的其他静态资源一起存放在 CDN 上。

在浏览器中，预渲染的数据使用 [`Cache`](https://developer.mozilla.org/en-US/docs/Web/API/Cache) API 保存。这个缓存在页面重新加载后仍然存在，并且会在用户首次访问你应用的新部署时被清除。

### 预渲染参数

与查询一样，预渲染函数可以接受一个参数，应该用 [Standard Schema](https://standardschema.dev/) 来[校验](#query-Query-arguments)：

```js
/// file: src/routes/blog/data.remote.js
// @filename: ambient.d.ts
declare module '#lib/server/database' {
	export function sql(strings: TemplateStringsArray, ...values: any[]): Promise<any[]>;
}
// @filename: index.js
// ---cut---
import * as v from 'valibot';
import { error } from '@sveltejs/kit';
import { prerender } from '$app/server';
import * as db from '#lib/server/database';

export const getPosts = prerender(async () => { /* ... */ });

export const getPost = prerender(v.string(), async (slug) => {
	const [post] = await db.sql`
		SELECT * FROM post
		WHERE slug = ${slug}
	`;

	if (!post) error(404, '未找到');
	return post;
});
```

SvelteKit 的爬虫在[预渲染页面](page-options#prerender) 时发现的任何对 `getPost(...)` 的调用都会被自动保存，但你也可以使用 `inputs` 选项指定它应该被调用哪些值：

```js
/// file: src/routes/blog/data.remote.js
import * as v from 'valibot';
import { prerender } from '$app/server';
// ---cut---

export const getPost = prerender(
	v.string(),
	async (slug) => { /* ... */ },
	{
		inputs: () => [
			'first-post',
			'second-post',
			'third-post'
		]
	}
);
```

默认情况下，预渲染函数会从你的服务器包中排除，这意味着你不能用任何_未被_预渲染的参数来调用它们。你可以设置 `dynamic: true` 来更改此行为：

```js
/// file: src/routes/blog/data.remote.js
import * as v from 'valibot';
import { prerender } from '$app/server';
// ---cut---

export const getPost = prerender(
	v.string(),
	async (slug) => { /* ... */ },
	{
		+++dynamic: true+++,
		inputs: () => [
			'first-post',
			'second-post',
			'third-post'
		]
	}
);
```

## 处理校验错误

只要_你_没有将无效数据传给你的远程函数，传递给 `command`、`query` 或 `prerender` 函数的参数未能通过校验的原因只有两个：

- 函数签名在两次部署之间发生了变化，而一些用户当前正在使用你应用的旧版本
- 有人试图用糟糕的数据戳你的公开端点来攻击你的站点

在第二种情况下，我们不想给攻击者任何帮助，所以 SvelteKit 会生成一个通用的 [400 Bad Request](https://http.dog/400) 响应。你可以通过实现 [`handleValidationError`](hooks#Server-hooks-handleValidationError) 服务器钩子来控制该消息，它与 [`handleError`](hooks#Shared-hooks-handleError) 一样，必须返回一个 [`App.Error`](errors#Type-safety)（默认为 `{ message: string }`）：

```js
/// file: src/hooks.server.js
/** @type {import('@sveltejs/kit').HandleValidationError} */
export function handleValidationError({ event, issues }) {
	return {
		message: '想得美，黑客！'
	};
}
```

如果你知道自己在做什么并想退出校验，你可以传入字符串 `'unchecked'` 来代替 schema：

```ts
/// file: data.remote.ts
import { query } from '$app/server';

export const getStuff = query('unchecked', async ({ id }: { id: string }) => {
	// 形状可能实际上并不像 TypeScript 认为的那样，
	// 因为恶意行为者可能用其他参数调用这个函数
});
```

## 使用 `getRequestEvent`

在 `query`、`form` 和 `command` 内部，你可以使用 [`getRequestEvent`]($app-server#getRequestEvent) 来获取当前的 [`RequestEvent`](@sveltejs-kit#RequestEvent) 对象。这使得构建用于与 cookie 交互的抽象变得容易，例如：

```ts
/// file: user.remote.js
// @filename: ambient.d.ts
interface User {
	name: string;
	avatar: string;
}

declare module '#lib/server/database' {
	export function findUser(sessionId: string | undefined): Promise<User | null>;
}

// @filename: index.js
// ---cut---
import { getRequestEvent, query } from '$app/server';
import { findUser } from '#lib/server/database';

export const getProfile = query(async () => {
	const user = await getUser();

	return user && {
		name: user.name,
		avatar: user.avatar
	};
});

// 这个查询可以从多个地方调用，但
// 函数每个请求只会运行一次
const getUser = query(async () => {
	const { cookies } = getRequestEvent();

	return await findUser(cookies.get('session_id'));
});
```

请注意，`RequestEvent` 的某些属性在远程函数内部是不同的：

- 你无法设置头（除了写入 cookie，而且仅能在 `form` 和 `command` 函数内部）
- `route`、`params` 和 `url` 与调用远程函数的页面相关，_而不是_ SvelteKit 为远程函数创建的端点的 URL。绝不要用它们来确定用户是否被授权访问某些数据，因为这些值是请求的一部分，可能被操纵。当用户导航时，查询也不会重新运行（除非导航导致查询的参数发生变化），所以你应当注意如何使用这些值。

## 重定向

在 `query`、`form` 和 `prerender` 函数内部可以使用 [`redirect(...)`](@sveltejs-kit#redirect) 函数。在 `command` 函数内部则*不*可以，因为你应该避免在这里重定向。（如果你确实必须，可以返回一个 `{ redirect: location }` 对象并在客户端处理它。）
