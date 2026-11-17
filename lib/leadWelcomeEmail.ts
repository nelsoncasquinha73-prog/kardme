import { resolveWelcomeLanguage, welcomeTranslations } from './i18n/leadWelcomeEmail'
import { escapeWelcomeText, sanitizeWelcomeHtml } from './sanitizeWelcomeHtml'

type WelcomeParams = {
  language?: unknown
  subject?: string | null
  body?: string | null
  variables: { nome: string; email: string; cardTitle: string }
  confirmUrl?: string | null
}

function replaceVariables(template: string, variables: WelcomeParams['variables'], html: boolean): string {
  return template.replace(/{(nome|email|cardTitle)}/g, (_, key: keyof WelcomeParams['variables']) =>
    html ? escapeWelcomeText(variables[key]) : variables[key])
}

/** Safe render-time fragment, composed separately from the trusted confirmation. */
export function composeLeadWelcomeEmail(params: WelcomeParams) {
  const language = resolveWelcomeLanguage(params.language)
  const text = welcomeTranslations[language]
  const direction = language === 'ar' ? 'rtl' : 'ltr'
  const alignment = direction === 'rtl' ? 'right' : 'left'
  const subject = replaceVariables(params.subject || text.subject, params.variables, false)
  const rendered = replaceVariables(params.body || text.body, params.variables, true).replace(/\n/g, '<br/>')
  const custom = sanitizeWelcomeHtml(rendered)
  const url = params.confirmUrl ? escapeWelcomeText(params.confirmUrl) : null
  const base = 'font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:400;line-height:1.5;color:#263238'
  const confirmation = url ? `
<tr><td lang="${language}" dir="${direction}" style="${base};padding:24px;border-top:1px solid #dfe5ec;text-align:${alignment}">
<p style="margin:0 0 20px">${text.confirmation}</p>
<table role="presentation" border="0" cellspacing="0" cellpadding="0"><tr><td bgcolor="#175cd3" style="background-color:#175cd3;border-radius:6px;text-align:center;mso-padding-alt:14px 20px">
<a href="${url}" style="display:inline-block;padding:14px 20px;border:1px solid #175cd3;border-radius:6px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;line-height:1.5;color:#ffffff;text-decoration:none">${text.button}</a>
</td></tr></table>
<p style="margin:20px 0 8px;font-size:14px">${text.instructions}</p>
<p dir="ltr" style="margin:0 0 20px;font-size:14px;word-break:break-all;overflow-wrap:anywhere"><a href="${url}" style="color:#175cd3;text-decoration:underline">${url}</a></p>
<p style="margin:0;font-size:14px;color:#4b5563">${text.notice}</p>
</td></tr>` : ''
  return {
    subject,
    warnings: custom.warnings,
    html: `<!doctype html><html lang="${language}" dir="${direction}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f3f5f7;${base}">
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f3f5f7" style="width:100%;background-color:#f3f5f7"><tr><td align="center" style="padding:24px 12px">
<!--[if mso]><table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0"><tr><td><![endif]-->
<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="width:100%;max-width:600px;background-color:#ffffff;border-collapse:collapse">
<tr><td dir="${direction}" style="${base};padding:24px;text-align:${alignment};overflow-wrap:anywhere"><div dir="auto">${custom.html}</div></td></tr>${confirmation}
</table><!--[if mso]></td></tr></table><![endif]-->
</td></tr></table></body></html>`,
  }
}
