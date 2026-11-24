import 'server-only'
import { timingSafeEqual } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { isMailbox } from './gmailTransport'

export function isAuthorizedCron(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || !secret.trim() || secret !== secret.trim() || secret === 'dev-secret') return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const received = Buffer.from(request.headers.get('authorization') || '')
  return expected.length === received.length && timingSafeEqual(expected, received)
}

export async function ownsCard(userId: string, cardId: string) {
  const { data } = await supabaseAdmin.from('cards').select('id')
    .eq('id', cardId).eq('user_id', userId).maybeSingle()
  return Boolean(data)
}

export async function getOwnedLead(userId: string, leadId: string) {
  // A lead's attribution card can belong to an ambassador. It does not authorize using that card as a sender.
  const { data: lead } = await supabaseAdmin.from('leads')
    .select('id, name, email, marketing_opt_in')
    .eq('id', leadId).eq('user_id', userId).maybeSingle()
  return lead
}

export async function canSendMarketing(userId: string, email: string) {
  if (!isMailbox(email)) return false
  const normalized = email.trim().toLowerCase()
  const pattern = normalized.replace(/[\\%_]/g, '\\$&')
  const [leads, cancellations] = await Promise.all([
    supabaseAdmin.from('leads').select('marketing_opt_in').eq('user_id', userId).ilike('email', pattern),
    supabaseAdmin.from('email_unsubscribes').select('email').eq('user_id', userId).ilike('email', `%${pattern}%`).limit(1000),
  ])
  if (leads.error || cancellations.error || !cancellations.data || cancellations.data.length >= 1000 ||
      cancellations.data.some(row => row.email.trim().toLowerCase() === normalized)) return false
  return Boolean(leads.data?.length && leads.data.length < 1000 && leads.data.every(lead => lead.marketing_opt_in === true))
}
