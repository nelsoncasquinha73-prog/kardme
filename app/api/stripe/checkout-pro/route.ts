import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { user_id, billing } = body as { user_id: string; billing: 'monthly' | 'yearly' }

    if (!user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    if (billing !== 'monthly' && billing !== 'yearly')
      return NextResponse.json({ error: 'Invalid billing' }, { status: 400 })

    const priceId =
      billing === 'monthly'
        ? process.env.STRIPE_PRICE_PRO_MONTHLY!
        : process.env.STRIPE_PRICE_PRO_YEARLY!

    // 1) get/create stripe customer
    const { data: subRow } = await supabaseAdmin
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user_id)
      .maybeSingle()

    let customerId = subRow?.stripe_customer_id || null

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { user_id },
      })
      customerId = customer.id

      await supabaseAdmin.from('user_subscriptions').upsert({
        user_id,
        stripe_customer_id: customerId,
        plan: 'free',
        status: 'active',
        updated_at: new Date().toISOString(),
      })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // 2) create checkout session (subscription)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${siteUrl}/dashboard?checkout=success`,
      cancel_url: `${siteUrl}/dashboard?checkout=cancel`,
      metadata: {
        user_id,
        purchase_type: 'pro_subscription',
        billing,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
