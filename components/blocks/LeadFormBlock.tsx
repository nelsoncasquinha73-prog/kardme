'use client'

import React, { useMemo, useState } from 'react'

type LeadFormSettings = {
  title?: string
  description?: string
  fields?: {
    name?: boolean
    email?: boolean
    phone?: boolean
    message?: boolean
  }
  buttonLabel?: string
}

type LeadFormStyle = {
  container?: {
    bgColor?: string
    radius?: number
    padding?: number
    borderWidth?: number
    borderColor?: string
    shadow?: boolean
  }
}

type Props = {
  cardId: string
  settings?: LeadFormSettings
  style?: LeadFormStyle
}

export default function LeadFormBlock({ cardId, settings, style }: Props) {
  const s: LeadFormSettings = settings ?? {}
  const st: LeadFormStyle = style ?? {}

  const fields = useMemo(
    () => ({
      name: s.fields?.name !== false,
      email: s.fields?.email !== false,
      phone: s.fields?.phone !== false,
      message: s.fields?.message !== false,
    }),
    [s.fields]
  )

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const containerStyle: React.CSSProperties = {
    background: st.container?.bgColor ?? 'transparent',
    borderRadius: st.container?.radius != null ? `${st.container.radius}px` : '16px',
    padding: st.container?.padding != null ? `${st.container.padding}px` : '12px',
    border:
      (st.container?.borderWidth ?? 0) > 0
        ? `${st.container?.borderWidth}px solid ${st.container?.borderColor ?? 'rgba(0,0,0,0.12)'}`
        : '1px solid rgba(0,0,0,0.08)',
    boxShadow: st.container?.shadow ? '0 14px 40px rgba(0,0,0,0.12)' : undefined,

    // ✅ MUITO IMPORTANTE: garantir que não fica "bandeira"
    position: 'relative',
    width: '100%',
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg(null)

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, ...formData }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data?.error || 'Erro no envio')
      }

      setStatus('success')
      setFormData({ name: '', email: '', phone: '', message: '' })
      window.setTimeout(() => setStatus('idle'), 1800)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro no envio')
      setStatus('error')
    }
  }

  return (
    <div style={containerStyle}>
      {(s.title || s.description) && (
        <div style={{ marginBottom: 10 }}>
          {s.title && <strong style={{ display: 'block', fontSize: 14 }}>{s.title}</strong>}
          {s.description && <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>{s.description}</div>}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {fields.name && (
          <input
            type="text"
            placeholder="Nome"
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            required
            style={input}
          />
        )}

        {fields.email && (
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            required
            style={input}
          />
        )}

        {fields.phone && (
          <input
            type="tel"
            placeholder="Telefone"
            value={formData.phone}
            onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
            style={input}
          />
        )}

        {fields.message && (
          <textarea
            placeholder="Mensagem"
            value={formData.message}
            onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
            style={{ ...input, minHeight: 84, resize: 'vertical' }}
          />
        )}

        <button type="submit" disabled={status === 'sending'} style={btn}>
          {status === 'sending' ? 'A enviar…' : s.buttonLabel ?? 'Enviar'}
        </button>

        {status === 'success' && <div style={{ fontSize: 12, color: '#16a34a' }}>Enviado ✅</div>}
        {status === 'error' && <div style={{ fontSize: 12, color: '#dc2626' }}>{errorMsg}</div>}
      </form>
    </div>
  )
}

const input: React.CSSProperties = {
  width: '100%',
  fontSize: 14,
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.14)',
  outline: 'none',
  background: '#fff',
}

const btn: React.CSSProperties = {
  height: 44,
  borderRadius: 14,
  border: 'none',
  background: 'var(--color-primary)',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
}
