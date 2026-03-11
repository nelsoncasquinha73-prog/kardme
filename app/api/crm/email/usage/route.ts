import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkCRMProActive } from '@/lib/crm/crmProGate'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function todayISODate(): string {
  // usage por dia (YYYY-MM-DD)
  const d = new Date()
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, countToSend } = body as { userId: string; countToSend: number }

    if (!userId || !countToSend || countToSend < 1) {
      return NextResponse.json({ error: 'userId e countToSend são obrigatórios' }, { status: 400 })
    }

    const hasCRMPro = await checkCRMProActive(userId)
    if (!hasCRMPro) {
      return NextResponse.json({ error: 'CRM Pro não está ativo' }, { status: 403 })
    }

    const day = todayISODate()
    const limit = 200

    const { data: row } = await supabaseAdmin
      .from('crm_email_daily_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('day', day)
      .maybeSingle()

    const current = (row as any)?.count ?? 0
    if (current + countToSend > limit) {
      return NextResponse.json(
        { error: `Limite diário atingido. Tens ${current}/${limit} envios hoje. Estás a tentar enviar +${countToSend}.` },
        { status: 429 }
      )
    }

    // upsert increment
    const next = current + countToSend
    const { error } = await supabaseAdmin
      .from('crm_email_daily_usage')
      .upsert({
        user_id: userId,
        day,
        count: next,
        updated_at: new Date().toISOString(),
      })

    if (error) throw error

    return NextResponse.json({ ok: true, day, current, next, limit })
  } catch (e: any) {
    console.error('Usage endpoint error:', e)
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 })
  }
}
