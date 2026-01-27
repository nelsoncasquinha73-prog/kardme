import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

type NfcItemInput = {
  card_id: string
  card_slug: string
  nfc_name: string
  nfc_company?: string | null
  nfc_function?: string | null
  nfc_logo_url?: string | null
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      user_id,
      billing,
      items,
    } = body as {
      user_id: string
      billing: 'monthly' | 'yearly'
      items: NfcItemInput[]
    }

    if (!user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    if (billing !== 'monthly' && billing !== 'yearly')
      return NextResponse.json({ error: 'Invalid billing' }, { status: 400 })
    if (!Array.isArray(items) || items.length < 1)
      return NextResponse.json({ error: 'Missing items' }, { status: 400 })

    const priceId =
      billing === 'monthly' ? process.env.STRIPE_PRICE_NFC_39! : process.env.STRIPE_PRICE_NFC_29!

    // Get/create customer
    const { data: subRow } = await supabaseAdmin
      .from('user_subscriptions')
      .select('stripe_customer_id, plan, status')
      .eq('user_id', user_id)
      .maybeSingle()

    const plan = subRow?.plan || 'free'
    const status = subRow?.status || 'active'

    // Require Pro active to buy NFC
    const proActive =
      (plan === 'pro_monthly' || plan === 'pro_yearly' || plan === 'enterprise') &&
      (status === 'active' || status === 'trialing')

    if (!proActive) {
      return NextResponse.json({ error: 'Precisas de Pro ativo para comprar NFC.' }, { status: 403 })
    }

    let customerId = subRow?.stripe_customer_id || null
    if (!customerId) {
      const customer = await stripe.customers.create({ metadata: { user_id } })
      customerId = customer.id
      await supabaseAdmin.from('user_subscriptions').upsert({
        user_id,
        stripe_customer_id: customerId,
        plan: 'free',
        status: 'active',
        updated_at: new Date().toISOString(),
      })
    }

    // Create order row (pending_payment) - shipping filled after webhook
    const unitPriceCents = billing === 'monthly' ? 3900 : 2900

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('nfc_orders')
      .insert({
        user_id,
        quantity: items.length,
        unit_price_cents: unitPriceCents,
        currency: 'eur',
        status: 'pending_payment',
        shipping_name: 'TBD',
        shipping_email: 'TBD',
        shipping_address_line1: 'TBD',
        shipping_city: 'TBD',
        shipping_postal_code: 'TBD',
        shipping_country: 'TBD',
      })
      .select('id')
      .single()

    if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 })

    const orderId = order.id as string

    const itemsToInsert = items.map((it) => ({
      nfc_order_id: orderId,
      card_id: it.card_id,
      card_slug: it.card_slug,
      nfc_name: it.nfc_name,
      nfc_company: it.nfc_company ?? null,
      nfc_function: it.nfc_function ?? null,
      nfc_logo_url: it.nfc_logo_url ?? null,
    }))

    const { error: itemsErr } = await supabaseAdmin.from('nfc_order_items').insert(itemsToInsert)
    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [{ price: priceId, quantity: items.length }],
      shipping_address_collection: {
        allowed_countries: [
          'PT','ES','FR','DE','IT','NL','BE','LU','IE','GB','US','CA','BR','AU','NZ','CH','SE','NO','DK','FI','AT','PL','CZ','SK','HU','RO','BG','GR','TR','MX','AR','CL','CO','PE','ZA','AE','SA','IN','JP','SG','HK'
        ],
      },
      success_url: `${siteUrl}/dashboard?checkout=nfc_success&order_id=${orderId}`,
      cancel_url: `${siteUrl}/dashboard?checkout=nfc_cancel&order_id=${orderId}`,
      metadata: {
        user_id,
        purchase_type: 'nfc_order',
        order_id: orderId,
        billing,
      },
    })

    await supabaseAdmin
      .from('nfc_orders')
      .update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
