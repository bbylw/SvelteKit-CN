---
title: 类型
---

## 生成的类型

`RequestHandler` 和 `Load` 类型都接受一个 `Params` 参数，允许你对 `params` 对象进行类型标注。例如，这个端点期望 `foo`、`bar` 和 `baz` 参数：

```js
/// file: src/routes/[foo]/[bar]/[baz]/+server.js
// @errors: 2355 2322 1360
/**
 * @type {import('@sveltejs/kit').RequestHandler<{
 *   foo: string;
 *   bar: string;
 *   baz: string
 * }>}
 */
export async function GET({ params }) {
	// ...
}
```

不用说，这样写出来很繁琐，而且可移植性较差（如果你将 `[foo]` 目录重命名为 `[qux]`，该类型就不再反映真实情况了）。

为了解决这个问题，SvelteKit 会为你的每个端点和页面生成 `.d.ts` 文件：

```ts
/// file: .svelte-kit/types/src/routes/[foo]/[bar]/[baz]/$types.d.ts
/// link: true
import type * as Kit from '@sveltejs/kit';

type RouteParams = {
	foo: string;
	bar: string;
	baz: string;
};

export type RequestHandler = Kit.RequestHandler<RouteParams>;
export type PageLoad = Kit.Load<RouteParams>;
```

得益于你 TypeScript 配置中的 [`rootDirs`](https://www.typescriptlang.org/tsconfig#rootDirs) 选项，这些文件可以作为同级文件导入到你的端点和页面中：

```js
/// file: src/routes/[foo]/[bar]/[baz]/+server.js
// @filename: $types.d.ts
import type * as Kit from '@sveltejs/kit';

type RouteParams = {
	foo: string;
	bar: string;
	baz: string
}

export type RequestHandler = Kit.RequestHandler<RouteParams>;

// @filename: index.js
// @errors: 2355 2322
// ---cut---
/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
	// ...
}
```

```js
/// file: src/routes/[foo]/[bar]/[baz]/+page.js
// @filename: $types.d.ts
import type * as Kit from '@sveltejs/kit';

type RouteParams = {
	foo: string;
	bar: string;
	baz: string
}

export type PageLoad = Kit.Load<RouteParams>;

// @filename: index.js
// @errors: 2355
// ---cut---
/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch }) {
	// ...
}
```

load 函数的返回类型随后可以通过 `$types` 模块以 `PageData` 和 `LayoutData` 的形式分别获取，而所有 `Actions` 返回值的联合类型则作为 `ActionData` 可用。

从 2.16.0 版本开始，提供了两个额外的辅助类型：`PageProps` 定义了 `data: PageData`，以及当定义了 action 时的 `form: ActionData`；而 `LayoutProps` 定义了 `data: LayoutData`，以及 `children: Snippet`。

```svelte
<!--- file: src/routes/+page.svelte --->
<script>
	/** @type {import('./$types').PageProps} */
	let { data, form } = $props();
</script>
```

> [!LEGACY]
> 在 2.16.0 之前：
> ```svelte
> <!--- file: src/routes/+page.svelte --->
> <script>
> 	/** @type {{ data: import('./$types').PageData, form: import('./$types').ActionData }} */
> 	let { data, form } = $props();
> </script>
> ```
>
> 使用 Svelte 4：
> ```svelte
> <!--- file: src/routes/+page.svelte --->
> <script>
>   /** @type {import('./$types').PageData} */
>   export let data;
>   /** @type {import('./$types').ActionData} */
>   export let form;
> </script>
> ```

> [!NOTE] 要让这个生效，你自己的 `tsconfig.json` 或 `jsconfig.json` 应该继承生成的 `$app/types`：
>
> `{ "extends": "$app/tsconfig" }`

## app.d.ts

`app.d.ts` 文件是你的应用的环境（ambient）类型的归属地，即无需显式导入即可使用的类型。

这个文件始终包含 `App` 命名空间。该命名空间包含几个会影响你所交互的某些 SvelteKit 特性形态的类型。

> TYPES: App
