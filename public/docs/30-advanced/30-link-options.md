---
title: 链接选项
---

在 SvelteKit 中，使用 `<a>` 元素（而不是框架特定的 `<Link>` 组件）在应用的各个路由之间进行导航。如果用户点击了一个 `href` 由应用「拥有」的链接（相对于指向外部站点的链接），那么 SvelteKit 会通过导入其代码并调用它需要的任何 `load` 函数来获取数据，从而导航到新页面。

你可以用 `data-sveltekit-*` 属性来自定义链接的行为。这些属性可以应用于 `<a>` 本身，或应用于某个父元素。

这些选项也适用于带有 [`method="GET"`](form-actions#GET-vs-POST) 的 `<form>` 元素。

## data-sveltekit-preload-data

在浏览器注册到用户已点击某个链接之前，我们可以检测到他们已将鼠标悬停在链接上（在桌面端），或者触发了 `touchstart` 或 `mousedown` 事件。在这两种情况下，我们都可以有根据地推测 `click` 事件即将到来。

SvelteKit 可以利用这些信息，提前开始导入代码并获取页面数据，这可以为我们赢得额外的几百毫秒 —— 这正是让用户界面感觉卡顿还是感觉流畅之间的差别。

我们可以用 `data-sveltekit-preload-data` 属性来控制这种行为，它可以有以下两个值之一：

- `"hover"` 表示当鼠标停在链接上时开始预加载。在移动端，预加载在 `touchstart` 时开始
- `"tap"` 表示一旦注册到 `touchstart` 或 `mousedown` 事件就开始预加载

默认项目模板在 `src/app.html` 的 `<body>` 元素上应用了 `data-sveltekit-preload-data="hover"` 属性，这意味着默认情况下每个链接都会在悬停时预加载：

```html
<body data-sveltekit-preload-data="hover">
	<div style="display: contents">%sveltekit.body%</div>
</body>
```

有时，在用户悬停于链接上时就调用 `load` 可能并不理想，因为这很可能导致误判（悬停之后不一定跟着点击），或者因为数据更新非常快，延迟可能意味着数据陈旧。

在这些情况下，你可以指定 `"tap"` 值，这会使 SvelteKit 仅在用户轻触或点击链接时才调用 `load`：

```html
<a data-sveltekit-preload-data="tap" href="/stonks">
	Get current stonk values
</a>
```

> [!NOTE] 你也可以从 `$app/navigation` 以编程方式调用 `preloadData`。

如果用户选择了减少数据用量，即 [`navigator.connection.saveData`](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/saveData) 为 `true`，则数据永远不会被预加载。

## data-sveltekit-preload-code

即使在你不想为某个链接预加载*数据*的情况下，预加载*代码*也可能是有益的。`data-sveltekit-preload-code` 属性的工作方式与 `data-sveltekit-preload-data` 类似，不同之处在于它可以取四个值之一，按「急切程度」递减排列：

- `"eager"` 表示链接会立即被预加载
- `"viewport"` 表示链接进入视口后会被预加载
- `"hover"` - 同上，但只预加载代码
- `"tap"` - 同上，但只预加载代码

请注意，`viewport` 和 `eager` 仅适用于导航后立即出现在 DOM 中的链接 —— 如果某个链接是后来添加的（例如在 `{#if ...}` 块中），那么在被 `hover` 或 `tap` 触发之前它不会被预加载。这是为了避免因积极地观察 DOM 变化而导致的性能陷阱。

> [!NOTE] 由于预加载代码是预加载数据的前提，因此只有当该属性指定的值比任何存在的 `data-sveltekit-preload-data` 属性更急切时，它才会产生效果。

与 `data-sveltekit-preload-data` 一样，如果用户选择了减少数据用量，此属性将被忽略。

## data-sveltekit-reload

有时，我们需要告诉 SvelteKit 不要处理某个链接，而是让浏览器来处理它。向链接添加 `data-sveltekit-reload` 属性……

```html
<a data-sveltekit-reload href="/path">Path</a>
```

……会导致点击链接时进行整页导航。

带有 `rel="external"` 属性的链接会受到相同的处理。此外，它们在[预渲染](page-options#prerender)期间会被忽略。

## data-sveltekit-replacestate

有时你不希望导航在浏览器的会话历史记录中创建新条目。向链接添加 `data-sveltekit-replacestate` 属性……

```html
<a data-sveltekit-replacestate href="/path">Path</a>
```

……会在点击链接时替换当前的 `history` 条目，而不是用 `pushState` 创建新条目。

## data-sveltekit-keepfocus

有时你不希望导航后[焦点被重置](accessibility#Focus-management)。例如，也许你有一个在用户输入时提交的搜索表单，并且你想让焦点保持在文本输入框上。向它添加 `data-sveltekit-keepfocus` 属性……

```html
<form data-sveltekit-keepfocus>
	<input type="text" name="query">
</form>
```

……会使当前聚焦的元素在导航后保持焦点。一般来说，避免在链接上使用此属性，因为聚焦的元素将是 `<a>` 标签（而不是之前聚焦的元素），而屏幕阅读器和其他辅助技术的用户通常期望焦点在导航后被移动。你还应该只在导航后仍然存在的元素上使用此属性。如果该元素不再存在，用户的焦点将丢失，从而给辅助技术用户带来困惑的体验。

## data-sveltekit-noscroll

当导航到内部链接时，SvelteKit 会镜像浏览器的默认导航行为：它会将滚动位置更改为 0,0，使用户位于页面的最左上角（除非链接包含 `#hash`，在这种情况下它会滚动到具有匹配 ID 的元素）。

在某些情况下，你可能希望禁用此行为。向链接添加 `data-sveltekit-noscroll` 属性……

```html
<a href="path" data-sveltekit-noscroll>Path</a>
```

……会在点击链接后阻止滚动。

## 禁用选项

要在已启用这些选项的元素内部禁用其中任何一个，请使用 `"false"` 值：

```html
<div data-sveltekit-preload-data>
	<!-- these links will be preloaded -->
	<a href="/a">a</a>
	<a href="/b">b</a>
	<a href="/c">c</a>

	<div data-sveltekit-preload-data="false">
		<!-- these links will NOT be preloaded -->
		<a href="/d">d</a>
		<a href="/e">e</a>
		<a href="/f">f</a>
	</div>
</div>
```

要有条件地将属性应用于元素，请这样做：

```svelte
<div data-sveltekit-preload-data={condition ? 'hover' : false}>
```
