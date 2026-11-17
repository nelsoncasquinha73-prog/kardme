import DOMPurify from 'isomorphic-dompurify'

export function escapeWelcomeText(value: string): string {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function safeUrl(value: string, image: boolean): boolean {
  if (/[\u0000-\u0020\u007f]/.test(value)) return false
  if (/^https?:\/\//i.test(value)) return true
  return image
    ? /^(cid:[^<>]+|data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=]+)$/i.test(value)
    : /^(mailto:|tel:)/i.test(value)
}

/** Render-time only. Never writes templates. No hooks on the shared DOMPurify instance. */
export function sanitizeWelcomeHtml(html: string): { html: string; warnings: string[] } {
  const warnings: string[] = []
  const root = DOMPurify.sanitize(html, {
    RETURN_DOM: true,
    ALLOWED_TAGS: ['p', 'br', 'div', 'span', 'b', 'strong', 'i', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'img', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'width', 'colspan', 'rowspan', 'dir', 'lang', 'start'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'svg', 'math', 'template'],
  }) as HTMLElement
  if (DOMPurify.removed.length) warnings.push('HTML content or attributes removed by the safety policy.')
  for (const element of Array.from(root.querySelectorAll('*'))) {
    const el = element as HTMLElement
    const tag = el.tagName.toLowerCase()
    if (tag === 'img') {
      const src = el.getAttribute('src') || ''
      if (!safeUrl(src, true)) {
        el.replaceWith(root.ownerDocument.createTextNode(el.getAttribute('alt') || '[image]'))
        warnings.push('Image source rejected; alternative text retained.')
        continue
      }
    }
    if (tag === 'a') {
      const href = el.getAttribute('href') || ''
      if (!safeUrl(href, false)) {
        el.removeAttribute('href')
        warnings.push('Unsafe or relative link removed; link text retained.')
      }
    }
    const original = el.style
    const safe: string[] = []
    for (const property of Array.from(original)) {
      const value = original.getPropertyValue(property).trim()
      if (original.getPropertyPriority(property)) continue
      if (['color', 'background-color'].includes(property) && /^(#[0-9a-f]{3,8}|[a-z]+|rgba?\([\d\s.,%]+\))$/i.test(value)) safe.push(`${property}:${value}`)
      if (property === 'font-weight' && /^(normal|bold|[1-9]00)$/.test(value)) safe.push(`${property}:${value}`)
      if (property === 'font-style' && /^(normal|italic)$/.test(value)) safe.push(`${property}:${value}`)
      if (property === 'text-decoration' && /^(none|underline|line-through)( (underline|line-through))?$/.test(value)) safe.push(`${property}:${value}`)
      if (property === 'text-align' && /^(left|right|center|justify|start|end)$/.test(value)) safe.push(`${property}:${value}`)
    }
    const heading = /^h[1-6]$/.test(tag)
    const desired = parseFloat(original.fontSize)
    const size = heading ? (tag === 'h1' ? 24 : tag === 'h2' ? 22 : 20) : 16
    safe.push(`font-size:${Number.isFinite(desired) && /px$/.test(original.fontSize) ? Math.max(heading ? 18 : 15, Math.min(heading ? 24 : 16, desired)) : size}px`, 'line-height:1.5')
    if (['p', 'div', 'blockquote', 'ul', 'ol'].includes(tag) || heading) safe.push('margin:0 0 16px')
    if (['td', 'th'].includes(tag)) safe.push('padding:8px', 'vertical-align:top', 'overflow-wrap:anywhere')
    if (['table', 'img'].includes(tag)) {
      const width = el.getAttribute('width') || original.width
      el.removeAttribute('width')
      if (tag === 'table') {
        el.setAttribute('width', '100%')
        safe.push('width:100%')
      } else if (width && /^\d+(px)?$/.test(width)) {
        safe.push(`width:${Math.min(600, Math.max(1, parseFloat(width)))}px`)
      } else if (width && /^\d+%$/.test(width)) {
        safe.push(`width:${Math.min(100, Math.max(1, parseFloat(width)))}%`)
      } else {
        safe.push('width:auto')
      }
      safe.push('max-width:100%')
      if (tag === 'table') safe.push('border-collapse:collapse', 'table-layout:fixed')
      else safe.push('height:auto', 'display:block', 'border:0')
    }
    if (!['table', 'img'].includes(tag)) el.removeAttribute('width')
    for (const attr of ['colspan', 'rowspan', 'start']) {
      const v = el.getAttribute(attr)
      if (v && (!/^\d+$/.test(v) || Number(v) > 100)) el.removeAttribute(attr)
    }
    if (el.hasAttribute('dir') && !/^(ltr|rtl|auto)$/.test(el.getAttribute('dir') || '')) el.removeAttribute('dir')
    el.setAttribute('style', safe.join(';'))
  }
  return { html: root.innerHTML, warnings }
}
