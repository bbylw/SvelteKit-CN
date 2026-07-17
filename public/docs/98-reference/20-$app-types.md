---
title: $app/types
---

此模块包含为你应用中的路由生成的类型。

<blockquote class="since note">
	<p>自 2.26 起可用</p>
</blockquote>

```js
// @noErrors
import type { RouteId, RouteParams, LayoutParams } from '$app/types';
```

## Asset

你 `static` 目录中所有资源文件名的联合类型，加上一个由 `import` 声明生成的资源路径的 `string` 通配符。

<div class="ts-block">

```dts
type Asset = '/favicon.png' | '/robots.txt' | (string & {});
```

</div>

## RouteId

你应用中所有路由 ID 的联合类型。用于 `page.route.id` 和 `event.route.id`。

<div class="ts-block">

```dts
type RouteId = '/' | '/my-route' | '/my-other-route/[param]';
```

</div>

## Pathname

你应用中所有有效路径名的联合类型。

<div class="ts-block">

```dts
type Pathname = '/' | '/my-route' | `/my-other-route/${string}` & {};
```

</div>

## ResolvedPathname

与 `Pathname` 类似，但可能带有 [base path](configuration#paths) 前缀。用于 `page.url.pathname`。

<div class="ts-block">

```dts
type ResolvedPathname = `${'' | `/${string}`}/` | `${'' | `/${string}`}/my-route` | `${'' | `/${string}`}/my-other-route/${string}` | {};
```

</div>

## RouteParams

用于获取与给定路由相关联的参数的工具类型。

```ts
// @errors: 2552
type BlogParams = RouteParams<'/blog/[slug]'>; // { slug: string }
```

<div class="ts-block">

```dts
type RouteParams<T extends RouteId> = { /* generated */ } | Record<string, never>;
```

</div>

## LayoutParams

用于获取与给定布局相关联的参数的工具类型，类似于 `RouteParams`，但还包括任何子路由的可选参数。

<div class="ts-block">

```dts
type RouteParams<T extends RouteId> = { /* generated */ } | Record<string, never>;
```

</div>
