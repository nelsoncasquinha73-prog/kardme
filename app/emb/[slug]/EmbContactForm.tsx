'use client'

import { useState } from 'react'

interface EmbContactFormProps {
  slug: string
  ambassadorEmail: string
  ambassadorName: string
}

export default function EmbContactForm({ slug, ambassadorEmail, ambassadorName }: EmbContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [consent, setConsent] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!formData.name || !formData.email) {
      setMessage({ type: 'error', text: 'Nome e email são obrigatórios.' })
      return
    }

    if (!consent) {
      setMessage({ type: 'error', text: 'Deve autorizar receber comunicações.' })
      return
    }

    setLoading(true)

    try {
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
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: '✅ Contacto enviado com sucesso! Entraremos em contacto em breve.' })
        setFormData({ name: '', email: '', phone: '' })
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

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        type="text"
        name="name"
        placeholder="Nome completo"
        value={formData.name}
        onChange={handleChange}
        required
        style={{
          padding: '12px 16px',
          borderRadius: 8,
          border: '1px solid #475569',
          backgroundColor: '#334155',
          color: '#f1f5f9',
          fontSize: 14,
          fontFamily: 'inherit',
        }}
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
        style={{
          padding: '12px 16px',
          borderRadius: 8,
          border: '1px solid #475569',
          backgroundColor: '#334155',
          color: '#f1f5f9',
          fontSize: 14,
          fontFamily: 'inherit',
        }}
      />
      <input
        type="tel"
        name="phone"
        placeholder="Telefone (opcional)"
        value={formData.phone}
        onChange={handleChange}
        style={{
          padding: '12px 16px',
          borderRadius: 8,
          border: '1px solid #475569',
          backgroundColor: '#334155',
          color: '#f1f5f9',
          fontSize: 14,
          fontFamily: 'inherit',
        }}
      />
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
