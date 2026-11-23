import {
  resolveWelcomeLanguage,
  welcomeTranslations,
} from './i18n/leadWelcomeEmail'

type Variables = {
  nome: string
  email: string
  cardTitle: string
}

type WelcomeParams = {
  language?: unknown
  subject?: string | null
  body?: string | null
  variables: Variables
  confirmUrl?: string | null
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function replaceVariables(
  template: string,
  variables: Variables,
): string {
  return template.replace(
    /{(nome|email|cardTitle)}/g,
    (_, key: keyof Variables) => variables[key] ?? '',
  )
}

export function composeLeadWelcomeEmail(params: WelcomeParams) {
  const language = resolveWelcomeLanguage(params.language)
  const t = welcomeTranslations[language]

  const direction = language === 'ar' ? 'rtl' : 'ltr'
  const alignment = direction === 'rtl' ? 'right' : 'left'

  const subject = replaceVariables(
    params.subject || t.subject,
    params.variables,
  )

  const message = replaceVariables(
    params.body || t.body,
    params.variables,
  )

  const safeMessage = escapeHtml(message).replace(/\r?\n/g, '<br>')

  const confirmUrl =
    typeof params.confirmUrl === 'string' &&
    /^https:\/\/[^<>"'\s]+$/i.test(params.confirmUrl)
      ? escapeHtml(params.confirmUrl)
      : null

  const confirmation = confirmUrl
    ? `
      <tr>
        <td dir="${direction}" style="padding:24px 28px;border-top:1px solid #e5e7eb;text-align:${alignment};font-family:Arial,Helvetica,sans-serif;color:#263238;">
          <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">
            ${escapeHtml(t.confirmation)}
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0">
            <tr>
              <td style="background:#2563eb;border-radius:8px;">
                <a href="${confirmUrl}"
                   style="display:inline-block;padding:14px 22px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;">
                  ${escapeHtml(t.button)}
                </a>
              </td>
            </tr>
          </table>
          <p style="margin:22px 0 8px;font-size:14px;line-height:1.6;">
            ${escapeHtml(t.instructions)}
          </p>
          <p style="margin:0;font-size:13px;line-height:1.6;overflow-wrap:anywhere;word-break:break-word;">
            <a href="${confirmUrl}" style="color:#2563eb;overflow-wrap:anywhere;word-break:break-word;">
              ${confirmUrl}
            </a>
          </p>
          <p style="margin:22px 0 0;font-size:13px;color:#64748b;">
            ${escapeHtml(t.notice)}
          </p>
        </td>
      </tr>`
    : ''

  const html = `<!doctype html>
<html lang="${language}" dir="${direction}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
         style="background:#f1f5f9;">
    <tr>
      <td align="center" style="padding:20px 10px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0"
               style="max-width:600px;background:#ffffff;border-radius:12px;">
          ${confirmation}
          <tr>
            <td dir="${direction}"
                style="padding:28px;text-align:${alignment};font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;color:#263238;overflow-wrap:anywhere;">
              ${safeMessage}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html, language }
}
