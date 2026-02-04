'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import AppChrome from '@/components/layout/AppChrome'
import { FiLayout, FiShoppingCart, FiUsers, FiSettings, FiBarChart2, FiTag } from 'react-icons/fi'
import { LanguageProvider } from '@/components/language/LanguageProvider'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

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
        if (storedRole === 'admin') setIsAdmin(true)
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

      if (profile?.role === 'admin') {
        sessionStorage.setItem('role', 'admin')
        setIsAdmin(true)
      }
      setLoading(false)
    }

    boot()
  }, [router, pathname])

  const navItems = isAdmin ? [
    { label: 'nav.clients', href: '/admin/clientes', icon: FiUsers },
    { label: 'nav.manage_templates', href: '/admin/templates', icon: FiLayout },
    { label: 'nav.template_store', href: '/admin/catalog', icon: FiShoppingCart, emoji: '🛍️' },
    { label: 'nav.analytics', href: '/admin/analytics', icon: FiBarChart2, emoji: '📊' },
    { label: 'nav.coupons', href: '/admin/coupons', icon: FiTag, emoji: '🎟️' },
    { label: 'nav.settings', href: '/admin/settings', icon: FiSettings },
  ] : [
    { label: 'nav.template_store', href: '/admin/catalog', icon: FiShoppingCart, emoji: '🛍️' },
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
    <LanguageProvider>
      <AppChrome userEmail={userEmail} isAdmin={isAdmin} navItems={navItems} getPageTitle={getPageTitle}>
        {children}
      </AppChrome>
    </LanguageProvider>
  )
}
