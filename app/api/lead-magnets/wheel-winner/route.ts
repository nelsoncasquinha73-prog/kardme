import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { lead_id, slug, prize_label } = await req.json()
    if (!lead_id || !slug || !prize_label) {
      return NextResponse.json({ error: 'Campos em falta' }, { status: 400 })
    }

    const { data: magnet } = await supabaseAdmin
      .from('lead_magnets')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!magnet) return NextResponse.json({ error: 'Magnet não encontrado' }, { status: 404 })

    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('name, email, phone')
      .eq('id', lead_id)
      .single()

    if (!lead) return NextResponse.json({ error: 'Lead não encontrada' }, { status: 404 })

    const { data: owner } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', magnet.user_id)
      .single()

    await supabaseAdmin.from('lead_activities').insert([{
      lead_id,
      user_id: magnet.user_id,
      type: 'wheel_winner',
      title: `🏆 Ganhou prémio na roleta: ${prize_label}`,
      meta: { magnet_id: magnet.id, magnet_title: magnet.title, prize_label },
    }])

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.kardme.com'

    if (owner?.email) {
      await fetch(baseUrl + '/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: magnet.user_id,
          leadId: lead_id,
          recipientEmail: owner.email,
          subject: `🏆 Novo vencedor na roleta: ${magnet.title}`,
          body: `Olá,\n\nTens um novo vencedor na roleta "${magnet.title}"!\n\nNome: ${lead.name}\nEmail: ${lead.email}${lead.phone ? `\nTelefone: ${lead.phone}` : ''}\nPrémio ganho: 🎡 ${prize_label}\n\nAcede ao CRM Pro para mais detalhes.\n\nMelhores cumprimentos,\nKardme`,
        }),
      })
    }

    await fetch(baseUrl + '/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: magnet.user_id,
        leadId: lead_id,
        recipientEmail: lead.email,
        subject: `🎉 Parabéns! Ganhaste na roleta: ${magnet.title}`,
        body: `Olá ${lead.name},\n\nParabéns! 🎉\n\nGanhaste na roleta "${magnet.title}"!\n\nO teu prémio: 🎡 ${prize_label}\n\n${magnet.thank_you_message || 'Entraremos em contacto brevemente para entregar o teu prémio.'}\n\nMelhores cumprimentos,\nKardme`,
      }),
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 })
  }
}
