'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import '@/styles/editor-ui.css'
import '@/styles/dashboard-sidebar.css'
import '@/styles/dashboard-modal.css'
import { ColorPickerProvider } from '@/components/editor/ColorPickerContext'
import {
  FiHome,
  FiLayout,
  FiMail,
  FiCalendar,
  FiShoppingCart,
  FiUsers,
  FiZap,
  FiHardDrive,
  FiSettings,
  FiLogOut,
} from 'react-icons/fi'
import { FiBarChart2 } from 'react-icons/fi'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
      else setLoading(false)
    })
  }, [router])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data?.user?.email || null)
    })
  }, [])

  const isAdmin = userEmail === 'nelson@kardme.com' || userEmail === 'admin@kardme.com'

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <p style={{ padding: 40 }}>A verificar sessão…</p>

  const navItems = [
    { label: 'Os meus cartões', href: '/dashboard', icon: FiHome },
    { label: '🛍️ Loja de Templates', href: '/dashboard/catalog', icon: FiShoppingCart },
    { label: 'Analytics', href: '/dashboard/analytics', icon: FiBarChart2 },
    ...(isAdmin ? [{ label: 'Gerir Templates', href: '/admin/templates', icon: FiLayout }] : []),
    { label: 'Contactos', href: '/dashboard/leads', icon: FiMail },
    { label: 'Reuniões', href: '/dashboard/bookings', icon: FiCalendar },
    { label: 'Encomendas', href: '/dashboard/orders', icon: FiShoppingCart },
    { label: 'Afiliados', href: '/dashboard/affiliate', icon: FiUsers },
    { label: 'NFC', href: '/dashboard/nfc', icon: FiZap },
    { label: 'Ficheiros', href: '/dashboard/storage', icon: FiHardDrive },
    { label: 'Definições', href: '/dashboard/settings', icon: FiSettings },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const titleByPrefix: Array<{ prefix: string; title: string }> = [
    { prefix: '/admin/templates', title: 'Gerir Templates' },
    { prefix: '/dashboard/leads', title: 'Contactos' },
    { prefix: '/dashboard/bookings', title: 'Reuniões' },
    { prefix: '/dashboard/orders', title: 'Encomendas' },
    { prefix: '/dashboard/affiliate', title: 'Afiliados' },
    { prefix: '/dashboard/nfc', title: 'NFC' },
    { prefix: '/dashboard/storage', title: 'Ficheiros' },
    { prefix: '/dashboard/settings', title: 'Definições' },
    { prefix: '/dashboard/catalog', title: '🛍️ Loja de Templates' },
    { prefix: '/dashboard', title: 'Os meus cartões' },
    { prefix: '/dashboard/analytics', title: 'Analytics' },
  ]

  const getPageTitle = () => {
    // Se estás no editor, mostra "Editor"
    // (o título vai ser atualizado no cliente se houver ?template_id=...)
    if (pathname.match(/^\/dashboard\/cards\/[^/]+\/theme/)) {
      return '✏️ Editor'
    }

    const match = titleByPrefix.find(
      (x) => pathname === x.prefix || pathname.startsWith(x.prefix + '/')
    )
    return match?.title || 'Kardme'
  }

  return (
    <ColorPickerProvider>
      <div className="editor-ui dashboard-scope" style={{ display: 'flex', minHeight: '100vh' }}>
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <h2 className="sidebar-logo">Kardme</h2>
            <p className="sidebar-tagline">Cartões digitais premium</p>
          </div>

          <nav className="sidebar-nav">
            <ul className="sidebar-menu">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link href={item.href} className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}>
                      <Icon className="sidebar-icon" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="sidebar-footer">
            <div
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.55)',
                marginBottom: 12,
                paddingBottom: 12,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                wordBreak: 'break-all',
              }}
            >
              <div style={{ marginBottom: 4 }}>Logado como:</div>
              <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{userEmail}</strong>
            </div>
            <button className="sidebar-logout" onClick={logout}>
              <FiLogOut className="sidebar-icon" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <div style={{ flex: 1 }}>
          <header className="dashboard-topbar">
            <strong>{getPageTitle()}</strong>
          </header>

          <main style={{ padding: 24 }}>{children}</main>
        </div>
      </div>
    </ColorPickerProvider>
  )
}
