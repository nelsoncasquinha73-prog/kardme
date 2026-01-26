'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import '@/styles/editor-ui.css'
import '@/styles/dashboard-sidebar.css'
import '@/styles/dashboard-modal.css'
import { ColorPickerProvider } from '@/components/editor/ColorPickerContext'
import { FiLayout, FiShoppingCart, FiUsers, FiSettings, FiLogOut } from 'react-icons/fi'
import { FiBarChart2 } from 'react-icons/fi'

type Role = 'admin' | 'user' | string

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [role, setRole] = useState<Role | null>(null)

  useEffect(() => {
    const boot = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        router.push('/login')
        return
      }

      const user = sessionData.session.user
      setUserEmail(user.email ?? null)

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const resolvedRole = !error && profile?.role ? profile.role : 'user'
      setRole(resolvedRole)
      sessionStorage.setItem('userRole', resolvedRole)

      setLoading(false)
    }

    boot()
  }, [router])

  const isAdmin = role === 'admin'

  const logout = async () => {
    await supabase.auth.signOut()
    sessionStorage.removeItem('userRole')
    router.push('/login')
  }

  const navItems = useMemo(() => {
    return [
      { label: 'Clientes', href: '/admin/clientes', icon: FiUsers },
      { label: 'Gerir Templates', href: '/admin/templates', icon: FiLayout },
      { label: '🛍️ Loja de Templates', href: '/dashboard/catalog', icon: FiShoppingCart },
      { label: '📊 Analytics', href: '/admin/analytics', icon: FiBarChart2 },
      { label: 'Configurações', href: '/admin/settings', icon: FiSettings },
    ]
  }, [])

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const titleByPrefix: Array<{ prefix: string; title: string }> = [
    { prefix: '/admin/clientes', title: 'Clientes' },
    { prefix: '/admin/templates', title: 'Gerir Templates' },
    { prefix: '/admin/analytics', title: '📊 Analytics Geral' },
    { prefix: '/admin/settings', title: 'Configurações' },
  ]

  const getPageTitle = () => {
    const match = titleByPrefix.find((x) => pathname === x.prefix || pathname.startsWith(x.prefix + '/'))
    return match?.title || 'Kardme'
  }

  if (loading || role === null) return <p style={{ padding: 40 }}>A verificar sessão…</p>

  if (!isAdmin) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>Sem permissões</h2>
        <p>Este painel só está disponível para admin.</p>
        <Link href="/dashboard">← Voltar</Link>
      </div>
    )
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
              <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>ADMIN</div>
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
