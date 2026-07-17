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

> [!NOTE] 要让这个生效，你自己的 `tsconfig.json` 或 `jsconfig.json` 应该继承自生成的 `.svelte-kit/tsconfig.json`（其中 `.svelte-kit` 是你的 [`outDir`](configuration#outDir)）：
>
> `{ "extends": "./.svelte-kit/tsconfig.json" }`

### 默认的 tsconfig.json

生成的 `.svelte-kit/tsconfig.json` 文件包含了一系列选项。其中一些是根据你的项目配置以编程方式生成的，通常不应在没有充分理由的情况下被覆盖：

```json
/// file: .svelte-kit/tsconfig.json
{
	"compilerOptions": {
		"paths": {
			"#lib": ["../src/lib/index.js"],
			"#lib/*": ["../src/lib/*"]
		},
		"rootDirs": ["..", "./types"]
	},
	"include": [
		"ambient.d.ts",
		"non-ambient.d.ts",
		"./types/**/$types.d.ts",
		"../vite.config.js",
		"../vite.config.ts",
		"../src/**/*.js",
		"../src/**/*.ts",
		"../src/**/*.svelte",
		"../tests/**/*.js",
		"../tests/**/*.ts",
		"../tests/**/*.svelte"
	],
	"exclude": [
		"../node_modules/**",
		"../src/service-worker.js",
		"../src/service-worker/**/*.js",
		"../src/service-worker.ts",
		"../src/service-worker/**/*.ts",
		"../src/service-worker.d.ts",
		"../src/service-worker/**/*.d.ts"
	]
}
```

其他的则是 SvelteKit 正常工作所必需的，除非你知道自己在做什么，否则也应该保持不动：

```json
/// file: .svelte-kit/tsconfig.json
{
	"compilerOptions": {
		// 这确保类型通过 `import type` 显式导入，
		// 这是必要的，因为 Svelte/Vite 否则无法
		// 正确编译组件
		"verbatimModuleSyntax": true,

		// Vite 一次编译一个 TypeScript 模块，
		// 而不是编译整个模块图
		"isolatedModules": true,

		// 告诉 TS 它仅用于类型检查
		"noEmit": true,

		// 这确保 `vite build`
		// 和 `svelte-package` 都能正确工作
		"lib": ["esnext", "DOM", "DOM.Iterable"],
		"moduleResolution": "bundler",
		"module": "esnext",
		"target": "esnext"
	}
}
```

使用 `vite.config.js` 中 SvelteKit 插件的 [`typescript.config` 设置](configuration#typescript) 来扩展或修改生成的 `tsconfig.json`。

## app.d.ts

`app.d.ts` 文件是你的应用的环境（ambient）类型的归属地，即无需显式导入即可使用的类型。

这个文件始终包含 `App` 命名空间。该命名空间包含几个会影响你所交互的某些 SvelteKit 特性形态的类型。

> TYPES: App
