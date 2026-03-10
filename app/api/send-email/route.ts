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

export async function POST(req: NextRequest) {
  try {
    const { userId, leadId, recipientEmail, subject, body, templateId } =
      await req.json()

    if (!userId || !leadId || !recipientEmail || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    // Ensure we have a valid access token
    let accessToken = integration.access_token as string | null

    const expired =
      integration.token_expires_at &&
      new Date(integration.token_expires_at) < new Date(Date.now() + 30 * 1000) // 30s buffer

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

    const raw = [
      `From: ${fromEmail}`,
      `To: ${recipientEmail}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset="UTF-8"',
      '',
      body,
    ].join('\r\n')

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
