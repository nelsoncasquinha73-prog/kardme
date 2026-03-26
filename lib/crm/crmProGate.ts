import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Check if user has CRM Pro active (verifica também data de expiração)
 */
export async function checkCRMProActive(userId: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin
      .from('user_addons')
      .select('crm_pro_active, crm_pro_expires_at')
      .eq('user_id', userId)
      .single()

    if (!data?.crm_pro_active) return false

    // Se tem data de expiração, verificar se ainda é válida
    if (data.crm_pro_expires_at) {
      const expires = new Date(data.crm_pro_expires_at)
      if (expires < new Date()) return false
    }

    return true
  } catch {
    return false
  }
}
