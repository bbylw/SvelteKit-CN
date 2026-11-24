<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DocsSidebar from '../components/DocsSidebar.vue'
import { docsStructure } from '../docs-structure'

const route = useRoute()
const router = useRouter()

const goHome = () => router.push('/')
const goFirstDoc = () => router.push(docsStructure[0]?.items[0]?.path ?? '/')

onMounted(() => {
  document.title = '页面未找到 · SvelteKit 中文文档'
})
</script>

<template>
  <div class="not-found-shell">
    <DocsSidebar />

    <a href="#main-content" class="skip-link">跳转到正文</a>

    <main id="main-content" class="not-found-main" tabindex="-1">
      <div class="not-found-inner">
        <p class="eyebrow">404</p>
        <h1 class="title">这个页面不存在</h1>
        <p class="lead">
          找不到 <code>{{ route.fullPath }}</code>
          对应的文档。链接可能已经过期，或者地址输入有误。
        </p>

        <div class="actions">
          <button type="button" class="btn btn-primary" @click="goHome">
            返回首页
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
          <button type="button" class="btn btn-ghost" @click="goFirstDoc">从简介开始阅读</button>
        </div>

        <p class="hint">
          也可以直接浏览侧边栏中的文档，或者查看
          <a href="https://svelte.dev/docs/kit" target="_blank" rel="noopener noreferrer">英文官方文档</a>。
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.not-found-shell {
  min-height: 100dvh;
}

.not-found-main {
  margin-left: var(--sidebar-w);
  min-height: 100dvh;
  display: grid;
  place-items: center;
}

@media (max-width: 1023px) {
  .not-found-main {
    margin-left: 0;
    padding-top: 4rem;
  }
}

.not-found-inner {
  max-width: var(--content-max);
  width: 100%;
  padding: 4rem var(--space-2xl);
}

.eyebrow {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.16em;
  color: var(--flame-text);
  margin-bottom: 0.75rem;
}

.title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.15;
  color: var(--ink);
  margin-bottom: 1rem;
}

.lead {
  color: var(--muted);
  font-size: 1.0625rem;
  line-height: 1.75;
  max-width: 48ch;
  margin-bottom: 2rem;
}

.lead code {
  font-family: var(--font-mono);
  font-size: 0.875em;
  background: var(--flame-wash);
  color: #c43d12;
  padding: 0.15em 0.4em;
  border-radius: var(--radius-xs);
  word-break: break-all;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.hint {
  font-size: var(--text-sm);
  color: var(--faint);
}

.hint a {
  color: var(--flame-text);
  text-decoration: underline;
  text-underline-offset: 2px;
}

@media (max-width: 768px) {
  .not-found-inner {
    padding: 2.5rem var(--space-lg);
  }
}
</style>
