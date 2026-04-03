import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_CONFIG_ERROR: Missing RESEND_API_KEY')
    throw new Error('Missing RESEND_API_KEY')
  }
  
  const from = process.env.RESEND_FROM || 'Kardme <onboarding@resend.dev>'
  
  console.log('RESEND_SEND_ATTEMPT', {
    to: params.to,
    from,
    subject: params.subject,
  })

  try {
    const result = await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
    console.log('RESEND_SEND_SUCCESS', result)
    return result
  } catch (err: any) {
    console.error('RESEND_SEND_ERROR', {
      message: err?.message,
      statusCode: err?.statusCode,
      to: params.to,
    })
    throw err
  }
}

/**
 * Processa um template de email:
 * 1. Substitui variáveis tipo {nome}, {email}, etc.
 * 2. Converte quebras de linha em HTML
 * 3. Retorna HTML formatado
 */
export function processEmailTemplate(
  template: string,
  variables: Record<string, string | null | undefined>
): string {
  // 1. Substituir variáveis {nome}, {email}, etc.
  let html = template
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`
    const regex = new RegExp(placeholder, 'g')
    html = html.replace(regex, value || '')
  })

  // 2. Converter texto puro em HTML
  // Dividir por parágrafos (2+ quebras de linha)
  const paragraphs = html.split(/\n\s*\n+/).filter(p => p.trim())
  
  // Converter cada parágrafo
  const htmlParagraphs = paragraphs.map(para => {
    // Dentro de cada parágrafo, converter quebras simples em <br>
    const withLineBreaks = para
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .join('<br />')
    
    return `<p>${withLineBreaks}</p>`
  })

  // 3. Envolver em estrutura HTML básica
  const finalHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    p {
      margin: 16px 0;
      font-size: 14px;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
${htmlParagraphs.join('\n')}
</body>
</html>
  `.trim()

  return finalHtml
}
