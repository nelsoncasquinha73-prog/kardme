import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

const KARDME_ADMIN_USER_ID = 'aafb4f55-843b-4dd2-b199-70dd9df592a8'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      cardId,
      name,
      email,
      phone,
      workArea,
      consentGiven,
    } = body || {}

    // 1) Validação
    if (!cardId || !name || !email || !workArea) {
      return NextResponse.json(
        { error: 'Nome, email e área profissional são obrigatórios.' },
        { status: 400 }
      )
    }

    if (consentGiven !== true) {
      return NextResponse.json(
        { error: 'Consentimento é obrigatório.' },
        { status: 400 }
      )
    }

    // 2) Confirmar que o cartão de origem existe
    const { data: sourceCard, error: cardError } = await supabaseServer
      .from('cards')
      .select('id, user_id, slug, published')
      .eq('id', cardId)
      .single()

    if (cardError || !sourceCard) {
      return NextResponse.json(
        { error: 'Cartão de origem não encontrado.' },
        { status: 404 }
      )
    }

    if (!sourceCard.published) {
      return NextResponse.json(
        { error: 'Cartão de origem não está publicado.' },
        { status: 403 }
      )
    }

    // 3) Informação da origem
    const sourceLabel = sourceCard.slug || sourceCard.id

    const leadNotes =
      `Lead interessada no Kardme.\n\n` +
      `Origem: Kardme Referral\n` +
      `Área profissional: ${String(workArea).trim()}\n` +
      `Cartão de origem: ${sourceLabel}\n` +
      `Card ID: ${sourceCard.id}`

    // 4) Inserir diretamente no CRM central do Kardme
    const { data: leadData, error: leadError } = await supabaseServer
      .from('leads')
      .insert([
        {
          user_id: KARDME_ADMIN_USER_ID,

          // O cartão NÃO determina o owner da lead.
          // Serve apenas para sabermos de onde veio.
          card_id: sourceCard.id,
          source_card_id: sourceCard.id,

          name: String(name).trim(),
          email: String(email).trim().toLowerCase(),
          phone: phone ? String(phone).trim() : null,

          notes: leadNotes,
          lead_source: 'kardme_referral',

          consent_given: true,
          marketing_opt_in: false,
          consent_timestamp: new Date().toISOString(),
          consent_version: '1.0',
        },
      ])
      .select('id')
      .single()

    if (leadError) {
      console.error('[api/kardme-referral] Lead insert error:', leadError)

      return NextResponse.json(
        { error: leadError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      leadId: leadData?.id,
    })
  } catch (err: any) {
    console.error('[api/kardme-referral] Unexpected error:', err)

    return NextResponse.json(
      { error: 'Erro interno.' },
      { status: 500 }
    )
  }
}
