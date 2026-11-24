import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendEmail } from '@/lib/email'
import { ownsCard } from '@/lib/server/emailAuthorization'
import { convertTextToHtml, isMailbox } from '@/lib/server/gmailTransport'

export async function POST(request: Request) {
  const { slug, email, name, phone, consent } = await request.json().catch(() => ({})) || {}
  if (typeof slug !== 'string' || !isMailbox(email) || consent !== true ||
      (name != null && typeof name !== 'string') || (phone != null && typeof phone !== 'string')) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { data: magnet } = await supabaseAdmin.from('lead_magnets')
    .select('id, user_id, card_id, title, discount_config, welcome_email_subject, welcome_email_body')
    .eq('slug', slug).eq('is_active', true).eq('magnet_type', 'discount').maybeSingle()
  if (!magnet || (magnet.card_id && !(await ownsCard(magnet.user_id, magnet.card_id)))) {
    return NextResponse.json({ error: 'Campanha indisponível' }, { status: 404 })
  }

  const { error } = await supabaseAdmin.from('leads').insert({
    user_id: magnet.user_id,
    lead_magnet_id: magnet.id,
    card_id: magnet.card_id,
    source_card_id: magnet.card_id,
    email: email.toLowerCase(),
    name: name || 'Sem nome',
    phone: phone || null,
    lead_source: 'discount_magnet',
    consent_given: true,
    consent_timestamp: new Date().toISOString(),
  })
  if (error) return NextResponse.json({ error: 'Erro ao registar pedido' }, { status: 500 })

  if (magnet.welcome_email_body && magnet.discount_config?.code) {
    try {
      const escapedName = (name || 'Utilizador').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      const body = magnet.welcome_email_body.replaceAll('{codigo}', () => magnet.discount_config.code)
        .replaceAll('{nome}', () => escapedName)
      await sendEmail({
        to: email,
        subject: magnet.welcome_email_subject || magnet.title,
        html: convertTextToHtml(body),
      })
    } catch {
      return NextResponse.json({ error: 'Não foi possível enviar o código' }, { status: 502 })
    }
  }
  return NextResponse.json({ ok: true })
}
