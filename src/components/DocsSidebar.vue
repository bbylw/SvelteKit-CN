<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { docsStructure } from '../docs-structure'

const route = useRoute()

// 移动端抽屉控制
const isMobileOpen = ref(false)
const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 1024
  if (!isMobile.value) isMobileOpen.value = false
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
})

// 路由切换时关闭移动端抽屉
watch(
  () => route.path,
  () => {
    isMobileOpen.value = false
  },
)

// 当前活动章节
const currentSectionIndex = computed(() =>
  docsStructure.findIndex((section) =>
    section.items.some((item) => item.path === route.path),
  ),
)

// 展开状态：默认展开当前所在章节
const isOpen = ref<Record<number, boolean>>({})

const toggleSection = (index: number) => {
  isOpen.value[index] = !isOpen.value[index]
}

watch(
  currentSectionIndex,
  (idx) => {
    if (idx >= 0) isOpen.value[idx] = true
  },
  { immediate: true },
)
</script>

<template>
  <!-- 移动端遮罩 -->
  <Transition name="fade">
    <div v-if="isMobileOpen" class="scrim" @click="isMobileOpen = false"></div>
  </Transition>

  <aside class="sidebar" :class="{ 'is-open': isMobileOpen }" aria-label="文档导航">
    <div class="brand">
      <router-link to="/" class="brand-link">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <path
              d="M12 2L3 14h6l-1 8 10-12h-6l1-8z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span class="brand-text">
          <span class="brand-name">SvelteKit</span>
          <span class="brand-sub">中文文档</span>
        </span>
      </router-link>
    </div>

    <nav class="nav">
      <router-link to="/" class="nav-home" :class="{ active: route.path === '/' }">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M9 22V12h6v10" />
        </svg>
        <span>首页</span>
      </router-link>

      <div class="nav-sections">
        <div
          v-for="(section, index) in docsStructure"
          :key="section.path"
          class="nav-section"
          :class="{ 'is-open': isOpen[index], 'is-active': currentSectionIndex === index }"
        >
          <button class="nav-section-head" @click="toggleSection(index)" :aria-expanded="isOpen[index]">
            <svg
              class="chevron"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="9 6 15 12 9 18" />
            </svg>
            <span class="nav-section-label">{{ section.title }}</span>
            <span class="nav-section-count">{{ section.items.length }}</span>
          </button>

          <div class="nav-section-body">
            <router-link
              v-for="item in section.items"
              :key="item.path"
              :to="item.path"
              class="nav-item"
              :class="{ active: route.path === item.path }"
            >
              {{ item.title }}
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <div class="sidebar-foot">
      <a href="https://svelte.dev/docs/kit" target="_blank" rel="noopener" class="foot-link">
        英文官方文档
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 17L17 7" /><path d="M7 7h10v10" />
        </svg>
      </a>
    </div>
  </aside>

  <!-- 移动端触发按钮 -->
  <button
    v-if="isMobile"
    class="mobile-trigger"
    :class="{ hidden: isMobileOpen }"
    @click="isMobileOpen = true"
    aria-label="打开导航菜单"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  </button>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-w);
  background-color: var(--paper);
  border-right: 1px solid var(--hairline);
  display: flex;
  flex-direction: column;
  z-index: 100;
  overflow: hidden;
}

/* —— 品牌区 —— */
.brand {
  flex-shrink: 0;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--hairline);
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  color: var(--ink);
}

.brand-link:hover {
  color: var(--ink);
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  background: var(--flame);
  color: #fff;
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 8px rgba(255, 62, 0, 0.32);
  flex-shrink: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}

.brand-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: -0.02em;
}

.brand-sub {
  font-size: 0.6875rem;
  color: var(--faint);
  font-family: var(--font-mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* —— 导航 —— */
.nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0 1.5rem;
}

.nav-home {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 1.5rem;
  margin: 0 0.5rem 0.5rem;
  border-radius: var(--radius-sm);
  color: var(--ink-soft);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: background-color 0.15s var(--ease-smooth), color 0.15s var(--ease-smooth);
}

.nav-home:hover {
  background-color: var(--paper-soft);
  color: var(--ink);
}

.nav-home.active {
  color: var(--flame);
  background-color: var(--flame-wash);
}

.nav-sections {
  padding: 0 0.5rem;
}

.nav-section {
  margin-bottom: 0.15rem;
}

.nav-section-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--ink);
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: -0.01em;
  text-align: left;
  transition: background-color 0.15s var(--ease-smooth);
}

.nav-section-head:hover {
  background-color: var(--paper-soft);
}

.chevron {
  transition: transform 0.25s var(--ease-out);
  color: var(--faint);
  flex-shrink: 0;
}

.nav-section.is-open .chevron {
  transform: rotate(90deg);
  color: var(--ink-soft);
}

.nav-section.is-active .nav-section-head {
  color: var(--flame);
}

.nav-section-count {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--faint);
  background: var(--paper-soft);
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-pill);
  min-width: 1.25rem;
  text-align: center;
}

.nav-section-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s var(--ease-out);
}

.nav-section.is-open .nav-section-body {
  grid-template-rows: 1fr;
}

.nav-section-body > .nav-item:first-child {
  margin-top: 0.25rem;
}

.nav-item {
  display: block;
  padding: 0.4rem 0.75rem 0.4rem 1.9rem;
  border-radius: var(--radius-sm);
  color: var(--muted);
  font-size: 0.8125rem;
  line-height: 1.4;
  transition: background-color 0.15s var(--ease-smooth), color 0.15s var(--ease-smooth);
}

.nav-item:hover {
  color: var(--ink);
  background-color: var(--paper-soft);
}

.nav-item.active {
  color: var(--ink);
  font-weight: 500;
  background-color: var(--surface);
  box-shadow: inset 2px 0 0 var(--flame);
}

/* —— 底部 —— */
.sidebar-foot {
  flex-shrink: 0;
  padding: 0.9rem 1.25rem;
  border-top: 1px solid var(--hairline);
}

.foot-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  color: var(--muted);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  letter-spacing: 0.02em;
  transition: background-color 0.15s var(--ease-smooth), color 0.15s var(--ease-smooth);
}

.foot-link:hover {
  color: var(--ink);
  background-color: var(--paper-soft);
}

/* —— 移动端触发 —— */
.mobile-trigger {
  position: fixed;
  top: 0.85rem;
  left: 0.85rem;
  z-index: 200;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  background: var(--surface);
  border: 1px solid var(--hairline-2);
  border-radius: var(--radius-sm);
  color: var(--ink);
  box-shadow: var(--shadow-soft);
  transition: opacity 0.2s, transform 0.2s;
}

.mobile-trigger.hidden {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.9);
}

/* —— 过渡 —— */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s var(--ease-smooth);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* —— 移动端 —— */
@media (max-width: 1023px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s var(--ease-out);
    box-shadow: var(--shadow-lift);
  }

  .sidebar.is-open {
    transform: translateX(0);
  }
}

@media (min-width: 1024px) {
  .mobile-trigger {
    display: none;
  }
}
</style>
