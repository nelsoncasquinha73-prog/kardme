'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import styles from './wheel.module.css'
import PremiumWheelCanvas from '@/components/PremiumWheelCanvas'

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

// ✅ HAMILTON METHOD - Distribuição exata de 100 slots sem distorção
function hamiltonMethod(slices: WheelSlice[]): WheelSlice[] {
  // Fallback: se percentages não somam 100, normaliza
  const totalPercentage = slices.reduce((sum, s) => sum + (Number((s as any).percentage) || 0), 0)
  const normalizedSlices = totalPercentage === 0 
    ? slices.map(s => ({ ...s, percentage: 100 / slices.length }))
    : totalPercentage !== 100
    ? slices.map(s => ({ ...s, percentage: (Number((s as any).percentage) || 0) * (100 / totalPercentage) }))
    : slices

  const bucket: WheelSlice[] = []
  const slots = normalizedSlices.map((s, i) => ({
    slice: s,
    index: i,
    percentage: Number((s as any).percentage) || 0,
    whole: 0,
    remainder: 0,
  }))

  // 1) Calcular inteiros e restos
  let totalWhole = 0
  for (const slot of slots) {
    slot.whole = Math.floor(slot.percentage)
    slot.remainder = slot.percentage - slot.whole
    totalWhole += slot.whole
  }

  // 2) Distribuir inteiros
  for (const slot of slots) {
    for (let i = 0; i < slot.whole; i++) {
      bucket.push(slot.slice)
    }
  }

  // 3) Distribuir os slots restantes (até 100) pelos maiores restos
  const remaining = 100 - totalWhole
  if (remaining > 0) {
    const sorted = slots
      .map((s, i) => ({ ...s, origIndex: i }))
      .sort((a, b) => b.remainder - a.remainder)
    for (let i = 0; i < remaining && i < sorted.length; i++) {
      bucket.push(sorted[i].slice)
    }
  }

  return bucket.slice(0, 100)
}

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
  const [prizes, setPrizes] = useState<WheelSlice[]>([])
  const [confetti, setConfetti] = useState<{x:number;y:number;color:string;size:number;speed:number;angle:number}[]>([])
  const [wheelSize, setWheelSize] = useState(420)

  useEffect(() => { if (slug) loadData() }, [slug])

  useEffect(() => {
    function computeSize() {
      const vw = window.innerWidth
      const size = Math.max(340, Math.min(520, Math.floor(vw * 0.72)))
      setWheelSize(size)
    }
    computeSize()
    window.addEventListener('resize', computeSize)
    return () => window.removeEventListener('resize', computeSize)
  }, [])

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

  
    const bucket = hamiltonMethod(slices)
    // Escolher vencedor determinístico (se houver contador) ou aleatório (fallback)
    const pos = (typeof newTotal === 'number' ? (newTotal - 1) : Math.floor(Math.random() * 100)) % 100
    const winner = bucket[pos] ?? slices[Math.floor(Math.random() * slices.length)]
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
      rotationRef.current = rot
      if (t < 1) { animFrameRef.current = requestAnimationFrame(animate) }
      else {
        rotationRef.current = finalRot
        setResult(winner); setSpinning(false)
        spawnConfetti(winner.is_prize)
        if (winner.is_prize) {
          setPrizes(prev => [...prev, winner])
          if (leadId) notifyWinner(winner.label)
        }
        const newCount = spinCount + 1
        setSpinCount(newCount)
        if (leadId) incrementSpinCount(leadId, newCount)
        if (newCount >= maxSpins) {
          setExhausted(true)
          setStep('result')
        } else {
          setTimeout(() => { setResult(null); setStep('spin'); setTimeout(() => // wheel drawn by component, 50) }, 2500)
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
    setTimeout(() => // wheel drawn by component, 50)
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
        {magnet.cover_image_url && step !== 'result' && <img src={magnet.cover_image_url} alt={magnet.title} className={styles.coverImage} />}
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
              <PremiumWheelCanvas slices={getSlices()} rotation={rotationRef.current} wheelSize={wheelSize} />
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
        {step === 'result' && (exhausted || spinsLeft <= 0) && (
          <div className={styles.resultSection}>
            {prizes.length > 0 ? (
              <>
                <div className={styles.resultIcon}>🎉</div>
                <h2 className={styles.resultTitle}>Parabéns!</h2>
                <p style={{color:'rgba(255,255,255,0.7)',marginBottom:12}}>Ganhaste {prizes.length} prémio{prizes.length > 1 ? 's' : ''}:</p>
                <div style={{display:'flex',flexDirection:'column',gap:8,width:'100%',alignItems:'center'}}>
                  {prizes.map((p,i) => (
                    <div key={i} className={styles.resultBadge} style={{background:`linear-gradient(135deg, ${p.color}, ${p.color}dd)`,boxShadow:`0 4px 24px ${p.color}66`}}>{p.label}</div>
                  ))}
                </div>
                <p className={styles.resultMessage}>{magnet.thank_you_message || 'Os teus prémios foram registados! Entraremos em contacto em breve.'}</p>
              </>
            ) : (
              <>
                <div className={styles.resultIcon}>😔</div>
                <h2 className={styles.resultTitle}>Não foi desta vez...</h2>
                <p className={styles.resultMessage}>{magnet.thank_you_message || 'Obrigado por participares! Fica atento às próximas oportunidades.'}</p>
              </>
            )}
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
