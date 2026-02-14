import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { sendEmail } from '@/lib/email'
import { createClient } from '@supabase/supabase-js'
import { getLang, paymentFailedEmail, paymentSucceededEmail } from '@/lib/emailTemplates'

export const runtime = 'nodejs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUserByCustomerId(customerId: string) {
  try {
    const { data: subRow } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()

    const userId = (subRow as any)?.user_id
    if (!userId) return null

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, language')
      .eq('id', userId)
      .maybeSingle()

    if (!(profile as any)?.email) return null

    return {
      email: (profile as any).email as string,
      lang: getLang((profile as any).language as string | null),
    }
  } catch (err) {
    console.error('Error fetching user by customerId:', err)
    return null
  }
}

async function getUserEmailByCustomerId(customerId: string): Promise<string | null> {
  try {
    const user = await getUserByCustomerId(customerId)
    return user?.email || null
  } catch (err) {
    console.error('Error fetching user email:', err)
    return null
  }
}

function planLabelFromInvoice(invoice: Stripe.Invoice): string {
  const line = invoice.lines?.data?.[0]
  const price = (line as any)?.price as Stripe.Price | undefined
  const interval = price?.recurring?.interval

  if (interval === 'year') return 'Kardme Pro (Anual)'
  if (interval === 'month') return 'Kardme Pro (Mensal)'
  return 'Kardme Pro'
}

function formatDatePT(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy}`
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://kardme.com'
}

export async function POST(req: Request) {
  const sig = (await headers()).get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    )
  }

  try {
    const appUrl = getAppUrl()

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

          if (session.customer_details?.email) {
            await stripe.customers.update(customerId, {
              email: session.customer_details.email,
            })
          }

          await supabaseAdmin.from('user_subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan,
            status: sub.status,
            cancel_at_period_end: sub.cancel_at_period_end,
            next_billing_date: (sub as any).current_period_end
              ? new Date((sub as any).current_period_end * 1000).toISOString()
              : null,
            current_period_end: (sub as any).current_period_end
              ? new Date((sub as any).current_period_end * 1000).toISOString()
              : null,
            billing_email: session.customer_details?.email || null,
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
      const customerId = (pi.customer as string | null) || null

      let email: string | null = (pi as any).receipt_email || null

      if (!email && customerId) {
        email = await getUserEmailByCustomerId(customerId)
      }

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

      if (email && customerId) {
        const user = await getUserByCustomerId(customerId)
        if (user) {
          const tpl = paymentFailedEmail({ lang: user.lang, appUrl })
          console.log('RESEND_SEND_ATTEMPT', { to: email, subject: tpl.subject })
          await sendEmail({
            to: email,
            subject: tpl.subject,
            html: tpl.html,
          })
        }
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string | null

      let email: string | null =
        (invoice.customer_email as string | null) ||
        (invoice as any).customer_details?.email ||
        null

      if (!email && customerId) {
        email = await getUserEmailByCustomerId(customerId)
      }

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

      if (email && customerId) {
        const user = await getUserByCustomerId(customerId)
        if (user) {
          const tpl = paymentFailedEmail({ lang: user.lang, appUrl })
          console.log('RESEND_SEND_ATTEMPT', { to: email, subject: tpl.subject })
          await sendEmail({
            to: email,
            subject: tpl.subject,
            html: tpl.html,
          })
        }
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string | null

      if (customerId) {
        const user = await getUserByCustomerId(customerId)
        if (user) {
          const planLabel = planLabelFromInvoice(invoice)

          let nextBillingDateText: string | null = null
          const nextTs = (invoice as any)?.lines?.data?.[0]?.period?.end as number | undefined
          if (nextTs) {
            nextBillingDateText = formatDatePT(new Date(nextTs * 1000))
          }

          const tpl = paymentSucceededEmail({
            lang: user.lang,
            appUrl,
            planLabel,
            nextBillingDateText,
          })

          console.log('RESEND_SEND_ATTEMPT', { to: user.email, subject: tpl.subject })
          await sendEmail({
            to: user.email,
            subject: tpl.subject,
            html: tpl.html,
          })
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
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle()

      if (row?.user_id) {
        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: sub.status,
            cancel_at_period_end: sub.cancel_at_period_end,
            next_billing_date: (sub as any).current_period_end
              ? new Date((sub as any).current_period_end * 1000).toISOString()
              : null,
            current_period_end: (sub as any).current_period_end
              ? new Date((sub as any).current_period_end * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', row.user_id)
      }
    }

    return NextResponse.json({ received: true })
  } catch (e: any) {
    console.error('Webhook handler error:', e)
    return NextResponse.json({ error: e?.message || 'Webhook handler error' }, { status: 500 })
  }
}
