# SvelteKit 中文文档网站

基于 Vue 3 + Vite 构建的 SvelteKit 中文文档网站。

## 项目特点

- ✨ **Vue 3** - 使用最新的 Vue 3 组合式 API
- 📦 **Vite** - 极速的开发体验
- 🎨 **暗色主题** - 精心设计的暗色界面
- 📝 **Markdown 渲染** - 支持语法高亮的 Markdown 渲染
- 🚀 **快速导航** - 侧边栏导航系统
- 📱 **响应式设计** - 支持移动端

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全
- **Vue Router** - 官方路由管理器
- **Pinia** - 状态管理
- **Vite** - 下一代前端构建工具
- **Markdown-it** - Markdown 解析器
- **Highlight.js** - 代码语法高亮

## 快速开始

### 安装依赖

```sh
npm install
```

### 启动开发服务器

```sh
npm run dev
```

访问 http://localhost:5173 查看网站

### 构建生产版本

```sh
npm run build
```

### 预览生产构建

```sh
npm run preview
```

## 项目结构

```
sveltekit-cn-docs/
├── public/
│   └── docs/           # SvelteKit 文档内容
├── src/
│   ├── assets/         # 静态资源
│   ├── components/     # Vue 组件
│   │   └── Sidebar.vue # 侧边栏导航组件
│   ├── router/         # 路由配置
│   ├── stores/         # Pinia 状态管理
│   ├── utils/          # 工具函数
│   │   └── markdown.ts # Markdown 渲染工具
│   ├── views/          # 页面视图
│   │   ├── DocView.vue # 文档页面
│   │   └── HomeView.vue # 首页
│   ├── App.vue         # 根组件
│   └── main.ts         # 应用入口
├── docs-structure.ts   # 文档结构和路由配置
└── vite.config.ts      # Vite 配置
```

## 文档结构

文档分为以下几个主要部分：

- **入门** - SvelteKit 简介和快速开始
- **核心概念** - 路由、Load 函数、表单操作等
- **构建和部署** - 构建应用和各类适配器
- **高级** - Hooks、错误处理、Service Workers 等
- **最佳实践** - 认证、性能、SEO 等
- **附录** - FAQ、集成、调试等
- **参考** - API 参考、配置、CLI 等

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge
