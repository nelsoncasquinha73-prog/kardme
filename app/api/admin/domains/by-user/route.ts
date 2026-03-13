import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function assertAdmin(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return { ok: false as const, status: 401, error: 'Não autenticado' }

  const token = authHeader.replace('Bearer ', '')
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !userData?.user?.id) return { ok: false as const, status: 401, error: 'Não autenticado' }

  const currentUserId = userData.user.id
  const { data: adminProfile, error: adminError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', currentUserId)
    .single()

  if (adminError || adminProfile?.role !== 'admin') return { ok: false as const, status: 403, error: 'Sem permissões' }
  return { ok: true as const }
}

export async function GET(req: Request) {
  try {
    const admin = await assertAdmin(req)
    if (!admin.ok) return NextResponse.json({ success: false, error: admin.error }, { status: admin.status })

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ success: false, error: 'userId é obrigatório' }, { status: 400 })

    // Buscar cards do user
    const { data: cards, error: cardsErr } = await supabaseAdmin
      .from('cards')
      .select('id,title,slug')
      .eq('user_id', userId)

    if (cardsErr) return NextResponse.json({ success: false, error: cardsErr.message }, { status: 500 })

    const cardIds = (cards ?? []).map(c => c.id)
    if (cardIds.length === 0) return NextResponse.json({ success: true, domains: [], cards: [] })

    // Buscar domínios desses cards
    const { data: domains, error: domErr } = await supabaseAdmin
      .from('custom_domains')
      .select('id,card_id,domain,status,last_check_at,created_at')
      .in('card_id', cardIds)

    if (domErr) return NextResponse.json({ success: false, error: domErr.message }, { status: 500 })

    return NextResponse.json({ success: true, cards, domains })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Erro desconhecido' }, { status: 500 })
  }
}
