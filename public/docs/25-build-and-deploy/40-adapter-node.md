---
title: Node 服务器
---

要生成一个独立的 Node 服务器，请使用 [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node)。

## 用法

用 `npm i -D @sveltejs/adapter-node` 安装，然后将适配器添加到你的 `vite.config.js`：

```js
// @errors: 2307 2554
/// file: vite.config.js
import adapter from '@sveltejs/adapter-node';
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

## 部署

首先，用 `npm run build` 构建你的应用。这将在适配器选项中指定的输出目录中创建生产服务器，默认为 `build`。

你将需要输出目录、项目的 `package.json`，以及 `node_modules` 中的生产依赖来运行应用。生产依赖可以通过复制 `package.json` 和 `package-lock.json`，然后运行 `npm ci --omit dev` 来生成（如果你的应用没有任何依赖，可以跳过这一步）。然后你可以用这个命令启动你的应用：

```sh
node build
```

开发依赖将使用 [Rolldown](https://rolldown.rs/) 打包进你的应用。要控制给定的包是被打包还是外部化，请分别在你的 `package.json` 的 `devDependencies` 或 `dependencies` 中放置它。

### 压缩响应

你通常会想要压缩来自服务器的响应。如果你已经将服务器部署在反向代理后面以进行 SSL 或负载均衡，由于 Node.js 是单线程的，在该层处理压缩通常会带来更好的性能。

然而，如果你正在构建[自定义服务器](#Custom-server) 并确实想在那里添加压缩中间件，请注意我们建议使用 [`@polka/compression`](https://www.npmjs.com/package/@polka/compression)，因为 SvelteKit 会流式传输响应，而更流行的 `compression` 包不支持流式传输，使用时可能会导致错误。

## 环境变量

在 `dev` 和 `preview` 中，SvelteKit 会从你的 `.env` 文件（或 `.env.local`，或 `.env.[mode]`，[由 Vite 决定](https://vitejs.dev/guide/env-and-mode.html#env-files)）读取环境变量。

在生产环境中，`.env` 文件_不会_被自动加载。要这样做，在你的项目中安装 `dotenv`……

```sh
npm install dotenv
```

……并在运行构建好的应用之前调用它：

```sh
node +++-r dotenv/config+++ build
```

如果你使用 Node.js v20.6+，你可以改用 [`--env-file`](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs) 标志：

```sh
node +++--env-file=.env+++ build
```

### `PORT`、`HOST` 和 `SOCKET_PATH`

默认情况下，服务器将在 `0.0.0.0` 上使用端口 3000 接受连接。这些可以通过 `PORT` 和 `HOST` 环境变量进行自定义：

```sh
HOST=127.0.0.1 PORT=4000 node build
```

或者，可以将服务器配置为在指定的 socket 路径上接受连接。当使用 `SOCKET_PATH` 环境变量完成此操作时，`HOST` 和 `PORT` 环境变量将被忽略。

```sh
SOCKET_PATH=/tmp/socket node build
```

### `PROTOCOL_HEADER`、`HOST_HEADER` 和 `PORT_HEADER`

HTTP 没有给 SvelteKit 一种可靠的方式来获知当前正在被请求的 URL。默认情况下，SvelteKit 将从请求的 `host` 头（以及 `https` 协议，如果没有设置 `PROTOCOL_HEADER` 的话）派生出源（origin）。

如果你的应用是从一个在请求时未知的源提供的——例如因为它位于一个不传递 `host` 头的反向代理后面，或者因为你想要使用一个与请求的 host 不同的规范源来进行 CSRF 检查——你可以在你的 `vite.config.js` 中设置 [`paths.origin`](configuration#paths) 选项：

```js
// @errors: 2307
/// file: vite.config.js
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter(),
			paths: {
				origin: process.env.ORIGIN
			}
		})
	]
});
```

当 `paths.origin` 未设置（默认）时，`adapter-node` 从请求中派生源——使用 `host` 头（以及 `PROTOCOL_HEADER`/`PORT_HEADER`，如果设置了的话）——并相应地设置 `request.url`。否则，配置的值将被用作表单提交和远程函数调用时 CSRF 检查的受信任自身源，以及预渲染期间 `url.origin` 的值。

或者，你可以指定一些告诉 SvelteKit 请求协议和主机的头，从中它可以构造出源 URL：

```sh
PROTOCOL_HEADER=x-forwarded-proto HOST_HEADER=x-forwarded-host node build
```

> [!NOTE] [`x-forwarded-proto`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Proto) 和 [`x-forwarded-host`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Host) 是事实上的标准头，如果你使用的是反向代理（想想负载均衡器和 CDN），它们会转发原始的协议和主机。你只应该在你的服务器位于受信任的反向代理后面时才设置这些变量；否则，客户端就有可能伪造这些头。
>
> 如果你在非标准端口上托管你的代理，并且你的反向代理支持 `x-forwarded-port`，你也可以设置 `PORT_HEADER=x-forwarded-port`。

如果 `adapter-node` 无法正确确定你的部署的 URL，在使用[表单操作](form-actions) 时你可能会遇到这个错误：

> [!NOTE] 禁止跨站 POST 表单提交

### `ADDRESS_HEADER` 和 `XFF_DEPTH`

传递给钩子和端点的 [`RequestEvent`](@sveltejs-kit#RequestEvent) 对象包含一个 `event.getClientAddress()` 函数，它返回客户端的 IP 地址。默认情况下，这是连接的 `remoteAddress`。如果你的服务器位于一个或多个代理（如负载均衡器）后面，这个值将包含最内层代理的 IP 地址，而不是客户端的，所以我们需要指定一个 `ADDRESS_HEADER` 来从中读取地址：

```sh
ADDRESS_HEADER=True-Client-IP node build
```

> [!NOTE] 头很容易被伪造。与 `PROTOCOL_HEADER` 和 `HOST_HEADER` 一样，在设置这些之前你应该[知道自己在做什么](https://adam-p.ca/blog/2022/03/x-forwarded-for/)。

如果 `ADDRESS_HEADER` 是 `X-Forwarded-For`，头的值将包含一个以逗号分隔的 IP 地址列表。`XFF_DEPTH` 环境变量应该指定你的服务器前面有多少个受信任的代理。例如，如果有三个受信任的代理，代理 3 将转发原始连接以及前两个代理的地址：

```
<client address>, <proxy 1 address>, <proxy 2 address>
```

一些指南会告诉你要读取最左边的地址，但这会让你[容易受到伪造攻击](https://adam-p.ca/blog/2022/03/x-forwarded-for/)：

```
<spoofed address>, <client address>, <proxy 1 address>, <proxy 2 address>
```

我们改为从_右边_读取，并考虑受信任代理的数量。在这种情况下，我们会使用 `XFF_DEPTH=3`。

> [!NOTE] 如果你需要读取最左边的地址（并且不在乎伪造）——例如，要提供一个地理位置服务，其中 IP 地址是_真实_的比_受信任_的更重要，你可以通过在你的应用内部检查 `x-forwarded-for` 头来做到这一点。

### `BODY_SIZE_LIMIT`

要接受的最大请求体大小，以字节为单位，包括流式传输期间。请求体大小也可以用单位后缀指定千字节（`K`）、兆字节（`M`）或千兆字节（`G`）。例如，`512K` 或 `1M`。默认为 512kb。你可以用 `Infinity` 的值（旧版本适配器中为 `0`）禁用此选项，并在你需要在更高级的场景时于 [`handle`](hooks#Server-hooks-handle) 中实现自定义检查。

### `SHUTDOWN_TIMEOUT`

在接收到 `SIGTERM` 或 `SIGINT` 信号后，强制关闭任何剩余连接之前等待的秒数。默认为 `30`。适配器内部调用 [`closeAllConnections`](https://nodejs.org/api/http.html#servercloseallconnections)。更多细节请参阅[优雅关闭](#Graceful-shutdown)。

### `IDLE_TIMEOUT`

当使用 systemd socket 激活时，`IDLE_TIMEOUT` 指定在没有收到请求后应用自动进入睡眠状态的秒数。如果未设置，应用将持续运行。更多细节请参阅 [Socket 激活](#Socket-activation)。

### `KEEP_ALIVE_TIMEOUT` 和 `HEADERS_TIMEOUT`

[`keepAliveTimeout`](https://nodejs.org/api/http.html#serverkeepalivetimeout) 和 [`headersTimeout`](https://nodejs.org/api/http.html#serverheaderstimeout) 的秒数。

## 选项

适配器可以用各种选项进行配置：

```js
// @errors: 2307 2554
/// file: vite.config.js
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter({
				// 显示的是默认选项
				out: 'build',
				precompress: true,
				envPrefix: ''
			})
		})
	]
});
```

### out

构建服务器的目录。默认为 `build`——即 `node build` 会在创建后于本地启动服务器。

### precompress

启用使用 gzip 和 brotli 对资源和预渲染页面进行预压缩。默认为 `true`。

### envPrefix

如果你需要更改用于配置部署的环境变量的名称（例如，与你无法控制的环境变量去冲突），你可以指定一个前缀：

```js
envPrefix: 'MY_CUSTOM_';
```

```sh
MY_CUSTOM_HOST=127.0.0.1 \
MY_CUSTOM_PORT=4000 \
node build
```

## 优雅关闭

默认情况下，当收到 `SIGTERM` 或 `SIGINT` 信号时，`adapter-node` 会优雅地关闭 HTTP 服务器。它会：

1. 拒绝新的请求（[`server.close`](https://nodejs.org/api/http.html#serverclosecallback)）
2. 等待已经发出但尚未收到响应的请求完成，并在它们变为空闲时关闭连接（[`server.closeIdleConnections`](https://nodejs.org/api/http.html#servercloseidleconnections)）
3. 最后，在 [`SHUTDOWN_TIMEOUT`](#Environment-variables-SHUTDOWN_TIMEOUT) 秒之后，关闭任何仍然活跃的剩余连接。（[`server.closeAllConnections`](https://nodejs.org/api/http.html#servercloseallconnections)）

> [!NOTE] 如果你想自定义此行为，可以使用[自定义服务器](#Custom-server)。

你可以监听 `sveltekit:shutdown` 事件，它在 HTTP 服务器关闭所有连接之后触发。与 Node 的 `exit` 事件不同，`sveltekit:shutdown` 事件支持异步操作，并且即使服务器有悬挂的工作（如打开的数据库连接）也会在所有连接关闭时触发。

```js
// @errors: 2304
process.on('sveltekit:shutdown', async (reason) => {
	await jobs.stop();
	await db.close();
});
```

参数 `reason` 取以下值之一：

- `SIGINT` - 关闭由 `SIGINT` 信号触发
- `SIGTERM` - 关闭由 `SIGTERM` 信号触发
- `IDLE` - 关闭由 [`IDLE_TIMEOUT`](#Environment-variables-IDLE_TIMEOUT) 触发

## Socket 激活

如今大多数 Linux 操作系统使用名为 systemd 的现代进程管理器来启动服务器并运行和管理服务。你可以将服务器配置为分配一个 socket，并按需启动和扩展你的应用。这被称为 [socket 激活](https://0pointer.de/blog/projects/socket-activated-containers.html)。在这种情况下，OS 会向你的应用传递两个环境变量——`LISTEN_PID` 和 `LISTEN_FDS`。然后适配器将监听文件描述符 3，它指向一个你将必须创建的 systemd socket 单元。

> [!NOTE] 你仍然可以将 [`envPrefix`](#Options-envPrefix) 与 systemd socket 激活一起使用。`LISTEN_PID` 和 `LISTEN_FDS` 始终不带前缀读取。

要利用 socket 激活，请遵循以下步骤。

1. 将你的应用作为 [systemd 服务](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html) 运行。它可以直接在主机系统上运行，也可以在容器内运行（例如使用 Docker 或 systemd 便携服务）。如果你额外向你的应用传递一个 [`IDLE_TIMEOUT`](#Environment-variables-IDLE_TIMEOUT) 环境变量，如果在 `IDLE_TIMEOUT` 秒内没有请求，它就会优雅关闭。当新的请求到来时，systemd 会自动再次启动你的应用。

```ini
/// file: /etc/systemd/system/myapp.service
[Service]
Environment=NODE_ENV=production IDLE_TIMEOUT=60
ExecStart=/usr/bin/node /usr/bin/myapp/build
```

2. 创建一个配套的 [socket 单元](https://www.freedesktop.org/software/systemd/man/latest/systemd.socket.html)。适配器只接受一个单独的 socket。

```ini
/// file: /etc/systemd/system/myapp.socket
[Socket]
ListenStream=3000

[Install]
WantedBy=sockets.target
```

3. 通过运行 `sudo systemctl daemon-reload` 确保 systemd 已识别这两个单元。然后使用 `sudo systemctl enable --now myapp.socket` 在启动时启用该 socket 并立即启动它。然后，一旦向 `localhost:3000` 发出第一个请求，应用就会自动启动。

## 自定义服务器

适配器在你的构建目录中创建两个文件——`index.js` 和 `handler.js`。运行 `index.js`——例如 `node build`，如果你使用默认构建目录——将在配置的端口上启动一个服务器。

或者，你可以导入 `handler.js` 文件，它导出一个适用于 [Express](https://github.com/expressjs/express)、[Connect](https://github.com/senchalabs/connect) 或 [Polka](https://github.com/lukeed/polka)（或者甚至只是内置的 [`http.createServer`](https://nodejs.org/dist/latest/docs/api/http.html#httpcreateserveroptions-requestlistener)）的处理程序，并自行搭建你的服务器：

```js
// @errors: 2307 7006
/// file: my-server.js
import { handler } from './build/handler.js';
import express from 'express';

const app = express();

// 添加一个独立于 SvelteKit 应用存在的路由
app.get('/healthcheck', (req, res) => {
	res.end('ok');
});

// 让 SvelteKit 处理其他一切，包括提供预渲染页面和静态资源
app.use(handler);

app.listen(3000, () => {
	console.log('正在监听 3000 端口');
});
```

> [!NOTE] 当你在自定义服务器中使用 `handler.js` 时，只有处理程序本身读取的环境变量会生效：`PROTOCOL_HEADER`、`HOST_HEADER`、`PORT_HEADER`、`ADDRESS_HEADER`、`XFF_DEPTH` 和 `BODY_SIZE_LIMIT`。
>
> 服务器生命周期变量（`PORT`、`HOST`、`SOCKET_PATH`、`SHUTDOWN_TIMEOUT`、`IDLE_TIMEOUT`、`KEEP_ALIVE_TIMEOUT`、`HEADERS_TIMEOUT`、`LISTEN_PID`、`LISTEN_FDS`）只被默认的 `node build` 服务器遵守。如果你需要相同的行为，请在自定义服务器中自己实现它们——例如，上面的代码片段无论 `PORT` 如何，都监听硬编码的 `3000`。
