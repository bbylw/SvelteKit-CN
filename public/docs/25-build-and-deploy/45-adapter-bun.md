---
title: Bun 服务器
---

[`adapter-bun`](https://github.com/sveltejs/kit/tree/main/packages/adapter-bun) 将 SvelteKit 应用构建为独立的 [Bun](https://bun.com/) 服务器。生成的服务器使用 `Bun.serve` 处理请求，并使用 `Bun.file` 响应客户端资源、预渲染输出以及通过 `$app/server` 的 [`read`](https://svelte.dev/docs/kit/$app-server#read) 读取的文件。

> [!NOTE] 需要 Bun 1.4 或更高版本。

## 用法

运行 `npx sv add sveltekit-adapter="adapter:bun"`，或者用 `npm i -D @sveltejs/adapter-bun` 安装，然后将适配器添加到你的 `vite.config.js`：

```js
// @errors: 2307 2554
/// file: vite.config.js
import adapter from '@sveltejs/adapter-bun';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter()
		})
	]
});
```

该适配器调用 Bun 的构建 API，因此生产构建本身必须在 Bun 中运行。`--bun` 标志会覆盖 Vite 的 Node.js shebang：

```sh
bun run --bun build
```

默认构建输出到 `build`。用它启动服务器：

```sh
bun ./build
```

运行应用需要输出目录、项目的 `package.json` 以及 `node_modules` 中的生产依赖。可以通过复制 `package.json` 和 `bun.lock`，然后运行 `bun install --production --frozen-lockfile` 来生成生产依赖（如果你的应用没有任何依赖，可以跳过这一步）。开发依赖会被打包进你的应用。要控制某个包是被打包还是作为外部依赖，请分别将它放在 `package.json` 的 `devDependencies` 或 `dependencies` 中。

客户端资源和预渲染输出会在请求到达 SvelteKit 之前被提供。只有 `GET` 和 `HEAD` 请求会以这种方式提供；其他方法会继续交给 SvelteKit。每个资源都带有构建期间计算出的 ETag，因此条件请求会用空的 `304` 响应进行重新验证。Bun 提供 MIME 类型、基于文件系统的文件的字节范围请求，以及无需将每个资源缓冲到内存中的流式传输。位于 SvelteKit 的 `immutable` 目录下的文件会收到 `Cache-Control: public,max-age=31536000,immutable`。

## 选项

```js
// @errors: 2307 2554
/// file: vite.config.js
import adapter from '@sveltejs/adapter-bun';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter({
				out: 'build',
				envPrefix: '',
				serverOptions: {
					idleTimeout: 30
				}
			})
		})
	]
});
```

### out

输出目录。默认为 `build`。

### precompress

设置 `precompress: true` 会在构建期间为客户端和预渲染资源生成 `.br` 和 `.gz` 变体。服务器会针对每个请求协商 `Accept-Encoding`，优先使用 brotli 而非 gzip，并且每个变体都带有自己的 ETag。当设置了 `buildOptions.compile` 时该选项会被忽略，因为嵌入的资源是按标识路径导入的。

### envPrefix

下面记录的每个部署环境变量的前缀。当无前缀的名称与你的主机管理的变量冲突时，这会很有用：

```js
// @errors: 2307
import adapter from '@sveltejs/adapter-bun';
// ---cut---
adapter({ envPrefix: 'MY_APP_' });
```

```sh
MY_APP_HOST=127.0.0.1 MY_APP_PORT=4000 bun ./build
```

配置前缀后，如果服务器在启动时发现带有该前缀的未知环境变量，就会启动失败。这可以捕获冲突和拼写错误。

### serverOptions

传给 `Bun.serve` 的可 JSON 序列化的默认值。支持的属性有：

- `hostname`
- `port`
- `unix`
- `reusePort`
- `ipv6Only`
- `idleTimeout`
- `maxRequestBodySize`
- `development`

环境变量优先于这些默认值。配置的 Unix socket 优先于 `hostname`、`port`、`reusePort` 和 `ipv6Only`。

生成的服务器拥有 `fetch` 和 `routes`。它不会通过 `serverOptions` 暴露 `websocket`、`error`、TLS、HTTP/3 或 HTTP/1 配置。如果你的应用需要这些 `Bun.serve` 选项，请使用自定义的 Bun 集成。

### buildOptions

`buildOptions` 配置将服务器转换为可执行文件的 `Bun.build` 调用，因此它仅在设置了 `compile` 时生效。适配器接受 `sourcemap`、`minify`、`bytecode`、`banner`、`footer`、`drop`、`features`、`optimizeImports`、`external` 和 `compile`。入口点、输出目录、顶层 `target` 和模块 `format` 是保留的。Source map 默认为 `external`；设置 `sourcemap: 'none'` 可以禁用它。

#### 编译后的可执行文件

设置 `compile: true` 以在 `<out>/server` 生成单个可执行文件：

```js
// @errors: 2307
import adapter from '@sveltejs/adapter-bun';
// ---cut---
adapter({
	buildOptions: {
		compile: true
	}
});
```

无需单独安装 Bun 运行时即可构建并运行它：

```sh
bun run --bun build
./build/server
```

该可执行文件嵌入了服务器代码、客户端资源、预渲染输出和 Bun 运行时。`compile` 也可以是 Bun 目标字符串（这会保留默认的 `server` 文件名），或者是一个选项对象。要更改可执行文件名或进行交叉编译，请提供选项对象：

```js
// @errors: 2307
import adapter from '@sveltejs/adapter-bun';
// ---cut---
adapter({
	out: 'dist',
	buildOptions: {
		compile: {
			outfile: 'application',
			target: 'bun-linux-x64'
		},
		minify: true,
		bytecode: true,
		sourcemap: 'linked'
	}
});
```

此示例的结果是 `dist/application`。平台目标、原生依赖和其他限制遵循 [Bun 的可执行文件编译规则](https://bun.com/docs/compiler/executables)。

可执行文件会打包生产依赖，因为运行时没有可用来解析它们的 `node_modules`。要在运行时改为从 `node_modules` 解析某个包，请将它列在 `external` 中并设置 `compile: { autoloadPackageJson: true }`。像 `jsdom` 这样读取自身所在位置相对文件的包只能以这种方式工作。

## 环境变量

Bun 会自动加载 `.env` 文件。如果设置了 `envPrefix`，请为此节中的每个名称添加该前缀。

### 监听器

`HOST` 和 `PORT` 配置 TCP 监听器。如果两者和 `serverOptions` 默认值都不存在，服务器会监听 `3000` 端口。

```sh
HOST=127.0.0.1 PORT=4000 bun ./build
```

`SOCKET_PATH` 改为选择一个 Unix 域套接字。当它存在时，仅适用于 TCP 的选项会被忽略：

```sh
SOCKET_PATH=/tmp/sveltekit.sock bun ./build
```

`REUSE_PORT` 启用 Bun 的 `reusePort` 选项，`IPV6_ONLY` 启用 `ipv6Only`。布尔变量接受 `1`、`true`、`yes` 和 `on`，或 `0`、`false`、`no` 和 `off`，并忽略大小写。

### 请求限制与诊断

`BODY_SIZE_LIMIT` 控制 `Bun.serve` 的 `maxRequestBodySize`。默认为 `512K`。该值必须解析为整数个字节，并且可以使用不区分大小写的二进制 `K`、`M` 或 `G` 后缀，例如 `768K` 或 `1.5M`。`Infinity` 会禁用该限制。

`CONNECTION_IDLE_TIMEOUT` 以秒为单位设置 Bun 的每请求不活动超时。它必须是 `0` 到 `255` 之间的整数；`0` 会禁用超时。生成的处理器会为内容类型以 `text/event-stream` 开头的响应禁用该超时，并添加 `X-Accel-Buffering: no`。它有意不叫 `IDLE_TIMEOUT`，因为在 adapter-node 中该名称含义不同（在没有请求 N 秒后关闭服务器）。

`DEVELOPMENT` 启用 Bun 的开发模式错误页面。对于生成的服务器，它默认为 `false`。

### 代理后面的公共源

如果配置了 [`paths.origin`](@sveltejs-kit-vite#paths)，或者在运行时设置了 `ORIGIN` 环境变量，那么该值就是每个请求的可信源。否则，适配器会从 `Host` 头派生主机，并假定协议为 `https`，因为生产部署通常在上游终止 TLS。如果该假设不成立——例如直接提供纯 HTTP 服务——请配置 `paths.origin`、`ORIGIN` 或 `PROTOCOL_HEADER`。

在可信的反向代理后面，`PROTOCOL_HEADER`、`HOST_HEADER` 和 `PORT_HEADER` 指定包含公共协议、主机和端口的头：

```sh
PROTOCOL_HEADER=x-forwarded-proto \
HOST_HEADER=x-forwarded-host \
PORT_HEADER=x-forwarded-port \
bun ./build
```

协议头必须包含不带冒号的 `http` 或 `https`。端口头必须包含一个数字。无效值会产生 `400 Bad Request` 响应。存在但为空的头会被忽略，转而使用回退值。

> [!CAUTION] 只有当你控制的代理才能让请求到达服务器时，才应信任转发头。直接的客户端可以伪造这些头。

### 代理后面的客户端地址

[`event.getClientAddress()`](https://svelte.dev/docs/kit/@sveltejs-kit#RequestEvent) 默认使用 `server.requestIP(request).address`。当直接对端是代理时，请将 `ADDRESS_HEADER` 设置为可信代理头的名称：

```sh
ADDRESS_HEADER=true-client-ip bun ./build
```

对于 `x-forwarded-for`，还要将 `XFF_DEPTH` 设置为可信代理的数量。默认深度为 `1`，适配器会从逗号分隔列表的右侧进行选择，因此左侧由客户端提供的条目无法改变可信结果：

```sh
ADDRESS_HEADER=x-forwarded-for XFF_DEPTH=2 bun ./build
```

`XFF_DEPTH` 必须是至少为 `1` 的整数。如果配置的头不存在，或者包含的地址少于配置的深度，`getClientAddress()` 会抛出错误。

## 平台 API

请求事件的 `platform` 属性暴露 Bun 服务器实例：

```js
/** @type {import('./$types').RequestHandler} */
export function GET({ getClientAddress, platform }) {
	return Response.json({
		address: getClientAddress(),
		serverId: platform.server.id,
		pendingRequests: platform.server.pendingRequests,
		pendingWebSockets: platform.server.pendingWebSockets
	});
}
```

## 优雅关闭

收到 `SIGINT` 或 `SIGTERM` 时，生成的服务器会调用 `server.stop()`。Bun 会停止接受新连接，适配器会等待待处理的请求，然后发出带有信号名称的 `sveltekit:shutdown` 进程事件：

```js
process.on('sveltekit:shutdown', async (reason) => {
	await jobs.stop();
	await db.close();
});
```

在 `SHUTDOWN_TIMEOUT` 秒后仍然打开的连接会被强制关闭，因此像打开的事件流这样的空闲连接无法无限期地延迟关闭。该值必须是非负整数，默认为 `30`。

再次发送关闭信号会强制进程以状态码 `1` 退出。
