import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Check if user has CRM Pro active
 */
export async function checkCRMProActive(userId: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin
      .from('user_addons')
      .select('crm_pro_active')
      .eq('user_id', userId)
      .single()

    return data?.crm_pro_active === true
  } catch {
    return false
  }
}
