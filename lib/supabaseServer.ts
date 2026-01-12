import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/config'

const url = (SUPABASE_URL || '').trim()
const key = (SUPABASE_SERVICE_ROLE_KEY || '').trim()

// fallback hard para o build nunca morrer
const safeUrl = url.length ? url : 'http://localhost:54321'
const safeKey = key.length ? key : 'dummy-key'

export const supabaseServer = createClient(safeUrl, safeKey, {
  auth: { persistSession: false },
})
