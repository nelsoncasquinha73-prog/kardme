import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing env vars')
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
}) {
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

export async function POST(req: NextRequest) {
  try {
    const { userId, broadcastId, recipients, subject, htmlBody } = await req.json()

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
    const fromEmail = integration.sender_email || 'me'

    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (const recipientEmail of recipients) {
      try {
        console.log(`[SEND] Attempting to send to ${recipientEmail}`)

        const raw = buildRawEmail({
          fromEmail,
          to: recipientEmail,
          subject,
          htmlBody,
        })

        const res = await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: toBase64Url(raw),
          },
        })

        const messageId = res.data.id || null
        console.log(`[SUCCESS] Email sent to ${recipientEmail}, messageId: ${messageId}`)

        const { error: insertError } = await supabaseAdmin
          .from('email_broadcast_recipients')
          .insert({
            broadcast_id: broadcastId,
            email: recipientEmail,
            status: 'sent',
          })

        if (insertError) {
          console.error(`[DB INSERT FAILED] ${recipientEmail}: ${insertError.message}`)
          errors.push(`${recipientEmail}: DB insert failed - ${insertError.message}`)
        }

        sent++
      } catch (err: any) {
        failed++
        const errMsg = err?.message || String(err)
        console.error(`[FAILED] ${recipientEmail}: ${errMsg}`)
        errors.push(`${recipientEmail}: ${errMsg}`)
      }
    }

    const newStatus =
      sent > 0 && failed === 0
        ? 'sent'
        : sent > 0 && failed > 0
        ? 'sent'
        : 'draft'

    await supabaseAdmin
      .from('email_broadcasts')
      .update({
        status: newStatus,
        sent_at: sent > 0 ? new Date().toISOString() : null,
        total_recipients: sent,
      })
      .eq('id', broadcastId)

    if (sent === 0) {
      return NextResponse.json(
        {
          error: 'Nenhum email foi enviado',
          sent,
          failed,
          errors,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err: any) {
    console.error('Send broadcast error:', err)
    return NextResponse.json(
      { error: 'Failed to send broadcast', details: err?.message || String(err) },
      { status: 500 }
    )
  }
}
