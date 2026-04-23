'use client'

import { useEffect, useState } from 'react'
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

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: FiHome },
  { label: 'CRM Pro', href: '/dashboard/crm', icon: FiMail },
  { label: 'Lead Magnets', href: '/dashboard/lead-magnets', icon: FiGift },
  { label: 'Email Marketing', href: '/dashboard/email-marketing', icon: FiZap },
  { label: 'Embaixadores', href: '/dashboard/embaixadores', icon: FiTrendingUp },
  { label: 'Analytics', href: '/dashboard/analytics', icon: FiBarChart2 },
  { label: 'Analytics Global', href: '/admin/analytics', icon: FiBarChart2 },
  { label: 'Clientes', href: '/admin/clientes', icon: FiUsers },
  { label: 'Pedidos de Cartão', href: '/admin/card-orders', icon: FiShoppingCart },
  { label: 'Gerir Templates', href: '/admin/templates', icon: FiLayout },
  { label: 'Loja de Templates', href: '/admin/template-shop', icon: FiTag },
  { label: 'Cupões', href: '/admin/coupons', icon: FiGift },
  { label: 'Configurações', href: '/admin/settings', icon: FiSettings },
]

const getPageTitle = (pathname: string | null) => {
  if (!pathname) return 'Admin'
  const path = pathname.split('/').filter(Boolean)
  if (path[0] === 'admin') {
    if (path[1] === 'card-orders') return 'Pedidos de Cartão'
    if (path[1] === 'templates') return 'Gerir Templates'
    if (path[1] === 'template-shop') return 'Loja de Templates'
    if (path[1] === 'coupons') return 'Cupões'
    if (path[1] === 'settings') return 'Configurações'
    if (path[1] === 'analytics') return 'Analytics Global'
    if (path[1] === 'clientes') return 'Clientes'
  }
  return 'Admin'
}

function AdminLayoutContent({
  children,
  userEmail,
  isAdmin,
  pathname,
}: any) {
  return (
    <AppChrome
      userEmail={userEmail}
      isAdmin={isAdmin}
      navItems={NAV_ITEMS}
      getPageTitle={getPageTitle}
      pathname={pathname}
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
    // Se já carregou, não faz nada (evita re-fetch durante navegação)
    if (state.loaded) return

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
  }, [state.loaded, router])

  if (!state.loaded) {
    return (
      <LanguageProvider>
        <ToastProvider>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <p>A carregar...</p>
          </div>
        </ToastProvider>
      </LanguageProvider>
    )
  }

  return (
    <LanguageProvider>
      <ToastProvider>
        <AdminLayoutContent
          userEmail={state.userEmail}
          isAdmin={state.isAdmin}
          pathname={pathname}
        >
          {children}
        </AdminLayoutContent>
        <ToastContainer />
        <SyncLanguageToProfile />
      </ToastProvider>
    </LanguageProvider>
  )
}
