---
title: 打包发布
---

你可以使用 SvelteKit 来构建应用，也可以用 `@sveltejs/package` 包来构建组件库（`npx sv create` 提供了一个选项帮你完成这项设置）。

当你在创建一个应用时，`src/routes` 的内容是面向公众的部分；而 [`src/lib`]($lib) 则包含你应用内部的库代码。

一个组件库的结构与 SvelteKit 应用完全一致，区别在于 `src/lib` 是面向公众的部分，而你根目录的 `package.json` 则用于发布这个包。`src/routes` 可能是伴随该库一起提供的文档或演示站点，也可能只是你在开发过程中使用的一个沙盒。

运行 `@sveltejs/package` 提供的 `svelte-package` 命令，会取出 `src/lib` 的内容并生成一个 `dist` 目录（可通过 [配置](#Options) 修改），其中包含以下内容：

- `src/lib` 中的所有文件。Svelte 组件会被预处理，TypeScript 文件会被转译为 JavaScript。
- 为 Svelte、JavaScript 和 TypeScript 文件生成的类型定义（`d.ts` 文件）。为此你需要安装 `typescript >= 4.0.0`。类型定义会被放置在对应实现的旁边，手写的 `d.ts` 文件则会原样复制过来。你可以[禁用生成](#Options)，但我们强烈建议不要这样做——使用你库的人可能会用到 TypeScript，而他们需要这些类型定义文件。

> [!NOTE] `@sveltejs/package` 1.x 版本会生成一个 `package.json`。现在不再是这样了，它会使用你项目中的 `package.json` 并校验其正确性。如果你仍在使用 1.x 版本，请参阅 [这个 PR](https://github.com/sveltejs/kit/pull/8922) 获取迁移说明。

## package.json 的结构

既然你是在构建一个供公众使用的库，你的 `package.json` 的内容就变得更重要了。通过它，你可以配置包的入口点、哪些文件会被发布到 npm，以及你的库有哪些依赖。我们逐个来看最重要的字段。

### name

这是你的包名。其他人可以通过这个名字来安装它，它也会显示在 `https://npmjs.com/package/<name>` 上。

```json
{
	"name": "your-library"
}
```

更多内容请[在此阅读](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#name)。

### license

每个包都应该有一个 license 字段，以便人们知道他们被允许如何使用它。一个非常流行、且在分发和复用方面非常宽松（无担保）的许可证是 `MIT`。

```json
{
	"license": "MIT"
}
```

更多内容请[在此阅读](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#license)。注意，你还应该在包中包含一个 `LICENSE` 文件。

### files

这会告诉 npm 需要打包并上传哪些文件到 npm。它应该包含你的输出目录（默认是 `dist`）。你的 `package.json`、`README` 和 `LICENSE` 始终会被包含，所以你不需要指定它们。

```json
{
	"files": ["dist"]
}
```

要排除不必要的文件（例如单元测试，或仅从 `src/routes` 等处导入的模块等），你可以把它们添加到 `.npmignore` 文件中。这样会生成更小的包，安装起来也更快。

更多内容请[在此阅读](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#files)。

### exports

`"exports"` 字段包含包的入口点。如果你通过 `npx sv create` 建立了一个新的库项目，它会被设置为单一的出口，即包的根目录：

```json
{
	"exports": {
		".": {
			"types": "./dist/index.d.ts",
			"svelte": "./dist/index.js"
		}
	}
}
```

这会告诉打包工具和相应工具链，你的包只有一个入口点，即根目录，所有内容都应通过这个入口点导入，像这样：

```js
// @errors: 2307
import { Something } from 'your-library';
```

`types` 和 `svelte` 键是[导出条件](https://nodejs.org/api/packages.html#conditional-exports)。它们告诉工具链在查找 `your-library` 导入时应该导入哪个文件：

- TypeScript 会看到 `types` 条件并查找类型定义文件。如果你不发布类型定义，请省略这个条件。
- 支持 Svelte 的工具链会看到 `svelte` 条件并知道这是一个 Svelte 组件库。如果你发布的库不导出任何 Svelte 组件，并且也可能在非 Svelte 项目中使用（例如一个 Svelte store 库），你可以把这个条件替换为 `default`。

> [!NOTE] 之前版本的 `@sveltejs/package` 还会添加 `package.json` 导出。这不再是模板的一部分了，因为现在所有工具链都能处理未显式导出的 `package.json`。

你可以根据自己的喜好调整 `exports`，并提供更多的入口点。例如，如果你不想用一个 `src/lib/index.js` 文件来重新导出组件，而是想直接暴露一个 `src/lib/Foo.svelte` 组件，你可以创建如下的导出映射……

```json
{
	"exports": {
		"./Foo.svelte": {
			"types": "./dist/Foo.svelte.d.ts",
			"svelte": "./dist/Foo.svelte"
		}
	}
}
```

……而你库的消费者就可以像这样导入这个组件：

```js
// @filename: ambient.d.ts
declare module 'your-library/Foo.svelte';

// @filename: index.js
// ---cut---
import Foo from 'your-library/Foo.svelte';
```

> [!NOTE] 请注意，如果你提供类型定义，这样做需要额外小心。相关注意事项请[在此阅读](#TypeScript)

一般来说，exports 映射的每个键都是用户从你的包中导入内容时必须使用的路径，而值则是将被导入的文件的路径，或一个导出条件映射（其中又包含这些文件路径）。

更多关于 `exports` 的内容请[在此阅读](https://nodejs.org/docs/latest-v18.x/api/packages.html#package-entry-points)。

### svelte

这是一个旧式字段，用于让工具链识别 Svelte 组件库。当你使用了 `svelte` [导出条件](#Anatomy-of-a-package.json-exports) 后就不再需要它了，但为了与那些还不了解导出条件的过时工具链保持向后兼容，保留它是个好主意。它应该指向你的根入口点。

```json
{
	"svelte": "./dist/index.js"
}
```

### sideEffects

`package.json` 中的 `sideEffects` 字段被打包工具用来判断一个模块是否可能包含有副作用的代码。当一个模块在被导入时，会从模块外部的其他脚本中观察到可感知的变化，就认为该模块有副作用。例如，副作用包括修改全局变量或内置 JavaScript 对象的原型。由于副作用可能会影响应用其他部分的行为，无论这些文件/模块的 exports 是否在应用中被使用，它们都会被包含在最终的打包结果中。最佳实践是避免在代码中产生副作用。

在 `package.json` 中设置 `sideEffects` 字段可以帮助打包工具更激进地消除最终打包结果中未被使用的 exports，这一过程称为 tree-shaking（摇树优化）。这会生成更小、更高效的打包文件。不同的打包工具处理 `sideEffects` 的方式各有不同。虽然 Vite 并不需要这样，但我们建议库声明所有 CSS 文件都有副作用，以便你的库[能兼容 webpack](https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free)。这是新建项目自带的配置：

```json
/// file: package.json
{
	"sideEffects": ["**/*.css"]
}
```

> [!NOTE] 如果你的库中的脚本有副作用，请确保更新 `sideEffects` 字段。在新建的项目中，所有脚本默认都被标记为无副作用。如果一个有副作用的文件被错误地标记为无副作用，可能会导致功能损坏。

如果你的包中有带副作用的文件，你可以在一个数组中指定它们：

```json
/// file: package.json
{
	"sideEffects": [
		"**/*.css",
		"./dist/sideEffectfulFile.js"
	]
}
```

这样只有指定的文件会被视为有副作用。

## TypeScript

即使你自己不使用 TypeScript，你也应该为你的库发布类型定义，这样使用你库的人如果使用 TypeScript 就能获得正确的智能提示。`@sveltejs/package` 让生成类型的过程对你基本是透明的。默认情况下，在打包你的库时，会为 JavaScript、TypeScript 和 Svelte 文件自动生成类型定义。你只需要确保 [exports](#Anatomy-of-a-package.json-exports) 映射中的 `types` 条件指向正确的文件。当通过 `npx sv create` 初始化一个库项目时，根导出会自动设置好。

但是，如果你有除了根导出之外的其他导出——例如提供一个 `your-library/foo` 导入——你就需要额外注意类型定义的提供。遗憾的是，TypeScript 默认_不会_解析像 `{ "./foo": { "types": "./dist/foo.d.ts", ... }}` 这样的导出中的 `types` 条件。相反，它会相对你的库根目录搜索一个 `foo.d.ts`（即 `your-library/foo.d.ts` 而非 `your-library/dist/foo.d.ts`）。要解决这个问题，你有两个选择：

第一种选择是要求使用你库的人将其 `tsconfig.json`（或 `jsconfig.json`）中的 `moduleResolution` 选项设置为 `bundler`（自 TypeScript 5 起可用，是未来最佳且推荐的选项）、`node16` 或 `nodenext`。这会让 TypeScript 实际去查看 exports 映射并正确解析类型。

第二种选择是（滥用）TypeScript 的 `typesVersions` 特性来连接类型。这是 `package.json` 中的一个字段，TypeScript 用它来根据 TypeScript 版本检查不同的类型定义，其中也包含了一个用于此用途的路径映射特性。我们利用这个路径映射特性来达到目的。对于上面提到的 `foo` 导出，对应的 `typesVersions` 看起来像这样：

```json
{
	"exports": {
		"./foo": {
			"types": "./dist/foo.d.ts",
			"svelte": "./dist/foo.js"
		}
	},
	"typesVersions": {
		">4.0": {
			"foo": ["./dist/foo.d.ts"]
		}
	}
}
```

`>4.0` 告诉 TypeScript，如果使用的 TypeScript 版本大于 4（实践中几乎总是成立），就检查内层映射。内层映射告诉 TypeScript，`your-library/foo` 的类型定义位于 `./dist/foo.d.ts`，这本质上复制了 `exports` 条件。你还可以使用 `*` 作为通配符，一次性让多个类型定义可用，而无需重复书写。注意，如果你选择了 `typesVersions`，就必须通过它声明所有的类型导入，包括根导入（它被定义为 `"index.d.ts": [..]`）。

你可以在[此处](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html#version-selection-with-typesversions)阅读更多关于这个特性的内容。

## 最佳实践

你应该避免在包中使用像 `$app/env` 这样 SvelteKit 专属的模块，除非你打算让它们只能被其他 SvelteKit 项目消费。例如，与其使用 `import { browser } from '$app/env'`，不如使用 `import { BROWSER } from 'esm-env'`（[参见 esm-env 文档](https://github.com/benmccann/esm-env)）。你可能也希望将当前 URL 或导航动作等作为 prop 传入，而不是直接依赖 `$app/state`、`$app/navigation` 等。以这种更通用的方式编写你的应用，也会让你更容易搭建测试、UI 演示等工具。

请确保在你的 `vite.config.js`（而非 `tsconfig.json`）中通过 SvelteKit 插件添加[别名](configuration#alias)，这样它们才会被 `svelte-package` 处理。

你应该仔细考虑你对包所做的修改是 bug 修复、新功能还是破坏性变更，并相应地更新包的版本号。注意，如果你从现有的库中移除了 `exports` 中的任何路径或其内部的任何 `export` 条件，那应被视为一次破坏性变更。

```json
{
	"exports": {
		".": {
			"types": "./dist/index.d.ts",
// 将 `svelte` 改为 `default` 是一次破坏性变更：
---			"svelte": "./dist/index.js"---
+++			"default": "./dist/index.js"+++
		},
// 移除这个是一次破坏性变更：
---		"./foo": {
			"types": "./dist/foo.d.ts",
			"svelte": "./dist/foo.js",
			"default": "./dist/foo.js"
		},---
// 添加这个是允许的：
+++		"./bar": {
			"types": "./dist/bar.d.ts",
			"svelte": "./dist/bar.js",
			"default": "./dist/bar.js"
		}+++
	}
}
```

## Source maps（源码映射）

你可以通过在 `tsconfig.json` 中设置 `"declarationMap": true` 来创建所谓的声明映射（`d.ts.map` 文件）。这将允许像 VS Code 这样的编辑器在使用诸如 _Go to Definition_（跳转到定义）等特性时跳转到原始的 `.ts` 或 `.svelte` 文件。这意味着你还需要以某种方式把源文件与 dist 目录一起发布，使得声明文件内部的相对路径能指向磁盘上的文件。假设你按照 Svelte 的 CLI 建议，将所有库代码都放在 `src/lib` 中，那么只需要把 `src/lib` 添加到 `package.json` 的 `files` 中即可：

```json
{
	"files": [
		"dist",
		"!dist/**/*.test.*",
		"!dist/**/*.spec.*",
		+++"src/lib",
		"!src/lib/**/*.test.*",
		"!src/lib/**/*.spec.*"+++
	]
}
```

## Options（选项）

`svelte-package` 接受以下选项：

- `-w`/`--watch` — 监视 `src/lib` 中的文件变化并重新构建包
- `-i`/`--input` — 包含包所有文件的输入目录。默认为 `src/lib`
- `-o`/`--output` — 写入处理后文件的输出目录。你的 `package.json` 的 `exports` 应该指向该目录中的文件，`files` 数组也应该包含该文件夹。默认为 `dist`
- `-p`/`--preserve-output` — 防止在打包前删除输出目录。默认为 `false`，意味着会先清空输出目录
- `-t`/`--types` — 是否创建类型定义（`d.ts` 文件）。我们强烈建议这样做，因为它能提升整个生态中库的质量。默认为 `true`
- `--tsconfig` - tsconfig 或 jsconfig 的路径。未提供时，会在工作区路径中向上搜索最近的 tsconfig/jsconfig。

## 发布

要发布生成的包：

```sh
npm publish
```

## 注意事项

所有相对文件的导入都需要完全指定，遵循 Node 的 ESM 算法。这意味着对于像 `src/lib/something/index.js` 这样的文件，你必须包含带扩展名的文件名：

```js
// @errors: 2307
import { something } from './something+++/index.js+++';
```

如果你在使用 TypeScript，你需要以相同的方式导入 `.ts` 文件，但要用 `.js` 结尾，_而不是_ `.ts` 结尾。（这是一个我们无法控制的 TypeScript 设计决定。）在你的 `tsconfig.json` 或 `jsconfig.json` 中设置 `"moduleResolution": "NodeNext"` 会对此有所帮助。

除 Svelte 文件（被预处理）和 TypeScript 文件（被转译为 JavaScript）外，所有文件都会原样复制。
