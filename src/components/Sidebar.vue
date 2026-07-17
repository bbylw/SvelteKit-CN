<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { docsStructure } from '../docs-structure'

const router = useRouter()
const route = useRoute()

const isSidebarOpen = ref(true)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

// 查找当前活动路径在文档结构中的位置
const currentSectionIndex = computed(() => {
  return docsStructure.findIndex((section) =>
    section.items.some((item) => item.path === route.path),
  )
})

const isOpen = ref<Record<number, boolean>>({})

const toggleSection = (index: number) => {
  isOpen.value[index] = !isOpen.value[index]
}

// 初始化：展开当前所在的章节
if (currentSectionIndex.value >= 0) {
  isOpen.value[currentSectionIndex.value] = true
}
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar-closed': !isSidebarOpen }">
    <div class="sidebar-header">
      <h1 class="sidebar-title">SvelteKit 文档</h1>
      <button class="toggle-btn" @click="toggleSidebar">
        <svg
          v-if="isSidebarOpen"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    </div>

    <nav v-if="isSidebarOpen" class="sidebar-nav">
      <router-link to="/" class="nav-link home-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        </svg>
        <span>首页</span>
      </router-link>

      <div v-for="(section, index) in docsStructure" :key="section.path" class="nav-section">
        <button class="nav-section-title" @click="toggleSection(index)">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            :class="{ 'rotate': isOpen[index] }"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
          <span>{{ section.title }}</span>
        </button>

        <div v-show="isOpen[index]" class="nav-section-items">
          <router-link
            v-for="item in section.items"
            :key="item.path"
            :to="item.path"
            class="nav-link"
            :class="{ 'active': route.path === item.path }"
          >
            {{ item.title }}
          </router-link>
        </div>
      </div>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 280px;
  background-color: #1a1a1a;
  color: #e0e0e0;
  overflow-y: auto;
  transition: width 0.3s ease;
  z-index: 1000;
  border-right: 1px solid #333;
}

.sidebar-closed {
  width: 60px;
}

.sidebar-closed .sidebar-header h1,
.sidebar-closed .sidebar-nav {
  display: none;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #ff3e00;
}

.toggle-btn {
  background: none;
  border: none;
  color: #e0e0e0;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-btn:hover {
  color: #ff3e00;
}

.sidebar-nav {
  padding: 12px 0;
}

.home-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  margin-bottom: 8px;
}

.nav-section {
  margin-bottom: 8px;
}

.nav-section-title {
  width: 100%;
  padding: 10px 20px;
  background: none;
  border: none;
  color: #e0e0e0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.nav-section-title:hover {
  background-color: #2a2a2a;
}

.nav-section-title svg {
  transition: transform 0.3s ease;
}

.nav-section-title svg.rotate {
  transform: rotate(180deg);
}

.nav-section-items {
  background-color: #0f0f0f;
}

.nav-link {
  display: block;
  padding: 8px 20px 8px 44px;
  color: #a0a0a0;
  text-decoration: none;
  font-size: 13px;
  transition: color 0.2s;
}

.nav-link:hover {
  color: #e0e0e0;
  background-color: #2a2a2a;
}

.nav-link.active {
  color: #ff3e00;
  background-color: #2a2a2a;
  border-left: 3px solid #ff3e00;
}

@media (max-width: 768px) {
  .sidebar {
    width: 280px;
    transform: translateX(-100%);
  }

  .sidebar.sidebar-open {
    transform: translateX(0);
  }
}
</style>