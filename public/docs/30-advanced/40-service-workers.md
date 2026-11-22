---
title: Service Workers
---

Service worker 充当代理服务器，处理你应用内部的网络请求。这使得你的应用可以离线工作，但即使你不需要离线支持（或者由于你正在构建的应用类型而无法实际实现它），使用 service worker 通过预缓存构建好的 JS 和 CSS 来加速导航通常也是值得的。

在 SvelteKit 中，如果你有一个 `src/service-worker/index.ts` 文件，它将被打包并自动注册。

> [!NOTE] `src/service-worker.ts` 或 `.js` 同样有效，但请参阅下面关于[类型安全](#Type-safety) 一节的说明

## 在 service worker 内部

为了让 service worker 做任何有用的事情，你很可能需要导入一些东西：

- [`$app/service-worker`]($app-service-worker) 导出 `self`，它就是被标注为 [`ServiceWorkerGlobalScope`](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope) 类型的 `globalThis`（前提是你遵循了[这些步骤](#Type-safety)），这样你的 `fetch` 事件就有了正确的类型
- [`$app/env`]($app-env) 导出 `version`，它对于创建限定于某次部署的缓存很有用
- [`$app/manifest`]($app-manifest) 导出不可变的构建文件（`immutable`）、你的 `assets` 以及任何 `prerendered` 内容，让你可以填充缓存

一个典型的 service worker 可能看起来像这样：

```js
/// file: src/service-worker.js
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
// ---cut---
import { self } from '$app/service-worker';
import { version } from '$app/env';
import { immutable, assets } from '$app/manifest';
import { resolve } from '$app/paths';

// 为本次部署创建一个唯一的缓存名称
const CACHE = `cache-${version}`;

// 来自 `$app/manifest` 的 `immutable`/`assets` 路径是相对于 base 路径的，
// 因此请将它们解析为绝对路径名，以便在 `fetch` 处理程序中
// 与 `url.pathname` 进行匹配
const ASSETS = [
	...immutable.map((asset) => resolve(asset.path)), // Vite 输出
	...assets.map((asset) => resolve(asset.path))  // `static` 中的所有内容
];

self.addEventListener('install', (event) => {
	// 创建一个新的缓存并向其中添加所有文件
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	// 从磁盘中移除之前的缓存数据
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event) => {
	// 忽略 POST 请求等
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);

		// `immutable`/`assets` 总是可以从缓存中提供
		if (ASSETS.includes(url.pathname)) {
			const response = await cache.match(url.pathname);

			if (response) {
				return response;
			}
		}

		// 对于其他所有内容，先尝试网络……
		try {
			const response = await fetch(event.request);

			if (response.status === 200 && !response.headers.get('cache-control')?.includes('no-store')) {
				// ……并在后台缓存响应，供下次使用……
				void cache.put(event.request, response.clone());
			}

			return response;
		} catch (error) {
			// ……否则回退到之前缓存的数据（如果存在）……
			const response = await cache.match(event.request);

			if (response) {
				return response;
			}

			// ……或者抛出错误
			throw error;
		}
	}

	event.respondWith(respond());
});
```

> [!NOTE] 缓存时要小心！在某些情况下，过期数据可能比离线时无法获取数据更糟。由于浏览器在缓存过满时会清空缓存，你还应该注意不要缓存视频文件这样的大型资源。

## 类型安全

Service worker 运行在与应用其余部分不同的上下文中。因此，它们需要不同的类型。你应该确保项目的根 `tsconfig.json` 排除了你的 service worker 代码……

```json
/// file: tsconfig.json
{
	"extends": "$app/tsconfig",
	"include": ["src", "test"],
	"exclude": ["src/service-worker"]
}
```

……并且你的 `src/service-worker/index.ts` 文件旁边有一个单独的 `tsconfig.json`，它应该通过继承 [`$app/tsconfig/service-worker`]($app-tsconfig-service-worker) 来设置正确的类型：

```json
/// file: src/service-worker/tsconfig.json
{
	"extends": "$app/tsconfig/service-worker"
}
```

## 手动注册

如果你需要使用自己的逻辑注册 service worker，可以[禁用自动注册](@sveltejs-kit-vite#serviceWorker)。被注入到服务器渲染 HTML 中的默认注册看起来像这样：

```js
if ('serviceWorker' in navigator) {
	const script_url = './service-worker.js';
	const policy = globalThis?.window?.trustedTypes?.createPolicy(
		'sveltekit-trusted-url',
		{ createScriptURL(url) { return url; } }
	);
	const sanitised = policy?.createScriptURL(script_url) ?? script_url;
	addEventListener('load', function () {
		navigator.serviceWorker.register(sanitised, { type: 'module' });
	});
}
```

> [!NOTE] service worker 会为生产环境打包，但在开发期间不会。

## 更新 service worker

当在其作用域内发生整页导航时，以及诸如 `push` 和 `sync` 之类的功能事件之后，浏览器会检查是否有更新过的 service worker。客户端导航不属于这两种情况，因此在你的应用中四处导航本身并不会让新部署的 service worker 被采用。

SvelteKit 仅在错误恢复过程中调用 [`registration.update()`](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/update) —— 如果某个路由模块加载失败，或者导航导致错误状态，并且[版本轮询](@sveltejs-kit-vite#version)检测到应用已重新部署，那么在 SvelteKit 回退到整页导航之前，service worker 会被更新。

如果你希望更积极地采用新部署，你可以自己触发更新检查——例如在每次客户端导航时，在你的根布局中：

```js
import { afterNavigate } from '$app/navigation';

afterNavigate(async () => {
	if ('serviceWorker' in navigator) {
		const registration = await navigator.serviceWorker.getRegistration();
		await registration?.update();
	}
});
```

这不会导致新的 service worker（如果有的话）立即接管现有页面——相反，它会在后台安装，并在现有 service worker 管理的标签页数量降为零时立即接管。

## 其他解决方案

SvelteKit 的 service worker 实现被设计为易于使用，对大多数用户来说可能是一个不错的方案。不过，在 SvelteKit 之外，许多 PWA 应用会利用 [Workbox](https://web.dev/learn/pwa/workbox) 库。如果你习惯使用 Workbox，你可能会更喜欢 [Vite PWA 插件](https://vite-pwa-org.netlify.app/frameworks/sveltekit.html)。

## 参考资料

有关 service worker 的更一般信息，我们推荐 [MDN Web 文档](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)。
