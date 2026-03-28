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
    interest_type: '', // Comprar, Vender, Alugar
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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: 40,
        }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 800,
            color: '#fff',
            marginBottom: 8,
          }}>
            {ambassador.name}
          </h1>
          <p style={{
            fontSize: 14,
            color: '#94a3b8',
            marginBottom: 20,
          }}>
            {ambassador.bio || 'Embaixador Kardme'}
          </p>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            alignItems: 'center',
            marginBottom: 30,
          }}>
            {ambassador.email && (
              <a href={`mailto:${ambassador.email}`} style={{
                color: '#60a5fa',
                textDecoration: 'none',
                fontSize: 13,
              }}>
                📧 {ambassador.email}
              </a>
            )}
            {ambassador.phone && (
              <a href={`tel:${ambassador.phone}`} style={{
                color: '#60a5fa',
                textDecoration: 'none',
                fontSize: 13,
              }}>
                📱 {ambassador.phone}
              </a>
            )}
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: 32,
          backdropFilter: 'blur(10px)',
        }}>
          <h2 style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#fff',
            marginBottom: 24,
          }}>
            Deixe seu contacto
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input
              type="text"
              placeholder="Nome completo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
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
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
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
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            />

            <select
              value={formData.interest_type}
              onChange={(e) => setFormData({ ...formData, interest_type: e.target.value })}
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
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
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
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
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: 13,
                fontFamily: 'inherit',
              }}
            />

            <textarea
              placeholder="Mensagem (opcional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: 13,
                fontFamily: 'inherit',
                minHeight: 100,
                resize: 'vertical',
              }}
            />

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#cbd5e1',
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
              }}
            >
              {submitting ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: 40,
          color: '#64748b',
          fontSize: 12,
        }}>
          <p>Powered by Kardme</p>
        </div>
      </div>
    </div>
  )
}
