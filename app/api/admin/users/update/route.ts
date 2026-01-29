import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, nome, apelido, plan, billing, published_card_limit, plan_started_at, plan_expires_at, plan_auto_renew, disabled } = body

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId é obrigatório' }, { status: 400 })
    }

    const { error: updateError } = await supabaseAdmin
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
