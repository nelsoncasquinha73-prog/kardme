'use client'

import { useState } from 'react'
import { FiX } from 'react-icons/fi'

type Lead = {
  id: string
  name: string
  email: string
  phone: string
  zone: string | null
  marketing_opt_in: boolean
  lead_type_id: string | null
  lead_source: string | null
  country: string | null
}

type LeadType = {
  id: string
  name: string
  color: string
}

type LeadSource = {
  id: string
  label: string
  emoji: string
}

type Country = {
  id: string
  name: string
}

export default function EditLeadModal({
  lead,
  onClose,
  onSave,
  leadTypes,
  leadSources,
  countries,
  loading,
}: {
  lead: Lead
  onClose: () => void
  onSave: (data: Partial<Lead>) => Promise<void>
  leadTypes: LeadType[]
  leadSources: LeadSource[]
  countries: Country[]
  loading: boolean
}) {
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    zone: lead.zone,
    marketing_opt_in: lead.marketing_opt_in,
    lead_type_id: lead.lead_type_id,
    lead_source: lead.lead_source,
    country: lead.country,
  })

  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      setError('Nome é obrigatório')
      return
    }
    if (!formData.email?.trim()) {
      setError('Email é obrigatório')
      return
    }

    setError(null)
    try {
      await onSave(formData)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Erro ao guardar')
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a1a2e',
          borderRadius: 20,
          padding: 32,
          width: '100%',
          maxWidth: 500,
          border: '1px solid rgba(255,255,255,0.1)',
          maxHeight: '90vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>✏️ Editar Lead</h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 8,
              padding: 8,
              cursor: 'pointer',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
              color: '#ef4444',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Nome */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
              Nome *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
              Email *
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Telefone */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
              Telefone
            </label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Zona */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
              Zona
            </label>
            <input
              type="text"
              value={formData.zone || ''}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Tipo de Lead */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
              Tipo de Lead
            </label>
            <select
              value={formData.lead_type_id || ''}
              onChange={(e) => setFormData({ ...formData, lead_type_id: e.target.value || null })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            >
              <option value="">Sem tipo</option>
              {leadTypes.map((t) => (
                <option key={t.id} value={t.id} style={{ background: '#1a1a2e' }}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Fonte */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
              Fonte
            </label>
            <select
              value={formData.lead_source || ''}
              onChange={(e) => setFormData({ ...formData, lead_source: e.target.value || null })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            >
              <option value="">Sem fonte</option>
              {leadSources.map((s) => (
                <option key={s.id} value={s.id} style={{ background: '#1a1a2e' }}>
                  {s.emoji} {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* País */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
              País
            </label>
            <select
              value={formData.country || ''}
              onChange={(e) => setFormData({ ...formData, country: e.target.value || null })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            >
              <option value="">Sem país</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id} style={{ background: '#1a1a2e' }}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Marketing Opt-in */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.marketing_opt_in || false}
                onChange={(e) => setFormData({ ...formData, marketing_opt_in: e.target.checked })}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                Autorização de Marketing
              </span>
            </label>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '6px 0 0 28px' }}>
              {formData.marketing_opt_in ? '✓ Lead autoriza receber emails' : '✗ Lead não autoriza emails'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 24px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              background: '#3b82f6',
              color: '#fff',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'A guardar…' : '✓ Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
