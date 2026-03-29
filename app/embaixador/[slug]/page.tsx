'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { FiPhone, FiMail } from 'react-icons/fi'
import { getAmbassadorBySlug, createAmbassadorLead, type Ambassador } from '@/lib/ambassadors/ambassadorService'
import AmbassadorFloatingActions from '@/components/public/AmbassadorFloatingActions'

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
        phone: formData.phone || undefined,
        interest_type: formData.interest_type || undefined,
        location: formData.location || undefined,
        budget: formData.budget || undefined,
        notes: formData.notes || undefined,
        marketing_opt_in: formData.marketing_opt_in,
      })
      alert('Lead criado com sucesso!')
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
      console.error('Erro ao criar lead:', error)
      alert('Erro ao enviar formulário')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Carregando...</div>
  }

  if (!ambassador) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
      }}>
        <div style={{
          background: '#fff',
          padding: 24,
          borderRadius: 12,
          textAlign: 'center',
        }}>
          <h1>Embaixador não encontrado</h1>
          <button onClick={() => window.history.back()}>Voltar</button>
        </div>
      </div>
    )
  }

  if (!ambassador.is_published) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
      }}>
        <div style={{
          background: '#fff',
          padding: 24,
          borderRadius: 12,
          textAlign: 'center',
        }}>
          <h1>Este embaixador não está publicado</h1>
          <button onClick={() => window.history.back()}>Voltar</button>
        </div>
      </div>
    )
  }

  const bioColor = ambassador.bio_color || '#cbd5e1'
  const textColor = ambassador.text_color || '#fff'
  const bgColor = ambassador.background_color || '#1e293b'

  return (
    <div style={{
      background: bgColor,
      minHeight: '100vh',
      fontFamily: ambassador.font_family || 'system-ui',
      color: textColor,
    }}>
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: '20px',
      }}>
        {ambassador.cover_url && (
          <div style={{
            width: '100%',
            height: 200,
            background: `url(${ambassador.cover_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: 12,
            marginBottom: 20,
          }} />
        )}

        <div style={{
          textAlign: 'center',
          marginBottom: 32,
        }}>
          {ambassador.avatar_url && (
            <img
              src={ambassador.avatar_url}
              alt={ambassador.name}
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                marginBottom: 16,
                border: `3px solid ${bioColor}`,
              }}
            />
          )}
          <h1 style={{ margin: 0, marginBottom: 8, color: bioColor, fontSize: 28, fontWeight: 700 }}>
            {ambassador.name}
          </h1>
          {ambassador.bio && (
            <p style={{ margin: 0, color: textColor, fontSize: 14, opacity: 0.8 }}>
              {ambassador.bio}
            </p>
          )}
        </div>

        {(ambassador.email || ambassador.phone) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: ambassador.email && ambassador.phone ? '1fr 1fr' : '1fr',
            gap: 12,
            marginBottom: 24,
          }}>
            {ambassador.email && (
              <a
                href={`mailto:${ambassador.email}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  background: bioColor,
                  color: bgColor,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 10,
                }}
              >
                <FiMail size={18} />
                Email
              </a>
            )}

            {ambassador.phone && (
              <a
                href={`tel:${ambassador.phone}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  background: bioColor,
                  color: bgColor,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: 10,
                }}
              >
                <FiPhone size={18} />
                Ligar
              </a>
            )}
          </div>
        )}

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}>
          <h2 style={{ margin: '0 0 16px 0', color: bioColor, fontSize: 18, fontWeight: 700 }}>
            Deixe seu contacto
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input
              type="text"
              placeholder="Nome completo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: textColor,
                fontSize: 13,
              }}
            />

            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: textColor,
                fontSize: 13,
              }}
            />

            <input
              type="tel"
              placeholder="Telefone (opcional)"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: textColor,
                fontSize: 13,
              }}
            />

            {ambassador.show_interest_type && (
              <select
                value={formData.interest_type}
                onChange={(e) => setFormData({ ...formData, interest_type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.05)',
                  color: textColor,
                  fontSize: 13,
                }}
              >
                <option value="">Tipo de interesse (opcional)</option>
                <option value="Comprador">Comprador</option>
                <option value="Vendedor">Vendedor</option>
                <option value="Investidor">Investidor</option>
              </select>
            )}

            {ambassador.show_location && (
              <input
                type="text"
                placeholder="Localização (opcional)"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.05)',
                  color: textColor,
                  fontSize: 13,
                }}
              />
            )}

            {ambassador.show_budget && (
              <input
                type="text"
                placeholder="Orçamento (opcional)"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.05)',
                  color: textColor,
                  fontSize: 13,
                }}
              />
            )}

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

      <AmbassadorFloatingActions
        ambassadorUrl={typeof window !== 'undefined' ? window.location.href : ''}
        ambassadorName={ambassador.name}
        ambassadorId={ambassador.id}
        ambassadorEmail={ambassador.email}
        ambassadorPhone={ambassador.phone}
        ambassadorBio={ambassador.bio}
        buttonColor={ambassador.background_color || '#8B5CF6'}
      />
    </div>
  )
}
