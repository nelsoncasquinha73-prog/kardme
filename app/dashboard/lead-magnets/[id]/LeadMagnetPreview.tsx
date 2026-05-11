'use client'

import styles from './LeadMagnetEditor.module.css'

interface LeadMagnetPreviewProps {
  magnet: any
}

export default function LeadMagnetPreview({ magnet }: LeadMagnetPreviewProps) {
  const renderPreview = () => {
    switch (magnet.magnet_type) {
      case 'ebook':
        return (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
              📚 eBook
            </div>
            {magnet.capture_page_image && (
              <img
                src={magnet.capture_page_image}
                alt="eBook"
                style={{ maxWidth: 200, borderRadius: 8, marginBottom: 16 }}
              />
            )}
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
              {magnet.title}
            </h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>
              {magnet.description}
            </p>
            <button
              style={{
                padding: '10px 20px',
                borderRadius: 6,
                border: 'none',
                background: '#10b981',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Baixar eBook
            </button>
          </div>
        )

      case 'desconto':
        const discountConfig = magnet.discount_config
        return (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
              🎟️ Desconto Exclusivo
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 24 }}>
              {magnet.title}
            </h3>
            {discountConfig?.displayStyle === 'coupon' ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 24,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>
                  Desconto de
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
                  {discountConfig?.value}
                  {discountConfig?.type === 'percent' ? '%' : '€'}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#fff',
                    letterSpacing: 2,
                    fontFamily: 'monospace',
                    marginBottom: 12,
                  }}
                >
                  {discountConfig?.code}
                </div>
                {discountConfig?.expiresAt && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
                    Válido até {new Date(discountConfig.expiresAt).toLocaleDateString('pt-PT')}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: 'inline-block',
                  padding: '12px 20px',
                  background: '#10b981',
                  borderRadius: 6,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                {discountConfig?.code} • {discountConfig?.value}
                {discountConfig?.type === 'percent' ? '%' : '€'}
              </div>
            )}
            <button
              style={{
                padding: '10px 20px',
                borderRadius: 6,
                border: 'none',
                background: '#3b82f6',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Copiar Código
            </button>
          </div>
        )

      case 'form':
        return (
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
              📋 Formulário
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 16 }}>
              {magnet.title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(magnet.form_fields || []).map((field: any, idx: number) => (
                <div key={idx}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#fff', display: 'block', marginBottom: 4 }}>
                    {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      placeholder={field.placeholder}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 4,
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        fontSize: 12,
                      }}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 4,
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        fontSize: 12,
                      }}
                    >
                      <option>Seleciona uma opção</option>
                      {(field.options || []).map((opt: string, i: number) => (
                        <option key={i}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(field.options || []).map((opt: string, i: number) => (
                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                          <input type="checkbox" />
                          <span style={{ color: 'rgba(255,255,255,0.8)' }}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : field.type === 'radio' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(field.options || []).map((opt: string, i: number) => (
                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                          <input type="radio" name={field.id} />
                          <span style={{ color: 'rgba(255,255,255,0.8)' }}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 4,
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        fontSize: 12,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            <button
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 6,
                border: 'none',
                background: '#10b981',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 16,
              }}
            >
              Enviar
            </button>
          </div>
        )

      case 'checklist':
        return (
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
              ✅ Checklist
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 16 }}>
              {magnet.title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(magnet.checklist_items || []).map((item: any, idx: number) => (
                <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                  <input type="checkbox" />
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>{item.text}</span>
                </label>
              ))}
            </div>
          </div>
        )

      case 'roda_sorte':
        return (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
              🎡 Roda da Sorte
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 16 }}>
              {magnet.title}
            </h3>
            <div
              style={{
                width: 200,
                height: 200,
                margin: '0 auto 16px',
                borderRadius: '50%',
                background: 'conic-gradient(from 0deg, #10b981, #3b82f6, #f59e0b, #ef4444)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Girar</div>
            </div>
            <button
              style={{
                padding: '10px 20px',
                borderRadius: 6,
                border: 'none',
                background: '#f59e0b',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Girar Roda
            </button>
          </div>
        )

      default:
        return (
          <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            Tipo não reconhecido
          </div>
        )
    }
  }

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden',
      }}
    >
      {renderPreview()}
    </div>
  )
}
