'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import styles from './discount.module.css'

interface LeadMagnet {
  id: string
  title: string
  description: string | null
  capture_page_title: string
  capture_page_subtitle: string
  capture_page_image: string | null
  capture_page_button_text: string
  capture_page_success_message: string
  thank_you_message: string
  discount_config: any
  welcome_email_subject: string
  welcome_email_body: string
  card_id: string | null
}

export default function DiscountPage() {
  const params = useParams()
  const slug = Array.isArray((params as any).slug) ? (params as any).slug[0] : (params as any).slug
  const [magnet, setMagnet] = useState<LeadMagnet | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [consent, setConsent] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState(false)

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
        .eq('magnet_type', 'discount')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (data) {
        setMagnet(data)
        await supabase.rpc('increment_lead_magnet_views', { magnet_id: data.id })
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    // Validação básica: email obrigatório
    if (!formData.email) {
      setErrors({ email: 'Email é obrigatório' })
      return
    }

    if (!consent) {
      alert('Tens de autorizar para podermos entrar em contacto contigo.')
      return
    }

    setSubmitting(true)
    try {
      // Inserir lead
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .insert({
          lead_magnet_id: magnet?.id,
          email: formData.email,
          name: formData.name || 'Sem nome',
          phone: formData.phone,
          source: 'discount_magnet',
          card_id: magnet?.card_id,
        })
        .select()
        .single()

      if (leadError) throw leadError

      // Enviar email de boas-vindas com o código
      if (magnet?.welcome_email_body && magnet?.discount_config?.code) {
        const discountCode = magnet.discount_config.code
        const emailBody = magnet.welcome_email_body.replace('{codigo}', discountCode).replace('{nome}', formData.name || 'Utilizador')

        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: formData.email,
            subject: magnet.welcome_email_subject,
            html: emailBody,
            fromName: magnet.card_id ? `Kardme - ${magnet.title}` : 'Kardme',
          }),
        })
      }

      setSubmitted(true)
    } catch (e) {
      console.error(e)
      setErrors({ submit: 'Erro ao submeter. Tenta novamente.' })
    } finally {
      setSubmitting(false)
    }
  }

  function copyToClipboard() {
    const code = magnet?.discount_config?.code
    if (code) {
      navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return <div className={styles.container}>A carregar...</div>
  }

  if (!magnet) {
    return <div className={styles.container}>Campanha não encontrada</div>
  }

  if (submitted) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <h2 className={styles.successTitle}>🎉 Parabéns!</h2>
          <p className={styles.successMessage}>{magnet.thank_you_message}</p>

          <div className={styles.discountBox}>
            <div className={styles.discountLabel}>Código de Desconto</div>
            <div className={styles.discountCode}>{magnet.discount_config?.code}</div>
            <button onClick={copyToClipboard} className={styles.copyBtn}>
              {copied ? '✓ Copiado!' : 'Copiar Código'}
            </button>
          </div>

          {magnet.discount_config?.ctaUrl && (
            <a href={magnet.discount_config.ctaUrl} className={styles.ctaBtn}>
              Ativar Desconto
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {magnet.capture_page_image && (
          <img src={magnet.capture_page_image} alt={magnet.title} className={styles.image} />
        )}

        <h1 className={styles.title}>{magnet.capture_page_title}</h1>
        <p className={styles.subtitle}>{magnet.capture_page_subtitle}</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nome</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Teu nome"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email *</label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="teu@email.com"
              className={styles.input}
              required
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Telefone</label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+351 9XX XXX XXX"
              className={styles.input}
            />
          </div>

          {errors.submit && <div className={styles.error}>{errors.submit}</div>}

          <button type="submit" disabled={submitting} className={styles.submitBtn}>
            {submitting ? 'A processar...' : magnet.capture_page_button_text}
          </button>
        </form>
      </div>
    </div>
  )
}
