import { supabase } from '@/lib/supabaseClient'

export type MagnetType = 'ebook' | 'discount' | 'guide' | 'checklist' | 'webinar' | 'form'

export type FormFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'

export type FormFieldCondition = {
  fieldId: string
  value: string
}

export type FormField = {
  id: string
  label: string
  type: FormFieldType
  required: boolean
  placeholder?: string
  options?: string[]
  showIf?: FormFieldCondition
}

export type LeadMagnet = {
  id: string
  user_id: string
  title: string
  description: string | null
  cover_image_url: string | null
  magnet_type: MagnetType
  file_url: string | null
  form_fields: FormField[]
  thank_you_message: string | null
  slug: string
  is_active: boolean
  views_count: number
  leads_count: number
  created_at: string
  updated_at: string
  form_id?: string
}

export async function getLeadMagnets(userId: string): Promise<LeadMagnet[]> {
  const { data, error } = await supabase
    .from('lead_magnets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createLeadMagnet(magnet: Partial<LeadMagnet>): Promise<LeadMagnet> {
  const { data, error } = await supabase
    .from('lead_magnets')
    .insert([magnet])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateLeadMagnet(id: string, updates: Partial<LeadMagnet>): Promise<void> {
  const { error } = await supabase
    .from('lead_magnets')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteLeadMagnet(id: string): Promise<void> {
  const { error: formError } = await supabase
    .from('lead_magnet_forms')
    .delete()
    .eq('lead_magnet_id', id)

  if (formError) throw formError

  const { error } = await supabase
    .from('lead_magnets')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function toggleLeadMagnetActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('lead_magnets')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 7)
}

export const MAGNET_TYPE_LABELS: Record<MagnetType, string> = {
  ebook: '📘 E-book',
  discount: '🎁 Desconto',
  guide: '📋 Guia',
  checklist: '✅ Checklist',
  webinar: '🎥 Webinar',
  form: '📝 Formulário',
}

export const DEFAULT_FORM_FIELDS: FormField[] = [
  { id: 'name', label: 'Nome', type: 'text', required: true, placeholder: 'O teu nome' },
  { id: 'email', label: 'Email', type: 'email', required: true, placeholder: 'O teu email' },
  { id: 'phone', label: 'Telefone', type: 'tel', required: false, placeholder: 'O teu telefone' },
]
