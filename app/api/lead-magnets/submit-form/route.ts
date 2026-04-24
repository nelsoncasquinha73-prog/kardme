import { supabaseServer } from '@/lib/supabaseServer'
import { sendEmail } from '@/lib/email'
import { NextResponse } from 'next/server'

function normalizeEmailBody(body: string): string {
  if (!body) return ''
  let normalized = body.replace(/\r\n/g, '\n')
  const paragraphs = normalized.split(/\n\s*\n+/).filter(p => p.trim())
  const htmlParagraphs = paragraphs.map(p => {
    const withBr = p.replace(/\n/g, '<br/>')
    return `<p>${withBr}</p>`
  })
  return htmlParagraphs.join('')
}

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
      .select('id, user_id, title, card_id, welcome_email_subject, welcome_email_body')
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

    // 4) Buscar owner email (do cartão se existir, senão do user do magnet)
    let ownerEmail = null
    let ownerUserId = magnet.user_id
    
    if (magnet.card_id) {
      try {
        const { data: cardData } = await supabase
          .from('cards')
          .select('user_id')
          .eq('id', magnet.card_id)
          .single()
        if (cardData?.user_id) {
          ownerUserId = cardData.user_id
        }
      } catch (e) {
        console.error('Erro ao buscar card user_id:', e)
      }
    }
    
    // Buscar email de profiles
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', ownerUserId)
        .single()
      ownerEmail = profileData?.email
    } catch (e) {
      console.error('Erro ao buscar email de profiles:', e)
    }
    
    console.log('OWNER_EMAIL_DEBUG', {
      magnet_id: magnet.id,
      magnet_card_id: magnet.card_id,
      ownerUserId,
      ownerEmail,
    })

    // Buscar dados do cartão para usar como remetente
    let cardName = 'Kardme'
    if (magnet.card_id) {
      try {
        const { data: card } = await supabase
          .from('cards')
          .select('name')
          .eq('id', magnet.card_id)
          .single()
        if (card) {
          cardName = card.name || 'Kardme'
        }
      } catch (e) {
        console.error('Erro ao buscar cartão:', e)
      }
    }

    // 5) Enviar email ao owner (sempre)
    let ownerEmailRes = null
    if (ownerEmail) {
      try {
        ownerEmailRes = await sendEmail({
          to: ownerEmail,
          subject: `Nova candidatura recebida: ${leadName}`,
          fromName: cardName,
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
        const bodyTemplate = magnet.welcome_email_body || 'Recebemos a tua candidatura com sucesso. Em breve entraremos em contacto.'
        const link = magnet.file_url || ''
        const body = bodyTemplate
          .replace(/\{\{\s*name\s*\}\}/gi, leadName)
          .replace(/\{\{\s*link\s*\}\}/gi, link)

        leadEmailRes = await sendEmail({
          to: leadEmail,
          subject,
          html: normalizeEmailBody(body),
          fromName: cardName,
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
          meta: { error: ownerEmailRes?.error || null },
        },
        {
          lead_id: leadId,
          user_id: magnet.user_id,
          type: leadEmailRes ? 'welcome_email_sent' : 'welcome_email_failed',
          title: leadEmailRes
            ? 'Email de boas-vindas enviado ao candidato'
            : 'Falha ao enviar email de boas-vindas ao candidato',
          meta: { error: leadEmailRes?.error || null },
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
