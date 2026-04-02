import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export function useAuth() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const boot = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        if (!sessionData.session) {
          router.push('/login')
          return
        }

        setUser(sessionData.session.user)
        setLoading(false)
      } catch (err) {
        console.error('Erro ao carregar user:', err)
        setError('Erro ao autenticar')
        setLoading(false)
      }
    }

    boot()
  }, [router])

  return { loading, user, error }
}
