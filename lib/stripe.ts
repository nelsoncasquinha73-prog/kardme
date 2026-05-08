import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {})
  }
  return _stripe
}

// Mantém export para backward compat (mas prefere getStripe())
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as any)[prop]
  },
})

export const STRIPE_PRICES = {
  ambassador_monthly: process.env.STRIPE_PRICE_AMBASSADOR_MONTHLY!,
  ambassador_yearly: process.env.STRIPE_PRICE_AMBASSADOR_YEARLY!,
}
