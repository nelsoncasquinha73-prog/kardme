import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const { templateId, slug, userId } = await request.json()

    if (!templateId) {
      return NextResponse.json({ success: false, error: 'templateId é obrigatório' }, { status: 400 })
    }
    if (!slug) {
      return NextResponse.json({ success: false, error: 'slug é obrigatório' }, { status: 400 })
    }
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId é obrigatório' }, { status: 400 })
    }

    // 1) Buscar template
    const { data: template, error: templateError } = await supabaseServer
      .from('cards')
      .select('*')
      .eq('id', templateId)
      .eq('is_template', true)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ success: false, error: 'Template não encontrado' }, { status: 404 })
    }

    // 2) Criar novo cartão
    const { data: newCard, error: insertError } = await supabaseServer
      .from('cards')
      .insert({
  user_id: userId,
  slug,
  is_template: false,
  published: false,
  theme: template.theme,
  title: template.title ?? null,
})
      .select()
      .single()

    if (insertError || !newCard) {
      return NextResponse.json(
        { success: false, error: insertError?.message || 'Erro ao criar cartão' },
        { status: 500 }
      )
    }

    // 3) Copiar blocos
    const { data: blocks, error: blocksError } = await supabaseServer
      .from('card_blocks')
      .select('*')
      .eq('card_id', templateId)

    if (blocksError) {
      return NextResponse.json({ success: false, error: blocksError.message }, { status: 500 })
    }

    const newBlocks = (blocks ?? []).map(({ id, created_at, updated_at, ...rest }: any) => ({
      ...rest,
      card_id: newCard.id,
    }))

    if (newBlocks.length) {
      const { error: insertBlocksError } = await supabaseServer.from('card_blocks').insert(newBlocks)
      if (insertBlocksError) {
        return NextResponse.json({ success: false, error: insertBlocksError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, card: newCard })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    )
  }
}
