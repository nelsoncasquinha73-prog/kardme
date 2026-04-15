import { supabaseServer } from '@/lib/supabaseServer'
import { sendEmail } from '@/lib/email'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { slug, formData } = await request.json()
    const supabase = supabaseServer

    if (!slug || !formData) {
      return NextResponse.json(
        { error: 'slug e formData são obrigatórios' },
        { status: 400 }
      )
    }

    // 1) Buscar o lead magnet
    const { data: magnet, error: magnetError } = await supabase
      .from('lead_magnets')
      .select('id, user_id, title, welcome_email_subject, welcome_email_body')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (magnetError || !magnet) {
      return NextResponse.json(
        { error: 'Lead Magnet não encontrado' },
        { status: 404 }
      )
    }

    // 2) Preparar dados do lead
    const leadName = formData.name || 'Sem nome'
    const leadEmail = formData.email || null
    const leadPhone = formData.phone || null

    // Montar resumo do formulário
    const formDataSummary = Object.entries(formData)
      .map(([key, value]) => {
        const displayValue = Array.isArray(value) ? value.join(', ') : value
        return `${key}: ${displayValue}`
      })
      .join('\n')

    // 3) Inserir lead
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .insert([
        {
          user_id: magnet.user_id,
          card_id: null,
          name: leadName,
          email: leadEmail,
          phone: leadPhone,
          notes: `Resposta do Lead Magnet "${magnet.title}":\n\n${formDataSummary}`,
          lead_source: 'Lead Magnet',
          lead_magnet_id: magnet.id,
          form_data: formData,
          created_at: new Date().toISOString(),
        },
      ])
      .select('id')

    if (leadError) {
      return NextResponse.json({ error: leadError.message }, { status: 500 })
    }

    const leadId = leadData?.[0]?.id

    // 4) Buscar owner email
    const { data: ownerData } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', magnet.user_id)
      .single()

    const ownerEmail = ownerData?.email

    // 5) Enviar email ao owner (sempre)
    let ownerEmailRes = null
    if (ownerEmail) {
      try {
        ownerEmailRes = await sendEmail({
          to: ownerEmail,
          subject: `Nova candidatura recebida: ${leadName}`,
          html: `
            <p>Olá,</p>
            <p>Recebeste uma nova candidatura no teu Lead Magnet "<strong>${magnet.title}</strong>":</p>
            <p><strong>Nome:</strong> ${leadName}<br/>
            <strong>Email:</strong> ${leadEmail || 'Não fornecido'}<br/>
            <strong>Telefone:</strong> ${leadPhone || 'Não fornecido'}</p>
            <p><strong>Respostas:</strong></p>
            <pre>${formDataSummary}</pre>
            <p>Acede ao CRM Pro para mais detalhes.</p>
            <p>Melhores cumprimentos,<br/>Kardme</p>
          `,
        })
      } catch (err: any) {
        console.error('Erro ao enviar email ao owner:', err)
      }
    }

    // 6) Enviar email ao lead (se tiver email)
    let leadEmailRes = null
    if (leadEmail) {
      try {
        const subject = magnet.welcome_email_subject || 'Obrigado pela tua candidatura!'
        const body = magnet.welcome_email_body || 'Recebemos a tua candidatura com sucesso. Em breve entraremos em contacto.'

        leadEmailRes = await sendEmail({
          to: leadEmail,
          subject,
          html: body.replace(/\n/g, '<br/>'),
        })
      } catch (err: any) {
        console.error('Erro ao enviar email ao lead:', err)
      }
    }

    // 7) Log activities
    if (leadId) {
      await supabase.from('lead_activities').insert([
        {
          lead_id: leadId,
          user_id: magnet.user_id,
          type: ownerEmailRes ? 'owner_notified_email' : 'owner_email_failed',
          title: ownerEmailRes
            ? 'Email de notificação enviado ao owner'
            : 'Falha ao enviar email de notificação ao owner',
          meta: { details: ownerEmailRes?.details || null },
        },
        {
          lead_id: leadId,
          user_id: magnet.user_id,
          type: leadEmailRes ? 'welcome_email_sent' : 'welcome_email_failed',
          title: leadEmailRes
            ? 'Email de boas-vindas enviado ao candidato'
            : 'Falha ao enviar email de boas-vindas ao candidato',
          meta: { details: leadEmailRes?.details || null },
        },
      ])
    }

    return NextResponse.json({ ok: true, leadId }, { status: 200 })
  } catch (error: any) {
    console.error('Error in POST /api/lead-magnets/submit-form:', error)
    return NextResponse.json(
      { error: error?.message || 'Erro interno' },
      { status: 500 }
    )
  }
}
