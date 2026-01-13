'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    return createClient(url, anon)
  }, [])

  useEffect(() => {
    // garante que o supabase apanha a sessão do link (code/token)
    supabase.auth.getSession()
  }, [supabase])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setOk(null)
    setErr(null)

    try {
      if (password.length < 6) throw new Error('A password deve ter pelo menos 6 caracteres.')

      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      setOk('Password atualizada. Já podes fazer login.')
    } catch (e: any) {
      setErr(e?.message || 'Erro a atualizar password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 16 }}>
      <h1>Definir nova password</h1>

      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
        <input
          type="password"
          placeholder="Nova password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          minLength={6}
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
          {loading ? 'A guardar...' : 'Guardar password'}
        </button>

        {ok && <p style={{ color: 'green' }}>{ok}</p>}
        {err && <p style={{ color: 'crimson' }}>{err}</p>}
      </form>
    </div>
  )
}
