import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'

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

    const supabaseAdmin = getAdminSupabase()
    const stateHash = createHash('sha256').update(state).digest('hex')

    const { data: userId, error: stateError } = await supabaseAdmin
      .rpc('consume_gmail_oauth_state', { p_state_hash: stateHash })

    if (stateError || !userId) {
      return NextResponse.json(
        { error: 'Autorização Gmail inválida ou expirada' },
        { status: 400 }
      )
    }

    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token) {
      return NextResponse.json(
        { error: 'Failed to get access token', details: tokens },
        { status: 400 }
      )
    }

    // Get connected Google account email without Gmail read access
    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: profile } = await oauth2.userinfo.get()
    const gmailEmail = profile.email

    if (!gmailEmail || profile.verified_email !== true) {
      return NextResponse.json(
        { error: 'Não foi possível confirmar o email Google' },
        { status: 400 }
      )
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('user_integrations')
      .select('refresh_token')
      .eq('user_id', userId)
      .eq('integration_type', 'gmail')
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    const refreshToken = tokens.refresh_token || existing?.refresh_token

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'A Google não forneceu autorização de acesso permanente. Volta a ligar o Gmail.' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('user_integrations')
      .upsert(
        {
          user_id: userId,
          integration_type: 'gmail',
          access_token: tokens.access_token,
          refresh_token: refreshToken,
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
