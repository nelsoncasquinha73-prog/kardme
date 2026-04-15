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
      customFieldsData,
    } = body || {}

    // Validação de campos obrigatórios
    if (!slug || !name || !email) {
      return NextResponse.json(
        { error: 'Campos obrigatórios em falta (slug, name, email).' },
        { status: 400 }
      )
    }

    // Validação de consentimento (obrigatório)
    if (consentGiven !== true) {
      return NextResponse.json(
        { error: 'Consentimento é obrigatório.' },
        { status: 400 }
      )
    }

    // 1) Buscar embaixador (public)
    const { data: ambassador, error: ambErr } = await supabaseServer
      .from('ambassadors')
      .select('id, user_id, name, email, is_published, ambassador_type, stats_leads, custom_fields')
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

    // 4) Construir notas estruturadas com formulário
    let leadNotes = ''

    // Seção do formulário do embaixador (se houver custom_fields preenchidos)
    if (customFieldsData && Object.keys(customFieldsData).length > 0) {
      const customFields = ambassador.custom_fields || []
      const formLines: string[] = []

      customFields.forEach((field: any) => {
        if (field.enabled && customFieldsData[field.id]) {
          const value = customFieldsData[field.id]
          formLines.push(`• ${field.label}: ${value}`)
        }
      })

      if (formLines.length > 0) {
        leadNotes += 'Formulário do Embaixador:\n'
        leadNotes += formLines.join('\n')
        leadNotes += '\n\n'
      }
    }

    // Adicionar mensagem se existir
    if (message) {
      leadNotes += `Mensagem: ${message}\n\n`
    }

    // Rodapé com info do embaixador
    leadNotes += `Lead captada via Embaixador: ${ambassador.name || slug} (${slug})`

    // 5) Inserir lead no CRM (tabela leads)
    const leadSource = `ambassador:${slug}`

    const { data: leadData, error: leadError } = await supabaseServer
      .from('leads')
      .insert([
        {
          user_id: ownerUserId,
          card_id: null,
          name,
          email,
          phone: phone || null,
          zone: zone || null,
          notes: leadNotes,
          lead_source: leadSource,
          consent_given: true,
          marketing_opt_in: Boolean(marketingOptIn),
          consent_timestamp: new Date().toISOString(),
          consent_version: '1.0',
        },
      ])
      .select('id')

    if (leadError) {
      console.error('[api/ambassadors/lead] Lead insert error:', leadError)
      return NextResponse.json({ error: leadError.message }, { status: 500 })
    }

    const leadId = leadData?.[0]?.id as string | undefined

    // 6) Guardar também em ambassador_leads (para stats/painel do embaixador)
    const { error: ambLeadErr } = await supabaseServer.from('ambassador_leads').insert([
      {
        ambassador_id: ambassador.id,
        user_id: ownerUserId,
        name,
        email,
        phone: phone || null,
        zone: zone || null,
        notes: leadNotes,
        marketing_opt_in: Boolean(marketingOptIn),
        status: 'new',
      },
    ])

    if (ambLeadErr) {
      console.error('[api/ambassadors/lead] ambassador_leads insert error:', ambLeadErr)
    }

    // 7) Incrementar stats do embaixador
    await supabaseServer
      .from('ambassadors')
      .update({ stats_leads: (ambassador.stats_leads || 0) + 1 })
      .eq('id', ambassador.id)

    // 8) Emails
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
    console.error('[api/ambassadors/lead] Exception:', e)
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 })
  }
}
