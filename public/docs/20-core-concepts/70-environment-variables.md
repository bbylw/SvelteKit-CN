---
title: 环境变量
---

环境变量是你的应用所需的、独立于应用源代码之外存在的值。它们让你可以使用敏感信息（如 API 密钥和数据库凭据），而无需将它们存储在版本控制中。

在开发期间和构建时，在 `.env` 或 `.env.local` 文件中定义的变量会被添加到环境中：

```env
/// file: .env.local
API_KEY=19f401ba-e8b0-48c4-8c77-b0ebb26d97fe
```

按照下面的设置之后，它们可以通过下列模块导入：

- [`$app/env/private`]($app-env-private)
- [`$app/env/public`]($app-env-public)

> [!LEGACY]
> `$env/*` 模块，连同 `$app/environment`，在 SvelteKit 3 中已被弃用（并将在 SvelteKit 4 中移除），取而代之的是在 SvelteKit 2.62 中作为实验性选项添加的显式环境变量。

### 设置

添加一个导出了 `variables` 对象的 `src/env.ts`（或 `src/env.js`）文件：

```ts
/// file: src/env.ts
import { defineEnvVars } from '@sveltejs/kit/hooks';

export const variables = defineEnvVars({
	// ...
});
```

传给 [`defineEnvVars`](@sveltejs-kit-hooks#defineEnvVars) 的对象中的每个值，都是一个 [`EnvVarConfig`](@sveltejs-kit#EnvVarConfig) 对象，用于配置该环境变量。

> [!NOTE] `defineEnvVars` 原样返回它的参数——它纯粹是为了帮助类型安全而存在。

### 私有变量

默认情况下，所有变量都被视为私有的。例如，你不想泄露你的 `API_KEY`：

```ts
/// file: src/env.ts
import { defineEnvVars } from '@sveltejs/kit/hooks';

export const variables = defineEnvVars({
	+++API_KEY: {}+++
});
```

> [!NOTE] 由于这个变量不需要任何配置，我们可以使用一个空对象（`{}`）。

现在 `API_KEY` 已被定义，它可以通过 `$app/env/private` 导入到应用代码中：

```js
import { API_KEY } from '$app/env/private';
```

`$app/env/private` 模块不能被导入到在浏览器中运行的代码中，这样你就不会意外地在 JavaScript 包中泄露你的机密。

### 公共变量

有些变量完全可以——甚至有必要——暴露给浏览器。对于这些情况，我们可以指定 `public: true`：

```ts
/// file: src/env.ts
import { defineEnvVars } from '@sveltejs/kit/hooks';

export const variables = defineEnvVars({
	GOOGLE_ANALYTICS_ID: {
		+++public: true+++
	}
});
```

`GOOGLE_ANALYTICS_ID` 现在可以从 `$app/env/public` 导入，或者作为 `%sveltekit.env.GOOGLE_ANALYTICS_ID%` 用在你的 `app.html` 模板中：

```html
<!--- file: src/app.html --->
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.png" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		%sveltekit.head%

		<script
			async
			src="https://www.googletagmanager.com/gtag/js?id=+++%sveltekit.env.GOOGLE_ANALYTICS_ID%+++"
		></script>

		<script>
			window.dataLayer ??= [];
			function gtag(){dataLayer.push(arguments)}
			gtag('js', new Date());
			gtag('config', +++'%sveltekit.env.GOOGLE_ANALYTICS_ID%'+++);
		</script>
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
```

### 校验

你可以指定一个 [Standard Schema](https://standardschema.dev/) 校验器，如 [Zod](https://zod.dev/) 或 [Valibot](https://valibot.dev/)，来检查环境变量值是否正确：

```ts
/// file: src/env.ts
import { defineEnvVars } from '@sveltejs/kit/hooks';
+++import * as v from 'valibot';+++

export const variables = defineEnvVars({
	GOOGLE_ANALYTICS_ID: {
		public: true,
		+++schema: v.pipe(v.string(), v.regex(/G-[A-Z0-9]+/))+++
	}
});
```

如果值无效，应用将启动（或构建）失败。要退出其中一项或两项检查，可以使用 `$app/env` 中的 [`building`]($app-env#building) 配合一个接受可选值的校验器：

```ts
/// file: src/env.ts
import { defineEnvVars } from '@sveltejs/kit/hooks';
+++import { building } from '$app/env'+++
import * as v from 'valibot';

export const variables = defineEnvVars({
	SECRET: {
		// 构建时可选，但启动应用时必填
		+++schema: building ? v.optional(v.string()) : v.string()+++
	}
});
```

你可以使用校验器让值变为可选，或转换它们（例如将字符串转为布尔值，或解析 JSON）——请参阅你的校验库文档以了解如何操作。

### 静态变量

默认情况下，变量是动态的。如果一个变量配置了 `static: true`，它将被内联到你的应用代码中，从而启用诸如死代码消除之类的优化：

```ts
/// file: src/env.ts
import { defineEnvVars } from '@sveltejs/kit/hooks';
import * as v from 'valibot';

export const variables = defineEnvVars({
	SHOW_DEBUG_OVERLAY: {
		public: true,
		+++static: true,+++

		// 强制转换为 true/false
		schema: v.pipe(
			v.optional(v.string(), ''),
			v.transform((str) => str !== '')
		)
	}
});
```

因为这个变量是 `static` 的，除非 `SHOW_DEBUG_OVERLAY` 为真，否则此处显示的 `<DebugOverlay>` 组件将被排除在 JavaScript 包之外：

```svelte
<script>
	import { SHOW_DEBUG_OVERLAY } from '$app/env/public';
	import DebugOverlay from '#lib/components/DebugOverlay.svelte';
</script>

{#if SHOW_DEBUG_OVERLAY}
	<DebugOverlay />
{/if}
```

但如果该变量是在构建应用之前设置的……

```bash
SHOW_DEBUG_OVERLAY=true npm run build
```

……那么该组件就会被包含并显示出来。

### 记录变量的用途

你可以通过添加 `description` 来记录一个环境变量的用途：

```ts
/// file: src/env.ts
import { defineEnvVars } from '@sveltejs/kit/hooks';

export const variables = defineEnvVars({
	CACHE_TTL_SECONDS: {
		description: '缓存响应的时长，以秒为单位'
	}
});
```

在你的应用代码中将鼠标悬停在 `CACHE_TTL_SECONDS` 上会显示该描述。
