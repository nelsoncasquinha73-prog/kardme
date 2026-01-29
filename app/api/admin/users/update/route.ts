import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, nome, apelido, plan, billing, published_card_limit, plan_started_at, plan_expires_at, plan_auto_renew, disabled } = body

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId é obrigatório' }, { status: 400 })
    }

    const { data: sessionData } = await supabaseServer.auth.getSession()
    const currentUserId = sessionData?.session?.user?.id

    if (!currentUserId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 })
    }

    const { data: adminProfile, error: adminError } = await supabaseServer
      .from('profiles')
      .select('role')
      .eq('id', currentUserId)
      .single()

    if (adminError || adminProfile?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Sem permissões' }, { status: 403 })
    }

    const { error: updateError } = await supabaseServer
      .from('profiles')
      .update({
        nome,
        apelido,
        plan,
        billing,
        published_card_limit,
        plan_started_at,
        plan_expires_at,
        plan_auto_renew,
        disabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Erro em update:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro desconhecido' }, { status: 500 })
  }
}
