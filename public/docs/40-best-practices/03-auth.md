---
title: 鉴权
---

Auth（鉴权）指的是认证（authentication）和授权（authorization），这是构建 Web 应用时常见的需求。认证是指根据用户提供凭据来核实其身份是否如其所述。授权是指确定他们被允许执行哪些操作。

## 会话（Sessions）与令牌（tokens）

在用户提供了用户名和密码等凭据后，我们希望允许他们在后续请求中无需再次提供凭据就能使用应用。用户在后续请求中通常通过会话标识符或签名令牌（如 JSON Web Token，即 JWT）来进行认证。

会话 ID 最常存储在数据库中。它们可以被立即吊销，但每次请求都需要查询一次数据库。

相比之下，JWT 通常不会与数据存储进行比对，这意味着它们无法被立即吊销。这种方法的优势在于降低了延迟，并减轻了数据存储的负担。

## 集成点

Auth [cookies](@sveltejs-kit#Cookies) 可以在 [server hooks](hooks#Server-hooks) 中检查。如果找到了与所提供凭据相匹配的用户，可以将用户信息存储在 [`locals`](hooks#Server-hooks-locals) 中。

## 库

[Svelte CLI](/docs/cli) 提供了选项，可以为新项目[设置 Better Auth](https://svelte.dev/docs/cli/better-auth)，或将其添加到现有项目中。

## 指南

如果你想实现自己的鉴权系统，[Lucia auth 指南](https://lucia-auth.com/) 提供了一个基于会话的 Web 应用鉴权参考，包含 SvelteKit 示例。
