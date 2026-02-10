import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

import { sendEmail } from '@/lib/email'
export const runtime = 'nodejs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const sig = (await headers()).get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const purchaseType = session.metadata?.purchase_type

      if (purchaseType === 'pro_subscription') {
        const userId = session.metadata?.user_id
        const billing = session.metadata?.billing
        const subscriptionId = session.subscription as string | null
        const customerId = session.customer as string | null

        if (userId && subscriptionId && customerId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          const plan = billing === 'yearly' ? 'pro_yearly' : 'pro_monthly'

          await supabaseAdmin.from('user_subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan,
            status: sub.status,
            current_period_end: (sub as any).current_period_end ? new Date((sub as any).current_period_end * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
        }
      }

      if (purchaseType === 'nfc_order') {
        const orderId = session.metadata?.order_id
        const paymentIntentId = session.payment_intent as string | null

        if (orderId && session.payment_status === 'paid') {
          const shipping = (session as any).shipping_details
          const addr = shipping?.address

          await supabaseAdmin
            .from('nfc_orders')
            .update({
              status: 'paid',
              stripe_payment_intent_id: paymentIntentId,
              paid_at: new Date().toISOString(),
              shipping_name: shipping?.name || '—',
              shipping_email: session.customer_details?.email || '—',
              shipping_phone: session.customer_details?.phone || null,
              shipping_address_line1: addr?.line1 || '—',
              shipping_address_line2: addr?.line2 || null,
              shipping_city: addr?.city || '—',
              shipping_postal_code: addr?.postal_code || '—',
              shipping_country: addr?.country || '—',
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)

          const { data: items } = await supabaseAdmin
            .from('nfc_order_items')
            .select('card_id')
            .eq('nfc_order_id', orderId)

          const cardIds = (items || []).map((x: any) => x.card_id).filter(Boolean)

          if (cardIds.length) {
            await supabaseAdmin
              .from('cards')
              .update({
                nfc_enabled: true,
                nfc_order_id: orderId,
                nfc_enabled_at: new Date().toISOString(),
              })
              .in('id', cardIds)
          }
        }
      }

      if (purchaseType === 'template_purchase') {
        const templateId = session.metadata?.template_id
        const userId = session.metadata?.user_id
        const couponId = session.metadata?.coupon_id
        const originalPrice = session.metadata?.original_price
        const finalPrice = session.metadata?.final_price

        if (userId && templateId && session.payment_status === 'paid') {
          await supabaseAdmin.from('user_templates').upsert({
            user_id: userId,
            template_id: templateId,
          })

          if (couponId) {
            const { data: coupon } = await supabaseAdmin
              .from('coupons')
              .select('uses_count')
              .eq('id', couponId)
              .single()

            await supabaseAdmin
              .from('coupons')
              .update({ uses_count: (coupon?.uses_count || 0) + 1 })
              .eq('id', couponId)

            await supabaseAdmin.from('coupon_uses').insert({
              coupon_id: couponId,
              user_id: userId,
              template_id: templateId,
              original_price: parseFloat(originalPrice || '0'),
              final_price: parseFloat(finalPrice || '0'),
            })
          }
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as Stripe.PaymentIntent

      const email =
        (pi as any).receipt_email ||
        (pi as any).last_payment_error?.payment_method?.billing_details?.email ||
        null

      // Best-effort: marcar subscrição como past_due se conseguirmos ligar ao customer
      const customerId = (pi.customer as string | null) || null
      if (customerId) {
        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: 'past_due',
            billing_email: email,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)
      }

      if (email) {
        const appUrl = process.env.APP_URL || 'https://kardme.com'
        const subject = 'Falha no pagamento — atualize o seu método de pagamento'
        const html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.5">
            <h2>Falha no pagamento</h2>
            <p>Não foi possível processar o pagamento da sua subscrição Kardme.</p>
            <p>Para evitar interrupção do seu cartão, atualize o seu método de pagamento:</p>
            <p><a href="${appUrl}/dashboard/settings/billing">Gerir faturação</a></p>
            <p style="color:#666;font-size:12px">Se já atualizou, pode ignorar este email.</p>
          </div>
        `
        await sendEmail({ to: email, subject, html })
      }
    }



    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string | null

      if (customerId) {
        const email =
          (invoice.customer_email as string | null) ||
          (invoice as any).customer_details?.email ||
          null

        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: 'past_due',
            billing_email: email,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        if (email) {
          const appUrl = process.env.APP_URL || 'https://kardme.com'
          const subject = 'Falha no pagamento — atualize o seu método de pagamento'
          const html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.5">
              <h2>Falha no pagamento</h2>
              <p>Não foi possível processar o pagamento da sua subscrição Kardme.</p>
              <p>Para evitar interrupção do seu cartão, atualize o seu método de pagamento:</p>
              <p><a href="${appUrl}/dashboard/settings/billing">Gerir faturação</a></p>
              <p style="color:#666;font-size:12px">Se já atualizou, pode ignorar este email.</p>
            </div>
          `
          await sendEmail({ to: email, subject, html })
        }
      }
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      const { data: row } = await supabaseAdmin
        .from('user_subscriptions')
        .select('user_id, plan')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

      if (row?.user_id) {
        await supabaseAdmin.from('user_subscriptions').update({
          status: sub.status,
          current_period_end: (sub as any).current_period_end ? new Date((sub as any).current_period_end * 1000).toISOString() : null,
          updated_at: new Date().toISOString(),
        }).eq('user_id', row.user_id)
      }
    }

    return NextResponse.json({ received: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Webhook handler error' }, { status: 500 })
  }
}
