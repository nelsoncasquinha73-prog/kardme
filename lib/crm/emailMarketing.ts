import { supabase } from '@/lib/supabaseClient'

export type EmailSegment = {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export type EmailBroadcast = {
  id: string
  user_id: string
  title: string
  subject: string
  preheader: string | null
  html_content: any
  template_id: string | null
  status: 'draft' | 'scheduled' | 'sent' | 'paused'
  scheduled_at: string | null
  sent_at: string | null
  total_recipients: number
  opened: number
  clicked: number
  created_at: string
  updated_at: string
}

export type EmailBroadcastRecipient = {
  id: string
  broadcast_id: string
  lead_id: string
  email: string
  status: 'pending' | 'sent' | 'opened' | 'clicked' | 'failed'
  opened_at: string | null
  clicked_at: string | null
  click_count: number
  open_count: number
  created_at: string
  updated_at: string
}

export type EmailCampaignTemplate = {
  id: string
  user_id: string
  name: string
  category: string | null
  html_content: any
  thumbnail_url: string | null
  is_default: boolean
  created_at: string
}

export async function fetchEmailSegments(userId: string): Promise<EmailSegment[]> {
  const { data, error } = await supabase
    .from('email_segments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) {
    console.error('Erro ao carregar segmentos:', error)
    return []
  }
  return data || []
}

export async function createEmailSegment(userId: string, name: string, color: string): Promise<EmailSegment> {
  const { data, error } = await supabase
    .from('email_segments')
    .insert({ user_id: userId, name, color })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteEmailSegment(id: string): Promise<void> {
  const { error } = await supabase.from('email_segments').delete().eq('id', id)
  if (error) throw error
}

export async function updateEmailSegment(id: string, name: string, color: string): Promise<void> {
  const { error } = await supabase.from('email_segments').update({ name, color }).eq('id', id)
  if (error) throw error
}

export async function fetchLeadSegments(leadId: string): Promise<EmailSegment[]> {
  const { data, error } = await supabase
    .from('lead_segment_mapping')
    .select('email_segments(*)')
    .eq('lead_id', leadId)
  if (error) {
    console.error('Erro ao carregar segmentos do lead:', error)
    return []
  }
  return (data || []).map((m: any) => m.email_segments).filter(Boolean)
}

export async function addLeadToSegment(leadId: string, segmentId: string): Promise<void> {
  const { error } = await supabase.from('lead_segment_mapping').insert({ lead_id: leadId, segment_id: segmentId })
  if (error && !error.message.includes('duplicate')) throw error
}

export async function removeLeadFromSegment(leadId: string, segmentId: string): Promise<void> {
  const { error } = await supabase
    .from('lead_segment_mapping')
    .delete()
    .eq('lead_id', leadId)
    .eq('segment_id', segmentId)
  if (error) throw error
}

export async function addLeadsToSegment(leadIds: string[], segmentId: string): Promise<void> {
  const mappings = leadIds.map((leadId) => ({ lead_id: leadId, segment_id: segmentId }))
  const { error } = await supabase.from('lead_segment_mapping').insert(mappings)
  if (error && !error.message.includes('duplicate')) throw error
}

export async function removeLeadsFromSegment(leadIds: string[], segmentId: string): Promise<void> {
  const { error } = await supabase
    .from('lead_segment_mapping')
    .delete()
    .in('lead_id', leadIds)
    .eq('segment_id', segmentId)
  if (error) throw error
}

export async function fetchBroadcasts(userId: string, filters?: { status?: string }): Promise<EmailBroadcast[]> {
  let query = supabase.from('email_broadcasts').select('*').eq('user_id', userId)
  if (filters?.status) query = query.eq('status', filters.status)
  query = query.order('created_at', { ascending: false })
  const { data, error } = await query
  if (error) {
    console.error('Erro ao carregar broadcasts:', error)
    return []
  }
  return data || []
}

export async function createBroadcast(
  userId: string,
  params: { title: string; subject: string; preheader?: string; html_content: any; template_id?: string | null; scheduled_at?: string }
): Promise<EmailBroadcast> {
  const { data, error } = await supabase
    .from('email_broadcasts')
    .insert({
      user_id: userId,
      title: params.title,
      subject: params.subject,
      preheader: params.preheader || null,
      html_content: params.html_content,
      template_id: params.template_id || null,
      scheduled_at: params.scheduled_at || null,
      status: params.scheduled_at ? 'scheduled' : 'draft',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateBroadcast(
  broadcastId: string,
  userId: string,
  params: { title?: string; subject?: string; preheader?: string; html_content?: any; status?: string; scheduled_at?: string }
): Promise<EmailBroadcast> {
  const { data, error } = await supabase
    .from('email_broadcasts')
    .update({ ...params, updated_at: new Date().toISOString() })
    .eq('id', broadcastId)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteBroadcast(broadcastId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('email_broadcasts').delete().eq('id', broadcastId).eq('user_id', userId)
  if (error) throw error
}

export async function getBroadcastStats(broadcastId: string) {
  const { data, error } = await supabase.from('email_broadcast_recipients').select('status').eq('broadcast_id', broadcastId)
  if (error) {
    console.error('Erro ao carregar stats:', error)
    return { sent: 0, opened: 0, clicked: 0, failed: 0 }
  }
  const recipients = data || []
  return {
    sent: recipients.filter((r) => r.status !== 'pending').length,
    opened: recipients.filter((r) => r.status === 'opened').length,
    clicked: recipients.filter((r) => r.status === 'clicked').length,
    failed: recipients.filter((r) => r.status === 'failed').length,
  }
}

export async function fetchBroadcastRecipients(broadcastId: string): Promise<EmailBroadcastRecipient[]> {
  const { data, error } = await supabase
    .from('email_broadcast_recipients')
    .select('*')
    .eq('broadcast_id', broadcastId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('Erro ao carregar recipients:', error)
    return []
  }
  return data || []
}

export async function createBroadcastRecipients(broadcastId: string, recipients: Array<{ lead_id: string; email: string }>): Promise<void> {
  const mappings = recipients.map((r) => ({ broadcast_id: broadcastId, lead_id: r.lead_id, email: r.email, status: 'pending' }))
  const { error } = await supabase.from('email_broadcast_recipients').insert(mappings)
  if (error) throw error
}

export async function markRecipientAsSent(recipientId: string): Promise<void> {
  const { error } = await supabase
    .from('email_broadcast_recipients')
    .update({ status: 'sent', updated_at: new Date().toISOString() })
    .eq('id', recipientId)
  if (error) throw error
}

export async function markRecipientAsOpened(recipientId: string): Promise<void> {
  const { error } = await supabase
    .from('email_broadcast_recipients')
    .update({ status: 'opened', opened_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', recipientId)
  if (error) throw error
}

export async function markRecipientAsClicked(recipientId: string): Promise<void> {
  const { error } = await supabase
    .from('email_broadcast_recipients')
    .update({ status: 'clicked', clicked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', recipientId)
  if (error) throw error
}

export async function fetchCampaignTemplates(userId: string): Promise<EmailCampaignTemplate[]> {
  const { data, error } = await supabase
    .from('email_campaign_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('Erro ao carregar templates:', error)
    return []
  }
  return data || []
}

export async function createCampaignTemplate(
  userId: string,
  params: { name: string; category?: string; html_content: any; thumbnail_url?: string }
): Promise<EmailCampaignTemplate> {
  const { data, error } = await supabase
    .from('email_campaign_templates')
    .insert({
      user_id: userId,
      name: params.name,
      category: params.category || null,
      html_content: params.html_content,
      thumbnail_url: params.thumbnail_url || null,
      is_default: false,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCampaignTemplate(templateId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('email_campaign_templates').delete().eq('id', templateId).eq('user_id', userId)
  if (error) throw error
}

export async function getLeadsBySegments(userId: string, segmentIds: string[]): Promise<any[]> {
  if (segmentIds.length === 0) return []
  const { data, error } = await supabase.from('lead_segment_mapping').select('leads(*)').in('segment_id', segmentIds)
  if (error) {
    console.error('Erro ao carregar leads por segmentos:', error)
    return []
  }
  return (data || []).map((m: any) => m.leads).filter(Boolean)
}

export const SEGMENT_COLORS = ['#6c5ce7', '#0984e3', '#00b894', '#e17055', '#fdcb6e', '#fd79a8', '#636e72', '#00cec9']

export async function sendBroadcast(
  userId: string,
  broadcastId: string,
  recipients: string[],
  subject?: string,
  htmlBody?: string
): Promise<{ sent: number; failed: number }> {
  if (recipients.length === 0) {
    throw new Error('Sem destinatários')
  }

  // Fetch broadcast data if subject/htmlBody not provided
  let finalSubject = subject
  let finalHtmlBody = htmlBody

  if (!finalSubject || !finalHtmlBody) {
    const { data: broadcast } = await supabase
      .from('email_broadcasts')
      .select('subject, html_body')
      .eq('id', broadcastId)
      .single()

    finalSubject = broadcast?.subject || finalSubject || ''
    finalHtmlBody = broadcast?.html_body || finalHtmlBody || ''
  }

  if (!finalSubject || !finalHtmlBody) {
    throw new Error('Subject e htmlBody são obrigatórios')
  }

  try {
    const res = await fetch('/api/crm/email/send-broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        broadcastId,
        recipients,
        subject: finalSubject,
        htmlBody: finalHtmlBody,
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
