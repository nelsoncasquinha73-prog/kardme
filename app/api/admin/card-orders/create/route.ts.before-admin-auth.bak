import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome, email, telefone } = body

    if (!nome || !email) {
      return NextResponse.json({ error: 'Nome e email são obrigatórios' }, { status: 400 })
    }

    const slug = `pedido-${nanoid(8)}`

    const { data, error } = await supabaseAdmin
      .from('card_orders')
      .insert({
        slug,
        nome,
        email,
        telefone: telefone || null,
        status: 'rascunho',
      })
      .select()
      .single()

    if (error) {
      console.error('❌ [CREATE card-order] error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ [CREATE card-order] created:', data)
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('❌ [CREATE card-order] exception:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
