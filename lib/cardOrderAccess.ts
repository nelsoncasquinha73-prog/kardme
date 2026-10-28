import { createHash } from 'crypto'
import { createClient } from '@supabase/supabase-js'

export async function validateCardOrderAccess(
  slug: string,
  token: string
): Promise<boolean> {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    return false
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) return false

  const db = createClient(url, key, {
    auth: { persistSession: false },
  })

  const tokenHash = createHash('sha256')
    .update(token)
    .digest('hex')

  const { data, error } = await db
    .from('card_order_access_tokens')
    .select('order_id, expires_at, revoked_at')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (error || !data) return false

  const { data: order } = await db
    .from('card_orders')
    .select('id')
    .eq('id', data.order_id)
    .eq('slug', slug)
    .maybeSingle()

  return !!order
}
