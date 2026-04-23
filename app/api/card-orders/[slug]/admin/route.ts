import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error('Missing Supabase env vars')
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

async function isAdmin(token: string): Promise<boolean> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    const { data: user } = await supabase.auth.getUser()
    return user?.user?.email === 'admin@kardme.com' || user?.user?.email === 'nelson@kardme.com'
  } catch {
    return false
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const admin = await isAdmin(token)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { slug } = await params
    const { status, card_id } = await req.json()

    if (!['rascunho', 'submetido', 'em_producao', 'concluido'].includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    const supabaseAdmin = getAdminSupabase()

    const { data, error } = await supabaseAdmin
      .from('card_orders')
      .update({
        status,
        card_id: card_id || null,
      })
      .eq('slug', slug)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, order: data }, { status: 200 })
  } catch (err: any) {
    console.error('Error updating card order status:', err)
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 })
  }
}
