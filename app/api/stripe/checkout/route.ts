import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_PRICES } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { ambassadorId, planType, userId } = await req.json()

    if (!ambassadorId || !planType || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const priceId = planType === 'monthly' 
      ? STRIPE_PRICES.ambassador_monthly 
      : STRIPE_PRICES.ambassador_yearly

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/crm?checkout=success&ambassador=${ambassadorId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/crm?checkout=canceled&ambassador=${ambassadorId}`,
      metadata: {
        purchase_type: 'ambassador_subscription',
        ambassadorId,
        userId,
        planType,
      },
      subscription_data: {
        metadata: {
          purchase_type: 'ambassador_subscription',
          ambassadorId,
          userId,
          planType,
        },
      },
    })

    // Guardar checkout_session_id na BD
    await supabase
      .from('ambassadors')
      .update({ checkout_session_id: session.id })
      .eq('id', ambassadorId)
      .eq('user_id', userId)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
