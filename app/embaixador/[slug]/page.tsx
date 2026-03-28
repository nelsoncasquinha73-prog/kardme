'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getAmbassadorBySlug, createAmbassadorLead, type Ambassador } from '@/lib/ambassadors/ambassadorService'

export default function AmbassadorPage() {
  const params = useParams()
  const slug = params.slug as string
  
  const [ambassador, setAmbassador] = useState<Ambassador | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    interest_type: '',
    location: '',
    budget: '',
    notes: '',
    marketing_opt_in: false,
  })

  useEffect(() => {
    loadAmbassador()
  }, [slug])

  const loadAmbassador = async () => {
    try {
      setLoading(true)
      const data = await getAmbassadorBySlug(slug)
      setAmbassador(data)
    } catch (error) {
      console.error('Erro ao carregar embaixador:', error)
      alert('Embaixador não encontrado')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Nome e email são obrigatórios')
      return
    }

    try {
      setSubmitting(true)
      await createAmbassadorLead(ambassador!.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        interest_type: formData.interest_type || undefined,
        location: formData.location || undefined,
        budget: formData.budget || undefined,
        notes: formData.notes || undefined,
        marketing_opt_in: formData.marketing_opt_in,
      })
      alert('Obrigado! Entraremos em contacto em breve.')
      setFormData({
        name: '',
        email: '',
        phone: '',
        interest_type: '',
        location: '',
        budget: '',
        notes: '',
        marketing_opt_in: false,
      })
    } catch (error) {
      console.error('Erro ao submeter:', error)
      alert('Erro ao enviar formulário')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f172a' }}>
        <p style={{ color: '#fff' }}>Carregando...</p>
      </div>
    )
  }

  if (!ambassador) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f172a' }}>
        <p style={{ color: '#fff' }}>Embaixador não encontrado</p>
      </div>
    )
  }

  const bgColor = ambassador.background_color || '#0f172a'
  const textColor = ambassador.text_color || '#ffffff'
  const bioColor = ambassador.bio_color || '#94a3b8'
  const fontFamily = ambassador.font_family || 'system-ui'

  return (
    <div style={{
      minHeight: '100vh',
      background: bgColor,
      padding: '20px',
      fontFamily: fontFamily,
    }}>
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
      }}>
        {/* Cartão Header com Cover e Avatar */}
        <div style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 24,
          backdropFilter: 'blur(10px)',
        }}>
          {/* Cover Image */}
          {ambassador.cover_url && (
            <div style={{
              width: '100%',
              height: 200,
              background: `url(${ambassador.cover_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }} />
          )}

          {/* Avatar + Info */}
          <div style={{
            padding: '32px 24px 24px 24px',
            textAlign: 'center',
          }}>
            {ambassador.avatar_url && (
              <img
                src={ambassador.avatar_url}
                alt={ambassador.name}
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: '50%',
                  border: `6px solid ${bgColor}`,
                  objectFit: 'cover',
                  marginBottom: 20,
                }}
              />
            )}

            <h1 style={{
              fontSize: 28,
              fontWeight: 800,
              color: textColor,
              marginBottom: 8,
              margin: 0,
            }}>
              {ambassador.name}
            </h1>

            {ambassador.bio && (
              <p style={{
                fontSize: 14,
                color: bioColor,
                marginBottom: 16,
                marginTop: 8,
              }}>
                {ambassador.bio}
              </p>
            )}

            {/* Contact Links */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              alignItems: 'center',
            }}>
              {ambassador.email && (
                <a href={`mailto:${ambassador.email}`} style={{
                  color: '#60a5fa',
                  textDecoration: 'none',
                  fontSize: 13,
                  transition: 'opacity 0.2s',
                }}>
                  📧 {ambassador.email}
                </a>
              )}
              {ambassador.phone && (
                <a href={`tel:${ambassador.phone}`} style={{
                  color: '#60a5fa',
                  textDecoration: 'none',
                  fontSize: 13,
                  transition: 'opacity 0.2s',
                }}>
                  📱 {ambassador.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: 24,
          backdropFilter: 'blur(10px)',
        }}>
          <h2 style={{
            fontSize: 16,
            fontWeight: 700,
            color: textColor,
            marginBottom: 20,
            marginTop: 0,
          }}>
            Deixe seu contacto
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="text"
              placeholder="Nome completo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: textColor,
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            />

            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: textColor,
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            />

            <input
              type="tel"
              placeholder="Telefone (opcional)"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: textColor,
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            />

            <select
              value={formData.interest_type}
              onChange={(e) => setFormData({ ...formData, interest_type: e.target.value })}
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: textColor,
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            >
              <option value="">Tipo de interesse (opcional)</option>
              <option value="Comprar">Comprar</option>
              <option value="Vender">Vender</option>
              <option value="Alugar">Alugar</option>
            </select>

            <input
              type="text"
              placeholder="Localização (opcional)"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: textColor,
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            />

            <input
              type="text"
              placeholder="Orçamento (opcional)"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: textColor,
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            />

            <textarea
              placeholder="Mensagem (opcional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: textColor,
                fontSize: 13,
                fontFamily: 'inherit',
                minHeight: 80,
                resize: 'vertical',
              }}
            />

            {ambassador.custom_fields && ambassador.custom_fields.length > 0 && (
              <>
                {ambassador.custom_fields.map((field) => (
                  field.enabled && (
                    <div key={field.id}>
                      <label style={{ display: 'block', color: bioColor, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                        {field.label} {field.required && '*'}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          placeholder={field.label}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.05)',
                            color: textColor,
                            fontSize: 13,
                            fontFamily: 'inherit',
                            minHeight: 80,
                            resize: 'vertical',
                          }}
                        />
                      ) : field.type === 'select' ? (
                        <select
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.05)',
                            color: textColor,
                            fontSize: 13,
                            fontFamily: 'inherit',
                          }}
                        >
                          <option value="">Seleciona uma opção</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder={field.label}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.05)',
                            color: textColor,
                            fontSize: 13,
                            fontFamily: 'inherit',
                          }}
                        />
                      )}
                    </div>
                  )
                ))}
              </>
            )}

                        <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: bioColor,
              fontSize: 12,
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={formData.marketing_opt_in}
                onChange={(e) => setFormData({ ...formData, marketing_opt_in: e.target.checked })}
                style={{
                  cursor: 'pointer',
                }}
              />
              Autorizo receber comunicações
            </label>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '14px 24px',
                borderRadius: 8,
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: 14,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
                transition: 'all 0.2s',
                marginTop: 8,
              }}
            >
              {submitting ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: 32,
          color: bioColor,
          fontSize: 11,
        }}>
          <p>Powered by Kardme</p>
        </div>
      </div>
    </div>
  )
}
