'use client'

import React, { useMemo, useState } from 'react'
import { useLanguage } from '@/components/language/LanguageProvider'
import { trackEvent } from '@/lib/trackEvent'

type CustomLeadField = {
  id: string
  label: string
  placeholder?: string
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'textarea'
  required?: boolean
  enabled?: boolean
}

type LeadFormSettings = {
  title?: string
  description?: string
  fields?: {
    name?: boolean
    email?: boolean
    phone?: boolean
    message?: boolean
    zone?: boolean
  }
  buttonLabel?: string
  requiredFields?: {
    name?: boolean
    email?: boolean
    phone?: boolean
    message?: boolean
    zone?: boolean
  }

  customFields?: CustomLeadField[]
  fieldOrder?: string[]

  consentCheckboxEnabled?: boolean
  consentCheckboxText?: string
  marketingCheckboxEnabled?: boolean
  marketingCheckboxText?: string
  labels?: {
    name?: string
    email?: string
    phone?: string
    message?: string
    zone?: string
  }
  placeholders?: {
    name?: string
    email?: string
    phone?: string
    message?: string
    zone?: string
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
    placeholderColor?: string
  }
  button?: {
    borderWidth?: number
    borderColor?: string
    shadow?: boolean
    bgColor?: string
    textColor?: string
    radius?: number
    height?: number
    fontWeight?: number
  }
  consentCheckbox?: {
    textColor?: string
    fontSize?: number
    fontFamily?: string
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

  const { t, lang } = useLanguage()

  const fields = useMemo(
    () => ({
      name: s.fields?.name !== false,
      email: s.fields?.email !== false,
      phone: s.fields?.phone !== false,
      message: s.fields?.message !== false,
      zone: s.fields?.zone === true,
    }),
    [s.fields]
  )

  const requiredFields = {
    name: s.requiredFields?.name ?? true,
    email: s.requiredFields?.email ?? true,
    phone: s.requiredFields?.phone ?? false,
    message: s.requiredFields?.message ?? false,
    zone: s.requiredFields?.zone ?? false,
  }

  const customFields = (Array.isArray(s.customFields) ? s.customFields : [])
    .filter((field) => field.enabled !== false)

  const baseFieldIds = ['name', 'email', 'phone', 'message', 'zone']

  const allFieldIds = [
    ...baseFieldIds,
    ...customFields.map((field) => field.id),
  ]

  const requestedFieldOrder =
    Array.isArray(s.fieldOrder) && s.fieldOrder.length > 0
      ? s.fieldOrder
      : baseFieldIds

  const completeFieldOrder = [
    ...requestedFieldOrder,
    ...allFieldIds.filter((id) => !requestedFieldOrder.includes(id)),
  ].filter(
    (id, index, arr) =>
      allFieldIds.includes(id) &&
      arr.indexOf(id) === index
  )

  const labels = {
    name: s.labels?.name ?? 'Nome',
    email: s.labels?.email ?? 'Email',
    phone: s.labels?.phone ?? 'Telefone',
    message: s.labels?.message ?? 'Mensagem',
    zone: s.labels?.zone ?? 'Zona / Localização',
  }

  const placeholders = {
    name: s.placeholders?.name ?? 'Escreve o teu nome',
    email: s.placeholders?.email ?? 'Escreve o teu email',
    phone: s.placeholders?.phone ?? 'Opcional',
    message: s.placeholders?.message ?? 'Como posso ajudar?',
    zone: s.placeholders?.zone ?? 'Ex.: Lisboa, Oeiras',
  }

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '', zone: '' })
  const [customData, setCustomData] = useState<Record<string, string>>({})
  const [consentChecked, setConsentChecked] = useState(false)
  const [marketingChecked, setMarketingChecked] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const headingStyle: React.CSSProperties = {
    fontFamily: st.heading?.fontFamily || undefined,
    fontWeight: st.heading?.fontWeight ?? 900,
    color: st.heading?.color ?? '#111827',
    textAlign: st.heading?.align ?? 'left',
    fontSize: st.heading?.fontSize ?? 14,
  }

  const consentStyle: React.CSSProperties = {
    fontSize: st.consentCheckbox?.fontSize ?? 12,
    color: st.consentCheckbox?.textColor ?? 'rgba(17,24,39,0.75)',
    fontFamily: st.consentCheckbox?.fontFamily || undefined,
    fontWeight: st.consentCheckbox?.fontWeight ?? 500,
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
    border: (st.button?.borderWidth ?? 0) > 0 ? `${st.button?.borderWidth}px solid ${st.button?.borderColor ?? 'rgba(0,0,0,0.15)'}` : 'none',
    background: st.button?.bgColor ?? 'var(--color-primary)',
    color: st.button?.textColor ?? '#fff',
    fontWeight: st.button?.fontWeight ?? 800,
    cursor: status === 'sending' ? 'not-allowed' : 'pointer',
    opacity: status === 'sending' ? 0.8 : 1,
    boxShadow: st.button?.shadow ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
  }

  React.useEffect(() => {
    const placeholderColor = st.inputs?.placeholderColor ?? 'rgba(0,0,0,0.4)'
    const styleId = `leadform-placeholder-${cardId}`
    let styleEl = document.getElementById(styleId)
    
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = styleId
      document.head.appendChild(styleEl)
    }
    
    styleEl.textContent = `
      #leadform-${cardId} input::placeholder,
      #leadform-${cardId} textarea::placeholder {
        color: ${placeholderColor} !important;
      }
    `
  }, [st.inputs?.placeholderColor, cardId])

  const consentText = s.consentCheckboxText || 'Concordo em ser contactado(a) para responder ao meu pedido.'
  const marketingText = s.marketingCheckboxText || 'Quero receber novidades e oportunidades por email.'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if ((s.consentCheckboxEnabled ?? true) && !consentChecked) {
      setErrorMsg('Deve aceitar o tratamento de dados para continuar.')
      return
    }
    setStatus('sending')
    setErrorMsg(null)

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId,
          ...formData,
          requiredFields,
          customFields: Object.fromEntries(
            customFields.map((field) => [
              field.id,
              {
                label: field.label,
                type: field.type,
                value: customData[field.id] ?? '',
              },
            ])
          ),
          consentGiven: consentChecked,
          marketingOptIn: marketingChecked,
          consentTimestamp: new Date().toISOString(),
          consentVersion: '1.0',
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data?.error || 'Erro no envio')
      }

      setStatus('success')
      trackEvent(cardId, 'lead', 'lead_form')
      setFormData({ name: '', email: '', phone: '', message: '', zone: '' })
      setCustomData({})
      setConsentChecked(false)
      setMarketingChecked(false)
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

      <form id={`leadform-${cardId}`} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: 0, padding: 0 }}>
        {completeFieldOrder.map((fieldId) => {
          if (fieldId === 'name') {
            if (!fields.name) return null
            return (
              <div key="name">
                <div style={labelStyle}>{labels.name}</div>
                <input
                  type="text"
                  placeholder={placeholders.name}
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required={requiredFields.name}
                  style={inputStyle}
                />
              </div>
            )
          }

          if (fieldId === 'email') {
            if (!fields.email) return null
            return (
              <div key="email">
                <div style={labelStyle}>{labels.email}</div>
                <input
                  type="email"
                  placeholder={placeholders.email}
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  required={requiredFields.email}
                  style={inputStyle}
                />
              </div>
            )
          }

          if (fieldId === 'phone') {
            if (!fields.phone) return null
            return (
              <div key="phone">
                <div style={labelStyle}>{labels.phone}</div>
                <input
                  type="tel"
                  placeholder={placeholders.phone}
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  required={requiredFields.phone}
                  style={inputStyle}
                />
              </div>
            )
          }

          if (fieldId === 'zone') {
            if (!fields.zone) return null
            return (
              <div key="zone">
                <div style={labelStyle}>{labels.zone}</div>
                <input
                  type="text"
                  placeholder={placeholders.zone}
                  value={formData.zone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, zone: e.target.value }))}
                  required={requiredFields.zone}
                  style={inputStyle}
                />
              </div>
            )
          }

          if (fieldId === 'message') {
            if (!fields.message) return null
            return (
              <div key="message">
                <div style={labelStyle}>{labels.message}</div>
                <textarea
                  placeholder={placeholders.message}
                  value={formData.message}
                  onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                  required={requiredFields.message}
                  style={{ ...inputStyle, minHeight: 92, resize: 'vertical' }}
                />
              </div>
            )
          }

          const customField = customFields.find((field) => field.id === fieldId)

          if (!customField) return null

          return (
            <div key={customField.id}>
              <div style={labelStyle}>
                {customField.label}
                {customField.required ? ' *' : ''}
              </div>

              {customField.type === 'textarea' ? (
                <textarea
                  placeholder={customField.placeholder ?? ''}
                  value={customData[customField.id] ?? ''}
                  onChange={(e) =>
                    setCustomData((prev) => ({
                      ...prev,
                      [customField.id]: e.target.value,
                    }))
                  }
                  required={customField.required === true}
                  style={{ ...inputStyle, minHeight: 92, resize: 'vertical' }}
                />
              ) : (
                <input
                  type={customField.type}
                  placeholder={customField.placeholder ?? ''}
                  value={customData[customField.id] ?? ''}
                  onChange={(e) =>
                    setCustomData((prev) => ({
                      ...prev,
                      [customField.id]: e.target.value,
                    }))
                  }
                  required={customField.required === true}
                  style={inputStyle}
                />
              )}
            </div>
          )
        })}

        {(s.consentCheckboxEnabled ?? true) && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 4 }}>
            <input
              type="checkbox"
              id={`consent-${cardId}`}
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              style={{ marginTop: 4, cursor: 'pointer', accentColor: st.button?.bgColor ?? 'var(--color-primary)' }}
            />
            <label htmlFor={`consent-${cardId}`} style={{ ...consentStyle, cursor: 'pointer', lineHeight: 1.4 }}>
              {consentText}
            </label>
          </div>
        )}

        {(s.marketingCheckboxEnabled ?? false) && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 4 }}>
            <input
              type="checkbox"
              id={`marketing-${cardId}`}
              checked={marketingChecked}
              onChange={(e) => setMarketingChecked(e.target.checked)}
              style={{ marginTop: 4, cursor: 'pointer', accentColor: st.button?.bgColor ?? 'var(--color-primary)' }}
            />
            <label htmlFor={`marketing-${cardId}`} style={{ ...consentStyle, cursor: 'pointer', lineHeight: 1.4 }}>
              {marketingText}
            </label>
          </div>
        )}

        <button type="submit" disabled={status === 'sending' || ((s.consentCheckboxEnabled ?? true) && !consentChecked)} style={btnStyle}>
          {status === 'sending' ? 'A enviar…' : s.buttonLabel ?? 'Enviar'}
        </button>

        {status === 'success' && <div style={{ fontSize: 12, color: '#16a34a' }}>Enviado ✅</div>}
        {status === 'error' && <div style={{ fontSize: 12, color: '#dc2626' }}>{errorMsg}</div>}
      </form>
    </div>
  )
}
