// 生成 src/utils/doc-anchor-ids.ts
//
// 上游文档被翻译成中文后，标题文本改变，标题 id 也随之变化，导致文档里大量
// 指向英文标题（如 #Making-fetch-requests、#Options-envPrefix）的锚点失配。
// 这里按页面抓取 svelte.dev 官方文档的标题 id（顺序与译文标题一一对应），
// 生成路由 → 标题 id 列表的静态映射，渲染时按顺序使用，锚点即可继续工作。
//
// 用法：node scripts/generate-doc-anchors.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const docView = fs.readFileSync(path.join(root, 'src/views/DocView.vue'), 'utf8')

// 从 DocView.vue 读取 路由 → markdown 文件的映射
const routeFiles = {}
for (const match of docView.matchAll(/'([^']+)':\s*'([^']*\.md)'/g)) {
  routeFiles[match[1]] = match[2]
}

// 统计 markdown 中二至六级标题（跳过代码块里的 # 注释）
const localHeadings = (file) => {
  let fenced = false
  const headings = []
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced
      continue
    }
    if (!fenced && /^#{2,6}\s+/.test(line)) headings.push(line)
  }
  return headings
}

const upstreamSlug = (mdPath) => path.basename(mdPath, '.md').replace(/^\d+-/, '')

const anchors = {}
const skipped = []

for (const [route, mdPath] of Object.entries(routeFiles)) {
  const relative = mdPath.replace(/^\.\.\/\.\.\//, '')
  const candidates = [path.join(root, 'public', relative), path.join(root, 'public/docs', relative)]
  const file = candidates.find((candidate) => fs.existsSync(candidate))
  if (!file) {
    skipped.push(`${route} (本地文件缺失)`)
    continue
  }

  const local = localHeadings(file)
  const slug = upstreamSlug(mdPath)

  try {
    const response = await fetch(`https://svelte.dev/docs/kit/${slug}`)
    if (!response.ok) {
      skipped.push(`${route} (上游返回 ${response.status})`)
      continue
    }
    const html = await response.text()
    const ids = [...html.matchAll(/<h[2-6][^>]*\sid="([^"]+)"/g)].map((m) => m[1])
    // 标题数量必须一致才可按顺序对应，否则宁可不改，避免锚点指错标题
    if (ids.length !== local.length) {
      skipped.push(`${route} (标题数不一致：本地 ${local.length}，上游 ${ids.length})`)
      continue
    }
    if (ids.length) anchors[route] = ids
  } catch (error) {
    skipped.push(`${route} (${error.message})`)
  }
}

const body = `// 由 scripts/generate-doc-anchors.mjs 生成，请勿手动编辑。
// 每个路由对应上游英文文档的标题 id，顺序与译文中的标题一一对应。

export const docAnchorIds: Record<string, string[]> = ${JSON.stringify(anchors, null, 2)}
`

fs.writeFileSync(path.join(root, 'src/utils/doc-anchor-ids.ts'), body)
console.log(`已写入 ${Object.keys(anchors).length} 个路由的标题 id`)
if (skipped.length) console.log('跳过：\n' + skipped.map((s) => `  - ${s}`).join('\n'))
