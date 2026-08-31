/**
 * Comprehensive Markdown & Rich Content Renderer
 * Converts Markdown, Tables, Alert Boxes, Embeds, and Lists into Semantic HTML
 * Clean minimalist typography with zero icons
 */

export const renderMarkdownToHtml = (raw: string | string[] | undefined | null): string => {
  if (!raw) return ''

  let text = Array.isArray(raw) ? raw.join('\n\n') : String(raw)
  if (!text.trim()) return ''

  // 1. YouTube & Loom Video Embeds
  text = text.replace(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})[^\s\)]*/gi, (_, videoId) => {
    return `<div class="article-video-container"><iframe src="https://www.youtube-nocookie.com/embed/${videoId}" title="YouTube Video Player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
  })

  text = text.replace(/https?:\/\/(?:www\.)?loom\.com\/share\/([a-zA-Z0-9_-]+)[^\s\)]*/gi, (_, loomId) => {
    return `<div class="article-video-container"><iframe src="https://www.loom.com/embed/${loomId}" title="Loom Video Player" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>`
  })

  // 2. Code Blocks (```lang ... ```)
  text = text.replace(/```([a-z0-9_-]*)\r?\n([\s\S]*?)```/gi, (_, lang, code) => {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<div class="article-code-block"><div class="code-block-header"><span>${lang ? lang.toUpperCase() : 'CODE'}</span></div><pre><code>${escaped}</code></pre></div>`
  })

  // 3. Images with Caption (![alt](url))
  text = text.replace(/!\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/g, '<figure class="article-inline-image-box"><img src="$2" alt="$1" class="article-inline-img" /><figcaption class="img-caption">$1</figcaption></figure>')

  // 4. Links ([title](url))
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="article-inline-link">$1</a>')

  // 5. Horizontal Dividers (--- or ***)
  text = text.replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr class="article-divider" />')

  // 6. Headings (# H1, ## H2, ### H3, #### H4)
  text = text.replace(/^#### (.*?)$/gm, '<h4 class="article-h4">$1</h4>')
  text = text.replace(/^### (.*?)$/gm, '<h3 class="article-h3">$1</h3>')
  text = text.replace(/^## (.*?)$/gm, '<h2 class="article-h2">$1</h2>')
  text = text.replace(/^# (.*?)$/gm, '<h1 class="article-h1">$1</h1>')

  // 7. Clean Minimalist Alert Callout Boxes (ZERO ICONS)
  text = text.replace(/^(?:> (.*?)(?:\n|$))+/gm, (match) => {
    let content = match.split('\n').map(l => l.replace(/^>\s?/, '').trim()).filter(Boolean).join('<br>')
    
    // Strip any residual emojis/unicode symbols
    content = content.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim()

    if (content.includes('[!TIP]') || content.toLowerCase().includes('tip:') || content.toLowerCase().includes('pro tip')) {
      const clean = content.replace(/\[!TIP\]/gi, '').replace(/^(?:<br\s*\/?>)+|(?:<br\s*\/?>)+$/gi, '').trim()
      return `<div class="article-alert alert-tip"><div class="alert-content">${clean}</div></div>`
    }
    if (content.includes('[!WARNING]') || content.toLowerCase().includes('warning:') || content.toLowerCase().includes('caution:')) {
      const clean = content.replace(/\[!WARNING\]/gi, '').replace(/^(?:<br\s*\/?>)+|(?:<br\s*\/?>)+$/gi, '').trim()
      return `<div class="article-alert alert-warning"><div class="alert-content">${clean}</div></div>`
    }
    if (content.includes('[!NOTE]') || content.toLowerCase().includes('note:') || content.toLowerCase().includes('important:')) {
      const clean = content.replace(/\[!NOTE\]/gi, '').replace(/^(?:<br\s*\/?>)+|(?:<br\s*\/?>)+$/gi, '').trim()
      return `<div class="article-alert alert-info"><div class="alert-content">${clean}</div></div>`
    }
    if (content.toLowerCase().includes('key takeaway') || content.toLowerCase().includes('best practice')) {
      const clean = content.replace(/^(?:<br\s*\/?>)+|(?:<br\s*\/?>)+$/gi, '').trim()
      return `<div class="article-alert alert-success"><div class="alert-content">${clean}</div></div>`
    }

    return `<blockquote class="article-quote">${content}</blockquote>`
  })

  // 8. Tables (| col1 | col2 |)
  text = text.replace(/((?:\|[^\n]+\|\r?\n?)+)/g, (tableMatch) => {
    const lines = tableMatch.trim().split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length >= 2 && lines[0] && lines[1] && lines[1].includes('---')) {
      const headers = lines[0].split('|').slice(1, -1).map(h => h.trim())
      const rows = lines.slice(2).map(row => row.split('|').slice(1, -1).map(c => c.trim()))
      
      const thead = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`
      const tbody = `<tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`
      
      return `<div class="article-table-wrapper"><table class="article-table">${thead}${tbody}</table></div>`
    }
    return tableMatch
  })

  // 9. Interactive Task Checklists (- [x] task or - [ ] task)
  text = text.replace(/^-\s*\[x\]\s*(.*?)$/gm, '<li class="task-item is-checked"><span class="task-badge task-badge-done">✓</span><span>$1</span></li>')
  text = text.replace(/^-\s*\[\s?\]\s*(.*?)$/gm, '<li class="task-item is-pending"><span class="task-badge task-badge-todo">○</span><span>$1</span></li>')

  // 10. Inline Text Formatting
  text = text.replace(/~~(.*?)~~/g, '<del class="article-strikethrough">$1</del>')
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>')
  text = text.replace(/`([^`]+)`/g, '<code class="article-inline-code">$1</code>')

  // 11. Bullet & Numbered Lists
  text = text.replace(/^\s*-\s+(.*?)$/gm, '<li class="article-bullet-item">$1</li>')
  text = text.replace(/(<li class="task-item[\s\S]*?<\/li>)+/g, '<ul class="article-task-list">$1</ul>')
  text = text.replace(/(<li class="article-bullet-item[\s\S]*?<\/li>)+/g, '<ul class="article-bullet-list">$1</ul>')
  text = text.replace(/^\s*(\d+)\.\s+(.*?)$/gm, '<li class="article-numbered-item">$2</li>')
  text = text.replace(/(<li class="article-numbered-item[\s\S]*?<\/li>)+/g, '<ol class="article-numbered-list">$1</ol>')

  // 12. Paragraphs
  const paragraphs = text.split(/\n\s*\n/)
  return paragraphs.map(p => {
    p = p.trim()
    if (!p) return ''
    if (p.startsWith('<h') || p.startsWith('<div') || p.startsWith('<ul') || p.startsWith('<ol') || p.startsWith('<figure') || p.startsWith('<blockquote') || p.startsWith('<hr')) {
      return p
    }
    return `<p class="article-paragraph">${p.replace(/\n/g, '<br>')}</p>`
  }).filter(Boolean).join('\n\n')
}
