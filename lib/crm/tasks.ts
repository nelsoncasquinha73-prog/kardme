import { supabase } from '@/lib/supabaseClient'

export type LeadTask = {
  id: string
  lead_id: string
  user_id: string
  title: string
  description: string | null
  due_at: string
  status: 'open' | 'done' | 'cancelled'
  done_at: string | null
  action_type: string | null
  created_at: string
  updated_at: string
}

export async function createLeadTask(params: {
  leadId: string
  userId: string
  title: string
  description?: string
  dueAtISO: string
  actionType?: string
}) {
  return supabase.from('lead_tasks').insert({
    lead_id: params.leadId,
    user_id: params.userId,
    title: params.title,
    description: params.description || null,
    due_at: params.dueAtISO,
    action_type: params.actionType || 'follow_up',
  })
}

export async function markTaskDone(params: { taskId: string }) {
  return supabase
    .from('lead_tasks')
    .update({ status: 'done', done_at: new Date().toISOString() })
    .eq('id', params.taskId)
}

export async function fetchTasksForDay(params: { userId: string; dayISO: string }) {
  // dayISO: YYYY-MM-DD (local)
  const start = new Date(params.dayISO + 'T00:00:00')
  const end = new Date(params.dayISO + 'T23:59:59.999')

  return supabase
    .from('lead_tasks')
    .select('*')
    .eq('user_id', params.userId)
    .eq('status', 'open')
    .gte('due_at', start.toISOString())
    .lte('due_at', end.toISOString())
    .order('due_at', { ascending: true })
}


export async function fetchTasksForLead(params: { userId: string; leadId: string }) {
  return supabase
    .from('lead_tasks')
    .select('*')
    .eq('user_id', params.userId)
    .eq('lead_id', params.leadId)
    .eq('status', 'open')
    .order('due_at', { ascending: true })
}
