'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Billing = 'monthly' | 'yearly'

export default function UpgradeProCTA({
  defaultBilling = 'monthly',
  compact = false,
}: {
  defaultBilling?: Billing
  compact?: boolean
}) {
  const [billing, setBilling] = useState<Billing>(defaultBilling)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCheckout = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser()
      if (authErr || !authData?.user?.id) {
        setError('Sem sessão. Faz login novamente.')
        setLoading(false)
        return
      }

      const res = await fetch('/api/stripe/checkout-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: authData.user.id, billing }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Erro ao iniciar checkout.')
        setLoading(false)
        return
      }

      if (data?.url) window.location.href = data.url
      else setError('Checkout sem URL.')
    } catch {
      setError('Erro ao iniciar checkout.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 16,
        padding: compact ? 12 : 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 900, color: 'rgba(255,255,255,0.92)' }}>Upgrade para Pro</div>
          {!compact && (
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)', marginTop: 4 }}>
              Desbloqueia 30–40 cartões, templates e analytics.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={billing}
            onChange={(e) => setBilling(e.target.value as Billing)}
            style={{
              height: 38,
              padding: '0 10px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.92)',
              fontSize: 13,
              cursor: 'pointer',
            }}
            disabled={loading}
          >
            <option value="monthly">€6,99 / mês</option>
            <option value="yearly">€69 / ano</option>
          </select>

          <button
            onClick={startCheckout}
            disabled={loading}
            style={{
              height: 38,
              padding: '0 14px',
              borderRadius: 12,
              border: 'none',
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 900,
              fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'A abrir…' : 'Fazer upgrade'}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: 10,
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.30)',
            borderRadius: 12,
            padding: '10px 12px',
            color: 'rgba(252,165,165,0.95)',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
