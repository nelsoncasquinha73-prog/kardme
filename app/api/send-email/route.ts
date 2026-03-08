import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { google } from 'googleapis'
import nodemailer from 'nodemailer'

const oauth2Client = new google.auth.OAuth2(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/callback`
)

export async function POST(req: NextRequest) {
  try {
    const { userId, leadId, recipientEmail, subject, body, templateId } =
      await req.json()

    if (!userId || !leadId || !recipientEmail || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('integration_type', 'gmail')
      .single()

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'Gmail not connected' },
        { status: 401 }
      )
    }

    if (
      integration.token_expires_at &&
      new Date(integration.token_expires_at) < new Date()
    ) {
      oauth2Client.setCredentials({
        refresh_token: integration.refresh_token,
      })

      const { credentials } = await oauth2Client.refreshAccessToken()
      await supabase
        .from('user_integrations')
        .update({
          access_token: credentials.access_token,
          token_expires_at: credentials.expiry_date
            ? new Date(credentials.expiry_date).toISOString()
            : null,
        })
        .eq('id', integration.id)
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: integration.user_email || 'noreply@kardme.com',
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: integration.refresh_token,
        accessToken: integration.access_token,
      },
    })

    const info = await transporter.sendMail({
      from: `Kardme <noreply@kardme.com>`,
      to: recipientEmail,
      subject,
      html: body,
    })

    await supabase.from('message_history').insert({
      user_id: userId,
      lead_id: leadId,
      template_id: templateId || null,
      type: 'email',
      recipient_email: recipientEmail,
      subject,
      body,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (err) {
    console.error('Send email error:', err)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}