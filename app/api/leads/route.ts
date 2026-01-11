import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { cardId, name, email, phone, message } = body || {}

    if (!cardId || !name || !email) {
      return NextResponse.json(
        { error: 'Campos obrigatórios em falta (cardId, name, email).' },
        { status: 400 }
      )
    }

    // ✅ Usa Service Role no servidor (NUNCA no client)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase.from('leads').insert([
      {
        card_id: cardId,
        name,
        email,
        phone: phone || null,
        message: message || null,
      },
    ])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 })
  }
}
