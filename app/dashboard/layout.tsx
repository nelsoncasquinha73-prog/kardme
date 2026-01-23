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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
      else setLoading(false)
    })
  }, [router])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <p style={{ padding: 40 }}>A verificar sessão…</p>

  const navItems = [
    { label: 'Os meus cartões', href: '/dashboard', icon: FiHome },
    { label: 'Catálogo de Templates', href: '/dashboard/catalog', icon: FiLayout },
    { label: 'Contactos', href: '/dashboard/leads', icon: FiMail },
    { label: 'Reuniões', href: '/dashboard/bookings', icon: FiCalendar },
    { label: 'Encomendas', href: '/dashboard/orders', icon: FiShoppingCart },
    { label: 'Afiliados', href: '/dashboard/affiliate', icon: FiUsers },
    { label: 'NFC', href: '/dashboard/nfc', icon: FiZap },
    { label: 'Ficheiros', href: '/dashboard/storage', icon: FiHardDrive },
    { label: 'Definições', href: '/dashboard/settings', icon: FiSettings },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  // Título dinâmico da topbar
  const getPageTitle = () => {
    const item = navItems.find((i) => isActive(i.href))
    return item?.label || 'Dashboard'
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
