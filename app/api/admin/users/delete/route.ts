import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseServer } from '@/lib/supabaseServer'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId } = body

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

    await supabaseAdmin.from('cards').delete().eq('user_id', userId)
    await supabaseAdmin.from('profiles').delete().eq('id', userId)

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Erro ao eliminar user do Auth:', authError)
      return NextResponse.json({ success: false, error: authError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Erro em delete:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro desconhecido' }, { status: 500 })
  }
}
