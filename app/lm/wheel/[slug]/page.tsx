'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import styles from './wheel.module.css'

interface WheelSlice { id: string; label: string; color: string; is_prize: boolean }
interface WheelConfig { slices: WheelSlice[]; capture_before_spin: boolean; max_spins_per_email: number }
interface LeadMagnet { id: string; title: string; description?: string; cover_image_url?: string; thank_you_message?: string; wheel_config: WheelConfig; user_id: string; slug: string }

const DEFAULT_SLICES: WheelSlice[] = [
  { id: '1', label: '🏆 Prémio Principal', color: '#f59e0b', is_prize: true },
  { id: '2', label: 'Tenta outra vez', color: '#4b5563', is_prize: false },
  { id: '3', label: '🎁 Brinde Surpresa', color: '#8b5cf6', is_prize: true },
  { id: '4', label: 'Quase!', color: '#374151', is_prize: false },
  { id: '5', label: '🥈 2º Prémio', color: '#10b981', is_prize: true },
  { id: '6', label: 'Tenta outra vez', color: '#4b5563', is_prize: false },
]

export default function WheelPage() {
  const params = useParams()
  const slug = params.slug as string
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotationRef = useRef(0)
  const animFrameRef = useRef<number>(0)
  const [magnet, setMagnet] = useState<LeadMagnet | null>(null)
  const [loading, setLoading] = useState(true)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<WheelSlice | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', consent: false })
  const [step, setStep] = useState<'form' | 'spin' | 'result'>('form')
  const [leadCaptured, setLeadCaptured] = useState(false)
  const [leadId, setLeadId] = useState<string | null>(null)
  const [spinCount, setSpinCount] = useState(0)
  const [maxSpins, setMaxSpins] = useState(1)
  const [exhausted, setExhausted] = useState(false)
  const [confetti, setConfetti] = useState<{x:number;y:number;color:string;size:number;speed:number;angle:number}[]>([])

  useEffect(() => { if (slug) loadData() }, [slug])

  async function loadData() {
    setLoading(true)
    try {
      const { data } = await supabase.from('lead_magnets').select('*').eq('slug', slug).eq('is_active', true).single()
      if (data) {
        setMagnet(data)
        await supabase.rpc('increment_lead_magnet_views', { magnet_id: data.id })
        const max = data.wheel_config?.max_spins_per_email || 1
        setMaxSpins(max)
        if ((data.wheel_config || {}).capture_before_spin === false) setStep('spin')
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const getSlices = useCallback(() => magnet?.wheel_config?.slices?.length ? magnet.wheel_config.slices : DEFAULT_SLICES, [magnet])

  function lightenColor(hex: string, amount: number): string {
    try {
      const num = parseInt(hex.replace('#', ''), 16)
      return `rgb(${Math.min(255,(num>>16)+amount)},${Math.min(255,((num>>8)&0xff)+amount)},${Math.min(255,(num&0xff)+amount)})`
    } catch { return hex }
  }

  const drawWheel = useCallback((rot: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const slices = magnet?.wheel_config?.slices?.length ? magnet.wheel_config.slices : DEFAULT_SLICES
    const n = slices.length
    const arc = (2 * Math.PI) / n
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const R = cx - 8
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const glowGrad = ctx.createRadialGradient(cx, cy, R-10, cx, cy, R+8)
    glowGrad.addColorStop(0, 'rgba(245,158,11,0.6)')
    glowGrad.addColorStop(1, 'rgba(245,158,11,0)')
    ctx.beginPath(); ctx.arc(cx, cy, R+6, 0, 2*Math.PI); ctx.fillStyle = glowGrad; ctx.fill()
    ctx.beginPath(); ctx.arc(cx, cy, R+2, 0, 2*Math.PI); ctx.strokeStyle = 'rgba(245,158,11,0.8)'; ctx.lineWidth = 3; ctx.stroke()
    slices.forEach((slice, i) => {
      const start = rot + i * arc; const end = start + arc; const mid = start + arc / 2
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
      grad.addColorStop(0, lightenColor(slice.color, 40)); grad.addColorStop(1, slice.color)
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, start, end); ctx.closePath(); ctx.fillStyle = grad; ctx.fill()
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, start, end); ctx.closePath(); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5; ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + R*Math.cos(start), cy + R*Math.sin(start)); ctx.strokeStyle = 'rgba(245,158,11,0.5)'; ctx.lineWidth = 1; ctx.stroke()
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(mid); ctx.textAlign = 'right'; ctx.fillStyle = '#fff'
      ctx.font = `bold ${n > 8 ? 11 : 13}px Inter, sans-serif`; ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 6
      const maxLen = n > 8 ? 12 : 16
      ctx.fillText(slice.label.length > maxLen ? slice.label.substring(0, maxLen)+'…' : slice.label, R-14, 5); ctx.restore()
    })
    const innerGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 40)
    innerGrad.addColorStop(0, '#1a1a2e'); innerGrad.addColorStop(1, '#0f0f1a')
    ctx.beginPath(); ctx.arc(cx, cy, 38, 0, 2*Math.PI); ctx.fillStyle = innerGrad; ctx.fill()
    ctx.strokeStyle = 'rgba(245,158,11,0.6)'; ctx.lineWidth = 2; ctx.stroke()
    ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🎡', cx, cy)
  }, [magnet])

  useEffect(() => { if (magnet && (step === 'spin')) drawWheel(rotationRef.current) }, [magnet, step, drawWheel])

  function spawnConfetti(isPrize: boolean) {
    if (!isPrize) return
    const colors = ['#f59e0b','#8b5cf6','#10b981','#ef4444','#3b82f6','#ec4899']
    setConfetti(Array.from({ length: 60 }, () => ({ x: Math.random()*100, y: -10, color: colors[Math.floor(Math.random()*colors.length)], size: 4+Math.random()*8, speed: 1+Math.random()*3, angle: Math.random()*360 })))
    setTimeout(() => setConfetti([]), 4000)
  }

  async function incrementSpinCount(currentLeadId: string) {
        const newCount = spinCount + 1
        setSpinCount(newCount)
    setSpinCount(newCount)
    await supabase.from('leads').update({ spin_count: newCount }).eq('id', currentLeadId)
  }

  async function handleSpin() {
    if (spinning || !magnet) return
    setSpinning(true)
    const slices = getSlices(); const n = slices.length; const arc = (2*Math.PI)/n
    const prizes = slices.filter(s => s.is_prize); const nonPrizes = slices.filter(s => !s.is_prize)
    const winPrize = Math.random() < 0.35 && prizes.length > 0
    const winner = winPrize ? prizes[Math.floor(Math.random()*prizes.length)] : nonPrizes.length > 0 ? nonPrizes[Math.floor(Math.random()*nonPrizes.length)] : slices[Math.floor(Math.random()*slices.length)]
    const winnerIndex = slices.findIndex(s => s.id === winner.id)
    const targetSliceAngle = winnerIndex * arc + arc / 2
    const targetRot = -Math.PI/2 - targetSliceAngle
    const spins = 6 + Math.random()*4
    const finalRot = rotationRef.current + spins*2*Math.PI + (targetRot - ((rotationRef.current + spins*2*Math.PI) % (2*Math.PI)) + 2*Math.PI) % (2*Math.PI)
    const duration = 5000; const startTime = performance.now(); const startRot = rotationRef.current
    function easeOutQuart(t: number) { return 1 - Math.pow(1-t, 4) }
    function animate(now: number) {
      const t = Math.min((now - startTime) / duration, 1)
      const rot = startRot + (finalRot - startRot) * easeOutQuart(t)
      rotationRef.current = rot; drawWheel(rot)
      if (t < 1) { animFrameRef.current = requestAnimationFrame(animate) }
      else {
        rotationRef.current = finalRot; drawWheel(finalRot)
        setResult(winner); setSpinning(false)
        spawnConfetti(winner.is_prize); if (winner.is_prize && leadId) notifyWinner(winner.label)
        const currentLeadId = leadId
        if (currentLeadId) incrementSpinCount(currentLeadId)
        const newCount = spinCount + 1
        setSpinCount(newCount)
        if (winner.is_prize || newCount >= maxSpins) {
          setExhausted(true)
          setStep('result')
        } else {
          setTimeout(() => { setResult(null); setStep('spin'); setTimeout(() => drawWheel(rotationRef.current), 50) }, 2500)
        }
      }
    }
    animFrameRef.current = requestAnimationFrame(animate)
  }

  async function captureLeadAPI(prizeWon?: string): Promise<string | null> {
    if (!magnet || !form.email) return null
    try {
      const res = await fetch('/api/lead-magnets/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: magnet.slug, name: form.name, email: form.email, phone: form.phone || null, marketing_opt_in: form.consent, wheel_prize: prizeWon || '' }),
      })
      const json = await res.json()
      setLeadCaptured(true)
      return json?.lead_id || null
    } catch (e) { console.error(e); return null }
  }

  async function handleFormSubmit() {
    if (!form.name.trim() || !form.email.trim() || !form.consent) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { alert('Email inválido'); return }
    if (!magnet) return
    const { data: existing } = await supabase.from('leads').select('id, spin_count').eq('email', form.email.toLowerCase()).eq('lead_magnet_id', magnet.id).maybeSingle()
    if (existing) {
      const usedSpins = existing.spin_count || 1
      if (usedSpins >= maxSpins) {
        setExhausted(true)
        setStep('result')
        return
      }
      setLeadId(existing.id)
      setSpinCount(usedSpins)
      setLeadCaptured(true)
      setStep('spin')
      return
    }
    const id = await captureLeadAPI()
    if (id) setLeadId(id)
    setStep('spin')
  }

  async function notifyWinner(prizeLabel: string) {
    if (!magnet || !leadId) return
    try {
      await fetch("/api/lead-magnets/wheel-winner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead_id: leadId, slug: magnet.slug, prize_label: prizeLabel }) })
    } catch (e) { console.error(e) }
  }

  function handleTryAgain() {
    setResult(null)
    setStep('spin')
    setTimeout(() => drawWheel(rotationRef.current), 50)
  }

  const spinsLeft = maxSpins - spinCount

  if (loading) return <div className={styles.container}><div className={styles.card}><p style={{color:'rgba(255,255,255,0.5)',textAlign:'center',padding:40}}>A carregar...</p></div></div>
  if (!magnet) return <div className={styles.container}><div className={styles.card}><h1 style={{color:'#fff',textAlign:'center',padding:40}}>Roleta não encontrada</h1></div></div>

  return (
    <div className={styles.container}>
      <div className={styles.particles}>
        {[...Array(12)].map((_,i) => <div key={i} className={styles.particle} style={{left:`${(i*8)+2}%`,top:`${(i*7+10)%100}%`,animationDelay:`${i*0.5}s`,animationDuration:`${5+i%4}s`}} />)}
      </div>
      {confetti.map((c,i) => <div key={i} className={styles.confettiPiece} style={{left:`${c.x}%`,background:c.color,width:c.size,height:c.size*0.6,animationDuration:`${c.speed}s`,animationDelay:`${(i%5)*0.1}s`,transform:`rotate(${c.angle}deg)`}} />)}
      <div className={styles.card}>
        {magnet.cover_image_url && step !== 'result' && <img src={
magnet.cover_image_url} alt={magnet.title} className={styles.coverImage} />}
        <div className={styles.header}>
          <h1>{magnet.title}</h1>
          {magnet.description && <p className={styles.description}>{magnet.description}</p>}
        </div>
        {step === 'form' && (
          <div className={styles.formSection}>
            <p className={styles.formTitle}>🎡 Preenche os teus dados para girar!</p>
            <div className={styles.formGroup}><label>Nome *</label><input className={styles.input} type="text" placeholder="O teu nome" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} /></div>
            <div className={styles.formGroup}><label>Email *</label><input className={styles.input} type="email" placeholder="O teu email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} /></div>
            <div className={styles.formGroup}><label>Telefone (opcional)</label><input className={styles.input} type="tel" placeholder="O teu telefone" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} /></div>
            <label className={styles.checkboxLabel}><input type="checkbox" checked={form.consent} onChange={e => setForm(p => ({...p, consent: e.target.checked}))} /> Aceito receber comunicações e promoções.</label>
            <button className={styles.btnSpin} disabled={!form.name || !form.email || !form.consent} onClick={handleFormSubmit}>🎡 Quero girar a roleta!</button>
          </div>
        )}
        {step === 'spin' && (
          <div className={styles.wheelSection}>
            {maxSpins > 1 && (
              <div className={styles.spinsCounter}>
                {Array.from({length: maxSpins}).map((_,i) => (
                  <div key={i} className={`${styles.spinDotIndicator} ${i < spinCount ? styles.spinDotUsed : styles.spinDotAvailable}`} />
                ))}
                <span style={{color:'rgba(255,255,255,0.5)',fontSize:'0.8rem',marginLeft:8}}>{spinsLeft} tentativa{spinsLeft !== 1 ? 's' : ''} restante{spinsLeft !== 1 ? 's' : ''}</span>
              </div>
            )}
            <div className={styles.wheelWrapper}>
              <div className={styles.pointer}>
                <svg width="32" height="40" viewBox="0 0 32 40">
                  <defs>
                    <linearGradient id="ptrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24"/>
                      <stop offset="100%" stopColor="#d97706"/>
                    </linearGradient>
                    <filter id="ptrShadow"><feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.5"/></filter>
                  </defs>
                  <polygon points="16,36 4,8 28,8" fill="url(#ptrGrad)" filter="url(#ptrShadow)" stroke="#92400e" strokeWidth="1"/>
                  <circle cx="16" cy="12" r="4" fill="#fef3c7" stroke="#92400e" strokeWidth="1"/>
                </svg>
              </div>
              <canvas ref={canvasRef} width={340} height={340} className={styles.canvas} />
            </div>
            <button className={styles.btnSpin} onClick={handleSpin} disabled={spinning}>
              {spinning ? <span className={styles.spinningText}><span className={styles.spinDot}>●</span><span className={styles.spinDot}>●</span><span className={styles.spinDot}>●</span></span> : '🎡 Girar a Roleta!'}
            </button>
          </div>
        )}
        {step === 'result' && result && !exhausted && spinsLeft > 0 && (
          <div className={styles.resultSection}>
            <div className={styles.resultIcon}>😔</div>
            <h2 className={styles.resultTitle}>Não foi desta vez...</h2>
            <div className={styles.resultBadge} style={{background:`linear-gradient(135deg, ${result.color}, ${result.color}dd)`,boxShadow:`0 4px 24px ${result.color}66`}}>{result.label}</div>
            <p className={styles.resultMessage}>Ainda tens <strong style={{color:'#f59e0b'}}>{spinsLeft} tentativa{spinsLeft !== 1 ? 's' : ''}</strong> restante{spinsLeft !== 1 ? 's' : ''}!</p>
            <button className={styles.btnSpin} onClick={handleTryAgain}>🎡 Tentar outra vez!</button>
          </div>
        )}
        {step === 'result' && result && (exhausted || spinsLeft <= 0) && (
          <div className={styles.resultSection}>
            <div className={styles.resultIcon}>{result.is_prize ? '🎉' : '😔'}</div>
            <h2 className={styles.resultTitle}>{result.is_prize ? 'Parabéns!' : 'Não foi desta vez...'}</h2>
            <div className={styles.resultBadge} style={{background:`linear-gradient(135deg, ${result.color}, ${result.color}dd)`,boxShadow:`0 4px 24px ${result.color}66`}}>{result.label}</div>
            <p className={styles.resultMessage}>{magnet.thank_you_message || (result.is_prize ? 'O teu prémio foi registado! Entraremos em contacto em breve.' : 'Obrigado por participares! Fica atento às próximas oportunidades.')}</p>
          </div>
        )}
        {step === 'result' && !result && exhausted && (
          <div className={styles.resultSection}>
            <div className={styles.resultIcon}>⚠️</div>
            <h2 className={styles.resultTitle}>Já esgotaste as tuas tentativas!</h2>
            <p className={styles.resultMessage}>Obrigado por participares!</p>
          </div>
        )}
      </div>
    </div>
  )
}
