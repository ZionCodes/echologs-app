import { createHighlighter } from 'shiki'

async function getHighlighter() {
  if (!globalThis.__shiki) {
    globalThis.__shiki = await createHighlighter({
      themes: ['github-dark'],
      langs:  ['python', 'javascript', 'shellscript', 'yaml'],
    })
  }
  return globalThis.__shiki
}

export async function highlight(code, lang = 'python') {
  try {
    const h       = await getHighlighter()
    const safeLang = lang === 'bash' ? 'shellscript' : lang
    return h.codeToHtml(code, { lang: safeLang, theme: 'github-dark' })
  } catch {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    return `<pre class="shiki" style="background:#0d1117"><code>${escaped}</code></pre>`
  }
}