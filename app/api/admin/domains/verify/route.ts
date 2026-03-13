import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const VERCEL_API = 'https://api.vercel.com'

function normalizeDomain(d: string) {
  return d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
}

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

export async function POST(req: Request) {
  try {
    const admin = await assertAdmin(req)
    if (!admin.ok) return NextResponse.json({ success: false, error: admin.error }, { status: admin.status })

    const body = await req.json()
    const domainRaw = body.domain as string | undefined
    if (!domainRaw) return NextResponse.json({ success: false, error: 'domain é obrigatório' }, { status: 400 })

    const domain = normalizeDomain(domainRaw)

    const token = process.env.VERCEL_TOKEN
    const teamId = process.env.VERCEL_TEAM_ID
    if (!token || !teamId) return NextResponse.json({ success: false, error: 'Vercel env vars em falta' }, { status: 500 })

    const cfgRes = await fetch(`${VERCEL_API}/v6/domains/${domain}/config?teamId=${teamId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const cfgJson = await cfgRes.json()

    const status = cfgJson?.misconfigured ? 'dns_pending' : 'active'

    await supabaseAdmin
      .from('custom_domains')
      .update({
        status,
        dns_instructions: cfgJson,
        error_message: null,
        last_check_at: new Date().toISOString(),
      })
      .eq('domain', domain)

    return NextResponse.json({ success: true, domain, status, config: cfgJson })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Erro desconhecido' }, { status: 500 })
  }
}
