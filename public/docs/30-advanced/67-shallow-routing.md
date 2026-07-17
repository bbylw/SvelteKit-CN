---
title: 浅层路由
---

当你在 SvelteKit 应用中导航时，你会创建*历史条目*。点击后退和前进按钮会遍历这个条目列表，重新运行任何 `load` 函数并根据需要替换页面组件。

有时，*不*进行导航就创建历史条目会很有用。例如，你可能想显示一个用户可以通过导航返回来关闭的模态对话框。这在移动设备上尤其有价值，因为滑动手势通常比直接与 UI 交互更自然。在这些情况下，一个*没有*与历史条目相关联的模态框可能成为挫败感的来源，因为用户可能会尝试向后滑动来关闭它，结果却发现自己到了错误的页面。

SvelteKit 通过 [`pushState`]($app-navigation#pushState) 和 [`replaceState`]($app-navigation#replaceState) 函数使这成为可能，它们允许你在不导航的情况下将状态与历史条目相关联。例如，要实现一个由历史驱动的模态框：

```svelte
<!--- file: +page.svelte --->
<script>
	import { pushState } from '$app/navigation';
	import { page } from '$app/state';
	import Modal from './Modal.svelte';

	function showModal() {
		pushState('', {
			showModal: true
		});
	}
</script>

{#if page.state.showModal}
	<Modal close={() => history.back()} />
{/if}
```

可以通过导航返回（取消设置 `page.state.showModal`）来关闭模态框，或者通过以导致 `close` 回调运行的方式与其交互来关闭，后者会以编程方式导航返回。

## API

`pushState` 的第一个参数是 URL，相对于当前 URL。要停留在当前 URL 上，使用 `''`。

第二个参数是新的页面状态，可以通过 [page 对象]($app-state#page) 以 `page.state` 访问。你可以通过声明一个 [`App.PageState`](types#PageState) 接口（通常在 `src/app.d.ts` 中）来使页面状态类型安全。

要在不创建新历史条目的情况下设置页面状态，请使用 `replaceState` 而不是 `pushState`。

## 为路由加载数据

进行浅层路由时，你可能想在当前页面内部渲染另一个 `+page.svelte`。例如，点击照片缩略图可以弹出详情视图，而无需导航到照片页面。

为此，你需要加载 `+page.svelte` 所期望的数据。一种便捷的方法是在 `<a>` 元素的 `click` 处理器内部使用 [`preloadData`]($app-navigation#preloadData)。如果该元素（或某个父元素）使用了 [`data-sveltekit-preload-data`](link-options#data-sveltekit-preload-data)，那么数据将已经被请求，`preloadData` 会复用该请求。

```svelte
<!--- file: src/routes/photos/+page.svelte --->
<script>
	import { preloadData, pushState, goto } from '$app/navigation';
	import { page } from '$app/state';
	import Modal from './Modal.svelte';
	import PhotoPage from './[id]/+page.svelte';

	let { data } = $props();
</script>

{#each data.thumbnails as thumbnail}
	<a
		href="/photos/{thumbnail.id}"
		onclick={async (e) => {
			if (innerWidth < 640        // bail if the screen is too small
				|| e.shiftKey             // or the link is opened in a new window
				|| e.metaKey || e.ctrlKey // or a new tab (mac: metaKey, win/linux: ctrlKey)
				// should also consider clicking with a mouse scroll wheel
			) return;

			// prevent navigation
			e.preventDefault();

			const { href } = e.currentTarget;

			// run `load` functions (or rather, get the result of the `load` functions
			// that are already running because of `data-sveltekit-preload-data`)
			const result = await preloadData(href);

			if (result.type === 'loaded' && result.status === 200) {
				pushState(href, { selected: result.data });
			} else {
				// something bad happened! try navigating
				goto(href);
			}
		}}
	>
		<img alt={thumbnail.alt} src={thumbnail.src} />
	</a>
{/each}

{#if page.state.selected}
	<Modal onclose={() => history.back()}>
		<!-- pass page data to the +page.svelte component,
		     just like SvelteKit would on navigation -->
		<PhotoPage data={page.state.selected} />
	</Modal>
{/if}
```

## 注意事项

在服务器端渲染期间，`page.state` 始终是一个空对象。用户着陆的第一个页面也是如此 —— 如果用户重新加载页面（或从另一个文档返回），在他们导航之前状态*不会*被应用。

浅层路由是一个需要 JavaScript 才能工作的功能。使用它时请留意，并尽量在 JavaScript 不可用的情况下考虑合理的回退行为。
