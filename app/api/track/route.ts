import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { cardId, type, key, path, referrer } = await req.json()

    // Validação básica
    if (!cardId || !type || !['view', 'click', 'lead'].includes(type)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Valida que o card existe
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('id, user_id')
      .eq('id', cardId)
      .eq('published', true)
      .single()

    if (cardError || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    // Insere o evento
    const { error: insertError } = await supabase.from('card_events').insert({
      card_id: cardId,
      user_id: card.user_id,
      event_type: type,
      event_key: key || null,
      path: path || null,
      referrer: referrer || null,
      ua: req.headers.get('user-agent') || null,
    })

    if (insertError) {
      console.error('[track] insert error:', insertError)
      return NextResponse.json({ error: 'Failed to track' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[track] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
