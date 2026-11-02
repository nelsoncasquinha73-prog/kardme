import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import { randomBytes, createHash } from 'node:crypto'

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null

    if (!token) {
      return NextResponse.json(
        { error: 'Sessão não autenticada' },
        { status: 401 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { data: authData, error: authError } =
      await supabase.auth.getUser(token)

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: 'Sessão inválida' },
        { status: 401 }
      )
    }

    const state = randomBytes(32).toString('hex')
    const stateHash = createHash('sha256')
      .update(state)
      .digest('hex')

    const { error: insertError } = await supabase
      .from('gmail_oauth_states')
      .insert({
        state_hash: stateHash,
        user_id: authData.user.id,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })

    if (insertError) {
      console.error('[GMAIL CONNECT] State insert failed', insertError)
      return NextResponse.json(
        { error: 'Não foi possível iniciar a ligação Gmail' },
        { status: 500 }
      )
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/callback`
    )

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'openid',
        'email',
        'https://www.googleapis.com/auth/gmail.send',
      ],
      state,
    })

    return NextResponse.json({ authUrl })
  } catch (err) {
    console.error('[GMAIL CONNECT]', err)
    return NextResponse.json(
      { error: 'Erro ao iniciar ligação Gmail' },
      { status: 500 }
    )
  }
}
