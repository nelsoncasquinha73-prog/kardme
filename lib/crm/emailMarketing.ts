import { supabase } from '@/lib/supabaseClient'

export const SEGMENT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
]

export interface EmailSegment {
  id: string
  user_id: string
  name: string
  color?: string
  created_at: string
}

export interface EmailBroadcast {
  id: string
  user_id: string
  title: string
  subject: string
  preheader?: string
  html_content: any
  status: 'draft' | 'sent' | 'scheduled'
  sent_at?: string
  total_recipients?: number
  created_at: string
}

// SEGMENTS
export async function createSegment(userId: string, name: string, color?: string) {
  const { data, error } = await supabase
    .from('email_segments')
    .insert({ user_id: userId, name, color })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSegments(userId: string) {
  const { data, error } = await supabase
    .from('email_segments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateSegment(segmentId: string, updates: any) {
  const { data, error } = await supabase
    .from('email_segments')
    .update(updates)
    .eq('id', segmentId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteSegment(segmentId: string) {
  const { error } = await supabase
    .from('email_segments')
    .delete()
    .eq('id', segmentId)

  if (error) throw error
}

// SEGMENT MAPPING
export async function addLeadsToSegment(segmentId: string, leadIds: string[]) {
  const mappings = leadIds.map((leadId) => ({
    segment_id: segmentId,
    lead_id: leadId,
  }))

  const { error } = await supabase
    .from('lead_segment_mapping')
    .insert(mappings)

  if (error) throw error
}

export async function removeLeadsFromSegment(segmentId: string, leadIds: string[]) {
  const { error } = await supabase
    .from('lead_segment_mapping')
    .delete()
    .in('lead_id', leadIds)
    .eq('segment_id', segmentId)

  if (error) throw error
}

export async function getSegmentLeads(segmentId: string) {
  const { data, error } = await supabase
    .from('lead_segment_mapping')
    .select('leads(id, name, email)')
    .eq('segment_id', segmentId)

  if (error) throw error
  return (data || []).map((m: any) => m.leads).filter(Boolean)
}

// BROADCASTS
export async function createBroadcast(userId: string, broadcast: any) {
  const { data, error } = await supabase
    .from('email_broadcasts')
    .insert({ user_id: userId, ...broadcast })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getBroadcasts(userId: string) {
  const { data, error } = await supabase
    .from('email_broadcasts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getBroadcast(broadcastId: string) {
  const { data, error } = await supabase
    .from('email_broadcasts')
    .select('*')
    .eq('id', broadcastId)
    .single()

  if (error) throw error
  return data
}

export async function updateBroadcast(broadcastId: string, userId: string, updates: any) {
  const { data, error } = await supabase
    .from('email_broadcasts')
    .update(updates)
    .eq('id', broadcastId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteBroadcast(broadcastId: string, userId: string) {
  const { error } = await supabase
    .from('email_broadcasts')
    .delete()
    .eq('id', broadcastId)
    .eq('user_id', userId)

  if (error) throw error
}

// BROADCAST RECIPIENTS
export async function getBroadcastRecipients(broadcastId: string) {
  const { data, error } = await supabase
    .from('email_broadcast_recipients')
    .select('*')
    .eq('broadcast_id', broadcastId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getBroadcastStats(broadcastId: string) {
  const { data, error } = await supabase
    .from('email_broadcast_recipients')
    .select('status')
    .eq('broadcast_id', broadcastId)

  if (error) throw error

  const stats = {
    total: data?.length || 0,
    sent: data?.filter((d) => d.status === 'sent').length || 0,
    failed: data?.filter((d) => d.status === 'failed').length || 0,
    opened: data?.filter((d) => d.status === 'opened').length || 0,
  }

  return stats
}

export async function updateRecipientStatus(broadcastId: string, email: string, status: string) {
  const { error } = await supabase
    .from('email_broadcast_recipients')
    .update({ status })
    .eq('broadcast_id', broadcastId)
    .eq('email', email)

  if (error) throw error
}

// SEND BROADCAST
export async function sendBroadcast(
  userId: string,
  broadcastId: string,
  recipients: Array<{ email: string; leadId?: string; name?: string }>,
  subject: string,
  htmlBody: string
): Promise<{ sent: number; failed: number }> {
  if (recipients.length === 0) {
    throw new Error('Sem destinatários')
  }

  if (!subject || !htmlBody) {
    throw new Error('Subject e htmlBody são obrigatórios')
  }

  try {
    const recipientEmails = recipients.map((r) => r.email)
    const recipientLeadIds = recipients.map((r) => r.leadId || null)
    const recipientNames = recipients.map((r) => r.name || null)

    const res = await fetch('/api/crm/email/send-broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        broadcastId,
        recipients: recipientEmails,
        recipientLeadIds,
        subject,
        htmlBody,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Erro ao enviar')
    }

    const result = await res.json()
    return result
  } catch (e: any) {
    throw new Error(e.message || 'Erro ao enviar broadcast')
  }
}
