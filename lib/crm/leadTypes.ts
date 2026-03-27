import { supabase } from '@/lib/supabaseClient'

export type LeadType = {
  id: string
  card_id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export async function fetchLeadTypes(cardId: string): Promise<LeadType[]> {
  const { data, error } = await supabase
    .from('crm_lead_types')
    .select('*')
    .eq('card_id', cardId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createLeadType(cardId: string, userId: string, name: string, color: string): Promise<LeadType> {
  const { data, error } = await supabase
    .from('crm_lead_types')
    .insert({ card_id: cardId, user_id: userId, name, color })
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

export async function updateLeadType(id: string, name: string, color: string): Promise<void> {
  const { error } = await supabase
    .from('crm_lead_types')
    .update({ name, color })
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

export async function updateLeadSource(leadId: string, source: string): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ lead_source: source })
    .eq('id', leadId)
  if (error) throw error
}

export const LEAD_SOURCES = [
  { value: 'cartão', label: '📇 Cartão' },
  { value: 'importado', label: '📥 Importado' },
  { value: 'lead_form', label: '📋 Lead Form' },
  { value: 'manual', label: '✍️ Manual' },
]

export const TYPE_COLORS = [
  '#6c5ce7', '#0984e3', '#00b894', '#e17055',
  '#fdcb6e', '#fd79a8', '#636e72', '#00cec9',
]
