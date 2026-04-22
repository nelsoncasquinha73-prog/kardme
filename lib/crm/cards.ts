import { supabase } from '@/lib/supabaseClient'

export async function updateLeadCard(leadId: string, cardId: string): Promise<void> {
  const { error } = await supabase
    .from('leads')
    .update({ card_id: cardId })
    .eq('id', leadId)

  if (error) throw error
}
