'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import AppChrome from '@/components/layout/AppChrome'
import { FiHome, FiLayout, FiMail, FiCalendar, FiShoppingCart, FiUsers, FiZap, FiSettings, FiBarChart2, FiCreditCard, FiUser, FiBook, FiStar, FiClipboard } from 'react-icons/fi'
import { LanguageProvider } from '@/components/language/LanguageProvider'
import { ToastProvider } from '@/lib/toast-context'
import { ToastContainer } from '@/components/Toast'
import SyncLanguageToProfile from '@/components/SyncLanguageToProfile'

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
    isPro: boolean
  }>({
    loaded: false,
    userEmail: null,
    isAdmin: false,
    isPro: false,
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

      let isPro = false
      if (!isAdmin) {
        const { data: sub } = await supabase
          .from('user_subscriptions')
          .select('status, plan')
          .eq('user_id', user.id)
          .maybeSingle()
        isPro = (sub?.plan === 'pro_monthly' || sub?.plan === 'pro_yearly') && sub?.status === 'active'
      }

      setState({
        loaded: true,
        userEmail,
        isAdmin,
        isPro: isAdmin ? true : isPro,
      })
    }

    boot()
  }, [router])

  const navItems = state.isAdmin
    ? [
        { label: 'nav.dashboard', href: '/dashboard', icon: FiHome },
        { label: 'nav.clients', href: '/admin/clientes', icon: FiUsers },
        { label: 'nav.manage_templates', href: '/admin/templates', icon: FiLayout },
        { label: 'nav.analytics', href: '/admin/analytics', icon: FiBarChart2 },
        { label: 'nav.template_store', href: '/dashboard/catalog', icon: FiShoppingCart },
        { label: 'nav.settings', href: '/admin/settings', icon: FiSettings },
      ]
    : [
        { label: 'nav.dashboard', href: '/dashboard', icon: FiHome },
        { label: 'nav.analytics', href: '/dashboard/analytics', icon: FiBarChart2 },
        { label: 'CRM Mini', href: '/dashboard/leads', icon: FiClipboard },
        { label: 'CRM Pro', href: '/dashboard/crm', icon: FiStar, locked: !state.isPro },
        { label: 'Lead Magnets', href: '/dashboard/lead-magnets', icon: FiZap, locked: !state.isPro },
        { label: 'Email Marketing', href: '/dashboard/email-marketing', icon: FiMail, locked: !state.isPro },
        { label: 'Embaixadores', href: '/dashboard/embaixadores', icon: FiUsers, locked: !state.isPro },
        { label: 'Biblioteca', href: '/dashboard/biblioteca', icon: FiBook },
        { label: 'nav.template_store', href: '/dashboard/catalog', icon: FiShoppingCart },
        { label: 'NFC', href: '/dashboard/nfc', icon: FiZap },
        { label: 'nav.plans', href: '/dashboard/plans', icon: FiCreditCard },
        { label: 'nav.billing', href: '/dashboard/settings/billing', icon: FiCreditCard },
        { label: 'nav.profile', href: '/dashboard/perfil', icon: FiUser },
      ]

  const titleByPrefix: Array<{ prefix: string; title: string }> = [
    { prefix: '/admin/clientes', title: 'Clientes' },
    { prefix: '/admin/templates', title: 'Gerir Templates' },
    { prefix: '/admin/analytics', title: 'Analytics Geral' },
    { prefix: '/admin/settings', title: 'Configurações' },
    { prefix: '/dashboard/leads', title: 'CRM Mini' },
    { prefix: '/dashboard/crm', title: 'CRM Pro' },
    { prefix: '/dashboard/lead-magnets', title: 'Lead Magnets' },
    { prefix: '/dashboard/email-marketing', title: 'Email Marketing' },
    { prefix: '/dashboard/embaixadores', title: 'Embaixadores' },
    { prefix: '/dashboard/biblioteca', title: 'Biblioteca' },
    { prefix: '/dashboard/nfc', title: 'NFC' },
    { prefix: '/dashboard/settings', title: 'Definições' },
    { prefix: '/dashboard/plans', title: 'Planos' },
    { prefix: '/dashboard/catalog', title: 'Loja de Templates' },
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
