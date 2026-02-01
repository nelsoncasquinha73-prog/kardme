'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import AppChrome from '@/components/layout/AppChrome'
import { FiLayout, FiShoppingCart, FiUsers, FiSettings, FiBarChart2 } from 'react-icons/fi'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const boot = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        router.push('/login')
        return
      }

      const user = sessionData.session.user
      setUserEmail(user.email ?? null)

      const storedRole = sessionStorage.getItem('role')
      if (storedRole) {
        if (storedRole !== 'admin' && !pathname.startsWith('/admin/catalog')) {
          router.push('/dashboard')
        }
        setLoading(false)
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if ((error || profile?.role !== 'admin') && !pathname.startsWith('/admin/catalog')) {
        router.push('/dashboard')
        return
      }

      sessionStorage.setItem('role', 'admin')
      setLoading(false)
    }

    boot()
  }, [router])

  const navItems = [
    { label: 'Clientes', href: '/admin/clientes', icon: FiUsers },
    { label: 'Gerir Templates', href: '/admin/templates', icon: FiLayout },
    { label: '🛍️ Loja de Templates', href: '/admin/catalog', icon: FiShoppingCart },
    { label: '📊 Analytics', href: '/admin/analytics', icon: FiBarChart2 },
    { label: 'Configurações', href: '/admin/settings', icon: FiSettings },
  ]

  const titleByPrefix: Array<{ prefix: string; title: string }> = [
    { prefix: '/admin/clientes', title: 'Clientes' },
    { prefix: '/admin/templates', title: 'Gerir Templates' },
    { prefix: '/admin/analytics', title: '📊 Analytics Geral' },
    { prefix: '/admin/catalog', title: '🛍️ Loja de Templates' },
    { prefix: '/admin/settings', title: 'Configurações' },
  ]

  const getPageTitle = () => {
    if (pathname.match(/^\/admin\/templates\/[^/]+\/theme/)) return '✏️ Editor'
    const match = titleByPrefix.find((x) => pathname === x.prefix || pathname.startsWith(x.prefix + '/'))
    return match?.title || 'Kardme'
  }

  if (loading) return <p style={{ padding: 40 }}>A verificar sessão…</p>

  return (
    <AppChrome userEmail={userEmail} isAdmin={true} navItems={navItems} getPageTitle={getPageTitle}>
      {children}
    </AppChrome>
  )
}
