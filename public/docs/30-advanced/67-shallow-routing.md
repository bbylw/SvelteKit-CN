---
title: 页面状态与浅路由
---

当你在 SvelteKit 应用中导航时，你会创建_历史记录条目（history entries）_。点击后退和前进按钮会遍历这个条目列表，重新运行任何 `load` 函数、替换页面组件，并按需更新滚动位置和焦点元素。

有时，在不执行完整导航的情况下创建历史记录条目是很有用的。我们称之为_浅路由（shallow routing）_。

例如，你可能想显示一个模态对话框，用户可以通过后退来关闭它。这在移动设备上尤其有价值，因为滑动手势通常比直接与 UI 交互更自然。在这些情况下，_未_与历史记录条目关联的模态框可能会令人沮丧，因为用户可能会向后滑动试图关闭它，却发现自己到了错误的页面。

SvelteKit 通过 [`goto`]($app-navigation#goto) 函数实现这一点：使用 `shallow: true` 选项，它允许你将状态与历史记录条目关联，而无需导航：

```svelte
<!--- file: +page.svelte --->
<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Modal from './Modal.svelte';

	function showModal() {
		goto('', {
			state: { showModal: true },
			shallow: true
		});
	}
</script>

<button onclick={showModal}>打开</button>

{#if page.state.showModal}
	<Modal close={() => history.back()} />
{/if}
```

状态可以通过 [page 对象]($app-state#page) 以 `page.state` 的形式全局访问。你可以通过声明 [`App.PageState`](types#PageState) 接口（通常在 `src/app.d.ts` 中）来使页面状态具有类型安全。

模态框可以通过后退导航（取消设置 `page.state.showModal`）来关闭，也可以通过以某种方式与它交互来关闭，从而触发 `close` 回调，该回调会以编程方式后退导航。

在浅导航期间，你也可以更新浏览器地址栏的内容：

```js
import { goto } from '$app/navigation';
const state = { active: true };
// ---cut---
goto('/another/page', {
	state,
	shallow: true
});
```

> [!NOTE] 如果用户重新加载，他们会落在 `/another/page`，而_不是_当前渲染的页面——请参阅[注意事项](#Caveats)。

无论你是否选择更新可见的 URL，[`beforeNavigate`]($app-navigation#beforeNavigate)、[`onNavigate`]($app-navigation#onNavigate) 和 [`afterNavigate`]($app-navigation#afterNavigate) 都会以 `navigation.type === 'goto'` 和 `navigation.shallow === true` 运行。

一旦浅路由处于活动状态，`page.shallow` 就会变成一个 `{ url, params, route }` 对象，描述如果用户导航到那里（例如重新加载页面时会发生的情况）_将会_渲染的页面。`page.url`、`page.params` 和 `page.route` 继续描述当前渲染的页面。

```svelte
<!--- file: +page.svelte --->
<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
</script>

<p>用户可见的 URL 是 {page.shallow?.url.href ?? page.url.href}</p>
<p>你实际所在的页面是 {page.url.href}</p>

<button onclick={() => goto('/shallow', { shallow: true })}>进入浅路由</button>
```

不带 `shallow: true` 的常规 `goto` 调用或标准链接点击会退出浅路由。

后退或前进到某个浅路由条目会恢复它的 `page.state` 和 `page.shallow`。渲染的页面（因而 `page.url`）仍然是调用 `goto` 时用户所在的页面。要导航到可见的 URL，请在不带 `shallow: true` 的情况下调用 `goto(page.shallow.url)`。

> [!LEGACY]
> 在 SvelteKit 2 中，此功能是通过 `pushState` 和 `replaceState` 实现的，它们现在已被弃用。请改用带 `shallow: true` 的 `goto`，并在替换当前历史记录条目时使用 `replace` 选项。

## 路由选项

默认情况下，上面的示例会在历史栈中创建一个新的导航条目。如果你不想这样，可以改为替换现有的导航条目：

```js
import { goto } from '$app/navigation';
const url = new URL('https://example.com');
const state = { showModal: true };
// ---cut---
goto(url, {
	state,
	replace: true
});
```

默认情况下，使用 `goto` 设置的状态在重新加载后不会恢复。要改变这一点，请使用 `persistState`：

```js
import { goto } from '$app/navigation';
const url = new URL('https://example.com');
const state = { showModal: true };
// ---cut---
goto(url, {
	state,
	persistState: true
});
```

浅导航默认会保留当前的滚动位置和焦点元素。你可以使用 `reset: true` 退出此行为：

```js
import { goto } from '$app/navigation';
const url = new URL('https://example.com');
// ---cut---
goto(url, {
	shallow: true,
	reset: true
});
```

> [!NOTE]
> `page.state` 只有在 JavaScript 加载后才会被填充，这可能导致 UI 闪烁。请谨慎使用。

## 为路由加载数据

进行浅路由时，你可能想在当前页面内渲染另一个 `+page.svelte`。例如，点击照片缩略图可以在不导航到照片页面的情况下弹出详情视图。

为此，你需要加载 `+page.svelte` 所期望的数据。一种方便的方法是在 `<a>` 元素的 `click` 处理程序中使用 [`preloadData`]($app-navigation#preloadData)。如果该元素（或父元素）使用了 [`data-sveltekit-preload-data`](link-options#data-sveltekit-preload-data)，那么数据已经请求过了，`preloadData` 会复用该请求。

```svelte
<!--- file: src/routes/photos/+page.svelte --->
<script>
	import { preloadData, goto } from '$app/navigation';
	import { page } from '$app/state';
	import Modal from './Modal.svelte';
	import PhotoPage from './[id]/+page.svelte';

	let { data } = $props();
</script>

{#each data.thumbnails as thumbnail}
	<a
		href="/photos/{thumbnail.id}"
		onclick={async (e) => {
			if (innerWidth < 640        // 屏幕太小时退出
				|| e.shiftKey             // 或者链接在新窗口中打开
				|| e.metaKey || e.ctrlKey // 或者在新标签页中打开（mac: metaKey，win/linux: ctrlKey）
				// 还应该考虑使用鼠标滚轮点击
			) return;

			// 阻止导航
			e.preventDefault();

			const { href } = e.currentTarget;

			// 运行 `load` 函数（或者更确切地说，获取由于 `data-sveltekit-preload-data`
			// 已经在运行的 `load` 函数的结果）
			const result = await preloadData(href);

			if (result.type === 'loaded' && result.status === 200) {
				goto(href, { shallow: true, state: { selected: result.data } });
			} else {
				// 出了点问题！尝试导航
				goto(href);
			}
		}}
	>
		<img alt={thumbnail.alt} src={thumbnail.src} />
	</a>
{/each}

{#if page.state.selected}
	<Modal onclose={() => history.back()}>
		<!-- 将页面数据传递给 +page.svelte 组件，
		     就像 SvelteKit 在导航时所做的那样 -->
		<PhotoPage data={page.state.selected} />
	</Modal>
{/if}
```

## 注意事项

浅路由需要 JavaScript。使用时请留意，并尽量考虑在 JavaScript 不可用时的合理回退行为。

服务器对历史状态一无所知。因此，在 SSR 期间 `page.state` 是空对象，重新加载会直接导航到之前的 `page.shallow.url`（如果存在的话）。换句话说，如果重新加载前 `page.shallow.url.pathname` 是 `/photos/123`，那么重新加载后 `page.url.pathname` 将是 `/photos/123`，而 `page.shallow` 将是 `null`，无论 `persistState` 选项如何。（这只适用于初始页面加载，以避免客户端应用启动时 UI 闪烁。）
