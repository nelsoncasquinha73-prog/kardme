import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, nome, apelido, plan, published_card_limit } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email e password são obrigatórios' }, { status: 400 })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      return NextResponse.json({ success: false, error: authError?.message || 'Erro ao criar user' }, { status: 400 })
    }

    const userId = authData.user.id

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        nome: nome || null,
        apelido: apelido || null,
        plan: plan || 'free',
        published_card_limit: published_card_limit ?? 1,
      })
      .eq('id', userId)

    if (profileError) {
      console.error('Erro ao atualizar profile:', profileError)
    }

    return NextResponse.json({ success: true, userId, message: 'Cliente criado com sucesso' })
  } catch (err: any) {
    console.error('Erro ao criar cliente:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro desconhecido' }, { status: 500 })
  }
}
