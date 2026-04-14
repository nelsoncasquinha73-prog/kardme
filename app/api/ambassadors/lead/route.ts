import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

async function sendEmail(params: { userId: string; leadId?: string; recipientEmail: string; subject: string; body: string }) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.kardme.com'
    const response = await fetch(baseUrl + '/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: params.userId,
        leadId: params.leadId || null,
        recipientEmail: params.recipientEmail,
        subject: params.subject,
        body: params.body,
      }),
    })
    const txt = await response.text()
    if (!response.ok) return { ok: false, details: txt }
    return { ok: true, details: txt }
  } catch (err: any) {
    return { ok: false, details: err?.message || String(err) }
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      slug,
      name,
      email,
      phone,
      message,
      zone,
      consentGiven,
      marketingOptIn,
      leadType,
      budget,
      notes,
    } = body || {}

    if (!slug || !name || !email) {
      return NextResponse.json(
        { error: 'Campos obrigatórios em falta (slug, name, email).' },
        { status: 400 }
      )
    }

    // 1) Buscar embaixador (public)
    const { data: ambassador, error: ambErr } = await supabaseServer
      .from('ambassadors')
      .select('id, user_id, name, email, is_published, ambassador_type, stats_leads')
      .eq('slug', slug)
      .single()

    if (ambErr || !ambassador) {
      return NextResponse.json({ error: 'Embaixador não encontrado.' }, { status: 404 })
    }

    if (!ambassador.is_published) {
      return NextResponse.json({ error: 'Embaixador não publicado.' }, { status: 403 })
    }

    // 2) Determinar owner (quem recebe no CRM)
    const KARDME_ADMIN_USER_ID = 'aafb4f55-843b-4dd2-b199-70dd9df592a8'
    const ownerUserId =
      ambassador.ambassador_type === 'kardme' ? KARDME_ADMIN_USER_ID : ambassador.user_id

    // 3) Buscar email do owner (para notificação)
    const { data: ownerProfile } = await supabaseServer
      .from('profiles')
      .select('email')
      .eq('id', ownerUserId)
      .single()

    const ownerEmail = ownerProfile?.email || null

    // 4) Inserir lead no CRM (tabela leads)
    const leadSource = `ambassador:${slug}`
    const leadNotes =
      (notes ? String(notes) + '\n\n' : '') +
      `Lead captada via Embaixador: ${ambassador.name || slug} (${slug})`

    const { data: leadData, error: leadError } = await supabaseServer
      .from('leads')
      .insert([
        {
          user_id: ownerUserId,
          card_id: null,
          name,
          email,
          phone: phone || null,
          message: message || null,
          zone: zone || null,
          notes: leadNotes,
          lead_source: leadSource,
          consent_given: consentGiven ?? true,
          marketing_opt_in: marketingOptIn ?? false,
          consent_timestamp: new Date().toISOString(),
          consent_version: '1.0',
        },
      ])
      .select('id')

    if (leadError) {
      return NextResponse.json({ error: leadError.message }, { status: 500 })
    }

    const leadId = leadData?.[0]?.id as string | undefined

    // 5) Guardar também em ambassador_leads (para stats/token/painel)
    const { error: ambLeadErr } = await supabaseServer.from('ambassador_leads').insert([
      {
        ambassador_id: ambassador.id,
        user_id: ownerUserId,
        name,
        email,
        phone: phone || null,
        lead_type: leadType || null,
        zone: zone || null,
        budget: budget || null,
        notes: leadNotes,
        marketing_opt_in: marketingOptIn ?? false,
        status: 'new',
      },
    ])

    if (ambLeadErr) {
      console.error('Failed to insert ambassador_leads:', ambLeadErr)
    }

    // 6) Incrementar stats do embaixador
    await supabaseServer
      .from('ambassadors')
      .update({ stats_leads: (ambassador.stats_leads || 0) + 1 })
      .eq('id', ambassador.id)

    // 7) Emails
    if (ownerEmail) {
      await sendEmail({
        userId: ownerUserId,
        leadId,
        recipientEmail: ownerEmail,
        subject: `Nova lead vinda do Embaixador: ${ambassador.name || slug}`,
        body:
          `Olá,\n\n` +
          `Recebeste uma nova lead via embaixador.\n\n` +
          `Embaixador: ${ambassador.name || slug}\n` +
          `Nome: ${name}\n` +
          `Email: ${email}\n` +
          (phone ? `Telefone: ${phone}\n` : '') +
          (zone ? `Zona: ${zone}\n` : '') +
          `\nAcede ao CRM para ver detalhes.\n\n` +
          `Kardme`,
      })
    }

    if (ambassador.email) {
      await sendEmail({
        userId: ownerUserId,
        leadId,
        recipientEmail: ambassador.email,
        subject: `🎉 Nova lead registada no teu cartão`,
        body:
          `Olá ${ambassador.name || ''},\n\n` +
          `Boa notícia — entrou uma nova lead através do teu cartão.\n\n` +
          `Nome: ${name}\n` +
          `Email: ${email}\n` +
          (phone ? `Telefone: ${phone}\n` : '') +
          (zone ? `Zona: ${zone}\n` : '') +
          `\nObrigado por ajudares a angariar!\n\n` +
          `Kardme`,
      })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e: any) {
    console.error('Error in POST /api/ambassadors/lead:', e)
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 })
  }
}
