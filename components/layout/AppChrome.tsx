'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import '@/styles/editor-ui.css'
import '@/styles/dashboard-sidebar.css'
import '@/styles/dashboard-modal.css'
import { ColorPickerProvider } from '@/components/editor/ColorPickerContext'
import { FiLogOut, FiLock, FiX } from 'react-icons/fi'
import { useLanguage } from '@/components/language/LanguageProvider'
import LanguageDropdown from '@/components/language/LanguageDropdown'

type NavItem = { label: string; href: string; icon: any; emoji?: string; locked?: boolean }

function UpgradeModal({ itemLabel, onClose, onViewPlans }: { itemLabel: string; onClose: () => void; onViewPlans: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: 20, padding: '40px 32px', maxWidth: 380, width: '90%',
        textAlign: 'center', position: 'relative',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(255,255,255,0.08)', border: 'none',
          borderRadius: 8, padding: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><FiX size={16} /></button>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: 28,
          boxShadow: '0 8px 24px rgba(245,158,11,0.4)',
        }}>🔒</div>
        <h2 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700, marginBottom: 12 }}>
          Funcionalidade Premium
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 28 }}>
          Adere ao <strong style={{ color: '#f59e0b' }}>CRM Pro</strong> para teres acesso a <strong style={{ color: '#fff' }}>{itemLabel}</strong> e muito mais.
        </p>
        <button onClick={onViewPlans} style={{
          width: '100%', padding: '14px 24px',
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          border: 'none', borderRadius: 12, color: '#000',
          fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
          marginBottom: 10,
          boxShadow: '0 4px 16px rgba(245,158,11,0.4)',
        }}>
          ✨ Ver Planos
        </button>
        <button onClick={onClose} style={{
          width: '100%', padding: '12px 24px',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, color: 'rgba(255,255,255,0.6)',
          fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer',
        }}>
          Fechar
        </button>
      </div>
    </div>
  )
}

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
  const { t } = useLanguage()
  const [lockedModal, setLockedModal] = useState<string | null>(null)

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname === href || pathname.startsWith(href + "/")
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const items = useMemo(() => {
    return navItems.filter(item => {
      // Items de admin só aparecem se isAdmin === true
      const adminOnlyItems = ['/admin/card-orders', '/admin/templates', '/admin/template-shop', '/admin/coupons', '/admin/settings', '/admin/analytics', '/admin/clientes']
      if (adminOnlyItems.includes(item.href)) {
        return isAdmin
      }
      return true
    })
  }, [navItems, isAdmin])

  const getLabel = (item: NavItem) => {
    const translated = t(item.label)
    const text = translated === item.label ? item.label : translated
    return item.emoji ? `${item.emoji} ${text}` : text
  }

  return (
    <ColorPickerProvider>
      {lockedModal && (
        <UpgradeModal
          itemLabel={lockedModal}
          onClose={() => setLockedModal(null)}
          onViewPlans={() => { router.push('/dashboard/plans'); setLockedModal(null) }}
        />
      )}
      <div className="editor-ui dashboard-scope" style={{ display: 'flex', minHeight: '100vh' }}>
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <h2 className="sidebar-logo">Kardme</h2>
            <p className="sidebar-tagline">{t('common.tagline')}</p>
          </div>

          <nav className="sidebar-nav">
            <ul className="sidebar-menu">
              {items.map((item) => {
                const Icon = item.icon
                const label = getLabel(item)

                if (item.locked) {
                  return (
                    <li key={item.href}>
                      <button
                        onClick={() => setLockedModal(label)}
                        className="sidebar-link"
                        style={{
                          width: '100%', textAlign: 'left', background: 'none', border: 'none',
                          opacity: 0.45, cursor: 'pointer', display: 'flex', alignItems: 'center',
                          padding: 0, font: 'inherit', color: 'inherit',
                        }}
                      >
                        <Icon className="sidebar-icon" />
                        <span style={{ flex: 1 }}>{label}</span>
                        <FiLock size={12} style={{ opacity: 0.7, marginLeft: 4 }} />
                      </button>
                    </li>
                  )
                }

                return (
                  <li key={item.href}>
                    <Link href={item.href} className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}>
                      <Icon className="sidebar-icon" />
                      <span>{label}</span>
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
              <div style={{ marginBottom: 4 }}>{t('common.logged_as')}</div>
              <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{userEmail}</strong>
              {isAdmin && (
                <div style={{ marginTop: 6, color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>ADMIN</div>
              )}
            </div>
            <button className="sidebar-logout" onClick={logout}>
              <FiLogOut className="sidebar-icon" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        </aside>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <header className="dashboard-topbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <strong>{getPageTitle()}</strong>
            <LanguageDropdown />
          </header>

          <main style={{ padding: 24, flex: 1, overflow: 'auto' }}>{children}</main>
        </div>
      </div>
    </ColorPickerProvider>
  )
}
