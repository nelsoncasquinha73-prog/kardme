'use client'

// deploy ping

import { useEffect, useState } from 'react'
import { MagnetType, MAGNET_TYPE_LABELS } from '@/lib/crm/leadMagnets'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)



type LeadMagnet = {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  magnet_type: MagnetType
  file_url: string | null
  thank_you_message: string | null
  is_active: boolean
  custom_type_label?: string | null
  show_download_button?: boolean
  download_button_text?: string
  capture_page_button_text?: string | null
  capture_page_subtitle?: string | null
  success_message?: string | null
  show_success_message?: boolean
}

export default function LeadMagnetPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [magnet, setMagnet] = useState<LeadMagnet | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [submitting, setSubmitting] = useState(false)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [thankYou, setThankYou] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', marketing_opt_in: false })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    loadMagnet()
    trackView()
  }, [slug])

  async function loadMagnet() {
    const { data, error } = await supabasePublic
      .from('lead_magnets')
      .select('id, title, description, cover_image_url, magnet_type, file_url, thank_you_message, is_active, show_download_button, download_button_text, capture_page_button_text, capture_page_subtitle')
      .eq('slug', slug)
      .single()

    if (error || !data || !data.is_active) {
      setNotFound(true)
    } else {
      setMagnet(data)
    }
    setLoading(false)
  }

  async function trackView() {
    await supabasePublic.rpc('increment_magnet_views', { magnet_slug: slug })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.marketing_opt_in) {
      setError('Por favor preenche todos os campos e aceita as comunicações.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/lead-magnets/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, name: form.name, email: form.email, phone: form.phone, marketing_opt_in: form.marketing_opt_in }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao submeter. Tenta novamente.')
        return
      }
      setFileUrl(data.file_url)
      setThankYou(data.thank_you_message)
      setStep('success')
    } catch {
      setError('Erro de ligação. Tenta novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ color: '#94a3b8', fontSize: 16 }}>A carregar...</div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 24, color: '#f1f5f9', marginBottom: 8 }}>Página não encontrada</h1>
        <p>Este link pode ter expirado ou sido desativado.</p>
      </div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24,
        overflow: 'hidden',
      }}>

        {magnet?.cover_image_url && (
          <div style={{ width: '100%', overflow: 'hidden', borderRadius: '24px 24px 0 0' }}>
            <img
              src={magnet.cover_image_url}
              alt={magnet.title}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        )}

        <div style={{ padding: '32px 32px 40px' }}>
          {step === 'form' ? (
            <>


              <h1 style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#f1f5f9',
                marginBottom: 12,
                lineHeight: 1.3,
              }}>
                {magnet?.title}
              </h1>

              {magnet?.capture_page_subtitle && (
                <p style={{
                  fontSize: 16,
                  color: '#cbd5e1',
                  marginBottom: 28,
                  lineHeight: 1.6,
                  fontWeight: 500,
                }}>
                  {magnet.capture_page_subtitle}
                </p>
              )}


              {magnet?.description &&
                !magnet.capture_page_subtitle &&
                magnet.description.replace(/\s+/g, ' ').trim() !== (magnet.capture_page_subtitle || '').replace(/\s+/g, ' ').trim() && (
                  <p style={{
                    fontSize: 15,
                    color: '#94a3b8',
                    marginBottom: 28,
                    lineHeight: 1.6,
                  }}>
                    {magnet.description}
                  </p>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input
                    type="text"
                    placeholder="O teu nome"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                    style={{
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.07)',
                      color: '#f1f5f9',
                      fontSize: 15,
                      outline: 'none',
                    }}
                  />
                  <input
                    type="email"
                    placeholder="O teu email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                    style={{
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.07)',
                      color: '#f1f5f9',
                      fontSize: 15,
                      outline: 'none',
                    }}
                  />
                  <input
                    type="tel"
                    placeholder="Telefone" required
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.07)',
                      color: '#f1f5f9',
                      fontSize: 15,
                      outline: 'none',
                    }}
                  />

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginTop: 4 }}>
                    <input
                      type="checkbox"
                      checked={form.marketing_opt_in}
                      onChange={e => setForm(f => ({ ...f, marketing_opt_in: e.target.checked }))}
                      style={{ marginTop: 3, accentColor: '#6366f1', width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.4 }}>
                      Aceito receber comunicações por email com dicas e novidades relevantes.
                    </span>
                  </label>

                  {error && (
                    <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      marginTop: 8,
                      padding: '16px',
                      borderRadius: 12,
                      border: 'none',
                      background: submitting ? '#4f46e5' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#fff',
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      opacity: submitting ? 0.7 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {submitting ? 'A enviar...' : magnet?.capture_page_button_text || '📥 Quero acesso gratuito'}
                  </button>
                </div>
              </form>

              <p style={{ fontSize: 12, color: '#475569', textAlign: 'center', marginTop: 16 }}>
                🔒 Os teus dados estão seguros. Sem spam.
              </p>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>
                {thankYou || 'Obrigado!'}
              </h2>
              {magnet?.show_success_message !== false && (
              <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 28 }}>
                {magnet?.success_message || ""}
              </p>
              )}
              {magnet?.show_download_button && fileUrl && (
                <a
                  href={fileUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '16px 32px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  {magnet?.download_button_text || '📥 Fazer Download'}
                </a>
              )}
              <p style={{ fontSize: 12, color: '#475569', marginTop: 24 }}>
                Powered by <strong style={{ color: '#6366f1' }}>Kardme</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
