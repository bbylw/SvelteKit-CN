import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import ini from 'highlight.js/lib/languages/ini'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import 'highlight.js/styles/github-dark.css'
import { docsStructure } from '../docs-structure'
import { docAnchorIds } from './doc-anchor-ids'

// 只注册文档实际用到的语言，避免打包完整语法包
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('json', json)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('ini', ini)
// 文档中的别名：svelte 用 XML 标记高亮，dts/jsonc/toml/env 复用相近语法
hljs.registerLanguage('svelte', xml)
hljs.registerLanguage('dts', typescript)
hljs.registerLanguage('jsonc', json)
hljs.registerLanguage('toml', ini)
hljs.registerLanguage('env', ini)

// 文档路由索引：slug → 站内路由，用于重写上游文档里的相对链接
const docRoutes = new Map<string, string>()
// 全部站内路由，用于识别根路径形式的内链
const siteRoutes = new Set<string>()

for (const section of docsStructure) {
  for (const item of section.items) {
    siteRoutes.add(item.path)
    const slug = item.path.slice(item.path.lastIndexOf('/') + 1)
    if (!docRoutes.has(slug)) docRoutes.set(slug, item.path)
    // 上游文档用 @sveltejs-kit-vite、$app-navigation 这类名字引用模块文档
    const titleSlug = item.title.replace(/\//g, '-')
    if (!docRoutes.has(titleSlug)) docRoutes.set(titleSlug, item.path)
  }
}

// 与标题 id 保持一致的锚点生成规则
export const slugify = (text: string): string =>
  text
    .replace(/<[^>]*>/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'section'

const CALLOUT_LABELS: Record<string, string> = {
  note: '注意',
  tip: '提示',
  warning: '警告',
  important: '重要',
  caution: '小心',
  legacy: '旧版',
}

// 官方文档用这些指令在构建时注入从类型定义生成的 API，翻译仓库里保留了原始指令
const OFFICIAL_DOCS = 'https://svelte.dev/docs/kit'
const DIRECTIVE = /^> (MODULE|EXPORT_SNIPPET|EXPANDED_TYPES|TYPES|SNIPPET):[ \t]*(.+)$/gm

const rewriteDirectives = (markdown: string): string =>
  markdown.replace(DIRECTIVE, (_line, kind: string, rest: string) => {
    const target = rest.trim().split(/\s+/)[0] ?? ''
    let url = OFFICIAL_DOCS

    if (kind !== 'TYPES') {
      const [moduleName = '', hash = ''] = target.split('#')
      if (moduleName) {
        url = `${OFFICIAL_DOCS}/${moduleName.replace(/\//g, '-')}${hash ? `#${hash}` : ''}`
      }
    }

    return `> [!NOTE] 此处 API 参考由官方 TypeScript 类型定义生成，本站未附带生成结果。完整签名与说明请参阅 svelte.dev 上的[英文官方文档](${url})。`
  })

interface DocEnv {
  routePath: string
  headingIndex: number
  slugCounts: Map<string, number>
  [key: string | symbol]: unknown
}

const asDocEnv = (env: unknown): DocEnv => env as DocEnv

const isExternal = (href: string) => /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)

const decodeFragment = (fragment: string): string => {
  try {
    return decodeURIComponent(fragment)
  } catch {
    return fragment
  }
}

// 标题 id 由上游英文标题生成，见 doc-anchor-ids.ts；表内路由不带前导斜杠
const anchorIdsFor = (routePath: string): string[] | undefined =>
  docAnchorIds[routePath.replace(/^\//, '')]

// 目标文档里是否存在该标题 id
const hasAnchor = (routePath: string, fragment: string): boolean =>
  anchorIdsFor(routePath)?.includes(decodeFragment(fragment)) ?? false

const resolveHref = (href: string): string => {
  if (!href) return href
  if (isExternal(href)) return href

  // 同页锚点保持上游原始大小写与标点（#Making-fetch-requests、#Options-envPrefix），
  // 和标题生成的 id 完全一致，不能再做小写化
  if (href.startsWith('#')) return href

  const hashIndex = href.indexOf('#')
  const pathPart = (hashIndex === -1 ? href : href.slice(0, hashIndex)).split('?')[0] ?? ''
  const rawHash = hashIndex === -1 ? '' : href.slice(hashIndex + 1)
  const hash = rawHash ? `#${rawHash}` : ''

  if (!pathPart) return hash || href

  const stripped = pathPart.replace(/^(?:\.\.?\/)+/, '')

  // ../svelte/... 指向 Svelte 官方文档，而不是本站
  if (stripped === 'svelte' || stripped.startsWith('svelte/')) {
    const tail = stripped === 'svelte' ? '' : `/${stripped.slice('svelte/'.length)}`
    return `https://svelte.dev/docs/svelte${tail}${hash}`
  }

  // 上游站点自身的根路径链接（/tutorial、/packages、/docs/cli 等）本站没有对应页面
  if (pathPart.startsWith('/')) {
    if (siteRoutes.has(pathPart)) return `${pathPart}${hash}`
    return `https://svelte.dev${pathPart}${hash}`
  }

  // 文档之间用文件名互相引用（如 routing#server、glossary#SSR），按 slug 找站内路由
  const slug = stripped.split('/')[0] ?? ''
  const route = docRoutes.get(slug)
  if (route) {
    // 参考页等页面没有生成该 API 标题（内容由官方类型定义生成），站内无处可跳，
    // 直接指向官方英文文档中同名模块的锚点
    if (rawHash && !hasAnchor(route, rawHash)) {
      return `https://svelte.dev/docs/kit/${slug}${hash}`
    }
    return `${route}${hash}`
  }

  return href
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch {
        // Ignore
      }
    }
    return '' // use external default escaping
  },
})

// 标题生成稳定 id，供文档内锚点跳转
md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  const inline = tokens[idx + 1]
  if (token && inline) {
    const docEnv = asDocEnv(env)
    // 译文标题按顺序沿用上游英文文档的标题 id，保证 #Making-fetch-requests
    // 这类英文锚点仍然有效；没有对应上游 id 时才回退到中文 slug
    const upstreamId = anchorIdsFor(docEnv.routePath)?.[docEnv.headingIndex]
    docEnv.headingIndex += 1
    const base = upstreamId ?? slugify(inline.content)
    const count = upstreamId ? 0 : (docEnv.slugCounts.get(base) ?? 0)
    if (!upstreamId) docEnv.slugCounts.set(base, count + 1)
    token.attrSet('id', count === 0 ? base : `${base}-${count}`)
  }
  return self.renderToken(tokens, idx, options)
}

// 重写链接：跨文档相对链接、站外链接、锚点
const defaultLinkOpen = md.renderer.rules.link_open
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  if (token) {
    const href = token.attrGet('href')
    if (typeof href === 'string' && href) {
      const resolved = resolveHref(href)
      token.attrSet('href', resolved)
      if (/^https?:\/\//.test(resolved)) {
        token.attrSet('target', '_blank')
        token.attrSet('rel', 'noopener noreferrer')
      }
    }
  }
  return defaultLinkOpen
    ? defaultLinkOpen(tokens, idx, options, env, self)
    : self.renderToken(tokens, idx, options)
}

// 表格在窄屏可横向滚动，避免撑破正文
md.renderer.rules.table_open = () => '<div class="table-wrap"><table>\n'
md.renderer.rules.table_close = () => '</table></div>\n'

// 图片默认懒加载，避免长文档一次性请求全部图资源
const renderImage = md.renderer.rules.image
if (renderImage) {
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    tokens[idx]?.attrSet('loading', 'lazy')
    tokens[idx]?.attrSet('decoding', 'async')
    return renderImage(tokens, idx, options, env, self)
  }
}

// 上游文档使用 GitHub 风格提示块（> [!NOTE]），转成带标签的引用块
md.core.ruler.push('doc-callouts', (state) => {
  const tokens = state.tokens
  for (let i = 0; i < tokens.length; i++) {
    const open = tokens[i]
    if (open?.type !== 'blockquote_open') continue

    const inline = tokens[i + 2]
    if (!inline || inline.type !== 'inline') continue

    const match = /^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION|LEGACY)\]\s*/.exec(inline.content)
    if (!match) continue

    const kind = match[1]!.toLowerCase()
    open.attrJoin('class', `callout callout-${kind}`)
    open.attrSet('data-label', CALLOUT_LABELS[kind] ?? '')

    const first = inline.children?.[0]
    if (first?.type === 'text') {
      first.content = first.content.replace(/^\[![A-Z]+\]\s*/, '')
    }
    inline.content = inline.content.replace(/^\[![A-Z]+\]\s*/, '')
  }
})

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/

const splitFrontmatter = (raw: string): { title: string; body: string } => {
  const match = FRONTMATTER.exec(raw)
  if (!match) return { title: '', body: raw }

  const title = /^title:[ \t]*(.+)$/m
    .exec(match[1] ?? '')?.[1]
    ?.trim()
    .replace(/^["']|["']$/g, '')

  return { title: title ?? '', body: raw.slice(match[0].length) }
}

export interface RenderedDoc {
  title: string
  html: string
}

export const renderDoc = (raw: string, routePath: string): RenderedDoc => {
  const { title, body } = splitFrontmatter(raw)
  const env: DocEnv = { routePath, headingIndex: 0, slugCounts: new Map() }
  return { title, html: md.render(rewriteDirectives(body), env) }
}

export default md
