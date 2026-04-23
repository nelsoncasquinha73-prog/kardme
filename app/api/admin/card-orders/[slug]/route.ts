import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  console.log('🔵 [GET card-order] slug:', slug)

  const { data, error } = await supabaseAdmin
    .from('card_orders')
    .select('*')
    .eq('slug', slug)
    .single()

  console.log('🔵 [GET card-order] data:', data, 'error:', error)

  if (error) {
    console.log('❌ [GET card-order] error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json(data || {})
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const body = await req.json()
  const { status } = body

  console.log('🔵 [PATCH card-order] slug:', slug, 'status:', status)

  if (!status) {
    return NextResponse.json({ error: 'Status é obrigatório' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('card_orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('slug', slug)
    .select()
    .single()

  if (error) {
    console.log('❌ [PATCH card-order] error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('✅ [PATCH card-order] updated:', data)
  return NextResponse.json(data)
}
