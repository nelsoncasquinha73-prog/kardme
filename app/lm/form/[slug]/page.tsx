'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { LeadMagnet, FormField } from '@/lib/crm/leadMagnets'
import styles from './form.module.css'

export default function FormPage() {
  const params = useParams()
  const [magnet, setMagnet] = useState<LeadMagnet | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadMagnet()
  }, [params.slug])

  async function loadMagnet() {
    setLoading(true)
    console.log("slug:", params.slug)
    try {
      const { data, error } = await supabase
        .from('lead_magnets')
        .select('*, lead_magnet_forms!lead_magnets_form_id_fkey(id, title, fields)')
        .eq('slug', params.slug)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (data) {
        // Mapear lead_magnet_forms.fields para form_fields
        const formWithFields = {
          ...data,
          form_fields: (data as any).lead_magnet_forms?.fields || []
        }
        setMagnet(formWithFields)
        // Incrementar views_count via RPC
        await supabase.rpc('increment_lead_magnet_views', { magnet_id: data.id })
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function shouldShowField(field: FormField): boolean {
    if (!field.showIf) return true

    const dependsOnValue = formData[field.showIf.fieldId]
    if (!dependsOnValue) return false

    if (Array.isArray(dependsOnValue)) {
      return dependsOnValue.includes(field.showIf.value)
    }

    return dependsOnValue === field.showIf.value
  }

  function validateField(field: FormField, value: any): string | null {
    if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return `${field.label} é obrigatório`
    }

    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return `${field.label} deve ser um email válido`
      }
    }

    if (field.type === 'tel' && value) {
      const telRegex = /^[\d\s\-\+$$]+$/
      if (!telRegex.test(value)) {
        return `${field.label} deve ser um telefone válido`
      }
    }

    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const newErrors: Record<string, string> = {}
    const visibleFields = (magnet?.form_fields || []).filter(shouldShowField)

    visibleFields.forEach((field) => {
      const error = validateField(field, formData[field.id])
      if (error) newErrors[field.id] = error
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    try {
      const formDataSummary = visibleFields
        .map((field) => {
          const value = formData[field.id]
          const displayValue = Array.isArray(value) ? value.join(', ') : value
          return `${field.label}: ${displayValue}`
        })
        .join('\n')

      const res = await fetch('/api/lead-magnets/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: magnet!.slug,
          formData,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error || 'Erro ao enviar formulário')
      }


      setSubmitted(true)
    } catch (e: any) {
      alert('Erro ao enviar: ' + e.message)
    }
    setSubmitting(false)
  }

  function handleFieldChange(fieldId: string, value: any) {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[fieldId]
      return next
    })
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>A carregar...</p>
        </div>
      </div>
    )
  }

  if (!magnet) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>Lead Magnet não encontrado</h1>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>✅ Obrigado!</h1>
          <p>{magnet.thank_you_message || 'A tua resposta foi guardada com sucesso.'}</p>
        </div>
      </div>
    )
  }

  const visibleFields = (magnet.form_fields || []).filter(shouldShowField)

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {magnet.cover_image_url && (
          <img src={magnet.cover_image_url} alt={magnet.title} className={styles.coverImage} />
        )}

        <h1>{magnet.title}</h1>
        {magnet.description && <p className={styles.description}>{magnet.description}</p>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {visibleFields.map((field) => (
            <div key={field.id} className={styles.formGroup}>
              <label htmlFor={field.id} className={styles.label}>
                {field.label}
                {field.required && <span className={styles.required}>*</span>}
              </label>

              {field.type === 'textarea' && (
                <textarea
                  id={field.id}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className={styles.textarea}
                />
              )}

              {['text', 'email', 'tel'].includes(field.type) && (
                <input
                  id={field.id}
                  type={field.type}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className={styles.input}
                />
              )}

              {field.type === 'select' && (
                <select
                  id={field.id}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className={styles.select}
                >
                  <option value="">Seleciona uma opção</option>
                  {(field.options || []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}

              {field.type === 'radio' && (
                <div className={styles.radioGroup}>
                  {(field.options || []).map((option) => (
                    <label key={option} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name={field.id}
                        value={option}
                        checked={formData[field.id] === option}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}

              {field.type === 'checkbox' && (
                <div className={styles.checkboxGroup}>
                  {(field.options || []).map((option) => (
                    <label key={option} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        value={option}
                        checked={(formData[field.id] || []).includes(option)}
                        onChange={(e) => {
                          const current = formData[field.id] || []
                          const updated = e.target.checked
                            ? [...current, option]
                            : current.filter((v: string) => v !== option)
                          handleFieldChange(field.id, updated)
                        }}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              )}

              {errors[field.id] && <p className={styles.error}>{errors[field.id]}</p>}
            </div>
          ))}

          <button type="submit" disabled={submitting} className={styles.submitButton}>
            {submitting ? 'A enviar...' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  )
}
