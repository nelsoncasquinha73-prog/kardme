'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import '@/styles/editor-ui.css'
import '@/styles/dashboard-sidebar.css'
import { ColorPickerProvider } from '@/components/editor/ColorPickerContext'

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
    { label: 'Os meus cartões', href: '/dashboard' },
    { label: 'Contactos', href: '/dashboard/leads' },
    { label: 'Reuniões', href: '/dashboard/bookings' },
    { label: 'Encomendas', href: '/dashboard/orders' },
    { label: 'Afiliados', href: '/dashboard/affiliate' },
    { label: 'NFC', href: '/dashboard/nfc' },
    { label: 'Ficheiros', href: '/dashboard/storage' },
    { label: 'Definições', href: '/dashboard/settings' },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

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
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}>
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
            <strong>Os meus cartões</strong>
          </header>

          <main style={{ padding: 24 }}>{children}</main>
        </div>
      </div>
    </ColorPickerProvider>
  )
}
