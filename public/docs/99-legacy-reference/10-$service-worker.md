---
title: $service-worker
---

`service-worker` 模块存在于 SvelteKit 2 中，提供对以下导出的访问：

## base

一个表示应用 base 路径的根相对路径。请改用 `$app/paths` 中的 [`resolve(...)`]($app-paths#resolve)。

## build

一个由 Vite 生成的文件组成的 `string[]` 数组。在开发期间为空。请改用 `$app/manifest` 中的 [`immutable`]($app-manifest#immutable)。

## files

一个包含你 `static` 目录中文件的 `string[]` 数组。请改用 `$app/manifest` 中的 [`assets`]($app-manifest#assets)。

## prerendered

一个由预渲染页面组成的 `string[]` 数组。在开发期间为空。请改用 `$app/manifest` 中的 [`prerendered`]($app-manifest#prerendered)。

## version

[`config.version.name`](@sveltejs-kit-vite#version) 的值，用于填充缓存。请改用 `$app/env` 中的 [`version`]($app-env#version)。
