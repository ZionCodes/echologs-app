import { createHighlighter } from 'shiki'

// Store on globalThis so Vite HMR doesn't recreate it on every reload
async function getHighlighter() {
  if (!globalThis.__shiki_highlighter) {
    globalThis.__shiki_highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs:  ['python', 'javascript', 'shellscript', 'yaml'],
    })
  }
  return globalThis.__shiki_highlighter
}

export async function highlight(code, lang = 'python') {
  try {
    const h = await getHighlighter()
    return h.codeToHtml(code, { lang, theme: 'github-dark' })
  } catch {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    return `<pre class="shiki" style="background:#0d1117"><code>${escaped}</code></pre>`
  }
}