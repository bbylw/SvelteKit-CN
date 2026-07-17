---
title: 快照
---

短暂的 DOM 状态 —— 如侧边栏的滚动位置、`<input>` 元素的内容等 —— 会在你从一个页面导航到另一个页面时被丢弃。

例如，如果用户填写了表单，但在提交之前导航离开然后再返回，或者用户刷新了页面，他们填写的值将会丢失。在需要保留这类输入的情况下，你可以对 DOM 状态进行*快照*，然后在用户导航返回时恢复它。

为此，从 `+page.svelte` 或 `+layout.svelte` 导出一个带有 `capture` 和 `restore` 方法的 `snapshot` 对象：

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

<form method="POST">
	<label for="comment">Comment</label>
	<textarea id="comment" bind:value={comment} />
	<button>Post comment</button>
</form>
```

当你从此页面导航离开时，`capture` 函数会在页面更新之前立即被调用，返回的值会与浏览器历史堆栈中的当前条目相关联。如果你导航返回，页面更新后会立即用存储的值调用 `restore` 函数。

数据必须能序列化为 JSON，以便可以持久化到 `sessionStorage`。这使得在页面重新加载时，或用户从其他站点返回时，状态能够被恢复。

> [!NOTE] 避免从 `capture` 返回非常大的对象 —— 一旦被捕获，对象会在整个会话期间保留在内存中，在极端情况下可能太大而无法持久化到 `sessionStorage`。
