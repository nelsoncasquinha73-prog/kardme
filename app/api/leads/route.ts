import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)


  const renderWelcomeMessage = (template: string, vars: { nome: string; email: string; cardTitle: string }) => {
    return template
      .replace(/{nome}/g, vars.nome)
      .replace(/{email}/g, vars.email)
      .replace(/{cardTitle}/g, vars.cardTitle)
  }


async function sendWelcomeEmail(params: { userId: string; leadId: string; toEmail: string; leadName: string; cardTitle: string; subject?: string; body?: string }) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.kardme.com'
    const response = await fetch(baseUrl + '/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: params.userId,
        leadId: params.leadId,
        recipientEmail: params.toEmail,
        subject: params.subject || 'Bem-vindo à {cardTitle}! 🎉',
        body: params.body || 'Olá {nome},\n\nObrigado por se registar e visitar o nosso cartão digital!\n\nEstamos entusiasmados por te ter connosco.\n\nMelhores cumprimentos,\n{cardTitle}',
      }),
    })
    const txt = await response.text()
    if (!response.ok) return { ok: false, details: txt }
    return { ok: true, details: txt }
  } catch (err: any) {
    return { ok: false, details: err?.message || String(err) }
  }
}

async function sendOwnerNotification(params: { userId: string; leadId: string; ownerEmail: string; leadName: string; leadEmail: string; cardTitle: string }) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.kardme.com'
    const response = await fetch(baseUrl + '/api/send-email', {
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
      .select('user_id, name, crm_pro_welcome_subject, crm_pro_welcome_body')
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
          const ownerRes = await sendOwnerNotification({
            userId: cardData.user_id,
            leadId,
            ownerEmail: ownerData.email,
            leadName: name,
            leadEmail: email,
            cardTitle: cardData.name || 'Kardme',
          })

          // Enviar email ao lead (só se opt-in)
          let welcomeRes: any = null
          if (marketingOptIn && email) {
            // Preparar subject e body com replace de variáveis
            const customSubject = cardData.crm_pro_welcome_subject || 'Bem-vindo à {cardTitle}! 🎉'
            const customBody = cardData.crm_pro_welcome_body || 'Olá {nome},\n\nObrigado por se registar e visitar o nosso cartão digital!\n\nEstamos entusiasmados por te ter connosco.\n\nMelhores cumprimentos,\n{cardTitle}'
            
            const renderedSubject = renderWelcomeMessage(customSubject, {
              nome: name,
              email,
              cardTitle: cardData.name || 'Kardme',
            })
            const renderedBody = renderWelcomeMessage(customBody, {
              nome: name,
              email,
              cardTitle: cardData.name || 'Kardme',
            })

            welcomeRes = await sendWelcomeEmail({
              userId: cardData.user_id,
              leadId,
              toEmail: email,
              leadName: name,
              cardTitle: cardData.name || 'Kardme',
              subject: renderedSubject,
              body: renderedBody,
            })
          }

          // Log activities (sucesso/falha)
          if (leadId) {
            await supabaseAdmin.from('lead_activities').insert([
              {
                lead_id: leadId,
                user_id: cardData.user_id,
                type: ownerRes?.ok ? 'owner_notified_email' : 'owner_email_failed',
                title: ownerRes?.ok
                  ? 'Email de notificação enviado ao owner'
                  : 'Falha ao enviar email de notificação ao owner',
                meta: { details: ownerRes?.details || null },
              },
            ])

            if (marketingOptIn && email) {
              await supabaseAdmin.from('lead_activities').insert([
                {
                  lead_id: leadId,
                  user_id: cardData.user_id,
                  type: welcomeRes?.ok ? 'welcome_email_sent' : 'welcome_email_failed',
                  title: welcomeRes?.ok
                    ? 'Email de boas-vindas enviado ao lead'
                    : 'Falha ao enviar email de boas-vindas ao lead',
                  meta: { details: welcomeRes?.details || null },
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
