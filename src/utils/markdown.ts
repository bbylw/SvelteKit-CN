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

// 只注册文档实际用到的语言，避免打包完整语法包
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('json', json)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('ini', ini)

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

// 图片默认懒加载，避免长文档一次性请求全部图资源
const renderImage = md.renderer.rules.image
if (renderImage) {
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    tokens[idx]?.attrSet('loading', 'lazy')
    tokens[idx]?.attrSet('decoding', 'async')
    return renderImage(tokens, idx, options, env, self)
  }
}

export default md