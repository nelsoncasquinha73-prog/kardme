'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/lib/toast-context'

export default function SessionWatcher() {
  const router = useRouter()
  const { addToast } = useToast()

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        addToast('A tua sessão expirou. Por favor faz login novamente.', 'error')
        setTimeout(() => router.push('/login'), 2000)
      }
      if (event === 'TOKEN_REFRESHED') {
        // Token renovado silenciosamente — tudo bem
      }
    })
    return () => authListener.subscription.unsubscribe()
  }, [])

  return null
}
