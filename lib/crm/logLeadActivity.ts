import { supabase } from '@/lib/supabaseClient'

type ActivityType =
  | 'note'
  | 'email_sent'
  | 'step_changed'
  | 'contacted_toggled'
  | 'task_created'
  | 'task_updated'
  | 'task_done'

export async function logLeadActivity(params: {
  leadId: string
  userId: string
  type: ActivityType
  title?: string
  body?: string
  meta?: Record<string, any>
}) {
  const { leadId, userId, type, title, body, meta } = params

  const { error } = await supabase.from('lead_activities').insert({
    lead_id: leadId,
    user_id: userId,
    type,
    title: title || null,
    body: body || null,
    meta: meta || {},
  })

  if (error) {
    // não rebenta a UX — só loga
    console.error('[lead_activities] insert error:', error)
  }
}
