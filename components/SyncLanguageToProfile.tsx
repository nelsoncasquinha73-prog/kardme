'use client'

import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function normalizeLang(v: string | null) {
  const raw = (v || '').toLowerCase().trim()
  if (!raw) return null

  if (raw === 'ptbr' || raw === 'pt_br') return 'pt-br'
  if (raw === 'pt-pt') return 'pt'
  return raw
}

export default function SyncLanguageToProfile() {
  useEffect(() => {
    const run = async () => {
      try {
        const lang = normalizeLang(localStorage.getItem('i18n'))
        if (!lang) return

        const { data: auth } = await supabase.auth.getUser()
        const userId = auth?.user?.id
        if (!userId) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('language')
          .eq('id', userId)
          .maybeSingle()

        const current = (profile as any)?.language || null
        if (current === lang) return

        await supabase.from('profiles').update({ language: lang }).eq('id', userId)
      } catch (e) {
        console.warn('SyncLanguageToProfile failed:', e)
      }
    }

    run()
  }, [])

  return null
}
