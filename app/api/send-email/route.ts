import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

function toBase64Url(str: string) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
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

type AttachmentPayload = {
  filename: string
  mimeType: string
  base64: string
}

function buildRawEmail(params: {
  fromEmail: string
  to: string
  subject: string
  htmlBody: string
  attachments?: AttachmentPayload[]
}) {
  const attachments = params.attachments || []
  const hasAttachments = attachments.length > 0

  if (!hasAttachments) {
    return [
      `From: ${params.fromEmail}`,
      `To: ${params.to}`,
      `Subject: ${encodeSubjectRFC2047(params.subject)}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset="UTF-8"',
      '',
      params.htmlBody,
    ].join('\r\n')
  }

  const boundary = 'kardme_boundary_' + Math.random().toString(16).slice(2)

  const lines: string[] = []
  lines.push(`From: ${params.fromEmail}`)
  lines.push(`To: ${params.to}`)
  lines.push(`Subject: ${encodeSubjectRFC2047(params.subject)}`)
  lines.push('MIME-Version: 1.0')
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
    const safeName = (att.filename || 'file').replace(/[\r\n"]/g, '')
    const mime = (att.mimeType || 'application/octet-stream').replace(/[\r\n"]/g, '')

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

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      leadId,
      recipientEmail,
      subject,
      body,
      templateId,
      attachments,
      fromName,
    } = await req.json()

    if (!userId || !leadId || !recipientEmail || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const atts: AttachmentPayload[] = Array.isArray(attachments) ? attachments : []
    if (atts.length > 5) {
      return NextResponse.json({ error: 'Too many attachments (max 5)' }, { status: 400 })
    }

    const totalBase64Size = atts.reduce((sum, a) => sum + (a?.base64?.length || 0), 0)
    if (totalBase64Size > 14 * 1024 * 1024) {
      return NextResponse.json({ error: 'Attachments too large (max ~10MB total)' }, { status: 400 })
    }

    const supabaseAdmin = getAdminSupabase()

    const { data: integration, error: integrationError } = await supabaseAdmin
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('integration_type', 'gmail')
      .single()

    if (integrationError || !integration) {
      return NextResponse.json({ error: 'Gmail not connected' }, { status: 401 })
    }

    if (!integration.refresh_token) {
      return NextResponse.json(
        { error: 'Missing refresh token. Please reconnect Gmail.' },
        { status: 400 }
      )
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
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to obtain access token' }, { status: 500 })
    }

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: integration.refresh_token,
    })

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    const senderEmail = integration.sender_email || 'me'
    const safeFromName = fromName ? encodeFromNameRFC2047(String(fromName)) : ''
    const fromEmail = safeFromName ? `${safeFromName} <${senderEmail}>` : senderEmail

    const raw = buildRawEmail({
      fromEmail,
      to: recipientEmail,
      subject,
      htmlBody: body,
      attachments: atts,
    })

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: toBase64Url(raw),
      },
    })

    const messageId = res.data.id || null

    await supabaseAdmin.from('message_history').insert({
      user_id: userId,
      lead_id: leadId,
      template_id: templateId || null,
      recipient_email: recipientEmail,
      subject,
      body,
      message_id: messageId,
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, messageId })
  } catch (err: any) {
    console.error('Send email error:', err)
    return NextResponse.json(
      { error: 'Failed to send email', details: err?.message || String(err) },
      { status: 500 }
    )
  }
}
