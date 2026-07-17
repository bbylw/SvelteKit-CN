<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '../components/Sidebar.vue'
import md from '../utils/markdown'

const route = useRoute()
const content = ref('')
const loading = ref(true)
const error = ref<string | null>(null)

const loadDoc = async (path: string) => {
  loading.value = true
  error.value = null

  try {
    // 将路由路径映射到 docs 目录中的 markdown 文件
    const docPath = path.replace(/^\//, '').replace(/\//g, '/')
    let filePath = ''

    // 根据路径构建 markdown 文件路径
    if (docPath === 'getting-started/introduction') {
      filePath = '../../docs/10-getting-started/10-introduction.md'
    } else if (docPath === 'getting-started/creating-a-project') {
      filePath = '../../docs/10-getting-started/20-creating-a-project.md'
    } else if (docPath === 'getting-started/project-types') {
      filePath = '../../docs/10-getting-started/25-project-types.md'
    } else if (docPath === 'getting-started/project-structure') {
      filePath = '../../docs/10-getting-started/30-project-structure.md'
    } else if (docPath === 'getting-started/web-standards') {
      filePath = '../../docs/10-getting-started/40-web-standards.md'
    } else if (docPath === 'core-concepts/routing') {
      filePath = '../../docs/20-core-concepts/10-routing.md'
    } else if (docPath === 'core-concepts/load') {
      filePath = '../../docs/20-core-concepts/20-load.md'
    } else if (docPath === 'core-concepts/form-actions') {
      filePath = '../../docs/20-core-concepts/30-form-actions.md'
    } else if (docPath === 'core-concepts/page-options') {
      filePath = '../../docs/20-core-concepts/40-page-options.md'
    } else if (docPath === 'core-concepts/state-management') {
      filePath = '../../docs/20-core-concepts/50-state-management.md'
    } else if (docPath === 'core-concepts/remote-functions') {
      filePath = '../../docs/20-core-concepts/60-remote-functions.md'
    } else if (docPath === 'core-concepts/environment-variables') {
      filePath = '../../docs/20-core-concepts/70-environment-variables.md'
    } else if (docPath === 'build-and-deploy/building-your-app') {
      filePath = '../../docs/25-build-and-deploy/10-building-your-app.md'
    } else if (docPath === 'build-and-deploy/adapters') {
      filePath = '../../docs/25-build-and-deploy/20-adapters.md'
    } else if (docPath === 'build-and-deploy/adapter-auto') {
      filePath = '../../docs/25-build-and-deploy/30-adapter-auto.md'
    } else if (docPath === 'build-and-deploy/adapter-node') {
      filePath = '../../docs/25-build-and-deploy/40-adapter-node.md'
    } else if (docPath === 'build-and-deploy/adapter-static') {
      filePath = '../../docs/25-build-and-deploy/50-adapter-static.md'
    } else if (docPath === 'build-and-deploy/single-page-apps') {
      filePath = '../../docs/25-build-and-deploy/55-single-page-apps.md'
    } else if (docPath === 'build-and-deploy/adapter-cloudflare') {
      filePath = '../../docs/25-build-and-deploy/60-adapter-cloudflare.md'
    } else if (docPath === 'build-and-deploy/adapter-cloudflare-workers') {
      filePath = '../../docs/25-build-and-deploy/70-adapter-cloudflare-workers.md'
    } else if (docPath === 'build-and-deploy/adapter-netlify') {
      filePath = '../../docs/25-build-and-deploy/80-adapter-netlify.md'
    } else if (docPath === 'build-and-deploy/adapter-vercel') {
      filePath = '../../docs/25-build-and-deploy/90-adapter-vercel.md'
    } else if (docPath === 'build-and-deploy/writing-adapters') {
      filePath = '../../docs/25-build-and-deploy/99-writing-adapters.md'
    } else if (docPath === 'advanced/advanced-routing') {
      filePath = '../../docs/30-advanced/10-advanced-routing.md'
    } else if (docPath === 'advanced/hooks') {
      filePath = '../../docs/30-advanced/20-hooks.md'
    } else if (docPath === 'advanced/errors') {
      filePath = '../../docs/30-advanced/25-errors.md'
    } else if (docPath === 'advanced/link-options') {
      filePath = '../../docs/30-advanced/30-link-options.md'
    } else if (docPath === 'advanced/service-workers') {
      filePath = '../../docs/30-advanced/40-service-workers.md'
    } else if (docPath === 'advanced/server-only-modules') {
      filePath = '../../docs/30-advanced/50-server-only-modules.md'
    } else if (docPath === 'advanced/snapshots') {
      filePath = '../../docs/30-advanced/65-snapshots.md'
    } else if (docPath === 'advanced/shallow-routing') {
      filePath = '../../docs/30-advanced/67-shallow-routing.md'
    } else if (docPath === 'advanced/observability') {
      filePath = '../../docs/30-advanced/68-observability.md'
    } else if (docPath === 'advanced/packaging') {
      filePath = '../../docs/30-advanced/70-packaging.md'
    } else if (docPath === 'best-practices/auth') {
      filePath = '../../docs/40-best-practices/03-auth.md'
    } else if (docPath === 'best-practices/performance') {
      filePath = '../../docs/40-best-practices/05-performance.md'
    } else if (docPath === 'best-practices/icons') {
      filePath = '../../docs/40-best-practices/06-icons.md'
    } else if (docPath === 'best-practices/images') {
      filePath = '../../docs/40-best-practices/07-images.md'
    } else if (docPath === 'best-practices/accessibility') {
      filePath = '../../docs/40-best-practices/10-accessibility.md'
    } else if (docPath === 'best-practices/seo') {
      filePath = '../../docs/40-best-practices/20-seo.md'
    } else if (docPath === 'appendix/faq') {
      filePath = '../../docs/60-appendix/10-faq.md'
    } else if (docPath === 'appendix/integrations') {
      filePath = '../../docs/60-appendix/20-integrations.md'
    } else if (docPath === 'appendix/debugging') {
      filePath = '../../docs/60-appendix/25-debugging.md'
    } else if (docPath === 'appendix/migrating-to-sveltekit-2') {
      filePath = '../../docs/60-appendix/30-migrating-to-sveltekit-2.md'
    } else if (docPath === 'appendix/migrating') {
      filePath = '../../docs/60-appendix/40-migrating.md'
    } else if (docPath === 'appendix/additional-resources') {
      filePath = '../../docs/60-appendix/50-additional-resources.md'
    } else if (docPath === 'appendix/glossary') {
      filePath = '../../docs/60-appendix/60-glossary.md'
    } else if (docPath.startsWith('reference/')) {
      // 处理参考部分
      const refPath = docPath.replace('reference/', '')
      const refMap: Record<string, string> = {
        'sveltejs-kit': '98-reference/10-@sveltejs-kit.md',
        'sveltejs-kit-hooks': '98-reference/15-@sveltejs-kit-hooks.md',
        'sveltejs-kit-node': '98-reference/15-@sveltejs-kit-node.md',
        'sveltejs-kit-vite': '98-reference/15-@sveltejs-kit-vite.md',
        'app-env': '98-reference/19-$app-env.md',
        'app-environment': '98-reference/20-$app-environment.md',
        'app-forms': '98-reference/20-$app-forms.md',
        'app-navigation': '98-reference/20-$app-navigation.md',
        'app-paths': '98-reference/20-$app-paths.md',
        'app-server': '98-reference/20-$app-server.md',
        'app-state': '98-reference/20-$app-state.md',
        'app-stores': '98-reference/20-$app-stores.md',
        'app-types': '98-reference/20-$app-types.md',
        'env': '98-reference/25-$env-dynamic-private.md',
        'lib': '98-reference/26-$lib.md',
        'service-worker': '98-reference/27-$service-worker.md',
        'configuration': '98-reference/50-configuration.md',
        'cli': '98-reference/52-cli.md',
        'types': '98-reference/54-types.md',
      }
      filePath = '../../docs/' + (refMap[refPath] || '')
    }

    if (filePath) {
      const response = await fetch(filePath)
      if (!response.ok) {
        throw new Error('文档未找到')
      }
      const text = await response.text()
      // 移除 YAML frontmatter
      const markdownContent = text.replace(/^---[\s\S]*?---/, '')
      content.value = md.render(markdownContent)
    } else {
      content.value = '# 文档未找到\n\n抱歉，该文档暂未提供。'
    }
  } catch (err) {
    console.error('加载文档失败:', err)
    error.value = '加载文档失败，请稍后重试。'
    content.value = `# 错误\n\n${error.value}`
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDoc(route.path)
})

watch(() => route.path, (newPath) => {
  loadDoc(newPath)
})
</script>

<template>
  <div class="doc-layout">
    <Sidebar />
    <main class="doc-main">
      <div class="doc-content-wrapper">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>
        <div v-else class="doc-content">
          <article class="markdown-body" v-html="content"></article>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.doc-layout {
  display: flex;
  min-height: 100vh;
  background-color: #0d0d0d;
}

.doc-main {
  flex: 1;
  margin-left: 280px;
  padding: 0;
}

.doc-content-wrapper {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 60px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #e0e0e0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #333;
  border-top: 4px solid #ff3e00;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.doc-content {
  min-height: 60vh;
}

.markdown-body {
  color: #e0e0e0;
  line-height: 1.8;
  font-size: 16px;
}

/* Markdown 样式 */
.markdown-body :deep(h1) {
  font-size: 2.5em;
  font-weight: 700;
  margin: 1.5em 0 0.5em;
  color: #ffffff;
  padding-bottom: 0.3em;
  border-bottom: 1px solid #333;
}

.markdown-body :deep(h2) {
  font-size: 2em;
  font-weight: 600;
  margin: 1.5em 0 0.5em;
  color: #ffffff;
  padding-bottom: 0.3em;
  border-bottom: 1px solid #333;
}

.markdown-body :deep(h3) {
  font-size: 1.5em;
  font-weight: 600;
  margin: 1.5em 0 0.5em;
  color: #ffffff;
}

.markdown-body :deep(h4) {
  font-size: 1.25em;
  font-weight: 600;
  margin: 1.5em 0 0.5em;
  color: #ffffff;
}

.markdown-body :deep(p) {
  margin: 1em 0;
}

.markdown-body :deep(a) {
  color: #ff3e00;
  text-decoration: none;
  transition: color 0.2s;
}

.markdown-body :deep(a:hover) {
  color: #ff6b35;
  text-decoration: underline;
}

.markdown-body :deep(code) {
  background-color: #2a2a2a;
  color: #ff6b35;
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
}

.markdown-body :deep(pre) {
  background-color: #1a1a1a;
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
  margin: 1em 0;
  border: 1px solid #333;
}

.markdown-body :deep(pre code) {
  background-color: transparent;
  color: #e0e0e0;
  padding: 0;
  font-size: 0.9em;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 1em 0;
  padding-left: 2em;
}

.markdown-body :deep(li) {
  margin: 0.5em 0;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid #ff3e00;
  padding-left: 16px;
  margin: 1em 0;
  color: #a0a0a0;
  background-color: #1a1a1a;
  padding: 12px 16px;
  border-radius: 0 4px 4px 0;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #333;
  padding: 8px 12px;
  text-align: left;
}

.markdown-body :deep(th) {
  background-color: #1a1a1a;
  font-weight: 600;
}

.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 1em 0;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid #333;
  margin: 2em 0;
}

@media (max-width: 768px) {
  .doc-main {
    margin-left: 0;
  }

  .doc-content-wrapper {
    padding: 20px;
  }
}
</style>