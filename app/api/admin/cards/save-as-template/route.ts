import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  try {
    const { cardId, templateName } = await req.json()

    if (!cardId || !templateName) {
      return NextResponse.json({ success: false, error: 'cardId e templateName são obrigatórios' }, { status: 400 })
    }

    // Buscar o cartão original com todos os dados
    const { data: card, error: cardError } = await supabaseServer
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .single()

    if (cardError || !card) {
      return NextResponse.json({ success: false, error: 'Cartão não encontrado' }, { status: 404 })
    }

    // Buscar os blocos do cartão
    const { data: blocks, error: blocksError } = await supabaseServer
      .from('card_blocks')
      .select('*')
      .eq('card_id', cardId)
      .order('order', { ascending: true })

    if (blocksError) {
      return NextResponse.json({ success: false, error: 'Erro ao buscar blocos' }, { status: 500 })
    }

    // Criar o template
    const { data: template, error: templateError } = await supabaseServer
      .from('templates')
      .insert({
        name: templateName,
        description: `Template criado a partir do cartão "${card.title || 'Sem título'}"`,
        preview_json: {
          theme: card.theme,
          blocks: blocks || []
        },
        theme_json: card.theme,
        category: 'outros',
        is_active: true,
        price: 0,
        price_type: 'free'
      })
      .select()
      .single()

    if (templateError) {
      console.error('Erro ao criar template:', templateError)
      return NextResponse.json({ success: false, error: 'Erro ao criar template: ' + templateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, template })
  } catch (err: any) {
    console.error('Erro:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro desconhecido' }, { status: 500 })
  }
}
