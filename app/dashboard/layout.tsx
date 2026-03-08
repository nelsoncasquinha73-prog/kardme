'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import AppChrome from '@/components/layout/AppChrome'
import { FiHome, FiLayout, FiMail, FiCalendar, FiShoppingCart, FiUsers, FiZap, FiHardDrive, FiSettings, FiBarChart2, FiCreditCard, FiUser } from 'react-icons/fi'
import { LanguageProvider } from '@/components/language/LanguageProvider'
import SyncLanguageToProfile from '@/components/SyncLanguageToProfile'

type Role = 'admin' | 'user' | string

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
        setIsAdmin(storedRole === 'admin')
        setLoading(false)
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Erro a buscar role:', error)
        sessionStorage.setItem('role', 'user')
        setIsAdmin(false)
      } else {
        const userRole = profile?.role || 'user'
        sessionStorage.setItem('role', userRole)
        setIsAdmin(userRole === 'admin')
      }

      setLoading(false)
    }

    boot()
  }, [router])



  const navItems = isAdmin
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

  if (loading) return <p style={{ padding: 40 }}>A verificar sessão…</p>

  if (!isAdmin && pathname.startsWith('/admin')) {
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
    <LanguageProvider>
    <SyncLanguageToProfile />
    <AppChrome userEmail={userEmail} isAdmin={isAdmin} navItems={navItems} getPageTitle={getPageTitle}>
      {children}
    </AppChrome>
    </LanguageProvider>
  )
}
