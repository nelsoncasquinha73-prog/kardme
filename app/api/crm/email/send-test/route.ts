import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

function encodeHeader(value: string) {
  return '=?UTF-8?B?' + Buffer.from(value, 'utf8').toString('base64') + '?='
}

function safeHeader(value: string) {
  return value.replace(/[\r\n]/g, ' ').trim()
}

export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get('authorization') || ''
    const token = authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : null

    if (!token) {
      return NextResponse.json({ error: 'Sessão necessária' }, { status: 401 })
    }

    const admin = adminClient()
    const { data: auth, error: authError } = await admin.auth.getUser(token)

    if (authError || !auth.user) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 })
    }

    const userId = auth.user.id
    const body = await req.json()
    const { subject, htmlBody, senderCardId } = body

    if (
      typeof subject !== 'string' ||
      !subject.trim() ||
      subject.length > 200 ||
      typeof htmlBody !== 'string' ||
      !htmlBody.trim() ||
      htmlBody.length > 500000 ||
      typeof senderCardId !== 'string' ||
      !senderCardId
    ) {
      return NextResponse.json(
        { error: 'Assunto, conteúdo e cartão remetente são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: card, error: cardError } = await admin
      .from('cards')
      .select('id, name, title')
      .eq('id', senderCardId)
      .eq('user_id', userId)
      .single()

    if (cardError || !card) {
      return NextResponse.json(
        { error: 'Cartão remetente não autorizado' },
        { status: 403 }
      )
    }

    const { data: integration, error: integrationError } = await admin
      .from('user_integrations')
      .select('id, access_token, refresh_token, token_expires_at, sender_email')
      .eq('user_id', userId)
      .eq('integration_type', 'gmail')
      .eq('is_active', true)
      .single()

    if (integrationError || !integration?.refresh_token || !integration.sender_email) {
      return NextResponse.json(
        { error: 'Liga primeiro uma conta Gmail válida' },
        { status: 400 }
      )
    }

    const oauth = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXT_PUBLIC_APP_URL + '/api/gmail/callback'
    )

    oauth.setCredentials({
      access_token: integration.access_token || undefined,
      refresh_token: integration.refresh_token,
      expiry_date: integration.token_expires_at
        ? new Date(integration.token_expires_at).getTime()
        : undefined,
    })

    const gmail = google.gmail({ version: 'v1', auth: oauth })

    // O endereço foi obtido e verificado no callback OAuth.
    // Nunca aceitar um destinatário enviado pelo frontend.
    const verifiedEmail = integration.sender_email.trim().toLowerCase()

    if (!verifiedEmail.includes('@') || verifiedEmail.includes(' ') || verifiedEmail.includes('\n') || verifiedEmail.includes('\r')) {
      return NextResponse.json(
        { error: 'Endereço Gmail ligado inválido. Volta a ligar a conta.' },
        { status: 400 }
      )
    }

    // Reserva atómica: no máximo 10 tentativas por hora e por utilizador.
    const { data: allowed, error: rateError } = await admin
      .rpc('reserve_email_test_send', { p_user_id: userId })

    if (rateError) {
      console.error('[EMAIL TEST] Rate limit error:', rateError)
      return NextResponse.json(
        { error: 'Não foi possível verificar o limite de testes' },
        { status: 500 }
      )
    }

    if (!allowed) {
      return NextResponse.json(
        { error: 'Atingiste o limite de 10 testes por hora' },
        { status: 429 }
      )
    }

    const senderName = safeHeader(card.name || card.title || 'Kardme')
    const testSubject = safeHeader('[TESTE] ' + subject.trim())
    const recipient = verifiedEmail

    // Conteúdo de demonstração, sem associação a leads reais.
    const testHtml = htmlBody
      .replace(/\{\{nome\}\}/gi, 'Cliente Teste')
      .replace(/\{\{name\}\}/gi, 'Cliente Teste')
      .replace(/\{\{primeiro_nome\}\}/gi, 'Cliente')
      .replace(/\{nome\}/gi, 'Cliente Teste')
      .replace(/\{email\}/gi, recipient)
      .replace(/\{\{leadId\}\}/gi, '')
      .replace(/\{UNSUBSCRIBE_URL\}/g, '#')
      .replace(/\{MANAGE_PREFERENCES_URL\}/g, '#')

    const raw = [
      'From: ' + encodeHeader(senderName) + ' <' + recipient + '>',
      'To: ' + recipient,
      'Subject: ' + encodeHeader(testSubject),
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      'X-Kardme-Test: true',
      '',
      testHtml,
    ].join('\r\n')

    const encoded = Buffer.from(raw)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encoded },
    })

    // Persistir eventuais tokens renovados.
    const credentials = oauth.credentials
    if (credentials.access_token) {
      const { error: updateError } = await admin
        .from('user_integrations')
        .update({
          access_token: credentials.access_token,
          token_expires_at: credentials.expiry_date
            ? new Date(credentials.expiry_date).toISOString()
            : null,
        })
        .eq('id', integration.id)
        .eq('user_id', userId)

      if (updateError) {
        console.warn('[EMAIL TEST] Token update failed:', updateError)
      }
    }

    return NextResponse.json({
      success: true,
      sentTo: recipient,
      message: 'Email de teste enviado',
    })
  } catch (error) {
    console.error('[EMAIL TEST]', error)
    return NextResponse.json(
      { error: 'Não foi possível enviar o email de teste' },
      { status: 500 }
    )
  }
}
