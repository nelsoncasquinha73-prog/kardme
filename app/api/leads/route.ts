import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function sendWelcomeEmail(params: { userId: string; leadId: string; toEmail: string; leadName: string; cardTitle: string }) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: params.userId,
        leadId: params.leadId,
        recipientEmail: params.toEmail,
        subject: `Bem-vindo à ${params.cardTitle}! 🎉`,
        body: `Olá ${params.leadName},\n\nObrigado por se registar e visitar o nosso cartão digital!\n\nEstamos entusiasmados por te ter connosco.\n\nMelhores cumprimentos,\n${params.cardTitle}`,
      }),
    })
    if (!response.ok) {
      console.error('Failed to send welcome email:', await response.text())
    }
  } catch (err) {
    console.error('Error sending welcome email:', err)
  }
}

async function sendOwnerNotification(params: { userId: string; leadId: string; ownerEmail: string; leadName: string; leadEmail: string; cardTitle: string }) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: params.userId,
        leadId: params.leadId,
        recipientEmail: params.ownerEmail,
        subject: `Nova lead recebida: ${params.leadName}`,
        body: `Olá,\n\nTens uma nova lead no teu cartão "${params.cardTitle}":\n\nNome: ${params.leadName}\nEmail: ${params.leadEmail}\n\nAcede ao CRM Pro para mais detalhes.\n\nMelhores cumprimentos,\nKardme`,
      }),
    })
    if (!response.ok) {
      console.error('Failed to send owner notification:', await response.text())
    }
  } catch (err) {
    console.error('Error sending owner notification:', err)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { cardId, name, email, phone, message, zone, consentGiven, marketingOptIn, consentTimestamp, consentVersion } = body || {}

    if (!cardId || !name || !email) {
      return NextResponse.json(
        { error: 'Campos obrigatórios em falta (cardId, name, email).' },
        { status: 400 }
      )
    }

    // Inserir lead
    const { data: leadData, error: leadError } = await supabaseAdmin.from('leads').insert([
      {
        card_id: cardId,
        name,
        email,
        phone: phone || null,
        message: message || null,
        zone: zone || null,
        consent_given: consentGiven ?? true,
        marketing_opt_in: marketingOptIn ?? false,
        consent_timestamp: consentTimestamp || new Date().toISOString(),
        consent_version: consentVersion || '1.0',
      },
    ]).select('id')

    if (leadError) {
      return NextResponse.json({ error: leadError.message }, { status: 500 })
    }

    const leadId = leadData?.[0]?.id

    // Buscar card owner e verificar CRM Pro
    const { data: cardData } = await supabaseAdmin
      .from('cards')
      .select('user_id, title')
      .eq('id', cardId)
      .single()

    if (cardData?.user_id) {
      // Verificar se owner tem CRM Pro
      const { data: addonData } = await supabaseAdmin
        .from('user_addons')
        .select('crm_pro_active')
        .eq('user_id', cardData.user_id)
        .single()

      if (addonData?.crm_pro_active) {
        // Owner tem CRM Pro — enviar notificações
        const { data: ownerData } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('id', cardData.user_id)
          .single()

        if (ownerData?.email) {
          // Enviar email ao owner (sempre)
          await sendOwnerNotification({ userId: cardData.user_id, leadId, ownerEmail: ownerData.email, leadName: name, leadEmail: email, cardTitle: cardData.title || 'Kardme' })

          // Enviar email ao lead (só se opt-in)
          if (marketingOptIn && email) {
            await sendWelcomeEmail({ userId: cardData.user_id, leadId, toEmail: email, leadName: name, cardTitle: cardData.title || 'Kardme' })
          }

          // Log activities
          if (leadId) {
            await supabaseAdmin.from('lead_activities').insert([
              {
                lead_id: leadId,
                user_id: cardData.user_id,
                type: 'owner_notified_email',
                title: `Email de notificação enviado ao owner`,
              },
            ])

            if (marketingOptIn) {
              await supabaseAdmin.from('lead_activities').insert([
                {
                  lead_id: leadId,
                  user_id: cardData.user_id,
                  type: 'welcome_email_sent',
                  title: `Email de boas-vindas enviado ao lead`,
                },
              ])
            }
          }
        }
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e: any) {
    console.error('Error in POST /api/leads:', e)
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 })
  }
}
