---
title: Service workers
---

Service worker 充当处理应用内部网络请求的代理服务器。这使得你的应用可以离线工作，但即使你不需要离线支持（或者由于你正在构建的应用类型而无法实际实现它），使用 service worker 通过预缓存构建的 JS 和 CSS 来加速导航通常也是值得的。

在 SvelteKit 中，如果你有一个 `src/service-worker.js` 文件（或 `src/service-worker/index.js`），它会被打包并自动注册。

## service worker 内部

在 service worker 内部，你可以访问 [`$service-worker` 模块]($service-worker)，它为你提供所有静态资源、构建文件和预渲染页面的路径。你还会获得一个应用版本字符串（可用于创建唯一的缓存名称），以及部署的 `base` 路径。如果你的 Vite 配置指定了 `define`（用于全局变量替换），它也会应用于 service worker 以及你的服务器/客户端构建。

以下示例急切地缓存了构建的应用和 `static` 中的所有文件，并在其他请求发生时对其进行缓存。这将使每个页面在被访问过一次后都能离线工作。

```js
// @errors: 2688
/// file: src/service-worker.js
// Disables access to DOM typings like `HTMLElement` which are not available
// inside a service worker and instantiates the correct globals
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// Ensures that the `$service-worker` import has proper type definitions
/// <reference types="@sveltejs/kit" />

// Only necessary if you have an import from `$app/env/*`
/// <reference types="../.svelte-kit/env.d.ts" />

import { build, files, version } from '$service-worker';

// This gives `self` the correct types
const self = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (globalThis.self));

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ASSETS = [
	...build, // the app itself
	...files  // everything in `static`
];

self.addEventListener('install', (event) => {
	// Create a new cache and add all files to it
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	// Remove previous cached data from disk
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event) => {
	// ignore POST requests etc
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);

		// `build`/`files` can always be served from the cache
		if (ASSETS.includes(url.pathname)) {
			const response = await cache.match(url.pathname);

			if (response) {
				return response;
			}
		}

		// for everything else, try the network first, but
		// fall back to the cache if we're offline
		try {
			const response = await fetch(event.request);

			// if we're offline, fetch can return a value that is not a Response
			// instead of throwing - and we can't pass this non-Response to respondWith
			if (!(response instanceof Response)) {
				throw new Error('invalid response from fetch');
			}

			if (response.status === 200 && !response.headers.get('cache-control')?.includes('no-store')) {
				cache.put(event.request, response.clone());
			}

			return response;
		} catch (err) {
			const response = await cache.match(event.request);

			if (response) {
				return response;
			}

			// if there's no cache, then just error out
			// as there is nothing we can do to respond to this request
			throw err;
		}
	}

	event.respondWith(respond());
});
```

> [!NOTE] 缓存时要小心！在某些情况下，陈旧的数据可能比离线时无法获取的数据更糟糕。由于浏览器在缓存太满时会清空缓存，你还应该谨慎缓存像视频文件这样的大型资源。

> [!NOTE] 在开发期间，`build` 和 `prerendered` 是空数组

## 手动注册

如果你需要用自己的逻辑注册 service worker，可以[禁用自动注册](configuration#serviceWorker)。默认注册看起来像这样：

```js
if ('serviceWorker' in navigator) {
	addEventListener('load', function () {
		navigator.serviceWorker.register('./path/to/service-worker.js', {
			type: 'module'
		});
	});
}
```

> [!NOTE] service worker 会为生产环境打包，但在开发期间不会。

## 更新 service worker

当在其作用域内发生整页导航时，以及在诸如 `push` 和 `sync` 等功能性事件之后，浏览器会检查是否有更新的 service worker。客户端导航两者都不是，因此在你的应用中导航本身不会导致新部署的 service worker 被采用。

SvelteKit 仅在错误恢复过程中调用 [`registration.update()`](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/update) —— 如果某个路由模块加载失败，或者导航导致错误状态，并且[版本轮询](configuration#version)检测到应用已重新部署，那么在 SvelteKit 回退到整页导航之前，service worker 会被更新。

如果你希望更急切地采用新部署，你可以自己触发一次更新检查 —— 例如在每次客户端导航时，在你的根布局中：

```js
import { afterNavigate } from '$app/navigation';

afterNavigate(async () => {
	if ('serviceWorker' in navigator) {
		const registration = await navigator.serviceWorker.getRegistration();
		await registration?.update();
	}
});
```

这不会使新的 service worker（如果有的话）立即接管现有页面 —— 相反，它会在后台安装，并在由现有 service worker 管理的标签页数量降为零时立即接管。

## 其他解决方案

SvelteKit 的 service worker 实现旨在易于使用，对大多数用户来说可能是一个不错的解决方案。然而，在 SvelteKit 之外，许多 PWA 应用利用 [Workbox](https://web.dev/learn/pwa/workbox) 库。如果你习惯使用 Workbox，你可能更喜欢 [Vite PWA 插件](https://vite-pwa-org.netlify.app/frameworks/sveltekit.html)。

## 参考资料

关于 service worker 的更多一般性信息，我们推荐 [MDN web 文档](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)。
