'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import styles from '../../discount/[slug]/discount.module.css'

export default function EventLandingPage() {
  const params = useParams()
  const slug = params.slug as string

  const [magnet, setMagnet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({ email: '', phone: '', name: '' })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const fetchMagnet = async () => {
      try {
        const res = await fetch(`/api/lead-magnets/public/${slug}`)
        if (!res.ok) throw new Error('Lead magnet não encontrado')
        const data = await res.json()
        setMagnet(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchMagnet()
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/lead-magnets/capture/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          name: formData.name,
          magnet_id: magnet.id,
        }),
      })
      if (!res.ok) throw new Error('Erro ao submeter formulário')
      setSubmitted(true)
      setFormData({ email: '', phone: '', name: '' })
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) return <div className={styles.container}>A carregar...</div>
  if (error) return <div className={styles.container}>Erro: {error}</div>
  if (!magnet) return <div className={styles.container}>Lead magnet não encontrado</div>

  const cfg = magnet.event_config || {}
  const showCta = cfg.showCtaButton && cfg.ctaUrl

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* HERO */}
        <div className={styles.hero}>
          <h1 className={styles.title}>{magnet.title || 'Evento'}</h1>
          <p className={styles.subtitle}>{magnet.subtitle || ''}</p>
        </div>

        {/* DETALHES DO EVENTO */}
        <div style={{ padding: '20px 0', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
                TIPO
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
                {cfg.eventType === 'presentation'
                  ? 'Apresentação'
                  : cfg.eventType === 'event'
                  ? 'Evento'
                  : 'Webinar'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
                DATA & HORA
              </div>
              <div style={{ fontSize: 14, color: '#fff' }}>
                {cfg.startAt ? new Date(cfg.startAt).toLocaleString('pt-PT') : '—'}
              </div>
              {cfg.endAt && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                  até {new Date(cfg.endAt).toLocaleString('pt-PT')}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
                LOCAL
              </div>
              <div style={{ fontSize: 14, color: '#fff' }}>
                {cfg.locationType === 'in_person' ? 'Presencial' : 'Online'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
                {cfg.locationType === 'in_person' ? 'MORADA' : 'LINK'}
              </div>
              <div style={{ fontSize: 14, color: '#fff', wordBreak: 'break-word' }}>
                {cfg.locationType === 'in_person'
                  ? cfg.address || '—'
                  : cfg.joinUrl
                  ? (
                      <a href={cfg.joinUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>
                        Aceder ao evento →
                      </a>
                    )
                  : '—'}
              </div>
            </div>

            {typeof cfg.capacity === 'number' && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
                  CAPACIDADE
                </div>
                <div style={{ fontSize: 14, color: '#fff' }}>{cfg.capacity} lugares</div>
              </div>
            )}
          </div>
        </div>

        {/* FORMULÁRIO */}
        {!submitted ? (
          <form onSubmit={handleSubmit} style={{ marginTop: 30 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', display: 'block', marginBottom: 6 }}>
                Nome *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', display: 'block', marginBottom: 6 }}>
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', display: 'block', marginBottom: 6 }}>
                Telefone *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+351 9xx xxx xxx"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 800,
                cursor: 'pointer',
                marginBottom: 12,
              }}
            >
              Inscrever-me no Evento
            </button>

          </form>
        ) : (
          <div style={{ marginTop: 30, padding: 20, borderRadius: 10, background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#22c55e', marginBottom: 8 }}>
              ✓ Inscrição confirmada!
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
              Receberá um email de confirmação com os detalhes do evento.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
