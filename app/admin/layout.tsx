'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import AppChrome from '@/components/layout/AppChrome'
import { FiLayout, FiShoppingCart, FiUsers, FiSettings, FiBarChart2, FiTag, FiMail, FiZap, FiGift, FiTrendingUp } from 'react-icons/fi'
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

  // NÚCLEO OPERACIONAL (igual para admin e cliente)
  const coreNavItems = [
    { label: 'CRM Pro', href: '/dashboard/crm', icon: FiMail },
    { label: 'Lead Magnets', href: '/dashboard/lead-magnets', icon: FiGift },
    { label: 'Email Marketing', href: '/dashboard/email-marketing', icon: FiZap },
    { label: 'Embaixadores', href: '/dashboard/ambassadors', icon: FiTrendingUp },
  ]

  // EXTRAS DO ADMIN (só aparecem para admin)
  const adminOnlyItems = isAdmin ? [
    { label: 'Clientes', href: '/admin/clientes', icon: FiUsers },
    { label: 'Gerir Templates', href: '/admin/templates', icon: FiLayout },
    { label: 'Loja de Templates', href: '/admin/catalog', icon: FiShoppingCart },
    { label: 'Analytics', href: '/admin/analytics', icon: FiBarChart2 },
    { label: 'Cupões', href: '/admin/coupons', icon: FiTag },
    { label: 'Configurações', href: '/admin/settings', icon: FiSettings },
  ] : []

  // COMBINAR: núcleo + admin extras
  const navItems = isAdmin ? [...coreNavItems, ...adminOnlyItems] : [
    { label: 'Loja de Templates', href: '/admin/catalog', icon: FiShoppingCart },
  ]

  const titleByPrefix: Array<{ prefix: string; title: string }> = [
    { prefix: '/dashboard/crm', title: 'CRM Pro' },
    { prefix: '/dashboard/lead-magnets', title: 'Lead Magnets' },
    { prefix: '/dashboard/email-marketing', title: 'Email Marketing' },
    { prefix: '/dashboard/ambassadors', title: 'Embaixadores' },
    { prefix: '/admin/clientes', title: 'Clientes' },
    { prefix: '/admin/templates', title: 'Gerir Templates' },
    { prefix: '/admin/analytics', title: 'Analytics' },
    { prefix: '/admin/catalog', title: 'Loja de Templates' },
    { prefix: '/admin/coupons', title: 'Cupões' },
    { prefix: '/admin/settings', title: 'Configurações' },
  ]

  const getPageTitle = () => {
    if (pathname.match(/^\/admin\/templates\/[^/]+\/theme/)) return 'Editor'
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
