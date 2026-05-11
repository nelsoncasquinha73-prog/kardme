'use client'

import { useEffect, useState } from 'react'

export type DiscountConfig = {
  code: string
  type: 'percent' | 'fixed'
  value: number
  expiresAt?: string
  usageLimit?: number
  ctaUrl?: string
  displayStyle?: 'badge' | 'coupon'
}

interface DiscountConfiguratorProps {
  config: DiscountConfig | null
  onChange: (config: DiscountConfig) => void
}

export default function DiscountConfigurator({ config, onChange }: DiscountConfiguratorProps) {
  const [discount, setDiscount] = useState<DiscountConfig>(
    config || {
      code: '',
      type: 'percent',
      value: 0,
      displayStyle: 'coupon',
    }
  )

  useEffect(() => {
    if (config) setDiscount(config)
  }, [config])

  const handleChange = (field: keyof DiscountConfig, value: any) => {
    const updated = { ...discount, [field]: value }
    setDiscount(updated)
    onChange(updated)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Código */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 6 }}>
            Código do Desconto *
          </label>
          <input
            type="text"
            value={discount.code}
            onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
            placeholder="Ex: KARDME20"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: 12,
              outline: 'none',
            }}
          />
        </div>

        {/* Tipo + Valor */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 6 }}>
              Tipo *
            </label>
            <select
              value={discount.type}
              onChange={(e) => handleChange('type', e.target.value as any)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: 12,
                outline: 'none',
              }}
            >
              <option value="percent">Percentagem (%)</option>
              <option value="fixed">Valor fixo (€)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 6 }}>
              Valor *
            </label>
            <input
              type="number"
              value={discount.value}
              onChange={(e) => handleChange('value', parseFloat(e.target.value))}
              placeholder={discount.type === 'percent' ? '20' : '5.00'}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: 12,
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Data de expiração */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 6 }}>
            Data de Expiração (opcional)
          </label>
          <input
            type="datetime-local"
            value={discount.expiresAt ? new Date(discount.expiresAt).toISOString().slice(0, 16) : ''}
            onChange={(e) => handleChange('expiresAt', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: 12,
              outline: 'none',
            }}
          />
        </div>

        {/* Limite de usos */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 6 }}>
            Limite de Usos (opcional)
          </label>
          <input
            type="number"
            value={discount.usageLimit || ''}
            onChange={(e) => handleChange('usageLimit', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Ex: 50 (deixa vazio para ilimitado)"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: 12,
              outline: 'none',
            }}
          />
        </div>

        {/* URL de CTA */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 6 }}>
            Link para Ativar Desconto (opcional)
          </label>
          <input
            type="url"
            value={discount.ctaUrl || ''}
            onChange={(e) => handleChange('ctaUrl', e.target.value || undefined)}
            placeholder="https://..."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: 12,
              outline: 'none',
            }}
          />
        </div>

        {/* Estilo de exibição */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 6 }}>
            Estilo de Exibição
          </label>
          <select
            value={discount.displayStyle || 'coupon'}
            onChange={(e) => handleChange('displayStyle', e.target.value as any)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: 12,
              outline: 'none',
            }}
          >
            <option value="coupon">Cupão (grande, destacado)</option>
            <option value="badge">Badge (pequeno, compacto)</option>
          </select>
        </div>
      </div>

      {/* Preview */}
      <div style={{ marginTop: 12, padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: 8 }}>
          Preview
        </div>
        {discount.displayStyle === 'coupon' ? (
          <div style={{ textAlign: 'center', padding: 16, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
              Desconto de
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
              {discount.value}
              {discount.type === 'percent' ? '%' : '€'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: 2, fontFamily: 'monospace' }}>
              {discount.code || 'CODIGO'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'inline-block', padding: '6px 12px', background: '#10b981', borderRadius: 4, color: '#fff', fontSize: 12, fontWeight: 600 }}>
            {discount.code || 'CODIGO'} • {discount.value}
            {discount.type === 'percent' ? '%' : '€'}
          </div>
        )}
      </div>
    </div>
  )
}
