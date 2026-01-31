'use client'

import React, { useMemo, useState } from 'react'
import { trackEvent } from '@/lib/trackEvent'

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
  labels?: {
    name?: string
    email?: string
    phone?: string
    message?: string
  }
  placeholders?: {
    name?: string
    email?: string
    phone?: string
    message?: string
  }
}

type LeadFormStyle = {
  offsetY?: number
  heading?: {
    fontFamily?: string
    fontWeight?: number
    color?: string
    align?: 'left' | 'center' | 'right'
    fontSize?: number
  }
  container?: {
    enabled?: boolean
    bgColor?: string
    radius?: number
    padding?: number
    borderWidth?: number
    borderColor?: string
    shadow?: boolean
    widthMode?: "full" | "custom"
    customWidthPx?: number
  }
  inputs?: {
    bgColor?: string
    textColor?: string
    borderColor?: string
    radius?: number
    fontSize?: number
    paddingY?: number
    paddingX?: number
    labelColor?: string
    labelSize?: number
  }
  button?: {
    bgColor?: string
    textColor?: string
    radius?: number
    height?: number
    fontWeight?: number
  }
}

type Props = {
  cardId: string
  settings?: LeadFormSettings
  style?: LeadFormStyle
}

function isNonEmpty(v?: string) {
  return typeof v === 'string' && v.trim().length > 0
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

  const labels = {
    name: s.labels?.name ?? 'Nome',
    email: s.labels?.email ?? 'Email',
    phone: s.labels?.phone ?? 'Telefone',
    message: s.labels?.message ?? 'Mensagem',
  }

  const placeholders = {
    name: s.placeholders?.name ?? 'Escreve o teu nome',
    email: s.placeholders?.email ?? 'Escreve o teu email',
    phone: s.placeholders?.phone ?? 'Opcional',
    message: s.placeholders?.message ?? 'Como posso ajudar?',
  }

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const headingStyle: React.CSSProperties = {
    fontFamily: st.heading?.fontFamily || undefined,
    fontWeight: st.heading?.fontWeight ?? 900,
    color: st.heading?.color ?? '#111827',
    textAlign: st.heading?.align ?? 'left',
    fontSize: st.heading?.fontSize ?? 14,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: st.inputs?.labelSize ?? 12,
    color: st.inputs?.labelColor ?? 'rgba(17,24,39,0.75)',
    fontWeight: 700,
    marginBottom: 6,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    fontSize: st.inputs?.fontSize ?? 14,
    padding: `${st.inputs?.paddingY ?? 10}px ${st.inputs?.paddingX ?? 12}px`,
    borderRadius: st.inputs?.radius ?? 12,
    border: `1px solid ${st.inputs?.borderColor ?? 'rgba(0,0,0,0.14)'}`,
    outline: 'none',
    background: st.inputs?.bgColor ?? '#fff',
    color: st.inputs?.textColor ?? '#111827',
  }

  const btnStyle: React.CSSProperties = {
    height: st.button?.height ?? 44,
    borderRadius: st.button?.radius ?? 14,
    border: 'none',
    background: st.button?.bgColor ?? 'var(--color-primary)',
    color: st.button?.textColor ?? '#fff',
    fontWeight: st.button?.fontWeight ?? 800,
    cursor: status === 'sending' ? 'not-allowed' : 'pointer',
    opacity: status === 'sending' ? 0.8 : 1,
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
      trackEvent(cardId, 'lead', 'lead_form')
      setFormData({ name: '', email: '', phone: '', message: '' })
      window.setTimeout(() => setStatus('idle'), 1800)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro no envio')
      setStatus('error')
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        marginTop: st.offsetY ? `${st.offsetY}px` : undefined,
      }}
    >
      {(isNonEmpty(s.title) || isNonEmpty(s.description)) && (
        <div style={{ marginBottom: 10 }}>
          {isNonEmpty(s.title) && <div style={{ ...headingStyle, display: 'block' }}>{s.title}</div>}
          {isNonEmpty(s.description) && (
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6, textAlign: headingStyle.textAlign as any }}>
              {s.description}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: 0, padding: 0 }}>
        {fields.name && (
          <div>
            <div style={labelStyle}>{labels.name}</div>
            <input
              type="text"
              placeholder={placeholders.name}
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              required
              style={inputStyle}
            />
          </div>
        )}

        {fields.email && (
          <div>
            <div style={labelStyle}>{labels.email}</div>
            <input
              type="email"
              placeholder={placeholders.email}
              value={formData.email}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              required
              style={inputStyle}
            />
          </div>
        )}

        {fields.phone && (
          <div>
            <div style={labelStyle}>{labels.phone}</div>
            <input
              type="tel"
              placeholder={placeholders.phone}
              value={formData.phone}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              style={inputStyle}
            />
          </div>
        )}

        {fields.message && (
          <div>
            <div style={labelStyle}>{labels.message}</div>
            <textarea
              placeholder={placeholders.message}
              value={formData.message}
              onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
              style={{ ...inputStyle, minHeight: 92, resize: 'vertical' }}
            />
          </div>
        )}

        <button type="submit" disabled={status === 'sending'} style={btnStyle}>
          {status === 'sending' ? 'A enviar…' : s.buttonLabel ?? 'Enviar'}
        </button>

        {status === 'success' && <div style={{ fontSize: 12, color: '#16a34a' }}>Enviado ✅</div>}
        {status === 'error' && <div style={{ fontSize: 12, color: '#dc2626' }}>{errorMsg}</div>}
      </form>
    </div>
  )
}
