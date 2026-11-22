---
title: $app/types
---

此模块包含为你的应用中的路由生成的类型。

<blockquote class="since note">
	<p>自 2.26 起可用</p>
</blockquote>

```js
// @noErrors
import type { RouteId, PageRouteId, EndpointRouteId, RouteParams, LayoutParams } from '$app/types';
```

## AssetPath

你 `static` 目录中包含的所有资源文件名的联合类型，相对于 `base` 路径。

<div class="ts-block">

```dts
type AssetPath = 'favicon.png' | 'robots.txt' | (string & {});
```

</div>

## RouteId

你应用中所有路由 ID 的联合类型——即 `PageRouteId` 和 `EndpointRouteId` 的联合。用于 `page.route.id` 和 `event.route.id`。

<div class="ts-block">

```dts
type RouteId = '/' | '/my-route' | '/my-other-route/[param]' | '/my-endpoint';
```

</div>

## PageRouteId

你应用中拥有 `+page` 的路由 ID 的联合。

如果某个路由的目录同时包含 `+page` 和 `+server`，那么该路由 ID 可以同时属于 `PageRouteId` 和 `EndpointRouteId`。在下面的示例中，`/my-route` 两者都有。

<div class="ts-block">

```dts
type PageRouteId = '/' | '/my-route' | '/my-other-route/[param]';
```

</div>

## EndpointRouteId

你应用中拥有 `+server` 的路由 ID 的联合。

如果某个路由的目录同时包含 `+page` 和 `+server`，那么该路由 ID 可以同时属于 `PageRouteId` 和 `EndpointRouteId`。在下面的示例中，`/my-route` 两者都有。

<div class="ts-block">

```dts
type EndpointRouteId = '/my-route' | '/my-endpoint';
```

</div>

## Path

你应用中所有有效路径的联合类型，相对于 `base` 路径。

<div class="ts-block">

```dts
type Path = '' | 'my-route' | `my-other-route/${string}` & {};
```

</div>

## ResolvedPathname

与 `Path` 类似，但带有[基础路径](@sveltejs-kit-vite#paths) 前缀。用于 `page.url.pathname`。

<div class="ts-block">

```dts
type ResolvedPathname = `${'' | `/${string}`}/` | `${'' | `/${string}`}/my-route` | `${'' | `/${string}`}/my-other-route/${string}` | {};
```

</div>

## RouteParams

一个用于获取与给定路由关联的参数的实用工具类型。

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

一个用于获取与给定布局关联的参数的实用工具类型，它类似于 `RouteParams`，但也包含任何子路由的可选参数。它接受任何包含布局的目录的路由 ID，包括不属于 `RouteId` 的仅布局目录。

<div class="ts-block">

```dts
type LayoutParams<T extends '/' | '/my-layout' | '/my-other-layout'> = { /* generated */ };
```

</div>
