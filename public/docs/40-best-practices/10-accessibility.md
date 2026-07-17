---
title: 可访问性
---

SvelteKit 默认致力于为你的应用提供一个可访问的平台。Svelte 的[编译时可访问性检查](../svelte/compiler-warnings)也会应用于你构建的任何 SvelteKit 应用。

以下是 SvelteKit 内置可访问性特性如何工作，以及你需要做些什么来让这些特性尽可能好地发挥作用。请记住，虽然 SvelteKit 提供了一个可访问的基础，你仍然有责任确保你的应用代码是可访问的。如果你对可访问性还不熟悉，请参阅本指南的[「延伸阅读」](accessibility#Further-reading)部分获取更多资源。

我们认识到可访问性可能很难做到完美。如果你想建议如何改进 SvelteKit 对可访问性的处理，请[提交一个 GitHub issue](https://github.com/sveltejs/kit/issues)。

## 路由播报

在传统的服务端渲染应用中，每次导航（例如点击 `<a>` 标签）都会触发整页重新加载。发生这种情况时，屏幕阅读器和其他辅助技术会读出新页面的标题，以便用户理解页面已发生变化。

由于在 SvelteKit 中页面间的导航是在不重新加载页面的情况下发生的（称为[客户端路由](glossary#Routing)），SvelteKit 会向页面注入一个[实时区域](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)，它会在每次导航后读出新页面的名称。这是通过检查 `<title>` 元素来确定要播报的页面名称的。

因此，你应用中的每个页面都应该有一个唯一、描述性的标题。在 SvelteKit 中，你可以通过在每个页面上放置一个 `<svelte:head>` 元素来做到这一点：

```svelte
<!--- file: src/routes/+page.svelte --->
<svelte:head>
	<title>Todo List</title>
</svelte:head>
```

这将允许屏幕阅读器和其他辅助技术在导航发生后识别出新页面。提供描述性标题对于 [SEO](seo#Manual-setup-title-and-meta) 也很重要。

## 焦点管理

在传统的服务端渲染应用中，每次导航都会将焦点重置到页面顶部。这确保了使用键盘或屏幕阅读器浏览网页的人会从页面开头开始与页面交互。

为了在客户端路由期间模拟这种行为，SvelteKit 在每次导航和[增强型表单提交](form-actions#Progressive-enhancement)后将焦点聚焦到 `<body>` 元素上。有一个例外——如果存在带有 [`autofocus`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autofocus) 属性的元素，SvelteKit 会聚焦该元素而非 `<body>`。使用该属性时，请确保[考虑对辅助技术的影响](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autofocus#accessibility_considerations)。

如果你想自定义 SvelteKit 的焦点管理，可以使用 `afterNavigate` 钩子：

```js
/// <reference types="@sveltejs/kit" />
// ---cut---
import { afterNavigate } from '$app/navigation';

afterNavigate(() => {
	/** @type {HTMLElement | null} */
	const to_focus = document.querySelector('.focus-me');
	to_focus?.focus();
});
```

你也可以使用 [`goto`]($app-navigation#goto) 函数以编程方式导航到不同的页面。默认情况下，这与点击链接具有相同的客户端路由行为。不过，`goto` 也接受一个 `keepFocus` 选项，该选项会保留当前聚焦的元素而非重置焦点。如果你启用此选项，请确保当前聚焦的元素在导航后仍然存在于页面上。如果该元素不再存在，用户的焦点将会丢失，从而给辅助技术用户带来困惑的体验。

## "lang" 属性

默认情况下，SvelteKit 的页面模板将文档的默认语言设为英语。如果你的内容不是英文，你应该更新 `src/app.html` 中的 `<html>` 元素，使其具有正确的 [`lang`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang#accessibility) 属性。这将确保任何读取文档的辅助技术都使用正确的发音。例如，如果你内容是德语，你应该将 `app.html` 更新如下：

```html
/// file: src/app.html
<html lang="de">
```

如果你的内容有多种语言可用，你应该根据当前页面的语言设置 `lang` 属性。你可以通过 SvelteKit 的 [handle 钩子](hooks#Server-hooks-handle) 来做到这一点：

```html
/// file: src/app.html
<html lang="%lang%">
```

```js
/// file: src/hooks.server.js
// @filename: utils.ts
export function get_lang(event: import('@sveltejs/kit').RequestEvent) {
	return 'en';
}

// @filename: hooks.server.js
import { get_lang } from './utils';
// ---cut---
/** @type {import('@sveltejs/kit').Handle} */
export function handle({ event, resolve }) {
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', get_lang(event))
	});
}
```

## 延伸阅读

在大多数情况下，构建一个可访问的 SvelteKit 应用与构建一个可访问的 Web 应用是一样的。你应该能够将以下通用可访问性资源中的信息应用到你构建的任何 Web 体验中：

- [MDN Web Docs：可访问性](https://developer.mozilla.org/en-US/docs/Learn/Accessibility)
- [The A11y Project](https://www.a11yproject.com/)
- [如何满足 WCAG（快速参考）](https://www.w3.org/WAI/WCAG21/quickref/)
