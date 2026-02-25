import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client com service role (NUNCA expor no client)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Client "normal" para ler a sessão do requester (cookies)
const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function isRequesterAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cookieHeader = req.headers.get('cookie')

  // Tenta obter user via Authorization Bearer (se o teu frontend enviar)
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length)
    const { data } = await supabaseAnon.auth.getUser(token)
    const email = data.user?.email || ''
    return email === 'admin@kardme.com' || email === 'nelson@kardme.com'
  }

  // Fallback: tenta ler sessão via cookies (SSR)
  if (cookieHeader) {
    // Nota: supabase-js não lê cookies automaticamente aqui sem helpers,
    // então este fallback pode não funcionar. A solução robusta é enviar Bearer token do client.
    return false
  }

  return false
}

export async function POST(req: NextRequest) {
  try {
    // ✅ Segurança: só admin pode criar clientes
    const ok = await isRequesterAdmin(req)
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 })
    }

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

    // ✅ Upsert no profile (cria se não existir)
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      {
        id: userId,
        email,
        nome: nome || null,
        apelido: apelido || null,
        plan: plan || 'free',
        published_card_limit: published_card_limit ?? 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      console.error('Erro ao upsert profile:', profileError)
      // não falhar criação do user, mas reportar
    }

    return NextResponse.json({ success: true, userId, message: 'Cliente criado com sucesso' })
  } catch (err: any) {
    console.error('Erro ao criar cliente:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro desconhecido' }, { status: 500 })
  }
}
