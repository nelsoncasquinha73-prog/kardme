'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function BillingPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [noCustomer, setNoCustomer] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUserId(data.user?.id || null)
    }
    getUser()
  }, [])

  const handleManageBilling = async () => {
    if (!userId) return

    setLoading(true)
    setError('')
    setNoCustomer(false)

    try {
      const res = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 404) {
          setNoCustomer(true)
          return
        }
        throw new Error(data.error || 'Erro ao abrir portal de faturação')
      }

      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>Faturação</h1>

      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '24px',
        }}
      >
        <p style={{ color: '#666', marginBottom: '16px' }}>
          Gerencie sua subscrição, método de pagamento, faturas e histórico de pagamentos.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleManageBilling}
            disabled={loading || !userId}
            style={{
              background: '#2563eb',
              color: 'white',
              padding: '10px 18px',
              borderRadius: '6px',
              border: 'none',
              cursor: loading || !userId ? 'not-allowed' : 'pointer',
              opacity: loading || !userId ? 0.5 : 1,
              fontWeight: 600,
            }}
          >
            {loading ? 'A abrir...' : 'Gerir Faturação'}
          </button>

          <a
            href="/dashboard/plans"
            style={{
              background: '#111827',
              color: 'white',
              padding: '10px 18px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Ver Planos
          </a>
        </div>

        {noCustomer && (
          <div style={{ marginTop: '16px', color: '#b45309' }}>
            Ainda não tens uma subscrição ativa. Para gerir faturação, primeiro ativa o Plano Pro.
          </div>
        )}

        {error && <p style={{ color: '#dc2626', marginTop: '16px' }}>{error}</p>}
      </div>
    </div>
  )
}
