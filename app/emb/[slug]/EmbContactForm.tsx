'use client'

import { useState } from 'react'

interface CustomField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select'
  options?: string[]
  required?: boolean
  enabled?: boolean
}

interface DefaultField {
  id: 'name' | 'email' | 'phone'
  label: string
  type: 'text' | 'email' | 'tel'
  required: boolean
  enabled: boolean
}

interface EmbContactFormProps {
  slug: string
  ambassadorEmail: string
  ambassadorName: string
  customFields?: CustomField[]
  defaultFields?: DefaultField[]
}

export default function EmbContactForm({ 
  slug, 
  ambassadorEmail, 
  ambassadorName,
  customFields = [],
  defaultFields = [
    { id: 'name', label: 'Nome', type: 'text', required: true, enabled: true },
    { id: 'email', label: 'Email', type: 'email', required: true, enabled: true },
    { id: 'phone', label: 'Telefone', type: 'tel', required: false, enabled: true },
  ]
}: EmbContactFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({
    name: '',
    email: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [consent, setConsent] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validar campos default obrigatórios
    const enabledDefaultFields = defaultFields.filter(f => f.enabled && f.required)
    for (const field of enabledDefaultFields) {
      if (!formData[field.id]) {
        setMessage({ type: 'error', text: `${field.label} é obrigatório.` })
        return
      }
    }

    // Validar campos custom obrigatórios
    const enabledRequiredCustomFields = customFields.filter(f => (f.enabled ?? true) && (f.required ?? false))
    for (const field of enabledRequiredCustomFields) {
      if (!formData[field.id]) {
        setMessage({ type: 'error', text: `${field.label} é obrigatório.` })
        return
      }
    }

    if (!consent) {
      setMessage({ type: 'error', text: 'Deve autorizar receber comunicações.' })
      return
    }

    setLoading(true)

    try {
      const customFieldsData = customFields
        .filter(f => f.enabled ?? true)
        .reduce((acc, field) => {
          acc[field.id] = formData[field.id] || ''
          return acc
        }, {} as Record<string, string>)

      const response = await fetch('/api/ambassadors/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          consentGiven: true,
          marketingOptIn: consent,
          customFieldsData,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: '✅ Contacto enviado com sucesso! Entraremos em contacto em breve.' })
        setFormData({ name: '', email: '', phone: '' })
        customFields.forEach(f => {
          setFormData(prev => ({ ...prev, [f.id]: '' }))
        })
        setConsent(false)
      } else {
        setMessage({ type: 'error', text: result.error || 'Erro ao enviar. Tenta novamente.' })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erro de conexão. Tenta novamente.' })
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    padding: '12px 16px',
    borderRadius: 8,
    border: '1px solid #475569',
    backgroundColor: '#334155',
    color: '#f1f5f9',
    fontSize: 14,
    fontFamily: 'inherit',
  }

  // Renderizar campos default habilitados
  const enabledDefaultFields = defaultFields.filter(f => f.enabled)
  
  // Renderizar campos custom habilitados
  const enabledCustomFields = customFields.filter(f => f.enabled ?? true)

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Campos Default */}
      {enabledDefaultFields.map((field) => (
        <div key={field.id}>
          {field.type === 'text' && (
            <input
              type="text"
              name={field.id}
              placeholder={field.label}
              value={formData[field.id] || ''}
              onChange={handleChange}
              required={field.required}
              style={inputStyle as React.CSSProperties}
            />
          )}
          {field.type === 'email' && (
            <input
              type="email"
              name={field.id}
              placeholder={field.label}
              value={formData[field.id] || ''}
              onChange={handleChange}
              required={field.required}
              style={inputStyle as React.CSSProperties}
            />
          )}
          {field.type === 'tel' && (
            <input
              type="tel"
              name={field.id}
              placeholder={field.label}
              value={formData[field.id] || ''}
              onChange={handleChange}
              required={field.required}
              style={inputStyle as React.CSSProperties}
            />
          )}
        </div>
      ))}

      {/* Campos Custom */}
      {enabledCustomFields.map((field) => (
        <div key={field.id}>
          <label style={{ display: 'block', fontSize: 13, color: '#cbd5e1', marginBottom: 6, fontWeight: 500 }}>
            {field.label}
            {(field.required ?? false) && <span style={{ color: '#ef4444' }}>*</span>}
          </label>
          {field.type === 'text' && (
            <input
              type="text"
              name={field.id}
              placeholder={field.label}
              value={formData[field.id] || ''}
              onChange={handleChange}
              required={field.required ?? false}
              style={inputStyle as React.CSSProperties}
            />
          )}
          {field.type === 'textarea' && (
            <textarea
              name={field.id}
              placeholder={field.label}
              value={formData[field.id] || ''}
              onChange={handleChange}
              required={field.required ?? false}
              style={{
                ...inputStyle,
                minHeight: '100px',
                resize: 'vertical',
              } as React.CSSProperties}
            />
          )}
          {field.type === 'select' && field.options && (
            <select
              name={field.id}
              value={formData[field.id] || ''}
              onChange={handleChange}
              required={field.required ?? false}
              style={inputStyle as React.CSSProperties}
            >
              <option value="">Seleciona uma opção</option>
              {field.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#cbd5e1', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          style={{ width: 16, height: 16, cursor: 'pointer' }}
        />
        Autorizo receber comunicações
      </label>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            backgroundColor: message.type === 'success' ? '#10b981' : '#ef4444',
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '12px 16px',
          borderRadius: 8,
          backgroundColor: loading ? '#64748b' : '#3b82f6',
          color: '#fff',
          border: 'none',
          fontSize: 14,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: 8,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'A enviar...' : 'Enviar'}
      </button>
    </form>
  )
}
