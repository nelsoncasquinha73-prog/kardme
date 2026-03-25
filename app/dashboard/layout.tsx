'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import AppChrome from '@/components/layout/AppChrome'
import { FiHome, FiLayout, FiMail, FiCalendar, FiShoppingCart, FiUsers, FiZap, FiHardDrive, FiSettings, FiBarChart2, FiCreditCard, FiUser } from 'react-icons/fi'
import { LanguageProvider } from '@/components/language/LanguageProvider'
import { ToastProvider } from '@/lib/toast-context'
import { ToastContainer } from '@/components/Toast'
import SyncLanguageToProfile from '@/components/SyncLanguageToProfile'

type Role = 'admin' | 'user' | string

function DashboardLayoutContent({ children, userEmail, isAdmin, navItems, getPageTitle }: any) {
  return (
    <AppChrome userEmail={userEmail} isAdmin={isAdmin} navItems={navItems} getPageTitle={getPageTitle}>
      {children}
    </AppChrome>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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

      setState({
        loaded: true,
        userEmail,
        isAdmin: userRole === 'admin',
      })
    }

    boot()
  }, [router])

  const navItems = state.isAdmin
    ? [
        { label: 'nav.dashboard', href: '/dashboard', icon: FiHome, emoji: '🏠' },
        { label: 'nav.clients', href: '/admin/clientes', icon: FiUsers },
        { label: 'nav.manage_templates', href: '/admin/templates', icon: FiLayout },
        { label: 'nav.analytics', href: '/admin/analytics', icon: FiBarChart2, emoji: '📊' },
        { label: 'nav.template_store', href: '/dashboard/catalog', icon: FiShoppingCart, emoji: '🛍️' },
        { label: 'nav.settings', href: '/admin/settings', icon: FiSettings },
      ]
    : [
        { label: 'nav.dashboard', href: '/dashboard', icon: FiHome, emoji: '🏠' },
        { label: 'nav.template_store', href: '/dashboard/catalog', icon: FiShoppingCart, emoji: '🛍️' },
        { label: 'nav.plans', href: '/dashboard/plans', icon: FiHome },
        { label: 'nav.analytics', href: '/dashboard/analytics', icon: FiBarChart2 },
        { label: 'CRM Mini', href: '/dashboard/leads', icon: FiMail, emoji: '📋' },
        { label: 'CRM Pro', href: '/dashboard/crm', icon: FiMail, emoji: '💼' },
        { label: 'nav.meetings', href: '/dashboard/bookings', icon: FiCalendar },
        { label: 'nav.orders', href: '/dashboard/orders', icon: FiShoppingCart },
        { label: 'nav.affiliates', href: '/dashboard/affiliate', icon: FiUsers },
        { label: 'nav.nfc', href: '/dashboard/nfc', icon: FiZap },
        { label: 'nav.files', href: '/dashboard/storage', icon: FiHardDrive },
        { label: 'nav.profile', href: '/dashboard/perfil', icon: FiUser },
        { label: 'nav.settings', href: '/dashboard/settings', icon: FiSettings },
        { label: 'nav.billing', href: '/dashboard/settings/billing', icon: FiCreditCard },
      ]

  const titleByPrefix: Array<{ prefix: string; title: string }> = [
    { prefix: '/admin/clientes', title: 'Clientes' },
    { prefix: '/admin/templates', title: 'Gerir Templates' },
    { prefix: '/admin/analytics', title: '📊 Analytics Geral' },
    { prefix: '/admin/settings', title: 'Configurações' },
    { prefix: '/dashboard/leads', title: 'CRM Mini' },
    { prefix: '/dashboard/crm', title: 'CRM Pro' },
    { prefix: '/dashboard/bookings', title: 'Reuniões' },
    { prefix: '/dashboard/orders', title: 'Encomendas' },
    { prefix: '/dashboard/affiliate', title: 'Afiliados' },
    { prefix: '/dashboard/nfc', title: 'NFC' },
    { prefix: '/dashboard/storage', title: 'Ficheiros' },
    { prefix: '/dashboard/settings', title: 'Definições' },
    { prefix: '/dashboard/plans', title: 'Planos' },
    { prefix: '/dashboard/catalog', title: '🛍️ Loja de Templates' },
    { prefix: '/dashboard/analytics', title: 'Analytics' },
    { prefix: '/dashboard', title: 'Dashboard' },
  ]

  const getPageTitle = () => {
    if (pathname.match(/^\/dashboard\/cards\/[^/]+\/theme/)) return '✏️ Editor'
    const match = titleByPrefix.find((x) => pathname === x.prefix || pathname.startsWith(x.prefix + '/'))
    return match?.title || 'Kardme'
  }

  if (!state.loaded) {
    return (
      <LanguageProvider>
        <div style={{ padding: 40, textAlign: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>A verificar sessão…</p>
        </div>
      </LanguageProvider>
    )
  }

  if (!state.isAdmin && pathname.startsWith('/admin')) {
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
        <DashboardLayoutContent
        userEmail={state.userEmail}
        isAdmin={state.isAdmin}
        navItems={navItems}
        getPageTitle={getPageTitle}
      >
        {children}
      </DashboardLayoutContent>
      </LanguageProvider>
    </ToastProvider>
  )
}
