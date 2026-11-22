---
title: 鉴权
---

Auth（鉴权）指的是认证（authentication）和授权（authorization），这是构建 Web 应用时常见的需求。认证是指根据用户提供凭据来核实其身份是否如其所述。授权是指确定他们被允许执行哪些操作。

## 会话（Sessions）与令牌（tokens）

在用户提供了用户名和密码等凭据后，我们希望允许他们在后续请求中无需再次提供凭据就能使用应用。用户在后续请求中通常通过会话标识符或签名令牌（如 JSON Web Token，即 JWT）来进行认证。

会话 ID 最常存储在数据库中。它们可以被立即吊销，但每次请求都需要查询一次数据库。

相比之下，JWT 通常不会与数据存储进行比对，这意味着它们无法被立即吊销。这种方法的优势在于降低了延迟，并减轻了数据存储的负担。

## 集成点

Auth [cookies](@sveltejs-kit#Cookies) 可以在 [`handle`](hooks#handle) 钩子中检查。如果找到了与所提供凭据相匹配的用户，可以将用户信息存储在 [`locals`](hooks#handle-locals) 中：

```js
/// file: src/hooks.server.js
// @filename: ambient.d.ts
type User = {
	name: string;
};

declare namespace App {
	interface Locals {
		user: User | null;
	}
}

const getUserInformation: (cookie: string | void) => Promise<User | null>;

// @filename: index.js
// ---cut---
/** @type {import('@sveltejs/kit/hooks').Handle} */
export async function handle({ event, resolve }) {
	event.locals.user = await getUserInformation(event.cookies.get('sessionid'));

	return resolve(event);
}
```

然后你可以使用 [`getRequestEvent`]($app-server#getRequestEvent) 读取 `locals.user` 并检查用户是否已通过身份验证。这个检查可以放在共享的辅助函数中，然后在每个 `load` 函数中复用，如[此示例](load#Using-getRequestEvent) 所示。

> [!NOTE] 始终优先在 `+page.server.js` 中检查，而不是 `+layout.server.js`——请参阅[对身份验证的影响](load#Implications-for-authentication)

### 保护多个路由

要保护你的私有路由，请在 `handle` 钩中添加一个身份验证守卫，对公共路由白名单进行检查：

```js
/// file: src/hooks.server.js
// @filename: ambient.d.ts
type User = {
	name: string;
};

declare namespace App {
	interface Locals {
		user: User | null;
	}
}

const getUserInformation: (cookie: string | void) => Promise<User | null>;

// @filename: index.js
// ---cut---
import { redirect } from '@sveltejs/kit';

const PUBLIC_ROUTES = new Set(['/', '/login', '/signup']);

/** @type {import('@sveltejs/kit/hooks').Handle} */
export async function handle({ event, resolve }) {
	event.locals.user = await getUserInformation(event.cookies.get('sessionid'));

	if (!event.locals.user && !PUBLIC_ROUTES.has(event.route.id ?? '')) {
		redirect(303, '/login');
	}

	return resolve(event);
}
```

只要有可能，你应该匹配 `event.route.id` 而不是 `event.url.pathname`，因为 `event.route.id` 是 SvelteKit 路由器实际匹配到的路由，因此代表了如果请求被允许继续将会提供的内容。对 URL 路径名的简单字符串检查可能会遇到各种问题——例如，URL 路径名可以被[编码](advanced-routing#Encoding)，因此像 `event.url.pathname.startsWith('/admin')` 这样的检查可以被编码后的等价形式 `/%61dmin` 绕过。如果你确实必须匹配 URL 的任何原始部分，请确保使用正确的解码并编写充分的测试。

> [!NOTE] 预渲染页面和静态资源在提供时不会调用 `handle`，因此它们无法通过这种方式受到保护。

### 远程函数

如果你使用[远程函数](remote-functions)，你_必须_直接在函数内部运行身份验证检查——请参阅[对身份验证的影响](remote-functions#Implications-for-authentication)。

## 库

[Svelte CLI](/docs/cli) 提供了选项，可以为新项目[设置 Better Auth](/docs/cli/better-auth)，或将其添加到现有项目中。

## 指南

如果你想实现自己的鉴权系统，[Pilcrow 的 Auth Book](https://auth.pilcrowonpaper.com/) 提供了一个基于会话的 Web 应用鉴权参考。这里还有一份关于通常如何实现的[简单示例](https://github.com/lucia-auth/lucia/blob/main/code/auth_session.ts)。
