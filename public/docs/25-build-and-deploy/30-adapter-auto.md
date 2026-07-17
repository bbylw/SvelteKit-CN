---
title: 零配置部署
---

当你使用 `npx sv create` 创建一个新的 SvelteKit 项目时，它会默认安装 [`adapter-auto`](https://github.com/sveltejs/kit/tree/main/packages/adapter-auto)。当你部署时，这个适配器会自动安装并使用适用于受支持环境的正确适配器：

- 用于 [Cloudflare Pages](https://developers.cloudflare.com/pages/) 的 [`@sveltejs/adapter-cloudflare`](adapter-cloudflare)
- 用于 [Netlify](https://netlify.com/) 的 [`@sveltejs/adapter-netlify`](adapter-netlify)
- 用于 [Vercel](https://vercel.com/) 的 [`@sveltejs/adapter-vercel`](adapter-vercel)
- 用于 [Azure Static Web Apps](https://docs.microsoft.com/en-us/azure/static-web-apps/) 的 [`svelte-adapter-azure-swa`](https://github.com/geoffrich/svelte-adapter-azure-swa)
- 用于 [AWS via SST](https://sst.dev/docs/start/aws/svelte) 的 [`svelte-kit-sst`](https://github.com/sst/v2/tree/master/packages/svelte-kit-sst)
- 用于 [Google Cloud Run](https://cloud.google.com/run) 的 [`@sveltejs/adapter-node`](adapter-node)

一旦你确定了目标环境，建议将适当的适配器安装到你的 `devDependencies` 中，因为这会将适配器添加到你的 lockfile 中，并略微改善 CI 上的安装时间。

## 特定于环境的配置

要添加配置选项，例如 [`adapter-vercel`](adapter-vercel) 和 [`adapter-netlify`](adapter-netlify) 中的 `{ edge: true }`，你必须安装底层的适配器——`adapter-auto` 不接受任何选项。

## 添加社区适配器

你可以通过编辑 [adapters.js](https://github.com/sveltejs/kit/blob/main/packages/adapter-auto/adapters.js) 并提交 pull request，为额外的适配器添加零配置支持。
