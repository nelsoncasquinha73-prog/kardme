'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import AppChrome from '@/components/layout/AppChrome'
import { FiHome, FiLayout, FiMail, FiCalendar, FiShoppingCart, FiUsers, FiZap, FiSettings, FiBarChart2, FiCreditCard, FiUser, FiBook, FiStar, FiClipboard, FiGift, FiTrendingUp, FiTag } from 'react-icons/fi'
import { LanguageProvider } from '@/components/language/LanguageProvider'
import { ToastProvider } from '@/lib/toast-context'
import { ToastContainer } from '@/components/Toast'
import SyncLanguageToProfile from '@/components/SyncLanguageToProfile'
import SessionWatcher from '@/components/SessionWatcher'

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
    // Listener de sessão expirada
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (event === 'SIGNED_OUT') {
          router.push('/login')
        }
      }
      if (event === 'USER_UPDATED') return
      // Sessão expirada — mostrar aviso
      if (event === 'SIGNED_OUT') {
        alert('A tua sessão expirou. Por favor faz login novamente.')
      }
    })
    return () => authListener.subscription.unsubscribe()
  }, [])

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
        const hasActivePlan = (sub?.plan === 'pro_monthly' || sub?.plan === 'pro_yearly') && sub?.status === 'active'

        const { data: addon } = await supabase
          .from('user_addons')
          .select('crm_pro_active, crm_pro_expires_at')
          .eq('user_id', user.id)
          .maybeSingle()
        const hasManualAccess = addon?.crm_pro_active === true &&
          (!addon?.crm_pro_expires_at || new Date(addon.crm_pro_expires_at) > new Date())

        isPro = hasActivePlan || hasManualAccess
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

  // MENU DO ADMIN (fixo, sem mudanças)
  const adminNavItems = useMemo(() => [
    { label: 'Dashboard', href: '/dashboard', icon: FiHome },
    { label: 'Os Meus Cartões', href: '/dashboard/my-cards', icon: FiLayout },
    { label: 'CRM Pro', href: '/dashboard/crm', icon: FiMail },
    { label: 'Lead Magnets', href: '/dashboard/lead-magnets', icon: FiGift },
    { label: 'Email Marketing', href: '/dashboard/email-marketing', icon: FiZap },
    { label: 'Embaixadores', href: '/dashboard/embaixadores', icon: FiTrendingUp },
    { label: 'Analytics', href: '/dashboard/analytics', icon: FiBarChart2 },
    { label: 'Analytics Global', href: '/admin/analytics', icon: FiBarChart2 },
    { label: 'Clientes', href: '/admin/clientes', icon: FiUsers },
    { label: 'Gerir Templates', href: '/admin/templates', icon: FiLayout },
    { label: 'Loja de Templates', href: '/admin/catalog', icon: FiShoppingCart },
    { label: 'Cupões', href: '/admin/coupons', icon: FiTag },
    { label: 'Configurações', href: '/admin/settings', icon: FiSettings },
  ], [])

  // MENU DO CLIENTE (original)
  const clientNavItems = useMemo(() => [
    { label: 'nav.dashboard', href: '/dashboard', icon: FiHome },
    { label: 'nav.analytics', href: '/dashboard/analytics', icon: FiBarChart2 },
    { label: 'CRM Mini', href: '/dashboard/leads', icon: FiClipboard },
    { label: 'CRM Pro', href: '/dashboard/crm', icon: FiStar, locked: !state.isPro },
    { label: 'Lead Magnets', href: '/dashboard/lead-magnets', icon: FiGift, locked: !state.isPro },
    { label: 'Email Marketing', href: '/dashboard/email-marketing', icon: FiZap, locked: !state.isPro },
    { label: 'Embaixadores', href: '/dashboard/embaixadores', icon: FiUsers, locked: !state.isPro },
    { label: 'Biblioteca', href: '/dashboard/biblioteca', icon: FiBook },
    { label: 'nav.template_store', href: '/dashboard/catalog', icon: FiShoppingCart },
    { label: 'NFC', href: '/dashboard/nfc', icon: FiZap },
    { label: 'nav.plans', href: '/dashboard/plans', icon: FiCreditCard },
    { label: 'nav.billing', href: '/dashboard/settings/billing', icon: FiCreditCard },
    { label: 'nav.profile', href: '/dashboard/perfil', icon: FiUser },
  ], [state.isPro])

  // ESCOLHER MENU
  const navItems = useMemo(() => state.isAdmin ? adminNavItems : clientNavItems, [state.isAdmin, adminNavItems, clientNavItems])

  const titleByPrefix: Array<{ prefix: string; title: string }> = [
    { prefix: '/dashboard', title: 'Dashboard' },
    { prefix: '/dashboard/my-cards', title: 'Os Meus Cartões' },
    { prefix: '/dashboard/crm', title: 'CRM Pro' },
    { prefix: '/dashboard/lead-magnets', title: 'Lead Magnets' },
    { prefix: '/dashboard/email-marketing', title: 'Email Marketing' },
    { prefix: '/dashboard/embaixadores', title: 'Embaixadores' },
    { prefix: '/dashboard/analytics', title: 'Analytics' },
    { prefix: '/dashboard/leads', title: 'CRM Mini' },
    { prefix: '/dashboard/biblioteca', title: 'Biblioteca' },
    { prefix: '/dashboard/catalog', title: 'Loja de Templates' },
    { prefix: '/dashboard/nfc', title: 'NFC' },
    { prefix: '/dashboard/settings', title: 'Definições' },
    { prefix: '/dashboard/plans', title: 'Planos' },
    { prefix: '/dashboard/perfil', title: 'Perfil' },
    { prefix: '/admin/clientes', title: 'Clientes' },
    { prefix: '/admin/templates', title: 'Gerir Templates' },
    { prefix: '/admin/analytics', title: 'Analytics Global' },
    { prefix: '/admin/catalog', title: 'Loja de Templates' },
    { prefix: '/admin/coupons', title: 'Cupões' },
    { prefix: '/admin/settings', title: 'Configurações' },
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
        <SessionWatcher />
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
