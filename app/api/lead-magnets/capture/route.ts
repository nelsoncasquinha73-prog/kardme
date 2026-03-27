import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { slug, name, email, phone } = body || {}

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
        lead_source: 'Lead Magnet',
        lead_magnet_id: magnet.id,
        consent_given: true,
        marketing_opt_in: false,
        consent_timestamp: new Date().toISOString(),
        consent_version: '1.0',
      }])
      .select('id')

    if (leadError) {
      return NextResponse.json({ error: leadError.message }, { status: 500 })
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
