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
    const { userId, nome, apelido, plan, billing, published_card_limit, plan_started_at, plan_expires_at, plan_auto_renew, disabled, crm_pro_active, crm_pro_expires_at } = body

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

    // Guardar addons via service role (bypassa RLS)
    console.log('[addons] upserting:', { userId, crm_pro_active, crm_pro_expires_at })
    const { error: addonsError, data: addonsData } = await supabaseAdmin
      .from('user_addons')
      .upsert({
        user_id: userId,
        crm_pro_active: crm_pro_active ?? false,
        crm_pro_expires_at: crm_pro_expires_at || null,
      }, { onConflict: 'user_id' })
      .select()

    console.log('[addons] result:', { addonsData, addonsError })
    if (addonsError) {
      console.error('[addons] error:', addonsError)
      return NextResponse.json({ success: false, error: 'Erro ao guardar addons: ' + addonsError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Erro em update:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Erro desconhecido' }, { status: 500 })
  }
}
// v3
