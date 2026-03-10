import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

const oauth2Client = new google.auth.OAuth2(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/callback`
)

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      return NextResponse.json({ error: 'Missing code or state' }, { status: 400 })
    }

    const userId = Buffer.from(state, 'base64').toString('utf-8')

    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token) {
      return NextResponse.json(
        { error: 'Failed to get access token', details: tokens },
        { status: 400 }
      )
    }

    // Get Gmail email address (the "me" profile)
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    oauth2Client.setCredentials(tokens)
    
    const { data: profile } = await gmail.users.getProfile({ userId: 'me' })
    const gmailEmail = profile.emailAddress || 'noreply@kardme.com'

    const supabaseAdmin = getAdminSupabase()

    const { error } = await supabaseAdmin
      .from('user_integrations')
      .upsert(
        {
          user_id: userId,
          integration_type: 'gmail',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: tokens.expiry_date
            ? new Date(tokens.expiry_date).toISOString()
            : null,
          is_active: true,
          sender_email: gmailEmail,
        },
        { onConflict: 'user_id,integration_type' }
      )

    if (error) {
      console.error('Supabase upsert error:', error)
      return NextResponse.json(
        { error: 'Failed to save integration', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/crm?gmail=connected`
    )
  } catch (err: any) {
    console.error('OAuth callback error:', err)
    return NextResponse.json(
      { error: 'OAuth callback failed', details: err?.message || String(err) },
      { status: 500 }
    )
  }
}
