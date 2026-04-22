import { supabase } from '@/lib/supabaseClient'

const STORAGE_KEY = 'kardme_active_card_id'

export function getLocalActiveCardId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}

export function setLocalActiveCardId(cardId: string | null): void {
  if (typeof window === 'undefined') return
  if (cardId) localStorage.setItem(STORAGE_KEY, cardId)
  else localStorage.removeItem(STORAGE_KEY)
}

export async function saveActiveCardIdToDB(userId: string, cardId: string | null): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ last_active_card_id: cardId })
    .eq('id', userId)

  if (error) throw error
}

export async function getActiveCardIdFromDB(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('last_active_card_id')
    .eq('id', userId)
    .single()

  if (error) return null
  return (data as any)?.last_active_card_id || null
}
