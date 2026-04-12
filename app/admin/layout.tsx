'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import AppChrome from '@/components/layout/AppChrome'
import {
  FiHome,
  FiLayout,
  FiShoppingCart,
  FiUsers,
  FiSettings,
  FiBarChart2,
  FiTag,
  FiMail,
  FiZap,
  FiGift,
  FiTrendingUp,
} from 'react-icons/fi'
import { LanguageProvider } from '@/components/language/LanguageProvider'
import { ToastProvider } from '@/lib/toast-context'
import { ToastContainer } from '@/components/Toast'
import SyncLanguageToProfile from '@/components/SyncLanguageToProfile'

function AdminLayoutContent({
  children,
  userEmail,
  isAdmin,
  navItems,
  getPageTitle,
}: any) {
  return (
    <AppChrome
      userEmail={userEmail}
      isAdmin={isAdmin}
      navItems={navItems}
      getPageTitle={getPageTitle}
    >
      {children}
    </AppChrome>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [state, setState] = useState<{
    loaded: boolean
    userEmail: string | null
    isAdmin: boolean
  }>({
    loaded: false,
    userEmail: null,
    isAdmin: false,
  })

  useEffect(() => {
    const boot = async () => {
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session) {
        router.push('/login')
        return
      }

      const user = sessionData.session.user
      const userEmail = user.email ?? null

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const userRole = !error && profile?.role ? profile.role : 'user'
      const isAdmin = userRole === 'admin'

      setState({
        loaded: true,
        userEmail,
        isAdmin,
      })
    }

    boot()
  }, [router])

  const navItems = useMemo(
    () => [
      { label: 'Dashboard', href: '/dashboard', icon: FiHome },
      { label: 'CRM Pro', href: '/dashboard/crm', icon: FiMail },
      { label: 'Lead Magnets', href: '/dashboard/lead-magnets', icon: FiGift },
      { label: 'Email Marketing', href: '/dashboard/email-marketing', icon: FiZap },
      { label: 'Embaixadores', href: '/dashboard/embaixadores', icon: FiTrendingUp },
      { label: 'Analytics', href: '/dashboard/analytics', icon: FiBarChart2 },
      { label: 'Clientes', href: '/admin/clientes', icon: FiUsers },
      { label: 'Gerir Templates', href: '/admin/templates', icon: FiLayout },
      { label: 'Analytics Global', href: '/admin/analytics', icon: FiBarChart2 },
      { label: 'Loja de Templates', href: '/admin/catalog', icon: FiShoppingCart },
      { label: 'Cupões', href: '/admin/coupons', icon: FiTag },
      { label: 'Configurações', href: '/admin/settings', icon: FiSettings },
    ],
    []
  )

  const titleByPrefix: Array<{ prefix: string; title: string }> = [
    { prefix: '/dashboard/crm', title: 'CRM Pro' },
    { prefix: '/dashboard/lead-magnets', title: 'Lead Magnets' },
    { prefix: '/dashboard/email-marketing', title: 'Email Marketing' },
    { prefix: '/dashboard/embaixadores', title: 'Embaixadores' },
    { prefix: '/dashboard/analytics', title: 'Analytics' },
    { prefix: '/dashboard', title: 'Dashboard' },
    { prefix: '/admin/clientes', title: 'Clientes' },
    { prefix: '/admin/templates', title: 'Gerir Templates' },
    { prefix: '/admin/analytics', title: 'Analytics Global' },
    { prefix: '/admin/catalog', title: 'Loja de Templates' },
    { prefix: '/admin/coupons', title: 'Cupões' },
    { prefix: '/admin/settings', title: 'Configurações' },
  ]

  const getPageTitle = () => {
    if (pathname.match(/^\/admin\/templates\/[^/]+\/theme/)) return '✏️ Editor'
    const match = titleByPrefix.find((x) => pathname === x.prefix || pathname.startsWith(x.prefix + '/'))
    return match?.title || 'Kardme'
  }

  if (!state.loaded) {
    return (
      <LanguageProvider>
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p>A verificar sessão…</p>
        </div>
      </LanguageProvider>
    )
  }

  if (!state.isAdmin) {
    return (
      <LanguageProvider>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <h2>Sem permissões</h2>
          <p>Este painel só está disponível para admin.</p>
        </div>
      </LanguageProvider>
    )
  }

  return (
    <ToastProvider>
      <LanguageProvider>
        <SyncLanguageToProfile />
        <ToastContainer />
        <AdminLayoutContent
          userEmail={state.userEmail}
          isAdmin={state.isAdmin}
          navItems={navItems}
          getPageTitle={getPageTitle}
        >
          {children}
        </AdminLayoutContent>
      </LanguageProvider>
    </ToastProvider>
  )
}
