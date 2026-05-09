import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface EmailBroadcast {
  id: string
  user_id: string
  title: string
  subject: string
  preheader?: string
  html_content: any // jsonb dos blocos
  status: string
  scheduled_at?: string
  sent_at?: string
  total_recipients?: number
  created_at: string
  updated_at: string
}

export interface EmailCampaignTemplate {
  id: string
  user_id: string
  name: string
  category: string
  html_content: any // jsonb dos blocos
  thumbnail_url?: string
  is_default: boolean
  created_at: string
}

export interface EmailTemplate {
  id: string
  user_id: string
  name: string
  category: string
  subject: string
  body: string
  blocks?: any
  created_at: string
}

export async function getBroadcasts(userId: string): Promise<EmailBroadcast[]> {
  const { data, error } = await supabase
    .from('email_broadcasts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching broadcasts:', error)
    return []
  }

  return data || []
}

export async function getEmailCampaignTemplates(userId: string): Promise<EmailCampaignTemplate[]> {
  const { data, error } = await supabase
    .from('email_campaign_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching campaign templates:', error)
    return []
  }

  return data || []
}

export async function getEmailTemplates(userId: string): Promise<EmailTemplate[]> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching email templates:', error)
    return []
  }

  return data || []
}

export async function deleteBroadcast(broadcastId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('email_broadcasts')
    .delete()
    .eq('id', broadcastId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to delete broadcast: ${error.message}`)
  }
}

export async function getBroadcastRecipients(broadcastId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('email_broadcast_recipients')
    .select('*')
    .eq('broadcast_id', broadcastId)

  if (error) {
    console.error('Error fetching broadcast recipients:', error)
    return []
  }

  return data || []
}
