'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import '@/styles/editor-ui.css'
import '@/styles/dashboard-sidebar.css'

// ✅ IMPORTA O PROVIDER
import { ColorPickerProvider } from '@/components/editor/ColorPickerContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeRoute, setActiveRoute] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.push('/login')
      else setLoading(false)
    })

    // Track active route
    setActiveRoute(window.location.pathname)
  }, [router])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <p style={{ padding: 40 }}>A verificar sessão…</p>

  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Cartões digitais', href: '/dashboard/cards' },
    { label: 'Leads', href: '/dashboard/leads' },
    { label: 'Marcações', href: '/dashboard/bookings' },
    { label: 'Pedidos', href: '/dashboard/orders' },
    { label: 'Afiliação', href: '/dashboard/affiliate' },
    { label: 'Cartões NFC', href: '/dashboard/nfc' },
    { label: 'Armazenamento', href: '/dashboard/storage' },
    { label: 'Configurações', href: '/dashboard/settings' },
  ]

  return (
    <ColorPickerProvider>
      <div className="editor-ui dashboard-scope" style={{ display: 'flex', minHeight: '100vh' }}>
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <h2 className="sidebar-logo">Kardme</h2>
          </div>

          <nav className="sidebar-nav">
            <ul className="sidebar-menu">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`sidebar-link ${activeRoute === item.href ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sidebar-footer">
            <button className="sidebar-logout" onClick={logout}>
              Logout
            </button>
          </div>
        </aside>

        <div style={{ flex: 1 }}>
          <header className="dashboard-topbar">
            <strong>Dashboard</strong>
          </header>

          <main style={{ padding: 24 }}>{children}</main>
        </div>
      </div>
    </ColorPickerProvider>
  )
}
