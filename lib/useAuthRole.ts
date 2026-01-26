import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Role = 'admin' | 'user' | string

export function useAuthRole() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [role, setRole] = useState<Role | null>(null)

  useEffect(() => {
    const boot = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        router.push('/login')
        return
      }

      const user = sessionData.session.user
      setUserEmail(user.email ?? null)

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Erro ao carregar role:', error)
        setRole('user')
      } else {
        setRole(profile?.role ?? 'user')
        sessionStorage.setItem('role', profile?.role ?? 'user')
      }

      setLoading(false)
    }

    boot()
  }, [router])

  return { loading, userEmail, role }
}
