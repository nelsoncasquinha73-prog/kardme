import DOMPurify from 'isomorphic-dompurify'

// Renderiza blocos de email para HTML "email-safe"
function sanitizeEmailHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'style', 'color'],
    KEEP_CONTENT: true,
  })
}

export function renderEmailBlockToHtml(block: any): string {
  const { type, content } = block

  switch (type) {
    case 'text':
      return `<div style="font-size: ${content.fontSize || 16}px; color: ${content.color || '#111827'}; text-align: ${content.align || 'left'}; font-weight: ${content.fontWeight || 400}; line-height: 1.6; margin-bottom: 16px; white-space: pre-wrap; word-break: break-word;">
        ${escapeHtml(content.text).replace(/\n/g, '<br>')}
      </div>`

    case 'image':
      if (!content.url) {
        return `<div style="width: 100%; height: 200px; background-color: #f3f4f6; border-radius: ${content.borderRadius || 0}px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 14px; margin-bottom: 16px;">
          [Image]
        </div>`
      }
      return `<img src="${escapeHtml(content.url)}" alt="${escapeHtml(content.alt || '')}" style="width: ${content.width || '100%'}; border-radius: ${content.borderRadius || 0}px; display: block; max-width: 100%; height: auto; margin-bottom: 16px;" />`

    case 'button':
      return `<div style="text-align: ${content.align || 'center'}; margin-bottom: 16px;">
        <a href="${escapeHtml(content.url || '#')}" style="display: inline-block; padding: 12px 24px; background-color: ${content.backgroundColor || '#10b981'}; color: ${content.textColor || '#ffffff'}; text-decoration: none; border-radius: ${content.borderRadius || 6}px; font-weight: 700; font-size: 14px;">
          ${escapeHtml(content.text)}
        </a>
      </div>`

    case 'divider':
      return `<div style="height: ${content.thickness || 1}px; background-color: ${content.color || '#e5e7eb'}; margin: ${content.marginTop || 0}px 0 ${content.marginBottom || 0}px 0; margin-bottom: 16px;"></div>`

    case 'spacer':
      return `<div style="height: ${content.height || 24}px; margin-bottom: 16px;"></div>`

    case 'video':
      return `<div style="width: ${content.width || '100%'}; margin: 0 auto 16px; text-align: ${content.align || 'center'};">
        <div style="position: relative; display: inline-block; width: 100%; max-width: 500px; background-color: #000; border-radius: 8px; overflow: hidden;">
          ${content.thumbnail ? `<img src="${escapeHtml(content.thumbnail)}" alt="Video thumbnail" style="width: 100%; height: auto; display: block;" />` : `<div style="width: 100%; padding-bottom: 56.25%; background-color: #1a1a1a;"></div>`}
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60px; height: 60px; background-color: rgba(16, 185, 129, 0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px;">▶️</div>
        </div>
      </div>`

    case 'table':
      const headerHtml = (content.headers || []).map((h: string) => 
        `<th style="padding: 10px 14px; background-color: ${content.headerBg || '#1e293b'}; color: ${content.headerColor || '#fff'}; text-align: left; font-weight: 700; border: 1px solid ${content.borderColor || '#e5e7eb'};">${escapeHtml(h)}</th>`
      ).join('')
      
      const rowsHtml = (content.rows || []).map((row: string[], ri: number) => 
        `<tr>${row.map((cell: string) => 
          `<td style="padding: 10px 14px; background-color: ${ri % 2 === 0 ? (content.rowBg || '#fff') : (content.rowAltBg || '#f9fafb')}; border: 1px solid ${content.borderColor || '#e5e7eb'}; color: #111827;">${escapeHtml(cell)}</td>`
        ).join('')}</tr>`
      ).join('')

      return `<div style="overflow-x: auto; margin-bottom: 16px;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; font-size: ${content.fontSize || 14}px;">
          <thead><tr>${headerHtml}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>`

    default:
      return ''
  }
}

export function generateEmailHtmlBody(blocks: any[], subject: string, preheader: string): string {
  const blockHtml = blocks.map(block => renderEmailBlockToHtml(block)).join('')
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 24px 20px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #111827;">${escapeHtml(subject)}</h1>
              ${preheader ? `<p style="margin: 0; font-size: 12px; color: #9ca3af; font-style: italic;">${escapeHtml(preheader)}</p>` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 20px;">
              ${blockHtml}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280;">
                Kardme © 2026. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                <a href="{UNSUBSCRIBE_URL}" style="color: #3b82f6; text-decoration: none;">Unsubscribe</a>
                <span style="color: #d1d5db; margin: 0 8px;">|</span>
                <a href="{MANAGE_PREFERENCES_URL}" style="color: #3b82f6; text-decoration: none;">Manage Preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, m => map[m])
}
