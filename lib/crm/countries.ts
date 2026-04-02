import { supabase } from '@/lib/supabaseClient'

export type Country = {
  id: string
  user_id: string
  name: string
  created_at: string
}

export async function fetchCountries(userId: string): Promise<Country[]> {
  const { data, error } = await supabase
    .from('crm_countries')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createCountry(userId: string, name: string): Promise<Country> {
  const { data, error } = await supabase
    .from('crm_countries')
    .insert([{ user_id: userId, name }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCountry(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('crm_countries')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

export async function updateLeadCountry(leadId: string, country: string | null): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ country })
    .eq('id', leadId)

  if (error) throw error
}
