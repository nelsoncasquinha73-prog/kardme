'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { LeadMagnetForm } from '@/lib/crm/formBuilder'

interface LeadMagnetData {
  id: string
  title: string
  description: string
  cover_image_url: string
  thank_you_message: string
  form_fields: LeadMagnetForm
  magnet_type: string
}

export default function FormLandingPage() {
  const params = useParams()
  const slug = params.slug as string

  const [magnet, setMagnet] = useState<LeadMagnetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadMagnet()
  }, [slug])

  async function loadMagnet() {
    try {
      const res = await fetch(`/api/lead-magnets/get/${slug}`)
      if (!res.ok) throw new Error('Lead magnet not found')
      const data = await res.json()
      setMagnet(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar formulário')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/lead-magnets/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_magnet_id: magnet?.id,
          responses: answers,
        }),
      })

      if (!res.ok) throw new Error('Erro ao submeter formulário')

      setSubmitted(true)
      setAnswers({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao submeter')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>A carregar...</div>
  if (error || !magnet) return <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Erro: {error || 'Formulário não encontrado'}</div>
  if (submitted) return <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 48, marginBottom: 20 }}>✅</div><h1>Obrigado!</h1><p style={{ color: 'rgba(255,255,255,0.7)' }}>{magnet.thank_you_message}</p></div></div>

  const form = magnet.form_fields as LeadMagnetForm
  const questions = form.questions || []

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '40px 20px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {magnet.cover_image_url && (
          <img
            src={magnet.cover_image_url}
            alt={magnet.title}
            style={{ width: '100%', height: 300, objectFit: 'cover', borderRadius: 12, marginBottom: 32 }}
          />
        )}

        <h1 style={{ color: '#fff', fontSize: 32, marginBottom: 12 }}>{magnet.title}</h1>

        {magnet.description && (
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, marginBottom: 32 }}>
            {magnet.description}
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {questions.map((q) => (
            <div key={q.id}>
              <label style={{ display: 'block', color: '#fff', marginBottom: 8, fontWeight: 600 }}>
                {q.question}
                {q.is_required && <span style={{ color: '#f87171' }}> *</span>}
              </label>

              {q.description && (
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 8 }}>
                  {q.description}
                </p>
              )}

              {q.type === 'text' && (
                <input
                  type="text"
                  placeholder={q.placeholder || ''}
                  value={(answers[q.id || ''] as string) || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [q.id || '']: e.target.value }))}
                  required={q.is_required}
                  style={inputStyle}
                />
              )}

              {q.type === 'email' && (
                <input
                  type="email"
                  placeholder={q.placeholder || 'seu@email.com'}
                  value={(answers[q.id || ''] as string) || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [q.id || '']: e.target.value }))}
                  required={q.is_required}
                  style={inputStyle}
                />
              )}

              {q.type === 'textarea' && (
                <textarea
                  placeholder={q.placeholder || ''}
                  value={(answers[q.id || ''] as string) || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [q.id || '']: e.target.value }))}
                  required={q.is_required}
                  style={{ ...inputStyle, minHeight: 120 }}
                />
              )}

              {q.type === 'date' && (
                <input
                  type="date"
                  value={(answers[q.id || ''] as string) || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [q.id || '']: e.target.value }))}
                  required={q.is_required}
                  style={inputStyle}
                />
              )}

              {q.type === 'single_choice' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(q.options || []).map((opt) => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.value}
                        checked={(answers[q.id || ''] as string) === opt.value}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [q.id || '']: e.target.value }))}
                        required={q.is_required}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'multiple_choice' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(q.options || []).map((opt) => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
                      <input
                        type="checkbox"
                        value={opt.value}
                        checked={((answers[q.id || ''] as string[]) || []).includes(opt.value)}
                        onChange={(e) => {
                          const current = ((answers[q.id || ''] as string[]) || [])
                          const next = e.target.checked ? [...current, opt.value] : current.filter((v) => v !== opt.value)
                          setAnswers(prev => ({ ...prev, [q.id || '']: next }))
                        }}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'rating' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAnswers(prev => ({ ...prev, [q.id || '']: String(n) }))}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: (answers[q.id || ''] as string) === String(n) ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '12px 24px',
              borderRadius: 8,
              border: '1px solid rgba(34, 197, 94, 0.4)',
              background: 'rgba(34, 197, 94, 0.2)',
              color: '#86efac',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: 16,
              fontWeight: 600,
              marginTop: 24,
            }}
          >
            {submitting ? 'A enviar...' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  fontSize: 14,
  fontFamily: 'inherit',
} as const
