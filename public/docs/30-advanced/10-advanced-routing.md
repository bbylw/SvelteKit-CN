---
title: 进阶路由
---

## Rest 参数

如果路由片段的数量未知，你可以使用 rest 语法 —— 例如你可能会像下面这样实现 GitHub 的文件查看器……

```sh
/[org]/[repo]/tree/[branch]/[...file]
```

……在这种情况下，对 `/sveltejs/kit/tree/main/documentation/docs/04-advanced-routing.md` 的请求将会使页面获得以下参数：

```js
// @noErrors
{
	org: 'sveltejs',
	repo: 'kit',
	branch: 'main',
	file: 'documentation/docs/04-advanced-routing.md'
}
```

> [!NOTE] `src/routes/a/[...rest]/z/+page.svelte` 会匹配 `/a/z`（即完全没有参数），也会匹配 `/a/b/z`、`/a/b/c/z` 等等。请确保检查 rest 参数的值是否有效，例如使用[匹配器](#Matching)。

### 404 页面

Rest 参数还允许你渲染自定义的 404 页面。给定以下路由……

```tree
src/routes/
├ marx-brothers/
│ ├ chico/
│ ├ harpo/
│ ├ groucho/
│ └ +error.svelte
└ +error.svelte
```

……如果你访问 `/marx-brothers/karl`，`marx-brothers/+error.svelte` 文件将*不会*被渲染，因为没有匹配到任何路由。如果你想渲染嵌套的错误页面，应该创建一个匹配任何 `/marx-brothers/*` 请求的路由，并从中返回 404：

```tree
src/routes/
├ marx-brothers/
+++| ├ [...path]/+++
│ ├ chico/
│ ├ harpo/
│ ├ groucho/
│ └ +error.svelte
└ +error.svelte
```

```js
/// file: src/routes/marx-brothers/[...path]/+page.js
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export function load(event) {
	error(404, 'Not Found');
}
```

> [!NOTE] 如果你不处理 404 的情况，它们会出现在 [`handleError`](hooks#Shared-hooks-handleError) 中。

## 可选参数

像 `[lang]/home` 这样的路由包含一个名为 `lang` 的必需参数。有时让这些参数变为可选是有益的，这样在本例中 `home` 和 `en/home` 都会指向同一个页面。你可以通过再包裹一层括号来实现：`[[lang]]/home`

请注意，可选路由参数不能跟在 rest 参数之后（`[...rest]/[[optional]]`），因为参数是「贪婪」匹配的，可选参数将永远不会被使用。

## 匹配

像 `src/routes/fruits/[page]` 这样的路由会匹配 `/fruits/apple`，但它也会匹配 `/fruits/rocketship`。我们不希望这样。你可以通过在 `src/params.js` 文件（或 `src/params.ts`）中添加*匹配器*，来确保路由参数格式正确……

```js
/// file: src/params.js
import { defineParams } from '@sveltejs/kit';

export const params = defineParams({
	fruit: (param) => {
		if (param !== 'apple' && param !== 'orange') return;
		return param;
	}
});
```

……并增强你的路由：

```
src/routes/fruits/[page+++=fruit+++]
```

如果路径名不匹配，SvelteKit 会尝试匹配其他路由（使用下文所述的排序顺序），最终返回 404。如果匹配成功，返回的值会作为参数值传入。

你也可以使用 [Standard Schema](https://standardschema.dev) —— 例如配合 [Valibot](https://valibot.dev)：

```js
/// file: src/params.js
import { defineParams } from '@sveltejs/kit';
import * as v from 'valibot';

export const params = defineParams({
	number: v.pipe(v.string(), v.toNumber())
});
```

如果验证失败，路由不匹配。如果成功，参数会被赋予 schema 的输出类型，该类型必须是 `string`、`boolean`、`number`（如上例所示）或 `bigint` 的扩展：

```js
/// file: src/routes/items/[id=number]/+page.js
/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	console.log(typeof params.id); // 'number'
}
```

转换应当是*对称的* —— 如果转换为一个数字，那么对该数字调用 `toString()` 应该返回原始字符串。这使得 [`resolve`]($app-paths#resolve) 函数能够正确地构造路径名：

```js
import { resolve } from '$app/paths';

resolve('/blog/[id=number]', { id: 1 });
```

> [!NOTE] 匹配器会同时在服务器和浏览器中运行。

> [!NOTE] 在 SvelteKit 3 之前，你必须将每个参数匹配器定义在单独的文件中，全部列在 `params` 文件夹下（例如 `src/params/foo.js`，内容为 `export const match = (param) => param === 'foo';`），是否匹配取决于匹配器是否返回真值（这意味着不会发生值转换）。

## 排序

多个路由有可能匹配到同一个给定路径。例如以下每个路由都会匹配 `/foo-abc`：

```sh
src/routes/[...catchall]/+page.svelte
src/routes/[[a=x]]/+page.svelte
src/routes/[b]/+page.svelte
src/routes/foo-[c]/+page.svelte
src/routes/foo-abc/+page.svelte
```

SvelteKit 需要知道请求的是哪个路由。为此，它会根据以下规则对路由进行排序……

- 更具体的路由具有更高优先级（例如没有参数的路由比有一个动态参数的路由更具体，以此类推）
- 带[匹配器](#Matching)的参数（`[name=type]`）比不带的（`[name]`）具有更高优先级
- `[[optional]]` 和 `[...rest]` 参数会被忽略，除非它们是路由的最后一部分，这种情况下它们会被视为最低优先级。换句话说，就排序而言，`x/[[y]]/z` 等同于 `x/z`
- 平局按字母顺序解决

……最终产生这样的排序，意味着 `/foo-abc` 会调用 `src/routes/foo-abc/+page.svelte`，而 `/foo-def` 会调用 `src/routes/foo-[c]/+page.svelte` 而不是不那么具体的路由：

```sh
src/routes/foo-abc/+page.svelte
src/routes/foo-[c]/+page.svelte
src/routes/[[a=x]]/+page.svelte
src/routes/[b]/+page.svelte
src/routes/[...catchall]/+page.svelte
```

## 编码

某些字符不能在文件系统中使用 —— Linux 和 Mac 上的 `/`，以及 Windows 上的 `\ / : * ? " < > |`。`#` 和 `%` 字符在 URL 中有特殊含义，而 `[ ] ( )` 字符对 SvelteKit 有特殊含义，因此这些字符也不能直接用作路由的一部分。

要在路由中使用这些字符，你可以使用十六进制转义序列，其格式为 `[x+nn]`，其中 `nn` 是十六进制字符编码：

- `\` — `[x+5c]`
- `/` — `[x+2f]`
- `:` — `[x+3a]`
- `*` — `[x+2a]`
- `?` — `[x+3f]`
- `"` — `[x+22]`
- `<` — `[x+3c]`
- `>` — `[x+3e]`
- `|` — `[x+7c]`
- `#` — `[x+23]`
- `%` — `[x+25]`
- `[` — `[x+5b]`
- `]` — `[x+5d]`
- `(` — `[x+28]`
- `)` — `[x+29]`

例如，要创建一个 `/smileys/:-)` 路由，你需要创建一个 `src/routes/smileys/[x+3a]-[x+29]/+page.svelte` 文件。

你可以用 JavaScript 确定某个字符的十六进制编码：

```js
':'.charCodeAt(0).toString(16); // '3a', hence '[x+3a]'
```

你也可以使用 Unicode 转义序列。通常你不需要这样做，因为你可以直接使用未编码的字符，但如果 —— 出于某种原因 —— 你无法在文件名中使用比如 emoji，那么你可以使用转义字符。换句话说，以下两者是等价的：

```
src/routes/[u+d83e][u+dd2a]/+page.svelte
src/routes/🤪/+page.svelte
```

Unicode 转义序列的格式为 `[u+nnnn]`，其中 `nnnn` 是介于 `0000` 和 `10ffff` 之间的有效值。（与 JavaScript 字符串转义不同，无需使用代理对来表示 `ffff` 以上的码点。）要了解更多关于 Unicode 编码的信息，请参阅 [Programming with Unicode](https://unicodebook.readthedocs.io/unicode_encodings.html)。

> [!NOTE] 由于 TypeScript 在处理以 `.` 字符开头的目录时[存在困难](https://github.com/microsoft/TypeScript/issues/13399)，你可能会发现，在创建例如 [`.well-known`](https://en.wikipedia.org/wiki/Well-known_URI) 路由时，对这些字符进行编码会很有用：`src/routes/[x+2e]well-known/...`

## 进阶布局

默认情况下，*布局层级*会镜像*路由层级*。在某些情况下，这可能不是你想要的。

### (group)

也许你有一些属于「应用」的路由，它们应该使用一种布局（例如 `/dashboard` 或 `/item`），而另一些属于「营销」的路由应该使用不同的布局（`/about` 或 `/testimonials`）。我们可以用一个名称被括号包裹的目录来对这些路由进行分组 —— 与普通目录不同，`(app)` 和 `(marketing)` 不会影响其内部路由的 URL 路径名：

```tree
src/routes/
+++│ (app)/+++
│ ├ dashboard/
│ ├ item/
│ └ +layout.svelte
+++│ (marketing)/+++
│ ├ about/
│ ├ testimonials/
│ └ +layout.svelte
├ admin/
└ +layout.svelte
```

你也可以直接把一个 `+page` 放在 `(group)` 内，例如当 `/` 应该是一个 `(app)` 或 `(marketing)` 页面时。

### 跳出布局

根布局适用于你应用的每个页面 —— 如果省略，它默认为 `{@render children()}`。如果你希望某些页面具有与其他页面不同的布局层级，那么你可以将整个应用放入一个或多个分组中，*除了*那些不应该继承公共布局的路由。

在上面的例子中，`/admin` 路由既不继承 `(app)` 也不继承 `(marketing)` 布局。

### +page@

页面可以逐条路由地跳出当前布局层级。假设我们在前一个例子的 `(app)` 分组内有一个 `/item/[id]/embed` 路由：

```tree
src/routes/
├ (app)/
│ ├ item/
│ │ ├ [id]/
│ │ │ ├ embed/
+++│ │ │ │ └ +page.svelte+++
│ │ │ └ +layout.svelte
│ │ └ +layout.svelte
│ └ +layout.svelte
└ +layout.svelte
```

通常情况下，它会继承根布局、`(app)` 布局、`item` 布局和 `[id]` 布局。我们可以通过在后面追加 `@` 加上片段名称，来重置到其中某一个布局 —— 或者，对于根布局，追加空字符串。在这个例子中，我们可以从以下选项中选择：

- `+page@[id].svelte` - 继承自 `src/routes/(app)/item/[id]/+layout.svelte`
- `+page@item.svelte` - 继承自 `src/routes/(app)/item/+layout.svelte`
- `+page@(app).svelte` - 继承自 `src/routes/(app)/+layout.svelte`
- `+page@.svelte` - 继承自 `src/routes/+layout.svelte`

```tree
src/routes/
├ (app)/
│ ├ item/
│ │ ├ [id]/
│ │ │ ├ embed/
+++│ │ │ │ └ +page@(app).svelte+++
│ │ │ └ +layout.svelte
│ │ └ +layout.svelte
│ └ +layout.svelte
└ +layout.svelte
```

### +layout@

与页面一样，布局*本身*也可以使用相同的技术跳出其父布局层级。例如，一个 `+layout@.svelte` 组件会为其所有子路由重置层级。

```
src/routes/
├ (app)/
│ ├ item/
│ │ ├ [id]/
│ │ │ ├ embed/
│ │ │ │ └ +page.svelte  // uses (app)/item/[id]/+layout.svelte
│ │ │ ├ +layout.svelte  // inherits from (app)/item/+layout@.svelte
│ │ │ └ +page.svelte    // uses (app)/item/+layout@.svelte
│ │ └ +layout@.svelte   // inherits from root layout, skipping (app)/+layout.svelte
│ └ +layout.svelte
└ +layout.svelte
```

### 何时使用布局分组

并非所有的使用场景都适合布局分组，你也不应该觉得被迫使用它们。可能你的使用场景会导致复杂的 `(group)` 嵌套，或者你不想为一个单独的特例引入一个 `(group)`。使用其他方式（例如组合复用 `load` 函数或 Svelte 组件）或 if 语句来实现你想要的效果完全没有问题。下面的例子展示了一个回退到根布局并复用组件与函数（其他布局也可以使用它们）的布局：

```svelte
<!--- file: src/routes/nested/route/+layout@.svelte --->
<script>
	import ReusableLayout from '#lib/ReusableLayout.svelte';
	let { data, children } = $props();
</script>

<ReusableLayout {data}>
	{@render children()}
</ReusableLayout>
```

```js
/// file: src/routes/nested/route/+layout.js
// @filename: ambient.d.ts
declare module "#lib/reusable-load-function" {
	export function reusableLoad(event: import('@sveltejs/kit').LoadEvent): Promise<Record<string, any>>;
}
// @filename: index.js
// ---cut---
import { reusableLoad } from '#lib/reusable-load-function';

/** @type {import('./$types').PageLoad} */
export function load(event) {
	// Add additional logic here, if needed
	return reusableLoad(event);
}
```

## 延伸阅读

- [教程：进阶路由](/tutorial/kit/optional-params)
