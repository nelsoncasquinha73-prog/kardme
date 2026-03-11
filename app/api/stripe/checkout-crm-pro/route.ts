import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, billingCycle } = body

    if (!userId || !billingCycle) {
      return NextResponse.json(
        { error: 'userId e billingCycle são obrigatórios' },
        { status: 400 }
      )
    }

    const priceId =
      billingCycle === 'annual'
        ? process.env.STRIPE_CRM_PRO_PRICE_ANNUAL
        : process.env.STRIPE_CRM_PRO_PRICE_MONTHLY

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID não configurado' },
        { status: 500 }
      )
    }

    // Get/create Stripe customer
    const { data: subRow } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    let customerId = subRow?.stripe_customer_id || null

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { user_id: userId },
      })
      customerId = customer.id

      await supabase
        .from('user_subscriptions')
        .upsert({ user_id: userId, stripe_customer_id: customerId })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.kardme.com'

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/dashboard/crm?success=true`,
      cancel_url: `${baseUrl}/dashboard/crm?canceled=true`,
      metadata: {
        user_id: userId,
        product_type: 'crm_pro',
        billing_cycle: billingCycle,
      },
    })

    return NextResponse.json({ url: session.url }, { status: 200 })
  } catch (e: any) {
    console.error('Error creating CRM Pro checkout:', e)
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 })
  }
}
