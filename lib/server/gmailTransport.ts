import 'server-only'
import { google } from 'googleapis'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

function toBase64Url(str: string) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function buildFromHeader(fromName: string | null | undefined, senderEmail: string) {
  const raw = (fromName ? String(fromName) : '').trim()
  if (!raw) return senderEmail

  // remove CR/LF e aspas para evitar header injection / formato inválido
  const cleaned = raw.replace(/[\\\r\n]/g, ' ').replace(/"/g, "'").trim()

  const encoded = encodeFromNameRFC2047(cleaned)
  // formato mais compatível: "Nome" <email>
  return `"${encoded}" <${senderEmail}>`
}

function encodeFromNameRFC2047(name: string) {
  if (!name) return ''
  if (/^[ -~]*$/.test(name)) return name
  const encoded = Buffer.from(name, 'utf-8').toString('base64')
  return `=?UTF-8?B?${encoded}?=`
}

function encodeSubjectRFC2047(subject: string) {
  // Se não tem caracteres especiais, retorna como está
  if (/^[ -~]*$/.test(subject)) return subject
  // Senão, encoda em Base64 UTF-8
  const encoded = Buffer.from(subject, 'utf-8').toString('base64')
  return `=?UTF-8?B?${encoded}?=`
}

export type AttachmentPayload = {
  filename: string
  mimeType: string
  base64: string
}

export function validAttachments(value: unknown): value is AttachmentPayload[] {
  return Array.isArray(value) && value.length <= 5 &&
    value.every(item => item && typeof item.filename === 'string' && typeof item.mimeType === 'string' &&
      typeof item.base64 === 'string' && /^[a-z0-9+/]*={0,2}$/i.test(item.base64)) &&
    value.reduce((total, item) => total + item.base64.length, 0) <= 14 * 1024 * 1024
}

export function convertTextToHtml(text: string): string {
  // Converte \n em <br> e agrupa parágrafos
  return text
    .split('\n\n')
    .map(para => para.replace(/\n/g, '<br>').trim())
    .filter(para => para.length > 0)
    .map(para => `<p style="margin: 0 0 12px 0; line-height: 1.6; color: #333;">${para}</p>`)
    .join('')
}

export function buildRawEmail(params: {
  fromEmail: string
  fromName?: string | null
  unsubscribeUrl?: string
  to: string
  subject: string
  htmlBody: string
  attachments?: AttachmentPayload[]
}) {
  const attachments = params.attachments || []
  const hasAttachments = attachments.length > 0
  const headers = [
    `From: ${buildFromHeader(params.fromName, params.fromEmail)}`,
    `To: ${params.to}`,
    `Subject: ${encodeSubjectRFC2047(params.subject)}`,
    'MIME-Version: 1.0',
  ]
  if (params.unsubscribeUrl) {
    headers.push(`Reply-To: ${params.fromEmail}`, 'X-Mailer: Kardme Email Marketing', 'X-Priority: 3',
      `List-Unsubscribe: <${params.unsubscribeUrl}>`, 'List-Unsubscribe-Post: List-Unsubscribe=One-Click')
  }

  if (!hasAttachments) {
    return [
      ...headers,
      'Content-Type: text/html; charset="UTF-8"',
      '',
      params.htmlBody,
    ].join('\r\n')
  }

  const boundary = 'kardme_boundary_' + Math.random().toString(16).slice(2)

  const lines = [...headers]
  lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`)
  lines.push('')

  // HTML part
  lines.push(`--${boundary}`)
  lines.push('Content-Type: text/html; charset="UTF-8"')
  lines.push('Content-Transfer-Encoding: 7bit')
  lines.push('')
  lines.push(params.htmlBody)
  lines.push('')

  for (const att of attachments) {
    const safeName = (att.filename || 'file').replace(/[\\\r\n"]/g, '')
    const mime = /^[\w.+-]+\/[\w.+-]+$/.test(att.mimeType) ? att.mimeType : 'application/octet-stream'

    lines.push(`--${boundary}`)
    lines.push(`Content-Type: ${mime}; name="${safeName}"`)
    lines.push('Content-Transfer-Encoding: base64')
    lines.push(`Content-Disposition: attachment; filename="${safeName}"`)
    lines.push('')

    const b64 = (att.base64 || '').replace(/\s+/g, '')
    for (let i = 0; i < b64.length; i += 76) {
      lines.push(b64.slice(i, i + 76))
    }
    lines.push('')
  }

  lines.push(`--${boundary}--`)
  lines.push('')

  return lines.join('\r\n')
}

export function isMailbox(value: unknown): value is string {
  return typeof value === 'string' && !/[\r\n]/.test(value) && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i.test(value)
}

export async function openGmail(userId: string) {
  const integrations = supabaseAdmin
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('integration_type', 'gmail')
  const { data: integration, error: integrationError } = await integrations.single()

  if (integrationError || !integration || integration.is_active === false) {
    throw new Error('Gmail not connected')
  }

  if (!integration.refresh_token) {
    throw new Error('Missing refresh token. Please reconnect Gmail.')
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/callback`
  )

  let accessToken = integration.access_token as string | null

  const expired =
    integration.token_expires_at &&
    new Date(integration.token_expires_at) < new Date(Date.now() + 30 * 1000)

  if (!accessToken || expired) {
    oauth2Client.setCredentials({ refresh_token: integration.refresh_token })
    const { credentials } = await oauth2Client.refreshAccessToken()

    accessToken = credentials.access_token || null

    await supabaseAdmin
      .from('user_integrations')
      .update({
        access_token: accessToken,
        token_expires_at: credentials.expiry_date
          ? new Date(credentials.expiry_date).toISOString()
          : null,
      })
      .eq('id', integration.id)
      .eq('user_id', userId)
      .eq('integration_type', 'gmail')
  }

  if (!accessToken) {
    throw new Error('Failed to obtain access token')
  }

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: integration.refresh_token,
  })

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  return {
    senderEmail: isMailbox(integration.sender_email?.trim()) ? integration.sender_email.trim() : 'me',
    async sendRaw(raw: string) {
      const result = await gmail.users.messages.send({ userId: 'me', requestBody: { raw: toBase64Url(raw) } })
      return result.data.id || null
    },
  }
}

export async function sendGmail(params: {
  userId: string
  leadId: string
  recipientEmail: string
  subject: string
  body: string
  templateId?: string
  attachments?: AttachmentPayload[]
  fromName?: string
}) {
  const { userId, leadId, recipientEmail, subject, templateId, attachments, fromName } = params
  if (!isMailbox(recipientEmail) || /[\r\n]/.test(subject)) throw new Error('Invalid email headers')
  const gmail = await openGmail(userId)
  const htmlBody = convertTextToHtml(params.body.replaceAll('{{leadId}}', leadId))
  const messageId = await gmail.sendRaw(buildRawEmail({
    fromEmail: gmail.senderEmail, fromName,
    to: recipientEmail, subject, htmlBody, attachments,
  }))
  const { error } = await supabaseAdmin.from('message_history').insert({
    user_id: userId, lead_id: leadId, template_id: templateId || null,
    recipient_email: recipientEmail, subject, body: htmlBody,
    message_id: messageId, sent_at: new Date().toISOString(),
  })
  if (error) console.error('Failed to record Gmail message', { messageId, code: error.code })
  return messageId
}
