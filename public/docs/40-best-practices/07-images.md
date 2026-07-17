---
title: 图片
---

图片会对你应用的性能产生很大影响。为了获得最佳效果，你应通过以下方式优化它们：

- 生成 `.avif` 和 `.webp` 等最佳格式
- 为不同屏幕创建不同尺寸
- 确保资源能够被有效缓存

手动完成这些工作很繁琐。根据你的需求和偏好，有多种技术可供使用。

## Vite 的内置处理

[Vite 会自动处理导入的资源](https://vitejs.dev/guide/assets.html)以提升性能。这包括通过 CSS `url()` 函数引用的资源。文件名会被加上哈希以便缓存，小于 `assetsInlineLimit` 的资源会被内联。Vite 的资源处理最常用于图片，但也适用于视频、音频等。

```svelte
<script>
	import logo from '#lib/assets/logo.png';
</script>

<img alt="The project logo" src={logo} />
```

## @sveltejs/enhanced-img

`@sveltejs/enhanced-img` 是建立在 Vite 内置资源处理之上的一个插件。它提供即插即用的图片处理，能生成 `avif`、`webp` 等更小的文件格式，自动设置图片的原始 `width` 和 `height` 以避免布局抖动（layout shift），为各种设备创建多种尺寸的图片，并剥离用于隐私保护的 EXIF 数据。它可用于任何基于 Vite 的项目，包括但不限于 SvelteKit 项目。

> [!NOTE] 作为一个构建插件，`@sveltejs/enhanced-img` 只能优化在构建过程中位于你机器上的文件。如果你的图片位于别处（例如由你的数据库、CMS 或后端提供的路径），请阅读[从 CDN 动态加载图片](#Loading-images-dynamically-from-a-CDN)。

### 设置

安装：

```sh
npm i -D @sveltejs/enhanced-img
```

调整 `vite.config.js`：

```js
/// file: vite.config.js
+++import { enhancedImages } from '@sveltejs/enhanced-img';+++
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		+++enhancedImages(), // must come before the SvelteKit plugin+++
		sveltekit({/* ... */})
	]
});
```

首次构建会花费更长时间，因为转换图片的计算开销较大。不过，构建输出会被缓存在 `./node_modules/.cache/imagetools` 中，因此后续构建会很快。

### 基本用法

在你的 `.svelte` 组件中使用 `<enhanced:img>` 而非 `<img>`，并通过 [Vite 资源导入](https://vitejs.dev/guide/assets.html#static-asset-handling) 路径引用图片文件：

```svelte
<enhanced:img src="./path/to/your/image.jpg" alt="An alt text" />
```

在构建时，你的 `<enhanced:img>` 标签会被替换为一个由 `<picture>` 包裹的 `<img>`，提供多种图片类型和尺寸。只能在不损失质量的前提下缩小图片，这意味着你应该提供你需要的最高分辨率图片——系统会为可能请求图片的各种设备类型生成更小的版本。

你应该为 HiDPI 显示屏（即视网膜屏）提供 2 倍分辨率的图片。`<enhanced:img>` 会自动为更小的设备提供更小的版本。

> [!NOTE] 如果你想在 `<style>` 块中使用[标签名 CSS 选择器](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Basic_selectors#type_selectors)，你需要写成 `enhanced\:img` 来转义标签名中的冒号。

### 动态选择图片

你也可以手动导入一个图片资源并将其传递给 `<enhanced:img>`。当你有一组静态图片并希望动态选择其中一个或[遍历它们](https://github.com/sveltejs/kit/blob/0ab1733e394b6310895a1d3bf0f126ce34531170/sites/kit.svelte.dev/src/routes/home/Showcase.svelte)时，这很有用。在这种情况下，你需要同时更新 `import` 语句和 `<img>` 元素，如下所示，以表明你想要处理它们。

```svelte
<script>
	import MyImage from './path/to/your/image.jpg?enhanced';
</script>

<enhanced:img src={MyImage} alt="some alt text" />
```

你也可以使用 [Vite 的 `import.meta.glob`](https://vitejs.dev/guide/features.html#glob-import)。注意，你需要通过[自定义查询](https://vitejs.dev/guide/features.html#custom-queries)来指定 `enhanced`：

```svelte
<script>
	const imageModules = import.meta.glob(
		'/path/to/assets/*.{avif,AVIF,gif,GIF,heif,HEIF,jpeg,JPEG,jpg,JPG,png,PNG,tiff,TIFF,webp,WEBP}',
		{
			eager: true,
			query: {
				enhanced: true
			}
		}
	)
</script>

{#each Object.entries(imageModules) as [_path, module]}
	<enhanced:img src={module.default} alt="some alt text" />
{/each}
```

> [!NOTE] svg 图片目前仅支持静态方式

### 原始尺寸

`width` 和 `height` 是可选的，因为它们可以从源图片推断出来，并在 `<enhanced:img>` 标签被预处理时自动添加。有了这些属性，浏览器可以预留正确的空间，防止[布局抖动](https://web.dev/articles/cls)。如果你想使用不同的 `width` 和 `height`，可以用 CSS 来设置图片样式。由于预处理器会自动为你添加 `width` 和 `height`，如果你想让其中一个维度自动计算，那么你需要显式指定另一个：

```svelte
<style>
	.hero-image img {
		width: var(--size);
		height: auto;
	}
</style>
```

### `srcset` 和 `sizes`

如果你有一张大图片，例如占据设计宽度的主视觉图（hero image），你应该指定 `sizes`，以便在更小的设备上请求更小的版本。例如，如果你有一张 1280px 的图片，你可能想指定类似如下内容：

```svelte
<enhanced:img src="./image.png" sizes="min(1280px, 100vw)"/>
```

如果指定了 `sizes`，`<enhanced:img>` 会为更小的设备生成更小的图片，并填充 `srcset` 属性。

自动生成的最小图片宽度为 540px。如果你想要更小的图片，或以其他方式指定自定义宽度，可以用 `w` 查询参数：

```svelte
<enhanced:img
	src="./image.png?w=1280;640;400"
	sizes="(min-width:1920px) 1280px, (min-width:1080px) 640px, (min-width:768px) 400px"
/>
```

如果未提供 `sizes`，则会生成一张 HiDPI/Retina 图片和一张标准分辨率图片。你提供的图片应该具有你想要显示的 2 倍分辨率，以便浏览器能在具有高[设备像素比](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio)的设备上显示该图片。

### 逐图转换

默认情况下，增强图片会被转换为更高效的格式。不过，你可能希望应用其他转换，例如模糊、质量调整、扁平化或旋转操作。你可以通过附加查询字符串来运行逐图转换：

```svelte
<enhanced:img src="./path/to/your/image.jpg?blur=15" alt="An alt text" />
```

[查看 imagetools 仓库获取完整的指令列表](https://github.com/JonasKruckenberg/imagetools/blob/main/docs/directives.md)。

## 从 CDN 动态加载图片

在某些情况下，图片在构建时可能无法访问——例如，它们可能位于内容管理系统（CMS）或其他地方。

使用内容分发网络（CDN）可以让你动态地优化这些图片，并在尺寸方面提供更大的灵活性，但它可能涉及一些配置开销和使用成本。根据缓存策略，在收到 CDN 返回的 [304 响应](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/304) 之前，浏览器可能无法使用资源的缓存副本。针对 CDN 构建 HTML 允许使用 `<img>` 标签，因为 CDN 可以根据 `User-Agent` 响应头提供合适的格式，而构建时的优化必须生成带有多个来源的 `<picture>` 标签。最后，一些 CDN 可能会懒生成图片，这对于流量低且图片频繁变化的站点可能会产生负面的性能影响。

CDN 通常无需任何库即可使用。不过，有许多支持 Svelte 的库让这件事更简单。[`@unpic/svelte`](https://unpic.pics/img/svelte/) 是一个与 CDN 无关的库，支持大量提供商。你可能还会发现像 [Cloudinary](https://svelte.cloudinary.dev/) 这样的特定 CDN 也有 Svelte 支持。最后，一些支持 Svelte 的内容管理系统（CMS），如 [Contentful](https://www.contentful.com/sveltekit-starter-guide/)、[Storyblok](https://www.storyblok.com/docs/guides/svelte) 和 [Contentstack](https://www.contentstack.com/docs/developers/sample-apps/build-a-starter-website-with-sveltekit-and-contentstack)，都内置了对图片处理的支持。

## 最佳实践

- 对于每种图片类型，使用上面讨论过的合适方案。你可以在一个项目中混用和搭配这三种方案。例如，你可以用 Vite 的内置处理为 `<meta>` 标签提供图片，用 `@sveltejs/enhanced-img` 在首页展示图片，并用动态方式展示用户提交的内容。
- 无论你使用哪种图片优化类型，都考虑通过 CDN 提供所有图片。CDN 通过在全球分发静态资源的副本以降低延迟。
- 你的原始图片应具有良好的质量/分辨率，并且宽度应该是显示宽度的 2 倍，以便服务于 HiDPI 设备。图片处理可以在服务更小屏幕时缩小图片以节省带宽，但凭空制造像素来放大图片则是一种带宽浪费。
- 对于远大于移动设备宽度（约 400px）的图片，例如占据页面设计宽度的主视觉图，指定 `sizes` 以便在更小的设备上提供更小的图片。
- 对于重要图片，例如 [最大内容绘制（LCP）](https://web.dev/articles/lcp) 图片，设置 `fetchpriority="high"` 并避免使用 `loading="lazy"`，以尽可能早地优先加载。
- 给图片一个容器或样式，使其受约束，并且在页面加载时不会跳动，从而影响你的[累积布局抖动（CLS）](https://web.dev/articles/cls)。`width` 和 `height` 能帮助浏览器在图片仍在加载时预留空间，因此 `@sveltejs/enhanced-img` 会为你添加 `width` 和 `height`。
- 始终提供良好的 `alt` 文本。如果你不这样做，Svelte 编译器会发出警告。
- 不要在 `sizes` 中使用 `em` 或 `rem` 并更改这些度量的默认大小。当用于 `sizes` 或 `@media` 查询时，`em` 和 `rem` 都被定义为表示用户的默认 `font-size`。对于一个像 `sizes="(min-width: 768px) min(100vw, 108rem), 64rem"` 这样的 `sizes` 声明，如果通过 CSS 更改，实际控制图片在页面上布局方式的 `em` 或 `rem` 可能会不同。例如，不要做像 `html { font-size: 62.5%; }` 这样的事，因为浏览器预加载器预留的插槽在创建后最终会比 CSS 对象模型的实际插槽更大。
