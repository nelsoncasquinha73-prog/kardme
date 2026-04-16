import { supabase } from '@/lib/supabaseClient'

export interface LeadType {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface LeadSource {
  id: string
  user_id: string
  label: string
  emoji: string
  created_at: string
}

export const LEAD_SOURCES_DEFAULT = [
  { id: 'card', label: 'Cartão', emoji: '🎫' },
  { id: 'manual', label: 'Manual', emoji: '✋' },
  { id: 'imported', label: 'Importado', emoji: '📥' },
  { id: 'form', label: 'Lead Form', emoji: '📋' },
]

export async function fetchLeadTypes(userId: string): Promise<LeadType[]> {
  const { data, error } = await supabase
    .from('crm_lead_types')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data || []
}

export async function createLeadType(userId: string, name: string, color: string): Promise<LeadType> {
  const { data, error } = await supabase
    .from('crm_lead_types')
    .insert([{ user_id: userId, name, color }])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteLeadType(id: string): Promise<void> {
  const { error } = await supabase
    .from('crm_lead_types')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

export async function fetchLeadSources(userId: string): Promise<LeadSource[]> {
  const { data, error } = await supabase
    .from('crm_lead_sources')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data || []
}

export async function createLeadSource(userId: string, label: string, emoji: string): Promise<LeadSource> {
  const { data, error } = await supabase
    .from('crm_lead_sources')
    .insert([{ user_id: userId, label, emoji }])
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteLeadSource(id: string): Promise<void> {
  const { error } = await supabase
    .from('crm_lead_sources')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

export async function updateLeadTypeOnLead(leadId: string, leadTypeId: string | null): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ lead_type_id: leadTypeId })
    .eq('id', leadId)
  
  if (error) throw error
}

export async function updateLeadAudiences(leadId: string, audiences: string[]): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ audiences })
    .eq('id', leadId)
  
  if (error) throw error
}

export async function updateLeadSource(leadId: string, sourceId: string | null): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ source_id: sourceId })
    .eq('id', leadId)
  
  if (error) throw error
}
