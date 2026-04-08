import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('Missing env vars')
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

function toBase64Url(str: string) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function encodeSubjectRFC2047(subject: string) {
  if (/^[ -~]*$/.test(subject)) return subject
  const encoded = Buffer.from(subject, 'utf-8').toString('base64')
  return `=?UTF-8?B?${encoded}?=`
}

function buildRawEmail(params: {
  fromEmail: string
  to: string
  subject: string
  htmlBody: string
  unsubscribeUrl?: string
}) {
  const headers = [
    `From: ${params.fromEmail}`,
    `To: ${params.to}`,
    `Subject: ${encodeSubjectRFC2047(params.subject)}`,
    `Reply-To: ${params.fromEmail}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    'X-Mailer: Kardme Email Marketing',
    'X-Priority: 3',
  ]
  if (params.unsubscribeUrl) {
    headers.push(`List-Unsubscribe: <${params.unsubscribeUrl}>`)
    headers.push('List-Unsubscribe-Post: List-Unsubscribe=One-Click')
  }
  return [...headers, '', params.htmlBody].join('\r\n')
}

function addLeadIdToVideoLinks(htmlBody: string, leadId: string): string {
  return htmlBody.replace(
    /https:\/\/www\.kardme\.com\/video-preview\/([a-f0-9-]+)(?=["\s>])/g,
    `https://www.kardme.com/video-preview/$1?lead=${leadId}`
  )
}

// Substitui {{nome}} e outros placeholders pelo dados reais do lead
function replacePlaceholders(html: string, name: string | null): string {
  const firstName = name ? name.split(' ')[0] : 'Olá'
  return html
    .replace(/\{\{nome\}\}/gi, firstName)
    .replace(/\{\{name\}\}/gi, firstName)
    .replace(/\{\{primeiro_nome\}\}/gi, firstName)
}

export async function POST(req: NextRequest) {
  try {
    const { userId, broadcastId, recipients, recipientNames, subject, htmlBody, recipientLeadIds } = await req.json()

    if (!userId || !broadcastId || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!subject || !htmlBody) {
      return NextResponse.json({ error: 'Subject and htmlBody required' }, { status: 400 })
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
      return NextResponse.json({ error: 'Missing refresh token' }, { status: 400 })
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_APP_URL + '/api/gmail/callback'
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
          token_expires_at: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null,
        })
        .eq('id', integration.id)
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'Failed to obtain access token' }, { status: 500 })
    }

    oauth2Client.setCredentials({ access_token: accessToken, refresh_token: integration.refresh_token })

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    const fromEmail = integration.sender_email || 'me'

    let sent = 0
    let failed = 0
    const errors: string[] = []

    // Buscar emails unsubscribed
    const { data: unsubscribed } = await supabaseAdmin
      .from('email_unsubscribes')
      .select('email')
      .eq('user_id', userId)
    const unsubscribedEmails = new Set((unsubscribed || []).map(u => u.email.toLowerCase()))

    for (let i = 0; i < recipients.length; i++) {
      const recipientEmail = recipients[i]
      const leadId = recipientLeadIds?.[i] || null
      const leadName = recipientNames?.[i] || null

      try {
        // Skip se unsubscribed
        if (unsubscribedEmails.has(recipientEmail.toLowerCase())) {
          console.log("[SKIP] " + recipientEmail + " is unsubscribed")
          continue
        }

        console.log("[SEND] Attempting to send to " + recipientEmail + " (leadId: " + leadId + ", name: " + leadName + ")")

        let personalizedHtmlBody = htmlBody

        // 1. Substituir {{nome}} pelo nome real
        personalizedHtmlBody = replacePlaceholders(personalizedHtmlBody, leadName)

        // 2. Adicionar lead_id aos links de vídeo
        if (leadId) {
          personalizedHtmlBody = addLeadIdToVideoLinks(personalizedHtmlBody, leadId)
        }

        // 3. Substituir URLs de unsubscribe
        const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/crm/email/unsubscribe?broadcastId=${broadcastId}&email=${encodeURIComponent(recipientEmail)}`
        const managePreferencesUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/crm/email/preferences?broadcastId=${broadcastId}&email=${encodeURIComponent(recipientEmail)}`

        personalizedHtmlBody = personalizedHtmlBody
          .replace('{UNSUBSCRIBE_URL}', unsubscribeUrl)
          .replace('{MANAGE_PREFERENCES_URL}', managePreferencesUrl)

        const raw = buildRawEmail({ fromEmail, to: recipientEmail, subject, htmlBody: personalizedHtmlBody, unsubscribeUrl })

        const res = await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw: toBase64Url(raw) },
        })

        const messageId = res.data.id || null
        console.log(`[SUCCESS] Email sent to ${recipientEmail}, messageId: ${messageId}`)

        const { error: insertError } = await supabaseAdmin
          .from('email_broadcast_recipients')
          .insert({ broadcast_id: broadcastId, email: recipientEmail, lead_id: leadId, status: 'sent' })

        if (insertError) {
          console.error(`[DB INSERT FAILED] ${recipientEmail}: ${insertError.message}`)
          errors.push(`${recipientEmail}: DB insert failed - ${insertError.message}`)
        }

        // Registar atividade no CRM (scheduled_task como histórico)
        if (leadId) {
          await supabaseAdmin.from('scheduled_tasks').insert({
            user_id: userId,
            lead_id: leadId,
            title: `📧 Email enviado: ${subject}`,
            email_subject: subject,
            email_recipient: recipientEmail,
            due_at: new Date().toISOString(),
            send_status: 'sent',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            attachments: [],
          })
        }

        sent++
      } catch (err: any) {
        failed++
        const errMsg = err?.message || String(err)
        console.error(`[FAILED] ${recipientEmail}: ${errMsg}`)
        errors.push(`${recipientEmail}: ${errMsg}`)
      }
    }

    const newStatus = sent > 0 ? 'sent' : 'draft'

    await supabaseAdmin
      .from('email_broadcasts')
      .update({ status: newStatus, sent_at: sent > 0 ? new Date().toISOString() : null, total_recipients: sent })
      .eq('id', broadcastId)

    if (sent === 0) {
      return NextResponse.json({ error: 'Nenhum email foi enviado', sent, failed, errors }, { status: 500 })
    }

    return NextResponse.json({ success: true, sent, failed, errors: errors.length > 0 ? errors : undefined })
  } catch (err: any) {
    console.error('Send broadcast error:', err)
    return NextResponse.json({ error: 'Failed to send broadcast', details: err?.message || String(err) }, { status: 500 })
  }
}
