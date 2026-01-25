import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const userId = body?.userId as string | undefined
    const plan = body?.plan as string | undefined
    const published_card_limit = body?.published_card_limit as number | undefined
    const plan_started_at = body?.plan_started_at as string | undefined
    const plan_expires_at = body?.plan_expires_at as string | undefined
    const plan_auto_renew = body?.plan_auto_renew as boolean | undefined

    if (!userId || !plan || typeof published_card_limit !== 'number') {
      return NextResponse.json({ success: false, error: 'Parâmetros inválidos' }, { status: 400 })
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
        plan,
        published_card_limit,
        plan_started_at,
        plan_expires_at,
        plan_auto_renew,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('❌ Erro em update-plan:', err)
    return NextResponse.json(
      { success: false, error: err?.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
