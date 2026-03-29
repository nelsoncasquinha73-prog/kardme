import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

export const STRIPE_PRICES = {
  ambassador_monthly: process.env.STRIPE_PRICE_AMBASSADOR_MONTHLY!,
  ambassador_yearly: process.env.STRIPE_PRICE_AMBASSADOR_YEARLY!,
}
