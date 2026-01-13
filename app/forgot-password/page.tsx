'use client'

import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setOk(null)
    setErr(null)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) throw new Error(data?.error || 'Erro ao enviar email')

      setOk('Email enviado. Verifica a tua caixa de entrada.')
    } catch (e: any) {
      setErr(e?.message || 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 16 }}>
      <h1>Recuperar password</h1>

      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
        <input
          type="email"
          placeholder="o-teu-email@exemplo.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ padding: 12, borderRadius: 10, border: '1px solid #ddd' }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            borderRadius: 10,
            border: 'none',
            background: '#111',
            color: '#fff',
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'A enviar...' : 'Enviar email'}
        </button>

        {ok && <p style={{ color: 'green' }}>{ok}</p>}
        {err && <p style={{ color: 'crimson' }}>{err}</p>}
      </form>
    </div>
  )
}
