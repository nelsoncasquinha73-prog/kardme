'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import '@/styles/editor-ui.css'
import '@/styles/dashboard-sidebar.css'
import '@/styles/dashboard-modal.css'
import { ColorPickerProvider } from '@/components/editor/ColorPickerContext'
import { FiLogOut } from 'react-icons/fi'
import LanguageDropdown from '@/components/language/LanguageDropdown'

type NavItem = { label: string; href: string; icon: any }

export default function AppChrome({
  children,
  userEmail,
  isAdmin,
  navItems,
  getPageTitle,
}: {
  children: React.ReactNode
  userEmail: string | null
  isAdmin: boolean
  navItems: NavItem[]
  getPageTitle: () => string
}) {
  const router = useRouter()
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname === href || pathname.startsWith(href + "/")
  }

  const logout = async () => {
    await supabase.auth.signOut()
    sessionStorage.removeItem('role')
    router.push('/login')
  }

  const items = useMemo(() => navItems, [navItems])

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
              {items.map((item) => {
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
              {isAdmin && (
                <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>ADMIN</div>
              )}
            </div>


            <div style={{ marginBottom: 12 }}>
              <LanguageDropdown />
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
