<script setup lang="ts">
import { useRouter } from 'vue-router'
import Sidebar from '../components/Sidebar.vue'
import { docsStructure } from '../docs-structure'

const router = useRouter()

const goToDoc = (path: string) => {
  router.push(path)
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // 静默失败
  }
}

const features = [
  {
    title: '编译时优化',
    desc: 'Svelte 将组件编译为高效的原生 JS，没有虚拟 DOM 运行时开销。',
    icon: 'bolt',
  },
  {
    title: '文件即路由',
    desc: '基于文件系统的路由，布局组件、参数与 REST 行为一眼可读。',
    icon: 'route',
  },
  {
    title: '数据加载',
    desc: 'load 函数在服务端与客户端并行运行，自动处理水合与预取。',
    icon: 'database',
  },
  {
    title: '表单操作',
    desc: '渐进增强的表单处理，支持表单 Action 与失效模式回退。',
    icon: 'form',
  },
  {
    title: '灵活部署',
    desc: '一个适配器接口覆盖 Node、Cloudflare、Netlify、Vercel 与静态站点。',
    icon: 'deploy',
  },
  {
    title: '类型安全',
    desc: '路由参数、加载结果、表单动作全链路 TypeScript 类型推导。',
    icon: 'shield',
  },
]

const steps = [
  { cmd: 'npx sv create my-app', note: '使用官方脚手架创建项目' },
  { cmd: 'cd my-app', note: '进入项目目录' },
  { cmd: 'npm install', note: '安装依赖' },
  { cmd: 'npm run dev', note: '启动开发服务器' },
]

const sections = docsStructure.slice(0, 4)
</script>

<template>
  <div class="home">
    <Sidebar />

    <main class="main">
      <!-- ── 英雄区：非对称 ── -->
      <section class="hero">
        <div class="hero-grid">
          <div class="hero-left">
            <p class="eyebrow">SvelteKit v3 · 中文文档</p>
            <h1 class="hero-title">
              精简高效的<br />
              <span class="accent">Web 开发</span>框架
            </h1>
            <p class="hero-lead">
              SvelteKit 是基于 Svelte 构建的应用框架。它在编译时把组件编译为高效的原生 JavaScript，
              没有虚拟 DOM 的运行时开销——更小的包体、更快的首屏、更直观的心智模型。
            </p>
            <div class="hero-actions">
              <button class="btn btn-primary" @click="goToDoc('/getting-started/introduction')">
                开始使用
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
              <button class="btn btn-ghost" @click="goToDoc('/core-concepts/routing')">
                浏览文档
              </button>
            </div>
            <div class="hero-meta">
              <span class="meta-item">
                <span class="dot"></span> MIT 开源协议
              </span>
              <span class="meta-sep">·</span>
              <a href="https://github.com/sveltejs/kit" target="_blank" rel="noopener" class="meta-item">
                GitHub
              </a>
            </div>
          </div>

          <!-- 签名元素：编译器可视化卡片 -->
          <div class="hero-right" aria-hidden="true">
            <div class="compile-card">
              <div class="cc-head">
                <span class="cc-dot red"></span>
                <span class="cc-dot amber"></span>
                <span class="cc-dot green"></span>
                <span class="cc-label">compiler.svelte</span>
              </div>
              <div class="cc-body">
                <div class="cc-line"><span class="cc-kw">&lt;script&gt;</span></div>
                <div class="cc-line indent"><span class="cc-prop">let</span> <span class="cc-var">count</span> = <span class="cc-num">0</span></div>
                <div class="cc-line indent"><span class="cc-fn">$</span>: <span class="cc-str">doubled</span> = count * <span class="cc-num">2</span></div>
                <div class="cc-line"><span class="cc-kw">&lt;/script&gt;</span></div>
                <div class="cc-line mt"><span class="cc-kw">&lt;button</span> <span class="cc-prop">on:click</span>=<span class="cc-str">{() =&gt; count++}</span><span class="cc-kw">&gt;</span></div>
                <div class="cc-line indent cc-out">{count} · {doubled}</div>
                <div class="cc-line"><span class="cc-kw">&lt;/button&gt;</span></div>
              </div>
              <div class="cc-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
                <span>编译</span>
              </div>
              <div class="cc-result">
                <div class="cc-line"><span class="cc-comment">// 编译产物：零运行时</span></div>
                <div class="cc-line indent"><span class="cc-fn">function</span> <span class="cc-var">create_fragment</span>(<span class="cc-prop">ctx</span>) {</div>
                <div class="cc-line indent">  <span class="cc-comment">// 直接操作 DOM</span></div>
                <div class="cc-line indent">  <span class="cc-kw">return</span> { ... }</div>
                <div class="cc-line indent">}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── 核心特性：分隔列表，非三栏卡片 ── -->
      <section class="features">
        <div class="container">
          <header class="section-head">
            <p class="eyebrow">Why SvelteKit</p>
            <h2 class="section-title">为性能与开发体验而生</h2>
          </header>
          <div class="feature-list">
            <article v-for="(f, i) in features" :key="f.title" class="feature">
              <span class="feature-idx">{{ String(i + 1).padStart(2, '0') }}</span>
              <div class="feature-main">
                <h3>{{ f.title }}</h3>
                <p>{{ f.desc }}</p>
              </div>
              <span class="feature-tag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </span>
            </article>
          </div>
        </div>
      </section>

      <!-- ── 快速开始 ── -->
      <section class="start">
        <div class="container start-inner">
          <div class="start-text">
            <p class="eyebrow">Quick Start</p>
            <h2 class="section-title">三十秒跑起来</h2>
            <p class="start-lead">
              四条命令，从零到本地开发服务器。SvelteKit 的脚手架开箱即用，无需繁琐配置。
            </p>
          </div>
          <div class="start-steps">
            <div v-for="(s, i) in steps" :key="s.cmd" class="step">
              <span class="step-num">{{ i + 1 }}</span>
              <button class="step-cmd" @click="copyToClipboard(s.cmd)">
                <code>{{ s.cmd }}</code>
                <span class="step-copy">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </span>
              </button>
              <span class="step-note">{{ s.note }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── 文档导航 ── -->
      <section class="docnav">
        <div class="container">
          <header class="section-head">
            <p class="eyebrow">Documentation</p>
            <h2 class="section-title">按主题浏览</h2>
          </header>
          <div class="docnav-grid">
            <button
              v-for="section in sections"
              :key="section.path"
              class="docnav-card"
              @click="goToDoc(section.items[0]?.path ?? section.path)"
            >
              <div class="dn-top">
                <h3>{{ section.title }}</h3>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
              <ul class="dn-items">
                <li v-for="item in section.items.slice(0, 4)" :key="item.path">{{ item.title }}</li>
              </ul>
              <span class="dn-count">共 {{ section.items.length }} 篇</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ── 页脚 ── -->
      <footer class="footer">
        <div class="container footer-inner">
          <div class="footer-brand">
            <span class="brand-mark-sm">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2L3 14h6l-1 8 10-12h-6l1-8z" /></svg>
            </span>
            <div>
              <p class="footer-name">SvelteKit 中文文档</p>
              <p class="footer-tag">基于 SvelteKit v3 · MIT 协议</p>
            </div>
          </div>
          <nav class="footer-links">
            <a href="https://svelte.dev" target="_blank" rel="noopener">Svelte 官网</a>
            <a href="https://svelte.dev/docs/kit" target="_blank" rel="noopener">英文文档</a>
            <a href="https://svelte.dev/chat" target="_blank" rel="noopener">社区</a>
            <a href="https://github.com/sveltejs/kit" target="_blank" rel="noopener">GitHub</a>
          </nav>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.home {
  min-height: 100dvh;
}

.main {
  margin-left: var(--sidebar-w);
  min-height: 100dvh;
}

@media (max-width: 1023px) {
  .main {
    margin-left: 0;
  }
}

/* ── 英雄区 ── */
.hero {
  padding: 5rem 0 4rem;
}

.hero-grid {
  max-width: var(--layout-max);
  margin: 0 auto;
  padding: 0 var(--space-2xl);
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 3rem;
  align-items: center;
}

.hero-left {
  max-width: 560px;
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 3.75rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.035em;
  margin: 0.75rem 0 1.25rem;
  color: var(--ink);
}

.hero-title .accent {
  color: var(--flame);
}

.hero-lead {
  font-size: 1.0625rem;
  line-height: 1.75;
  color: var(--muted);
  max-width: 52ch;
  margin-bottom: 2rem;
}

.hero-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-sm);
  color: var(--faint);
  font-family: var(--font-mono);
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--moss);
  display: inline-block;
}

.meta-sep {
  color: var(--hairline-2);
}

/* —— 编译器卡片 —— */
.hero-right {
  position: relative;
}

.compile-card {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lift);
  overflow: hidden;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  line-height: 1.7;
}

.cc-head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1rem;
  border-bottom: 1px solid var(--hairline);
  background: var(--paper-soft);
}

.cc-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}

.cc-dot.red { background: #ff5f56; }
.cc-dot.amber { background: #ffbd2e; }
.cc-dot.green { background: #27c93f; }

.cc-label {
  margin-left: 0.5rem;
  color: var(--faint);
  font-size: 0.75rem;
}

.cc-body,
.cc-result {
  padding: 1rem 1.25rem;
}

.cc-line {
  white-space: pre;
}

.cc-line.indent {
  padding-left: 1.5rem;
}

.cc-line.mt {
  margin-top: 0.5rem;
}

.cc-kw { color: var(--slate); }
.cc-prop { color: #b15c5c; }
.cc-var { color: var(--ink); }
.cc-num { color: var(--flame); }
.cc-str { color: var(--moss); }
.cc-fn { color: #8b5cf6; }
.cc-out { color: var(--flame); font-weight: 500; }
.cc-comment { color: var(--faint); }

.cc-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.65rem;
  background: var(--flame-wash);
  border-top: 1px solid var(--hairline);
  border-bottom: 1px solid var(--hairline);
  color: var(--flame);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
}

.cc-result {
  background: var(--paper-soft);
}

/* ── 区块通用 ── */
.section-head {
  margin-bottom: 2.5rem;
}

.section-title {
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--ink);
  margin-top: 0.5rem;
}

/* ── 特性列表 ── */
.features {
  padding: 4.5rem 0;
  background: var(--paper-soft);
  border-top: 1px solid var(--hairline);
  border-bottom: 1px solid var(--hairline);
}

.feature-list {
  border-top: 1px solid var(--hairline-2);
}

.feature {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem 0.5rem;
  border-bottom: 1px solid var(--hairline);
  transition: padding-left 0.25s var(--ease-out);
}

.feature:hover {
  padding-left: 1.5rem;
}

.feature:hover .feature-tag {
  color: var(--flame);
  transform: translateX(4px);
}

.feature-idx {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--faint);
  min-width: 2.5rem;
}

.feature-main h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 0.35rem;
}

.feature-main p {
  color: var(--muted);
  font-size: 0.9375rem;
  line-height: 1.6;
}

.feature-tag {
  color: var(--hairline-2);
  transition: transform 0.25s var(--ease-out), color 0.25s;
}

/* ── 快速开始 ── */
.start {
  padding: 4.5rem 0;
}

.start-inner {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 3.5rem;
  align-items: start;
}

.start-text {
  position: sticky;
  top: 2rem;
}

.start-lead {
  color: var(--muted);
  font-size: 1rem;
  margin-top: 1rem;
  max-width: 40ch;
}

.start-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 1rem;
}

.step-num {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--flame-wash);
  color: var(--flame);
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 600;
}

.step-cmd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  text-align: left;
  background: var(--ink);
  color: #e8e6dc;
  border: 1px solid #2a2a2e;
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-family: var(--font-mono);
  transition: border-color 0.2s, transform 0.15s;
}

.step-cmd:hover {
  border-color: var(--flame);
}

.step-cmd:active {
  transform: scale(0.98);
}

.step-cmd code {
  font-size: 0.875rem;
  color: #ffb89f;
}

.step-copy {
  color: var(--faint);
  transition: color 0.2s;
}

.step-cmd:hover .step-copy {
  color: var(--flame-soft);
}

.step-note {
  grid-column: 2;
  font-size: 0.8125rem;
  color: var(--faint);
  margin-top: -0.25rem;
}

/* ── 文档导航 ── */
.docnav {
  padding: 4.5rem 0;
  background: var(--paper-soft);
  border-top: 1px solid var(--hairline);
}

.docnav-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

.docnav-card {
  text-align: left;
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  padding: 1.5rem;
  transition: border-color 0.2s, transform 0.25s var(--ease-out), box-shadow 0.25s;
}

.docnav-card:hover {
  border-color: var(--flame);
  transform: translateY(-3px);
  box-shadow: var(--shadow-soft);
}

.dn-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.dn-top h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--ink);
}

.docnav-card:hover .dn-top svg {
  color: var(--flame);
  transform: translateX(3px);
}

.dn-top svg {
  color: var(--faint);
  transition: transform 0.25s, color 0.25s;
}

.dn-items {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem;
}

.dn-items li {
  font-size: 0.875rem;
  color: var(--muted);
  padding: 0.25rem 0;
}

.dn-count {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--faint);
}

/* ── 页脚 ── */
.footer {
  padding: 2.5rem 0;
  border-top: 1px solid var(--hairline);
  background: var(--paper);
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.brand-mark-sm {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  background: var(--flame);
  color: #fff;
  border-radius: var(--radius-xs);
}

.footer-name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--ink);
}

.footer-tag {
  font-size: 0.75rem;
  color: var(--faint);
  font-family: var(--font-mono);
}

.footer-links {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.footer-links a {
  color: var(--muted);
  font-size: 0.875rem;
}

.footer-links a:hover {
  color: var(--ink);
}

/* ── 响应式 ── */
@media (max-width: 1024px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }

  .hero-right {
    max-width: 480px;
  }

  .start-inner {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .start-text {
    position: static;
  }

  .docnav-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 4.5rem 0 3rem;
  }

  .hero-grid {
    padding: 0 var(--space-lg);
  }

  .features,
  .start,
  .docnav {
    padding: 3rem 0;
  }

  .feature {
    grid-template-columns: auto 1fr;
    gap: 1rem;
    padding: 1.25rem 0.25rem;
  }

  .feature-tag {
    display: none;
  }

  .footer-inner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
