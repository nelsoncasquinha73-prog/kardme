import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('Missing Supabase env vars')
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  try {
    const { userId, nome, empresa } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })
    }

    const supabaseAdmin = getAdminSupabase()

    const slug = nanoid(8)

    const { data, error } = await supabaseAdmin
      .from('card_orders')
      .insert([
        {
          user_id: userId,
          slug,
          status: 'rascunho',
          nome: nome || null,
          empresa: empresa || null,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, slug, order: data }, { status: 201 })
  } catch (err: any) {
    console.error('Error creating card order:', err)
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 })
  }
}
