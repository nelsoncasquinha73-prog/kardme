import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-12-15.clover' })
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { ambassadorId } = await req.json()
    if (!ambassadorId) return NextResponse.json({ error: 'ambassadorId obrigatório' }, { status: 400 })

    const { data: ambassador, error } = await supabaseAdmin
      .from('ambassadors')
      .select('subscription_id, subscription_current_period_end')
      .eq('id', ambassadorId)
      .single()

    if (error || !ambassador) return NextResponse.json({ error: 'Embaixador não encontrado' }, { status: 404 })
    if (!ambassador.subscription_id) return NextResponse.json({ error: 'Sem subscrição ativa' }, { status: 400 })

    // Cancela no fim do período atual (não imediatamente)
    await stripe.subscriptions.update(ambassador.subscription_id, {
      cancel_at_period_end: true,
    })

    // Atualiza estado na BD
    await supabaseAdmin
      .from('ambassadors')
      .update({
        subscription_status: 'canceled',
        is_active: false,
        deactivated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', ambassadorId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error canceling ambassador subscription:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
