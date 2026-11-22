---
title: 快照
---

短暂的 DOM 状态——例如侧边栏的滚动位置、`<input>` 元素的内容等等——在从一个页面导航到另一个页面时会被丢弃。

例如，如果用户填写了表单，但在提交之前导航离开又返回，或者用户刷新了页面，他们填写的值就会丢失。在有必要保留这些输入的情况下，你可以对 DOM 状态进行_快照（snapshot）_，如果用户导航回来，就可以恢复它。

为此，请在组件初始化期间从 `$app/navigation` 调用 `snapshot`：

```svelte
<!--- file: +page.svelte --->
<script>
	import { snapshot } from '$app/navigation';

	let comment = $state('');

	snapshot({
		capture: () => comment,
		restore: (value) => (comment = value)
	});
</script>

<form method="POST">
	<label for="comment">评论</label>
	<textarea id="comment" bind:value={comment} />
	<button>发表评论</button>
</form>
```

当你离开此页面时——包括通过[浅路由](shallow-routing) 离开——`capture` 函数会在页面更新之前立即被调用，返回的值会与浏览器历史栈中的当前条目关联。如果你导航回来，`restore` 函数会在页面更新后立即以存储的值被调用。

快照必须有一个唯一的 ID，才能在组件重新挂载和页面重新加载后继续存在。默认情况下，该 ID 在调用 `snapshot(...)` 时根据堆栈跟踪生成，但你也可以显式提供一个 `id`，例如让快照在部署之间保持稳定（即使由于源代码变化导致堆栈跟踪不同），或者用于区分通过共享包装函数创建的或在同一个组件的多个实例中创建的快照：

```js
import { snapshot } from '$app/navigation';

let comment = '';

// ---cut---
snapshot({
	+++id: 'comment',+++
	capture: () => comment,
	restore: (value) => (comment = value)
});
```

可选的 `reset` 回调会在没有可恢复的捕获值的导航中运行，例如创建新的历史记录条目时。

捕获的值使用 [devalue](https://github.com/sveltejs/devalue) 进行序列化，它处理 JSON、像 `Date` 和 `Map` 这样的对象，以及你在 [`transport`](hooks#transport) 钩子中指定的自定义类型。序列化后的数据会持久化到 `sessionStorage`，这使得页面重新加载或用户从其他站点导航回来时可以恢复状态。

> [!NOTE] 避免从 `capture` 返回非常大的对象——一旦被捕获，对象将在会话期间保留在内存中，极端情况下可能太大而无法持久化到 `sessionStorage`。

## export const snapshot

> [!LEGACY]
> 以前，快照是通过从 `+page.svelte` 或 `+layout.svelte` 导出带有 `capture` 和 `restore` 方法的 `snapshot` 对象来创建的。这种形式已被弃用，取而代之的是可以从任何组件调用的 `snapshot` 辅助函数。

```svelte
<!--- file: +page.svelte --->
<script>
	let comment = $state('');

	/** @type {import('./$types').Snapshot<string>} */
	export const snapshot = {
		capture: () => comment,
		restore: (value) => comment = value
	};
</script>
```

以这种方式捕获的值会序列化为 JSON，并且浅导航不会捕获它们。
