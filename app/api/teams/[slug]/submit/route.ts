import { getCardOrderEmailTranslation } from '@/lib/i18n/cardOrderEmail'
import { sendEmail } from '@/lib/email'
import { decryptCardOrderToken } from '@/lib/cardOrderCrypto'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes, createHash } from 'node:crypto'
import { encryptCardOrderToken } from '@/lib/cardOrderCrypto'

export const runtime = 'nodejs'

const languages = new Set([
  'pt-PT', 'pt-BR', 'en', 'it', 'de', 'es', 'fr', 'ar'
])

const MAX_BODY_BYTES = 16_384

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!/^[a-z0-9-]{3,80}$/.test(slug)) {
      return NextResponse.json({ error: 'Invalid team' }, { status: 400 })
    }

    const length = Number(req.headers.get('content-length') || 0)
    if (length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 })
    }

    const raw = await req.text()
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 })
    }

    let body: Record<string, unknown>
    try {
      body = JSON.parse(raw)
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new Error('Invalid body')
      }
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const language = typeof body.language === 'string' ? body.language : 'en'
    const idempotencyKey = typeof body.idempotencyKey === 'string'
      ? body.idempotencyKey
      : ''

    if (!/^[0-9a-f-]{36}$/i.test(idempotencyKey)) {
      return NextResponse.json(
        { error: 'Invalid request identifier' },
        { status: 400 }
      )
    }

    if (
      name.length < 2 || name.length > 150 ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      phone.length > 40 ||
      !languages.has(language) ||
      body.privacyConsent !== true
    ) {
      return NextResponse.json(
        { error: 'Invalid fields or missing consent' },
        { status: 400 }
      )
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const db = createClient(url, key, {
      auth: { persistSession: false },
    })

    const { data: team, error: teamError } = await db
      .from('card_order_teams')
      .select('id')
      .eq('slug', slug)
      .eq('active', true)
      .single()

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team unavailable' }, { status: 404 })
    }

    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256')
      .update(token)
      .digest('hex')

    const encryptedToken = encryptCardOrderToken(token)
    const orderSlug = `pedido-${randomBytes(8).toString('hex')}`

    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString()

    const { data, error } = await db.rpc(
      'create_team_card_order',
      {
        p_team_id: team.id,
        p_language: language,
        p_name: name,
        p_email: email,
        p_phone: phone || null,
        p_idempotency_key: idempotencyKey,
        p_order_slug: orderSlug,
        p_token_hash: tokenHash,
        p_expires_at: expiresAt,
        p_encrypted_token: encryptedToken,
      }
    )

    if (error) {
      console.error('Team order creation failed:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json(
        { error: 'Unable to create order' },
        { status: 500 }
      )
    }

    const result = data?.[0]

    if (!result?.order_id) {
      return NextResponse.json(
        { error: 'Order creation not confirmed' },
        { status: 500 }
      )
    }

    // Reservar exclusivamente o envio do email.
    const { data: claimed, error: claimError } = await db.rpc(
      'claim_team_order_email',
      { p_request_id: result.request_id }
    )

    if (claimError) {
      console.error('Email claim failed:', claimError.code)
      return NextResponse.json(
        { error: 'Order saved; email pending' },
        { status: 503 }
      )
    }

    if (!claimed) {
      return NextResponse.json(
        { ok: true, requestId: result.request_id },
        { status: 200 }
      )
    }

    try {
      const { data: saved, error: readError } = await db
        .from('card_order_team_requests')
        .select('email, name, language, encrypted_access_token, order_id')
        .eq('id', result.request_id)
        .single()

      if (readError || !saved?.encrypted_access_token) {
        throw new Error('Unable to retrieve access token')
      }

      const accessToken = decryptCardOrderToken(
        saved.encrypted_access_token
      )

      const appUrl = process.env.NEXT_PUBLIC_APP_URL
      if (!appUrl) throw new Error('Missing application URL')

      const link = new URL(
        `/api/card-orders/${encodeURIComponent(result.order_slug)}/access`,
        appUrl
      )
      link.searchParams.set('token', accessToken)

      const safeName = saved.name
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

      const emailText = getCardOrderEmailTranslation(saved.language || 'en')
      const emailDirection = saved.language === 'ar' ? 'rtl' : 'ltr'

      await sendEmail({
        to: saved.email,
        subject: emailText.subject,
        html: `
          <div dir="${emailDirection}" style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
            <h2>${emailText.welcome}</h2>
            <p>${emailText.hello} ${safeName},</p>
            <p>${emailText.received}</p>
            <p>${emailText.instructions}</p>
            <p><a href="${link.toString()}">${emailText.button}</a></p>
            <p>${emailText.expiry}</p>
            <p>${emailText.signature}</p>
          </div>
        `,
      })

      const { error: updateError } = await db
        .from('card_order_team_requests')
        .update({
          email_status: 'enviado',
          email_sent_at: new Date().toISOString(),
          email_error: null,
        })
        .eq('id', result.request_id)
        .eq('email_status', 'a_enviar')

      if (updateError) {
        console.error('Email status update failed:', updateError.code)
      }

    } catch (emailError) {
      console.error('Team email delivery failed:', emailError)

      await db
        .from('card_order_team_requests')
        .update({
          email_status: 'erro',
          email_error: 'Falha no processamento do envio',
        })
        .eq('id', result.request_id)
        .eq('email_status', 'a_enviar')

      return NextResponse.json(
        { error: 'Order saved; email delivery failed' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { ok: true, requestId: result.request_id },
      { status: result.created ? 201 : 200 }
    )
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
