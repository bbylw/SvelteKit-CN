---
title: '#lib'
---

当通过 [`sv` CLI](/docs/cli/overview) 搭建一个新的 SvelteKit 项目时，它会通过向你的 `package.json` 添加以下内容，为你的 `src/lib` 目录自动创建一个 `#lib` 导入别名：

```json
{
	"imports": {
		"#lib": "./src/lib/index.js",
		"#lib/*": "./src/lib/*"
	}
}
```

`#` 前缀利用了 Node 内置的 [subpath imports](https://nodejs.org/api/packages.html#subpath-imports) 特性，该特性为包内部别名保留了 `#`。Vite 和 TypeScript 都原生解析这些别名。

> [!LEGACY]
> 此前，这个别名是 `$lib`，并由 SvelteKit 自动配置。现在它是 `#lib`，必须在你的 `package.json` 的 `imports` 字段中声明。`import { foo } from '$lib/foo.js'` 变为 `import { foo } from '#lib/foo.js'`。

```svelte
<!--- file: src/lib/Component.svelte --->
A reusable component
```

```svelte
<!--- file: src/routes/+page.svelte --->
<script>
	import Component from '#lib/Component.svelte';
</script>

<Component />
```
