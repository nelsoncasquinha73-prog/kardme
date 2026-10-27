import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function requireCardOrderAdmin(req: Request) {
  const header = req.headers.get('authorization') || ''

  if (!header.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401 }
    )
  }

  const token = header.slice(7).trim()

  const { data, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !data.user) {
    return NextResponse.json(
      { error: 'Sessão inválida' },
      { status: 401 }
    )
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    return NextResponse.json(
      { error: 'Sem permissões' },
      { status: 403 }
    )
  }

  return null
}
