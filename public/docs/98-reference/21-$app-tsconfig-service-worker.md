---
title: $app/tsconfig/service-worker
---

此模块包含专门为你的 service worker 定制的 TypeScript 配置。你的 service worker 应该通过位于 `src/service-worker/tsconfig.json` 的配置继承它：

```json
/// file: src/service-worker/tsconfig.json
{
	"extends": "$app/tsconfig/service-worker"
}
```
