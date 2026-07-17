<script setup lang="ts">
import { useRouter } from 'vue-router'
import Sidebar from '../components/Sidebar.vue'

const router = useRouter()

const goToDoc = (path: string) => {
  router.push(path)
}

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
}
</script>

<template>
  <div class="home-layout">
    <Sidebar />
    <main class="home-main">
      <div class="hero">
        <div class="hero-content">
          <div class="logo-section">
            <svg
              width="128"
              height="128"
              viewBox="0 0 512 512"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="heroBgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stop-color="#FF6B35" />
                  <stop offset="0.5" stop-color="#FF3E00" />
                  <stop offset="1" stop-color="#D62E00" />
                </linearGradient>
                <linearGradient id="heroHighlight" x1="120" y1="80" x2="300" y2="300" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.35" />
                  <stop offset="1" stop-color="#FFFFFF" stop-opacity="0" />
                </linearGradient>
              </defs>
              <rect width="512" height="512" rx="112" fill="url(#heroBgGrad)" />
              <rect width="512" height="512" rx="112" fill="url(#heroHighlight)" />
              <path
                d="M398 178C398 130 356 92 300 92C250 92 210 116 188 152L146 212C142 218 140 225 140 232C140 242 146 251 156 255C166 259 177 257 184 249L226 189C238 171 258 160 280 160C318 160 348 190 348 228C348 246 340 263 326 275L318 281C332 285 344 293 354 304C380 282 398 248 398 210Z"
                fill="#FFFFFF"
              />
              <path
                d="M114 334C114 382 156 420 212 420C262 420 302 396 324 360L366 300C370 294 372 287 372 280C372 270 366 261 356 257C346 253 335 255 328 263L286 323C274 341 254 352 232 352C194 352 164 322 164 284C164 266 172 249 186 237L194 231C180 227 168 219 158 208C132 230 114 264 114 302Z"
                fill="#FFFFFF"
              />
            </svg>
            <h1 class="hero-title">SvelteKit</h1>
            <p class="hero-subtitle">精简高效的 Web 开发</p>
          </div>

          <p class="hero-description">
            SvelteKit 是一个用于快速开发健壮、高性能 Web 应用的框架，基于 Svelte 构建。
          </p>

          <div class="hero-actions">
            <button class="btn btn-primary" @click="goToDoc('/getting-started/introduction')">
              开始使用
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            <button class="btn btn-secondary" @click="goToDoc('/core-concepts/routing')">
              查看文档
            </button>
          </div>
        </div>
      </div>

      <div class="features">
        <div class="features-container">
          <h2 class="section-title">核心特性</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff3e00" stroke-width="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
              </div>
              <h3>快速开发</h3>
              <p>利用 Svelte 的编译时特性，提供极快的开发体验和热模块替换</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff3e00" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 6v6l4 2"></path>
                </svg>
              </div>
              <h3>高性能</h3>
              <p>优化的构建系统，仅加载最小必需的代码，提供出色的性能表现</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff3e00" stroke-width="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                </svg>
              </div>
              <h3>灵活部署</h3>
              <p>支持多种部署方式，包括 Node.js、静态站点、Cloudflare Workers 等</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff3e00" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </div>
              <h3>类型安全</h3>
              <p>完整的 TypeScript 支持，提供出色的开发体验和类型检查</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff3e00" stroke-width="2">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                  <line x1="4" y1="22" x2="4" y2="15"></line>
                </svg>
              </div>
              <h3>服务端渲染</h3>
              <p>可配置的渲染策略，支持 SSR、CSR 和预渲染，灵活应对不同场景</p>
            </div>

            <div class="feature-card">
              <div class="feature-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff3e00" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h3>安全可靠</h3>
              <p>内置安全特性，遵循 Web 最佳实践，保障应用安全</p>
            </div>
          </div>
        </div>
      </div>

      <div class="getting-started">
        <div class="getting-started-container">
          <h2 class="section-title">快速开始</h2>
          <div class="steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <h3>创建新项目</h3>
                <div class="code-block">
                  <code>npm create svelte@latest my-app</code>
                  <button class="copy-btn" @click="copyToClipboard('npm create svelte@latest my-app')">
                    复制
                  </button>
                </div>
              </div>
            </div>

            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <h3>进入项目目录</h3>
                <div class="code-block">
                  <code>cd my-app</code>
                  <button class="copy-btn" @click="copyToClipboard('cd my-app')">
                    复制
                  </button>
                </div>
              </div>
            </div>

            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <h3>安装依赖并运行</h3>
                <div class="code-block">
                  <code>npm install && npm run dev</code>
                  <button class="copy-btn" @click="copyToClipboard('npm install && npm run dev')">
                    复制
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer class="footer">
        <div class="footer-content">
          <p>SvelteKit 中文文档 | 基于 SvelteKit v3</p>
          <div class="footer-links">
            <a href="https://svelte.dev" target="_blank" rel="noopener">Svelte 官网</a>
            <a href="https://svelte.dev/docs" target="_blank" rel="noopener">官方文档</a>
            <a href="https://github.com/sveltejs/kit" target="_blank" rel="noopener">GitHub</a>
          </div>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.home-layout {
  display: flex;
  min-height: 100vh;
  background-color: #0d0d0d;
}

.home-main {
  flex: 1;
  margin-left: 280px;
}

.hero {
  background: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%);
  padding: 80px 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-content {
  max-width: 800px;
  text-align: center;
}

.logo-section {
  margin-bottom: 32px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin: 24px 0 8px;
  background: linear-gradient(135deg, #ff3e00 0%, #ff6b35 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.5rem;
  color: #a0a0a0;
  margin: 0 0 24px;
}

.hero-description {
  font-size: 1.125rem;
  color: #e0e0e0;
  line-height: 1.8;
  margin: 0 0 40px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background-color: #ff3e00;
  color: white;
}

.btn-primary:hover {
  background-color: #ff6b35;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 62, 0, 0.3);
}

.btn-secondary {
  background-color: transparent;
  color: #e0e0e0;
  border: 2px solid #333;
}

.btn-secondary:hover {
  border-color: #ff3e00;
  color: #ff3e00;
}

.features {
  padding: 80px 60px;
  background-color: #0d0d0d;
}

.features-container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 48px;
  color: #ffffff;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
}

.feature-card {
  background-color: #1a1a1a;
  border-radius: 16px;
  padding: 32px;
  transition: all 0.3s;
  border: 1px solid #333;
}

.feature-card:hover {
  transform: translateY(-4px);
  border-color: #ff3e00;
  box-shadow: 0 8px 24px rgba(255, 62, 0, 0.1);
}

.feature-icon {
  margin-bottom: 20px;
}

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #ffffff;
}

.feature-card p {
  color: #a0a0a0;
  line-height: 1.6;
  font-size: 0.95rem;
}

.getting-started {
  padding: 80px 60px;
  background-color: #0d0d0d;
}

.getting-started-container {
  max-width: 800px;
  margin: 0 auto;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.step {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.step-number {
  width: 48px;
  height: 48px;
  background-color: #ff3e00;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #ffffff;
}

.code-block {
  background-color: #1a1a1a;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #333;
}

.code-block code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  color: #ff6b35;
}

.copy-btn {
  background-color: #2a2a2a;
  color: #e0e0e0;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.copy-btn:hover {
  background-color: #ff3e00;
  color: white;
}

.footer {
  padding: 40px 60px;
  background-color: #0a0a0a;
  border-top: 1px solid #333;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-content p {
  color: #a0a0a0;
  font-size: 0.9rem;
}

.footer-links {
  display: flex;
  gap: 24px;
}

.footer-links a {
  color: #e0e0e0;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: #ff3e00;
}

@media (max-width: 768px) {
  .home-main {
    margin-left: 0;
  }

  .hero {
    padding: 40px 20px;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.125rem;
  }

  .hero-actions {
    flex-direction: column;
  }

  .features,
  .getting-started {
    padding: 40px 20px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .footer-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}
</style>