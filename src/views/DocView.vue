<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '../components/Sidebar.vue'
import { docsStructure } from '../docs-structure'
import md from '../utils/markdown'

const route = useRoute()
const content = ref('')
const loading = ref(true)
const error = ref<string | null>(null)
const articleRef = ref<HTMLElement | null>(null)

// 路由 → markdown 文件路径映射
const pathMap: Record<string, string> = {
  'getting-started/introduction': '../../docs/10-getting-started/10-introduction.md',
  'getting-started/creating-a-project': '../../docs/10-getting-started/20-creating-a-project.md',
  'getting-started/project-types': '../../docs/10-getting-started/25-project-types.md',
  'getting-started/project-structure': '../../docs/10-getting-started/30-project-structure.md',
  'getting-started/web-standards': '../../docs/10-getting-started/40-web-standards.md',
  'core-concepts/routing': '../../docs/20-core-concepts/10-routing.md',
  'core-concepts/load': '../../docs/20-core-concepts/20-load.md',
  'core-concepts/form-actions': '../../docs/20-core-concepts/30-form-actions.md',
  'core-concepts/page-options': '../../docs/20-core-concepts/40-page-options.md',
  'core-concepts/state-management': '../../docs/20-core-concepts/50-state-management.md',
  'core-concepts/remote-functions': '../../docs/20-core-concepts/60-remote-functions.md',
  'core-concepts/environment-variables': '../../docs/20-core-concepts/70-environment-variables.md',
  'build-and-deploy/building-your-app': '../../docs/25-build-and-deploy/10-building-your-app.md',
  'build-and-deploy/adapters': '../../docs/25-build-and-deploy/20-adapters.md',
  'build-and-deploy/adapter-auto': '../../docs/25-build-and-deploy/30-adapter-auto.md',
  'build-and-deploy/adapter-node': '../../docs/25-build-and-deploy/40-adapter-node.md',
  'build-and-deploy/adapter-static': '../../docs/25-build-and-deploy/50-adapter-static.md',
  'build-and-deploy/single-page-apps': '../../docs/25-build-and-deploy/55-single-page-apps.md',
  'build-and-deploy/adapter-cloudflare': '../../docs/25-build-and-deploy/60-adapter-cloudflare.md',
  'build-and-deploy/adapter-cloudflare-workers': '../../docs/25-build-and-deploy/70-adapter-cloudflare-workers.md',
  'build-and-deploy/adapter-netlify': '../../docs/25-build-and-deploy/80-adapter-netlify.md',
  'build-and-deploy/adapter-vercel': '../../docs/25-build-and-deploy/90-adapter-vercel.md',
  'build-and-deploy/writing-adapters': '../../docs/25-build-and-deploy/99-writing-adapters.md',
  'advanced/advanced-routing': '../../docs/30-advanced/10-advanced-routing.md',
  'advanced/hooks': '../../docs/30-advanced/20-hooks.md',
  'advanced/errors': '../../docs/30-advanced/25-errors.md',
  'advanced/link-options': '../../docs/30-advanced/30-link-options.md',
  'advanced/service-workers': '../../docs/30-advanced/40-service-workers.md',
  'advanced/server-only-modules': '../../docs/30-advanced/50-server-only-modules.md',
  'advanced/snapshots': '../../docs/30-advanced/65-snapshots.md',
  'advanced/shallow-routing': '../../docs/30-advanced/67-shallow-routing.md',
  'advanced/observability': '../../docs/30-advanced/68-observability.md',
  'advanced/packaging': '../../docs/30-advanced/70-packaging.md',
  'best-practices/auth': '../../docs/40-best-practices/03-auth.md',
  'best-practices/performance': '../../docs/40-best-practices/05-performance.md',
  'best-practices/icons': '../../docs/40-best-practices/06-icons.md',
  'best-practices/images': '../../docs/40-best-practices/07-images.md',
  'best-practices/accessibility': '../../docs/40-best-practices/10-accessibility.md',
  'best-practices/seo': '../../docs/40-best-practices/20-seo.md',
  'appendix/faq': '../../docs/60-appendix/10-faq.md',
  'appendix/integrations': '../../docs/60-appendix/20-integrations.md',
  'appendix/debugging': '../../docs/60-appendix/25-debugging.md',
  'appendix/migrating-to-sveltekit-2': '../../docs/60-appendix/30-migrating-to-sveltekit-2.md',
  'appendix/migrating': '../../docs/60-appendix/40-migrating.md',
  'appendix/additional-resources': '../../docs/60-appendix/50-additional-resources.md',
  'appendix/glossary': '../../docs/60-appendix/60-glossary.md',
}

const refMap: Record<string, string> = {
  'reference/sveltejs-kit': '98-reference/10-@sveltejs-kit.md',
  'reference/sveltejs-kit-hooks': '98-reference/15-@sveltejs-kit-hooks.md',
  'reference/sveltejs-kit-node': '98-reference/15-@sveltejs-kit-node.md',
  'reference/sveltejs-kit-vite': '98-reference/15-@sveltejs-kit-vite.md',
  'reference/app-env': '98-reference/19-$app-env.md',
  'reference/app-environment': '98-reference/20-$app-environment.md',
  'reference/app-forms': '98-reference/20-$app-forms.md',
  'reference/app-navigation': '98-reference/20-$app-navigation.md',
  'reference/app-paths': '98-reference/20-$app-paths.md',
  'reference/app-server': '98-reference/20-$app-server.md',
  'reference/app-state': '98-reference/20-$app-state.md',
  'reference/app-stores': '98-reference/20-$app-stores.md',
  'reference/app-types': '98-reference/20-$app-types.md',
  'reference/env': '98-reference/25-$env-dynamic-private.md',
  'reference/lib': '98-reference/26-$lib.md',
  'reference/service-worker': '98-reference/27-$service-worker.md',
  'reference/configuration': '98-reference/50-configuration.md',
  'reference/cli': '98-reference/52-cli.md',
  'reference/types': '98-reference/54-types.md',
}

const getFilePath = (path: string): string => {
  const docPath = path.replace(/^\//, '')
  const mapped = pathMap[docPath]
  if (mapped) return mapped
  if (docPath.startsWith('reference/')) {
    const refPath = docPath.replace('reference/', '')
    return '../../docs/' + (refMap[refPath] || '')
  }
  return ''
}

// 当前文档的面包屑与上下篇
const currentSection = ref<(typeof docsStructure)[number] | null>(null)
const currentTitle = ref('')

const updateBreadcrumb = () => {
  currentSection.value = null
  currentTitle.value = ''
  for (const section of docsStructure) {
    const found = section.items.find((item) => item.path === route.path)
    if (found) {
      currentSection.value = section
      currentTitle.value = found.title
      break
    }
  }
}

// 上一篇 / 下一篇
const prevNext = computed(() => {
  const flat: { title: string; path: string; section: string }[] = []
  for (const section of docsStructure) {
    for (const item of section.items) {
      flat.push({ ...item, section: section.title })
    }
  }
  const idx = flat.findIndex((i) => i.path === route.path)
  return {
    prev: idx > 0 ? flat[idx - 1] : null,
    next: idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null,
  }
})

const loadDoc = async (path: string) => {
  loading.value = true
  error.value = null
  content.value = ''
  updateBreadcrumb()

  const filePath = getFilePath(path)

  if (!filePath) {
    content.value = '<p>该文档暂未提供。</p>'
    loading.value = false
    return
  }

  try {
    const response = await fetch(filePath)
    if (!response.ok) throw new Error('文档未找到')
    const text = await response.text()
    const markdownContent = text.replace(/^---[\s\S]*?---/, '')
    content.value = md.render(markdownContent)
  } catch (err) {
    console.error('加载文档失败:', err)
    error.value = '加载文档失败，请稍后重试。'
    content.value = ''
  } finally {
    loading.value = false
    await nextTick()
    if (articleRef.value) articleRef.value.scrollTop = 0
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }
}

onMounted(() => loadDoc(route.path))
watch(() => route.path, (newPath) => loadDoc(newPath))
</script>

<template>
  <div class="doc-shell">
    <Sidebar />

    <main class="doc-main">
      <div class="doc-scroll" ref="articleRef">
        <!-- 面包屑 -->
        <div class="doc-topbar">
          <nav class="crumbs" aria-label="路径">
            <router-link to="/" class="crumb">首页</router-link>
            <span class="crumb-sep">/</span>
            <span v-if="currentSection" class="crumb muted">{{ currentSection.title }}</span>
            <span v-if="currentTitle" class="crumb-sep">/</span>
            <span v-if="currentTitle" class="crumb current">{{ currentTitle }}</span>
          </nav>
        </div>

        <article class="doc-article">
          <div v-if="loading" class="state loading">
            <div class="skeleton-lines">
              <span class="sk-line w-60"></span>
              <span class="sk-line w-90"></span>
              <span class="sk-line w-75"></span>
              <span class="sk-line w-100"></span>
              <span class="sk-line w-85"></span>
              <span class="sk-line w-50"></span>
            </div>
          </div>

          <div v-else-if="error" class="state error-state">
            <p class="err-eyebrow">出错了</p>
            <p class="err-msg">{{ error }}</p>
            <button class="btn btn-ghost" @click="loadDoc(route.path)">重新加载</button>
          </div>

          <div v-else class="markdown-body" v-html="content"></div>
        </article>

        <!-- 上下篇导航 -->
        <nav v-if="!loading && !error" class="pager">
          <router-link v-if="prevNext.prev" :to="prevNext.prev.path" class="pager-card prev">
            <span class="pager-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              上一篇
            </span>
            <span class="pager-title">{{ prevNext.prev.title }}</span>
            <span class="pager-section">{{ prevNext.prev.section }}</span>
          </router-link>
          <span v-else></span>
          <router-link v-if="prevNext.next" :to="prevNext.next.path" class="pager-card next">
            <span class="pager-label">
              下一篇
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </span>
            <span class="pager-title">{{ prevNext.next.title }}</span>
            <span class="pager-section">{{ prevNext.next.section }}</span>
          </router-link>
        </nav>
      </div>
    </main>
  </div>
</template>

<style scoped>
.doc-shell {
  min-height: 100dvh;
}

.doc-main {
  margin-left: var(--sidebar-w);
  min-height: 100dvh;
}

@media (max-width: 1023px) {
  .doc-main {
    margin-left: 0;
  }
}

.doc-scroll {
  min-height: 100dvh;
}

/* —— 面包屑 —— */
.doc-topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--paper) 88%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--hairline);
}

.crumbs {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 0.85rem var(--space-2xl);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--faint);
}

.crumb {
  color: var(--muted);
}

.crumb.muted {
  color: var(--faint);
}

.crumb.current {
  color: var(--ink);
  font-weight: 500;
}

.crumb-sep {
  color: var(--hairline-2);
}

/* —— 文章 —— */
.doc-article {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 3rem var(--space-2xl) 4rem;
}

@media (max-width: 768px) {
  .doc-article {
    padding: 2rem var(--space-lg) 3rem;
  }

  .crumbs {
    padding: 0.85rem var(--space-lg);
  }
}

/* —— 加载骨架 —— */
.state {
  padding: 2rem 0;
}

.loading .skeleton-lines {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.sk-line {
  display: block;
  height: 0.95rem;
  border-radius: var(--radius-xs);
  background: linear-gradient(
    90deg,
    var(--paper-soft) 0%,
    color-mix(in srgb, var(--paper-soft) 60%, var(--surface)) 50%,
    var(--paper-soft) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite linear;
}

.w-50 { width: 50%; }
.w-60 { width: 60%; }
.w-75 { width: 75%; }
.w-85 { width: 85%; }
.w-90 { width: 90%; }
.w-100 { width: 100%; }

.sk-line:first-child {
  height: 2rem;
  width: 45%;
  margin-bottom: 0.5rem;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .sk-line {
    animation: none;
  }
}

/* —— 错误态 —— */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 3rem 0;
}

.err-eyebrow {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--flame);
}

.err-msg {
  font-size: 1.125rem;
  color: var(--ink);
  margin-bottom: 0.5rem;
}

/* —— 上下篇 —— */
.pager {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 0 var(--space-2xl) 4rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .pager {
    grid-template-columns: 1fr;
    padding: 0 var(--space-lg) 3rem;
  }
}

.pager-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1.1rem 1.25rem;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  background: var(--surface);
  transition: border-color 0.2s, transform 0.25s var(--ease-out);
}

.pager-card:hover {
  border-color: var(--flame);
  color: var(--ink);
}

.pager-card.next {
  text-align: right;
  align-items: flex-end;
}

.pager-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--faint);
}

.pager-card:hover .pager-label {
  color: var(--flame);
}

.pager-title {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  color: var(--ink);
}

.pager-section {
  font-size: var(--text-xs);
  color: var(--faint);
}

/* ── Markdown 排版 ── */
.markdown-body {
  color: var(--ink-soft);
  font-size: 1rem;
  line-height: 1.8;
}

.markdown-body :deep(h1) {
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.035em;
  margin: 0 0 1rem;
  color: var(--ink);
  padding-bottom: 0.6rem;
  border-bottom: 1px solid var(--hairline);
}

.markdown-body :deep(h2) {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  margin: 2.5rem 0 1rem;
  color: var(--ink);
  padding-top: 1.5rem;
  border-top: 1px solid var(--hairline);
}

.markdown-body :deep(h3) {
  font-size: 1.3rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 2rem 0 0.75rem;
  color: var(--ink);
}

.markdown-body :deep(h4) {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 1.5rem 0 0.5rem;
  color: var(--ink);
}

.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 1.25rem 0 0.5rem;
  color: var(--ink-soft);
}

.markdown-body :deep(p) {
  margin: 1rem 0;
}

.markdown-body :deep(a) {
  color: var(--flame);
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--flame) 30%, transparent);
  text-underline-offset: 2px;
  transition: text-decoration-color 0.2s;
}

.markdown-body :deep(a:hover) {
  text-decoration-color: var(--flame);
}

.markdown-body :deep(strong) {
  font-weight: 700;
  color: var(--ink);
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 1.25rem 0;
  padding-left: 1.5rem;
}

.markdown-body :deep(li) {
  margin: 0.4rem 0;
  line-height: 1.7;
}

.markdown-body :deep(li::marker) {
  color: var(--flame);
  font-weight: 700;
}

.markdown-body :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.875em;
  background: var(--flame-wash);
  color: #c43d12;
  padding: 0.15em 0.4em;
  border-radius: var(--radius-xs);
  font-weight: 500;
}

.markdown-body :deep(pre) {
  background: #1a1a1f;
  border-radius: var(--radius-md);
  padding: 1.25rem 1.5rem;
  overflow-x: auto;
  margin: 1.5rem 0;
  border: 1px solid #2a2a30;
  font-size: 0.875rem;
  line-height: 1.65;
}

.markdown-body :deep(pre code) {
  background: none;
  color: #e8e6dc;
  padding: 0;
  font-weight: 400;
  font-size: inherit;
}

.markdown-body :deep(blockquote) {
  margin: 1.5rem 0;
  padding: 0.5rem 0 0.5rem 1.25rem;
  border-left: 3px solid var(--flame);
  color: var(--ink-soft);
  background: transparent;
  border-radius: 0;
}

.markdown-body :deep(blockquote p) {
  margin: 0.4rem 0;
}

.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-size: 0.9rem;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border-bottom: 1px solid var(--hairline);
  padding: 0.6rem 0.85rem;
  text-align: left;
  vertical-align: top;
}

.markdown-body :deep(th) {
  background: var(--paper-soft);
  font-weight: 600;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 0.85rem;
}

.markdown-body :deep(tr:last-child td) {
  border-bottom: none;
}

.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: var(--radius-sm);
  margin: 1.5rem 0;
}

.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid var(--hairline);
  margin: 2.5rem 0;
}
</style>
