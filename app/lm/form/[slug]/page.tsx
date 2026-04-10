'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { FormField } from '@/lib/crm/leadMagnets'

interface LeadMagnet {
  id: string
  user_id: string
  title: string
  description: string | null
  cover_image_url: string | null
  thank_you_message: string | null
  form_id?: string
  views_count?: number
  leads_count?: number
}

interface Form {
  id: string
  fields: FormField[]
}

export default function FormPage() {
  const params = useParams()
  const slug = params.slug as string

  const [magnet, setMagnet] = useState<LeadMagnet | null>(null)
  const [form, setForm] = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadMagnet()
  }, [slug])

  async function loadMagnet() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('lead_magnets')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error) throw error
      if (!data) throw new Error('Campanha não encontrada')

      setMagnet(data)

      // Incrementar views
      await supabase
        .from('lead_magnets')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', data.id)

      // Carregar formulário
      if (data.form_id) {
        const { data: formData, error: formError } = await supabase
          .from('lead_magnet_forms')
          .select('*')
          .eq('id', data.form_id)
          .single()

        if (!formError && formData) {
          setForm(formData)
          // Inicializar formData com campos vazios
          const initial: Record<string, string> = {}
          formData.fields.forEach((field: FormField) => {
            initial[field.id] = ''
          })
          setFormData(initial)
        }
      }
    } catch (e: any) {
      console.error(e)
    }
    setLoading(false)
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}

    if (form) {
      form.fields.forEach((field) => {
        const value = formData[field.id]?.trim()

        if (field.required && !value) {
          newErrors[field.id] = `${field.label} é obrigatório`
        }

        if (value && field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            newErrors[field.id] = 'Email inválido'
          }
        }

        if (value && field.type === 'tel') {
          const telRegex = /^[\d\s\-\+$$]+$/
          if (!telRegex.test(value)) {
            newErrors[field.id] = 'Telefone inválido'
          }
        }
      })
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) return

    setSubmitting(true)
    try {
      if (!magnet) throw new Error('Campanha não encontrada')

      // Criar lead
      const formattedResponses = form?.fields
        .map((field) => `${field.label}: ${formData[field.id] || '—'}`)
        .join('\n') || ''
      
      const notesText = `Capturado via: ${magnet.title}\n\nRespostas do formulário:\n${formattedResponses}`

      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert([
          {
            user_id: magnet.user_id || '',
            card_id: null,
            name: formData['name'] || '',
            email: formData['email'] || '',
            phone: formData['phone'] || '',
            notes: notesText,
            form_data: formData,
          },
        ])
        .select()
        .single()

      if (leadError) throw leadError

      // Incrementar leads_count
      await supabase
        .from('lead_magnets')
        .update({ leads_count: (magnet.leads_count || 0) + 1 })
        .eq('id', magnet.id)

      // Criar activity log
      await supabase.from('lead_activities').insert([
        {
          lead_id: lead.id,
          activity_type: 'form_submission',
          description: `Preencheu formulário: ${magnet.title}`,
          created_at: new Date().toISOString(),
        },
      ])

      setSubmitted(true)
    } catch (e: any) {
      alert('Erro ao submeter: ' + e.message)
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ color: 'rgba(255,255,255,0.5)' }}>A carregar...</div>
      </div>
    )
  }

  if (!magnet) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
        <div style={{ color: '#ef4444', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <h1 style={{ color: '#fff', margin: '0 0 8px' }}>Campanha não encontrada</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Esta campanha pode ter sido removida ou o link está incorreto.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>✅</div>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: '0 0 12px' }}>Obrigado!</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            {magnet.thank_you_message || 'O teu pedido foi recebido com sucesso.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: 20 }}>
      <div style={{ maxWidth: 500, margin: '0 auto', paddingTop: 40, paddingBottom: 40 }}>
        {magnet.cover_image_url && (
          <img
            src={magnet.cover_image_url}
            alt={magnet.title}
            style={{ width: '100%', borderRadius: 12, marginBottom: 24, maxHeight: 200, objectFit: 'cover' }}
          />
        )}

        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: '0 0 8px' }}>{magnet.title}</h1>
        {magnet.description && (
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
            {magnet.description}
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {form?.fields.map((field) => (
            <div key={field.id}>
              <label style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>
                {field.label}
                {field.required && <span style={{ color: '#ef4444' }}> *</span>}
              </label>
              <input
                type={field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : 'text'}
                value={formData[field.id] || ''}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, [field.id]: e.target.value }))
                  if (errors[field.id]) {
                    setErrors((prev) => {
                      const newErrors = { ...prev }
                      delete newErrors[field.id]
                      return newErrors
                    })
                  }
                }}
                placeholder={field.label}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  height: 44,
                  borderRadius: 10,
                  border: errors[field.id] ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                  fontSize: 13,
                  background: 'rgba(255,255,255,0.07)',
                  color: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {errors[field.id] && (
                <p style={{ fontSize: 11, color: '#ef4444', margin: '4px 0 0' }}>{errors[field.id]}</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '14px 0',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg,#10b981,#059669)',
              color: '#fff',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              marginTop: 8,
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? '⏳ A enviar...' : '✓ Enviar'}
          </button>
        </form>

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', margin: '24px 0 0' }}>
          Protegido por Kardme
        </p>
      </div>
    </div>
  )
}
