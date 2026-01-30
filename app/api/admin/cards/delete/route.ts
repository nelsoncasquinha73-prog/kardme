import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { cardId } = body

    if (!cardId) {
      return NextResponse.json({ success: false, error: 'cardId é obrigatório' }, { status: 400 })
    }

    await supabaseAdmin.from('card_blocks').delete().eq('card_id', cardId)
    
    const { error } = await supabaseAdmin.from('cards').delete().eq('id', cardId)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Erro em delete card:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro desconhecido' }, { status: 500 })
  }
}
