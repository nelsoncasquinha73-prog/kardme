import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { slug, name, email, phone, marketing_opt_in, number_chosen } = body || {}

    if (!slug || !name || !email) {
      return NextResponse.json(
        { error: 'Campos obrigatórios em falta (slug, name, email).' },
        { status: 400 }
      )
    }

    // Buscar lead magnet pelo slug
    const { data: magnet, error: magnetError } = await supabaseAdmin
      .from('lead_magnets')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (magnetError || !magnet) {
      return NextResponse.json({ error: 'Lead magnet não encontrado.' }, { status: 404 })
    }

    // Inserir lead na tabela leads
    const { data: leadData, error: leadError } = await supabaseAdmin
      .from('leads')
      .insert([{
        user_id: magnet.user_id,
        name,
        email,
        phone: phone || null,
        lead_source: magnet.magnet_type === 'raffle' ? 'Lead Magnet - Sorteio' : magnet.magnet_type === 'form' ? 'Lead Magnet - Formulário' : 'Lead Magnet',
        lead_magnet_id: magnet.id,
        consent_given: true,
        marketing_opt_in: marketing_opt_in || false,
        consent_timestamp: new Date().toISOString(),
        consent_version: '1.0',
      }])
      .select('id')

    if (leadError) {
      return NextResponse.json({ error: leadError.message }, { status: 500 })
    }

    const leadId = leadData?.[0]?.id

    // Registar atividade no histórico
    if (leadId) {
      await supabaseAdmin.from('lead_activities').insert([{
        lead_id: leadId,
        user_id: magnet.user_id,
        type: 'lead_magnet_download',
        title: `📥 Recebeu "${magnet.title}"`,
        meta: {
          magnet_id: magnet.id,
          magnet_title: magnet.title,
          magnet_type: magnet.magnet_type,
          file_url: magnet.file_url,
        },
      }])
    }

    // Incrementar leads_count
    await supabaseAdmin.rpc('increment_magnet_leads', { magnet_id: magnet.id })

    // Notificar owner por email
    try {
      const { data: ownerData } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', magnet.user_id)
        .single()

      if (ownerData?.email) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.kardme.com'
        await fetch(baseUrl + '/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: magnet.user_id,
            leadId: leadData?.[0]?.id,
            recipientEmail: ownerData.email,
            subject: `Nova lead via Lead Magnet: ${name}`,
            body: `Olá,\n\nTens uma nova lead via "${magnet.title}":\n\nNome: ${name}\nEmail: ${email}${phone ? `\nTelefone: ${phone}` : ''}\n\nAcede ao CRM Pro para mais detalhes.\n\nMelhores cumprimentos,\nKardme`,
          }),
        })
      }
    } catch (_) {}

    // Enviar email de boas-vindas à pessoa (se aceitou marketing)
    if (marketing_opt_in && email && leadId) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.kardme.com'

        // Usar template personalizado ou default
        const defaultSubject = `📥 O teu recurso: ${magnet.title}`
        const isRaffle = magnet.magnet_type === 'raffle'
        const defaultBody = isRaffle
          ? `Olá ${name},\n\nObrigado por participares no sorteio "${magnet.title}"!\n\nO teu número da sorte é: 🎰 ${number_chosen}\n\nGuarda este email — se fores o vencedor entraremos em contacto contigo.\n\nBoa sorte!\n\nMelhores cumprimentos`
          : `Olá ${name},\n\nObrigado pelo teu interesse!\n\nAqui está o link para o teu recurso "${magnet.title}":\n${magnet.file_url}\n\nPodes fazer download a qualquer momento.\n\nMelhores cumprimentos`

        const emailSubject = magnet.welcome_email_subject || defaultSubject
        const emailBody = (magnet.welcome_email_body || defaultBody)
          .replace(/{nome}/g, name)
          .replace(/{link}/g, magnet.file_url || '')
          .replace(/{numero}/g, number_chosen ? String(number_chosen) : '')

        const welcomeRes = await fetch(baseUrl + '/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: magnet.user_id,
            leadId,
            recipientEmail: email,
            subject: emailSubject,
            body: emailBody,
          }),
        })

        await supabaseAdmin.from('lead_activities').insert([{
          lead_id: leadId,
          user_id: magnet.user_id,
          type: welcomeRes?.ok ? 'welcome_email_sent' : 'welcome_email_failed',
          title: welcomeRes?.ok
            ? '📧 Email de boas-vindas enviado com o recurso'
            : '❌ Falha ao enviar email de boas-vindas',
          meta: { magnet_title: magnet.title },
        }])
      } catch (_) {}
    }

    return NextResponse.json({
      ok: true,
      file_url: magnet.file_url,
      thank_you_message: magnet.thank_you_message || 'Obrigado! O teu download está pronto.',
    }, { status: 200 })

  } catch (e: any) {
    console.error('Error in POST /api/lead-magnets/capture:', e)
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 })
  }
}
