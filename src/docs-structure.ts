import type { RouteRecordRaw } from 'vue-router'

// 文档结构
export const docsStructure = [
  {
    title: '入门',
    path: '/getting-started',
    items: [
      { title: '简介', path: '/getting-started/introduction' },
      { title: '创建项目', path: '/getting-started/creating-a-project' },
      { title: '项目类型', path: '/getting-started/project-types' },
      { title: '项目结构', path: '/getting-started/project-structure' },
      { title: 'Web 标准', path: '/getting-started/web-standards' },
    ],
  },
  {
    title: '核心概念',
    path: '/core-concepts',
    items: [
      { title: '路由', path: '/core-concepts/routing' },
      { title: 'Load 函数', path: '/core-concepts/load' },
      { title: '表单操作', path: '/core-concepts/form-actions' },
      { title: '页面选项', path: '/core-concepts/page-options' },
      { title: '状态管理', path: '/core-concepts/state-management' },
      { title: '远程函数', path: '/core-concepts/remote-functions' },
      { title: '环境变量', path: '/core-concepts/environment-variables' },
    ],
  },
  {
    title: '构建和部署',
    path: '/build-and-deploy',
    items: [
      { title: '构建应用', path: '/build-and-deploy/building-your-app' },
      { title: '适配器', path: '/build-and-deploy/adapters' },
      { title: 'Auto 适配器', path: '/build-and-deploy/adapter-auto' },
      { title: 'Node 适配器', path: '/build-and-deploy/adapter-node' },
      { title: 'Static 适配器', path: '/build-and-deploy/adapter-static' },
      { title: '单页应用', path: '/build-and-deploy/single-page-apps' },
      { title: 'Cloudflare 适配器', path: '/build-and-deploy/adapter-cloudflare' },
      { title: 'Cloudflare Workers', path: '/build-and-deploy/adapter-cloudflare-workers' },
      { title: 'Netlify 适配器', path: '/build-and-deploy/adapter-netlify' },
      { title: 'Vercel 适配器', path: '/build-and-deploy/adapter-vercel' },
      { title: '编写适配器', path: '/build-and-deploy/writing-adapters' },
    ],
  },
  {
    title: '高级',
    path: '/advanced',
    items: [
      { title: '高级路由', path: '/advanced/advanced-routing' },
      { title: 'Hooks', path: '/advanced/hooks' },
      { title: '错误处理', path: '/advanced/errors' },
      { title: '链接选项', path: '/advanced/link-options' },
      { title: 'Service Workers', path: '/advanced/service-workers' },
      { title: '仅服务端模块', path: '/advanced/server-only-modules' },
      { title: '快照', path: '/advanced/snapshots' },
      { title: '浅路由', path: '/advanced/shallow-routing' },
      { title: '可观测性', path: '/advanced/observability' },
      { title: '打包', path: '/advanced/packaging' },
    ],
  },
  {
    title: '最佳实践',
    path: '/best-practices',
    items: [
      { title: '认证', path: '/best-practices/auth' },
      { title: '性能', path: '/best-practices/performance' },
      { title: '图标', path: '/best-practices/icons' },
      { title: '图片', path: '/best-practices/images' },
      { title: '无障碍访问', path: '/best-practices/accessibility' },
      { title: 'SEO', path: '/best-practices/seo' },
    ],
  },
  {
    title: '附录',
    path: '/appendix',
    items: [
      { title: 'FAQ', path: '/appendix/faq' },
      { title: '集成', path: '/appendix/integrations' },
      { title: '调试', path: '/appendix/debugging' },
      { title: '迁移到 SvelteKit 2', path: '/appendix/migrating-to-sveltekit-2' },
      { title: '迁移', path: '/appendix/migrating' },
      { title: '更多资源', path: '/appendix/additional-resources' },
      { title: '术语表', path: '/appendix/glossary' },
    ],
  },
  {
    title: '参考',
    path: '/reference',
    items: [
      { title: '@sveltejs/kit', path: '/reference/sveltejs-kit' },
      { title: '@sveltejs/kit/hooks', path: '/reference/sveltejs-kit-hooks' },
      { title: '@sveltejs/kit/node', path: '/reference/sveltejs-kit-node' },
      { title: '@sveltejs/kit/vite', path: '/reference/sveltejs-kit-vite' },
      { title: '$app/env', path: '/reference/app-env' },
      { title: '$app/environment', path: '/reference/app-environment' },
      { title: '$app/forms', path: '/reference/app-forms' },
      { title: '$app/navigation', path: '/reference/app-navigation' },
      { title: '$app/paths', path: '/reference/app-paths' },
      { title: '$app/server', path: '/reference/app-server' },
      { title: '$app/state', path: '/reference/app-state' },
      { title: '$app/stores', path: '/reference/app-stores' },
      { title: '$app/types', path: '/reference/app-types' },
      { title: '$env', path: '/reference/env' },
      { title: '$lib', path: '/reference/lib' },
      { title: '$service-worker', path: '/reference/service-worker' },
      { title: '配置', path: '/reference/configuration' },
      { title: 'CLI', path: '/reference/cli' },
      { title: '类型', path: '/reference/types' },
    ],
  },
]

// 生成文档路由
const generateDocRoutes = (): RouteRecordRaw[] => {
  const routes: RouteRecordRaw[] = []

  docsStructure.forEach((section) => {
    section.items.forEach((item) => {
      routes.push({
        path: item.path,
        name: item.path,
        component: () => import('@/views/DocView.vue'),
        props: { route: item },
      })
    })
  })

  return routes
}

export const docRoutes = generateDocRoutes()

export default docsStructure