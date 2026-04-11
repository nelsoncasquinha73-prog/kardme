'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import styles from './wheel.module.css'

interface WheelSlice {
  id: string
  label: string
  color: string
  is_prize: boolean
}

interface WheelConfig {
  slices: WheelSlice[]
  capture_before_spin: boolean
  max_spins_per_email: number
}

interface LeadMagnet {
  id: string
  title: string
  description?: string
  cover_image_url?: string
  thank_you_message?: string
  welcome_email_subject?: string
  welcome_email_body?: string
  wheel_config: WheelConfig
  user_id: string
  slug: string
}

const DEFAULT_SLICES: WheelSlice[] = [
  { id: '1', label: '🏆 Prémio Principal', color: '#f59e0b', is_prize: true },
  { id: '2', label: 'Tenta outra vez', color: '#6b7280', is_prize: false },
  { id: '3', label: '🎁 Brinde Surpresa', color: '#8b5cf6', is_prize: true },
  { id: '4', label: 'Quase!', color: '#6b7280', is_prize: false },
  { id: '5', label: '🥈 2º Prémio', color: '#10b981', is_prize: true },
  { id: '6', label: 'Tenta outra vez', color: '#6b7280', is_prize: false },
]

export default function WheelPage() {
  const params = useParams()
  const slug = params.slug as string
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [magnet, setMagnet] = useState<LeadMagnet | null>(null)
  const [loading, setLoading] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<WheelSlice | null>(null)
  const [rotation, setRotation] = useState(0)
  const [form, setForm] = useState({ name: '', email: '', phone: '', consent: false })
  const [step, setStep] = useState<'form' | 'spin' | 'result'>('form')
  const [leadCaptured, setLeadCaptured] = useState(false)
  const [alreadyPlayed, setAlreadyPlayed] = useState(false)
  const [currentRotation, setCurrentRotation] = useState(0)

  useEffect(() => {
    if (slug) loadData()
  }, [slug])

  async function loadData() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('lead_magnets')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (data) {
        setMagnet(data)
        await supabase.rpc('increment_lead_magnet_views', { magnet_id: data.id })
        // Se capture_before_spin é false, mostra a roleta primeiro
        const config = data.wheel_config || {}
        if (!config.capture_before_spin) setStep('spin')
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (magnet) drawWheel(currentRotation)
  }, [magnet, currentRotation])

  function getSlices(): WheelSlice[] {
    return magnet?.wheel_config?.slices?.length ? magnet.wheel_config.slices : DEFAULT_SLICES
  }

  function drawWheel(rot: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const slices = getSlices()
    const numSlices = slices.length
    const arc = (2 * Math.PI) / numSlices
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const radius = cx - 10

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Sombra exterior
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 20
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI)
    ctx.fillStyle = '#1a1a2e'
    ctx.fill()
    ctx.restore()

    slices.forEach((slice, i) => {
      const startAngle = rot + i * arc
      const endAngle = startAngle + arc

      // Fatia
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = slice.color
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Texto
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(startAngle + arc / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 13px Inter, sans-serif'
      ctx.shadowColor = 'rgba(0,0,0,0.8)'
      ctx.shadowBlur = 4
      const maxLen = 14
      const label = slice.label.length > maxLen ? slice.label.substring(0, maxLen) + '…' : slice.label
      ctx.fillText(label, radius - 12, 5)
      ctx.restore()
    })

    // Centro
    ctx.beginPath()
    ctx.arc(cx, cy, 28, 0, 2 * Math.PI)
    ctx.fillStyle = '#0f0f1a'
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 3
    ctx.stroke()

    // Ícone centro
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 18px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🎡', cx, cy)
  }

  async function handleSpin() {
    if (spinning || !magnet) return

    const config = magnet.wheel_config || {}
    const captureFirst = config.capture_before_spin !== false

    // Se precisa capturar primeiro e ainda não capturou
    if (captureFirst && !leadCaptured) {
      setStep('form')
      return
    }

    setSpinning(true)
    const slices = getSlices()
    const numSlices = slices.length
    const arc = (2 * Math.PI) / numSlices

    // Escolher fatia vencedora (weighted por is_prize)
    const prizes = slices.filter(s => s.is_prize)
    const nonPrizes = slices.filter(s => !s.is_prize)
    const winPrize = Math.random() < 0.4 && prizes.length > 0
    const winner = winPrize
      ? prizes[Math.floor(Math.random() * prizes.length)]
      : nonPrizes.length > 0
        ? nonPrizes[Math.floor(Math.random() * nonPrizes.length)]
        : slices[Math.floor(Math.random() * slices.length)]

    const winnerIndex = slices.findIndex(s => s.id === winner.id)

    // Calcular rotação final
    const targetAngle = -(winnerIndex * arc + arc / 2)
    const spins = 5 + Math.random() * 3
    const finalRotation = currentRotation + spins * 2 * Math.PI + targetAngle - (currentRotation % (2 * Math.PI))

    // Animar
    const duration = 4000
    const start = performance.now()
    const startRot = currentRotation

    function animate(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Easing out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const rot = startRot + (finalRotation - startRot) * eased
      setCurrentRotation(rot)
      drawWheel(rot)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCurrentRotation(finalRotation)
        setResult(winner)
        setStep('result')
        setSpinning(false)

        // Capturar lead se ainda não foi capturada
        if (!leadCaptured && form.email) {
          captureLeadAPI(winner.label)
        }
      }
    }

    requestAnimationFrame(animate)
  }

  async function captureLeadAPI(prizeWon?: string) {
    if (!magnet || !form.email) return
    try {
      await fetch('/api/lead-magnets/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: magnet.slug,
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          marketing_opt_in: form.consent,
          wheel_prize: prizeWon || '',
        }),
      })
      setLeadCaptured(true)
    } catch (e) {
      console.error(e)
    }
  }

  async function handleFormSubmit() {
    if (!form.name.trim() || !form.email.trim() || !form.consent) return
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) return alert('Email inválido')
    if (!magnet) return

    // Verificar se já jogou
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('email', form.email.toLowerCase())
      .eq('lead_magnet_id', magnet.id)
      .maybeSingle()

    if (existing) {
      setAlreadyPlayed(true)
      return
    }

    const config = magnet.wheel_config || {}
    if (config.capture_before_spin !== false) {
      await captureLeadAPI()
    }
    setStep('spin')
  }

  if (loading) return (
    <div className={styles.container}>
      <div className={styles.card}>
        <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>A carregar...</p>
      </div>
    </div>
  )

  if (!magnet) return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 style={{ color: '#fff', textAlign: 'center' }}>Roleta não encontrada</h1>
      </div>
    </div>
  )

  if (alreadyPlayed) return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.alreadyCard}>
          <h1>⚠️ Já participaste!</h1>
          <p>Só é permitida uma participação por email. Obrigado!</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className={styles.container}>
      <div className={styles.particles}>
        {[...Array(20)].map((_, i) => (
          <div key={i} className={styles.particle} style={{
            left: `\${Math.random() * 100}%`,
            top: `\${Math.random() * 100}%`,
            animationDelay: `\${Math.random() * 6}s`,
            animationDuration: `\${4 + Math.random() * 4}s`,
          }} />
        ))}
      </div>

      <div className={styles.card}>
        {magnet.cover_image_url && step !== 'result' && (
          <img src={magnet.cover_image_url} alt={magnet.title} className={styles.coverImage} />
        )}

        <div className={styles.header}>
          <h1>{magnet.title}</h1>
          {magnet.description && <p className={styles.description}>{magnet.description}</p>}
        </div>

        {step === 'form' && (
          <div className={styles.formSection}>
            <p className={styles.formTitle}>Preenche os teus dados para girar a roleta!</p>
            <div className={styles.formGroup}>
              <label>Nome *</label>
              <input className={styles.input} type="text" placeholder="O teu nome" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label>Email *</label>
              <input className={styles.input} type="email" placeholder="O teu email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label>Telefone (opcional)</label>
              <input className={styles.input} type="tel" placeholder="O teu telefone" value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={form.consent}
                onChange={e => setForm(p => ({ ...p, consent: e.target.checked }))} />
              Aceito receber comunicações e promoções.
            </label>
            <button className={styles.btnSpin}
              disabled={!form.name || !form.email || !form.consent}
              onClick={handleFormSubmit}>
              🎡 Quero girar!
            </button>
          </div>
        )}

        {step === 'spin' && (
          <div className={styles.wheelSection}>
            <div className={styles.wheelWrapper}>
              <div className={styles.pointer}>▼</div>
              <canvas ref={canvasRef} width={320} height={320} className={styles.canvas} />
            </div>
            <button className={styles.btnSpin} onClick={handleSpin} disabled={spinning}>
              {spinning ? '🎡 A girar...' : '🎡 Girar!'}
            </button>
          </div>
        )}

        {step === 'result' && result && (
          <div className={styles.resultSection}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>
              {result.is_prize ? '🎉' : '😢'}
            </div>
            <h2>{result.is_prize ? 'Parabéns!' : 'Quase!'}</h2>
            <div className={styles.resultBadge} style={{ background: result.color }}>
              {result.label}
</div>
            <p>{magnet.thank_you_message || (result.is_prize ? 'O teu prémio foi registado! Entraremos em contacto em breve.' : 'Não foi desta vez. Obrigado por participares!')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
