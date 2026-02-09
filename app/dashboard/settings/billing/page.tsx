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

    try {
      const res = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to open billing portal')
      }

      const { url } = await res.json()
      window.location.href = url
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>Faturação</h1>

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          Gerencie sua subscrição, método de pagamento, faturas e histórico de pagamentos.
        </p>

        <button
          onClick={handleManageBilling}
          disabled={loading || !userId}
          style={{
            background: '#2563eb',
            color: 'white',
            padding: '8px 24px',
            borderRadius: '4px',
            border: 'none',
            cursor: loading || !userId ? 'not-allowed' : 'pointer',
            opacity: loading || !userId ? 0.5 : 1,
          }}
        >
          {loading ? 'Abrindo...' : 'Gerir Faturação'}
        </button>

        {error && <p style={{ color: '#dc2626', marginTop: '16px' }}>{error}</p>}
      </div>
    </div>
  )
}
