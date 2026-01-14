'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import '@/styles/editor-ui.css'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
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

  return (
    <div className="editor-ui" style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 260, background: '#0b0b0f', color: '#fff', padding: 24 }}>
        <h2 style={{ marginBottom: 30 }}>Kardme</h2>

        <nav>
          <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2.2em' }}>
            <li><Link href="/dashboard">Dashboard</Link></li>
            <li><Link href="/dashboard/cards">Cartões digitais</Link></li>
            <li><Link href="/dashboard/leads">Leads</Link></li>
            <li><Link href="/dashboard/bookings">Marcações</Link></li>
            <li><Link href="/dashboard/orders">Pedidos</Link></li>
            <li><Link href="/dashboard/affiliate">Afiliação</Link></li>
            <li><Link href="/dashboard/nfc">Cartões NFC</Link></li>
            <li><Link href="/dashboard/storage">Armazenamento</Link></li>
            <li><Link href="/dashboard/settings">Configurações</Link></li>
          </ul>
        </nav>
      </aside>

      <div style={{ flex: 1, background: '#f7f7f9' }}>
        <strong>Dashboard (v2)</strong>

        <header
          style={{
            padding: '16px 24px',
            background: '#fff',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <strong>Dashboard</strong>
          <button className="btn" onClick={logout}>Logout</button>
        </header>

        <main style={{ padding: 24 }}>{children}</main>
      </div>
    </div>
  )
}
