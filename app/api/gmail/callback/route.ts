import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { google } from 'googleapis'

const oauth2Client = new google.auth.OAuth2(
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/callback`
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state' },
        { status: 400 }
      )
    }

    const userId = Buffer.from(state, 'base64').toString('utf-8')
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token) {
      return NextResponse.json(
        { error: 'Failed to get access token' },
        { status: 400 }
      )
    }

    const { error } = await supabase
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
        },
        { onConflict: 'user_id,integration_type' }
      )

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save integration' },
        { status: 500 }
      )
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/crm?gmail=connected`
    )
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.json(
      { error: 'OAuth callback failed' },
      { status: 500 }
    )
  }
}