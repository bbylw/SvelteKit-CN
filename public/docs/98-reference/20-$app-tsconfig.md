---
title: $app/tsconfig
---

此模块包含为你的应用定制的 TypeScript 配置。你自己的配置应该继承它——一个典型的 `tsconfig.json` 看起来像这样：

```json
/// file: tsconfig.json
{
	"extends": "$app/tsconfig",
	"include": ["src", "test"],
	"exclude": ["src/service-worker"]
}
```

你可以用自己的 `compilerOptions` 扩展此配置。覆盖以下属性可能会导致出错——如果发生这种情况，SvelteKit 会警告你：

- `paths` —— 这源自（已弃用的）[`alias`](@sveltejs-kit-vite#alias) 配置选项，加上你 `package.json` 中指定的任何[子路径导入](https://nodejs.org/api/packages.html#subpath-imports)，以使 Vite 和 TypeScript 的行为保持一致。理想情况下，请配置子路径导入，而不是直接使用 `paths`
- `types` —— 你的应用需要能够“看到”为[环境变量](environment-variables) 等内容生成的模块声明，因此此数组必须包含 `"$app/types"`
- `isolatedModules` —— 必须为 `true`，因为 Vite 一次编译一个模块
- `verbatimModuleSyntax` —— 必须为 `true`，这样你才能在 `.svelte` 文件中安全地使用类型导入

请注意，上面的示例配置排除了 `src/service-worker`，因为 service worker 需要位于它们自己的 TypeScript 项目中。如果你使用 service worker，请创建一个继承 [`$app/tsconfig/service-worker`]($app-tsconfig-service-worker) 的 `src/service-worker/tsconfig.json`。
