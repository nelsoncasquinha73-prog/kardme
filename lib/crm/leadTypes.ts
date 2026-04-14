import { supabase } from '@/lib/supabaseClient'

export type LeadType = {
  id: string
  card_id: string | null
  user_id: string
  name: string
  color: string
  created_at: string
}

export type LeadSource = {
  id: string
  user_id: string
  value: string
  label: string
  emoji: string
  created_at: string
}

// ── AUDIÊNCIAS (globais por user) ─────────────────────────────────────────────

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
    .insert({ user_id: userId, card_id: null, name, color })
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

// ── MULTI-AUDIÊNCIA ───────────────────────────────────────────────────────────

// Atualiza o array de audiências de uma lead (substitui tudo)
export async function updateLeadAudiences(leadId: string, audienceIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ audience_ids: audienceIds })
    .eq('id', leadId)
  if (error) throw error
}

// Adiciona uma audiência à lead (sem remover as existentes)
export async function addAudienceToLead(leadId: string, audienceId: string, currentIds: string[]): Promise<void> {
  if (currentIds.includes(audienceId)) return
  const newIds = [...currentIds, audienceId]
  await updateLeadAudiences(leadId, newIds)
}

// Remove uma audiência da lead
export async function removeAudienceFromLead(leadId: string, audienceId: string, currentIds: string[]): Promise<void> {
  const newIds = currentIds.filter(id => id !== audienceId)
  await updateLeadAudiences(leadId, newIds)
}

// Compatibilidade retroativa — mantém lead_type_id em sincronia com o primeiro audience_id
export async function updateLeadTypeOnLead(leadId: string, leadTypeId: string | null): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ lead_type_id: leadTypeId })
    .eq('id', leadId)
  if (error) throw error
}

// ── ORIGENS (globais por user) ────────────────────────────────────────────────

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
  const value = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  const { data, error } = await supabase
    .from('crm_lead_sources')
    .insert({ user_id: userId, value, label, emoji })
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

export async function updateLeadSource(leadId: string, source: string): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ lead_source: source })
    .eq('id', leadId)
  if (error) throw error
}

// ── CONSTANTES ────────────────────────────────────────────────────────────────

export const LEAD_SOURCES_DEFAULT = [
  { value: 'cartão', label: '📇 Cartão' },
  { value: 'importado', label: '📥 Importado' },
  { value: 'lead_form', label: '📋 Lead Form' },
  { value: 'manual', label: '✍️ Manual' },
  { value: 'Lead Magnet', label: '🧲 Lead Magnet' },
  { value: 'ambassador', label: '👤 Embaixador' },
]

export const TYPE_COLORS = [
  '#6c5ce7', '#0984e3', '#00b894', '#e17055',
  '#fdcb6e', '#fd79a8', '#636e72', '#00cec9',
]
