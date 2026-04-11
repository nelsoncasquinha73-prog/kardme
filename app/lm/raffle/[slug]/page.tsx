'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import styles from './raffle.module.css'

interface RaffleConfig {
  grid_size: number
  prize_description: string
  prize_image_url?: string
  winning_numbers?: number[]
}

interface LeadMagnet {
  id: string
  title: string
  description?: string
  cover_image_url?: string
  thank_you_message?: string
  welcome_email_subject?: string
  welcome_email_body?: string
  raffle_config: RaffleConfig
  user_id: string
  leads_count: number
  views_count: number
  slug: string
}

interface RaffleEntry {
  number_chosen: number
  is_winner: boolean
}

interface ModalData {
  number: number
  name: string
  email: string
  phone: string
  consent: boolean
}

export default function RafflePage() {
  const params = useParams()
  const slug = params.slug as string

  const [magnet, setMagnet] = useState<LeadMagnet | null>(null)
  const [entries, setEntries] = useState<RaffleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
  const [modal, setModal] = useState<ModalData>({ number: 0, name: '', email: '', phone: '', consent: false })
  const [alreadyParticipated, setAlreadyParticipated] = useState(false)

  useEffect(() => {
    if (slug) loadData()
  }, [slug])

  async function loadData() {
    setLoading(true)
    try {
      const { data: magnetData } = await supabase
        .from('lead_magnets')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (magnetData) {
        setMagnet(magnetData)
        await supabase.rpc('increment_lead_magnet_views', { magnet_id: magnetData.id })
        const { data: entriesData } = await supabase
          .from('raffle_entries')
          .select('number_chosen, is_winner')
          .eq('lead_magnet_id', magnetData.id)
        setEntries(entriesData || [])
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function handleNumberClick(num: number) {
    const taken = entries.find(e => e.number_chosen === num)
    if (taken) return
    setSelectedNumber(num)
    setModal({ number: num, name: '', email: '', phone: '', consent: false })
  }

  async function handleSubmit() {
    if (!modal.name.trim() || !modal.email.trim() || !modal.consent) return
    if (!magnet) return
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(modal.email)) return alert('Email inválido')

    setSubmitting(true)
    try {
      // Verificar se já participou
      const { data: existing } = await supabase
        .from('raffle_entries')
        .select('id')
        .eq('lead_magnet_id', magnet.id)
        .eq('email', modal.email.toLowerCase())
        .maybeSingle()

      if (existing) {
        setAlreadyParticipated(true)
        setSelectedNumber(null)
        setSubmitting(false)
        return
      }

      // Inserir entrada no sorteio
      const { error: entryError } = await supabase
        .from('raffle_entries')
        .insert([{
          lead_magnet_id: magnet.id,
          number_chosen: modal.number,
          name: modal.name.trim(),
          email: modal.email.toLowerCase().trim(),
          phone: modal.phone.trim() || null,
          consent_given: true,
          marketing_opt_in: true,
        }])

      if (entryError) {
        if (entryError.code === '23505') {
          alert('Este número já foi escolhido! Escolhe outro.')
          await loadData()
          setSelectedNumber(null)
          setSubmitting(false)
          return
        }
        throw entryError
      }

      // Chamar API capture para: criar lead no CRM + enviar emails (owner + boas-vindas)
      try {
        await fetch('/api/lead-magnets/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: magnet.slug,
            name: modal.name.trim(),
            email: modal.email.toLowerCase().trim(),
            phone: modal.phone.trim() || null,
            marketing_opt_in: true,
          }),
        })
      } catch (apiErr) {
        console.error('Erro ao chamar capture API:', apiErr)
        // Não bloqueia o fluxo — lead já foi registado no raffle_entries
      }

      setEntries(prev => [...prev, { number_chosen: modal.number, is_winner: false }])
      setSelectedNumber(null)
      setSubmitted(true)
    } catch (e: any) {
      alert('Erro: ' + e.message)
    }
    setSubmitting(false)
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
        <h1 style={{ color: '#fff', textAlign: 'center' }}>Sorteio não encontrado</h1>
      </div>
    </div>
  )

  if (alreadyParticipated) return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.alreadyCard}>
          <h1>⚠️ Já participaste!</h1>
          <p>Só é permitida uma participação por email. Boa sorte no sorteio!</p>
        </div>
      </div>
    </div>
  )

  if (submitted) return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.successCard}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎰</div>
          <h1>✅ Estás dentro!</h1>
          <div className={styles.successNumber}>{modal.number}</div>
          <p>{magnet.thank_you_message || 'A tua participação foi registada. Boa sorte!'}</p>
        </div>
      </div>
    </div>
  )

  const config = magnet.raffle_config || {}
  const gridSize = config.grid_size || 49
  const winningNumbers = config.winning_numbers || []
  const takenNumbers = new Set(entries.map(e => e.number_chosen))
  const available = gridSize - takenNumbers.size

  return (
    <div className={styles.container}>
      <div className={styles.particles}>
        {[...Array(20)].map((_, i) => (
          <div key={i} className={styles.particle} style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${4 + Math.random() * 4}s`,
          }} />
        ))}
      </div>

      <div className={styles.card}>
        {magnet.cover_image_url && (
          <img src={magnet.cover_image_url} alt={magnet.title} className={styles.coverImage} />
        )}

        <div className={styles.header}>
          <h1>{magnet.title}</h1>
          {config.prize_description && (
            <div className={styles.prize}>🏆 {config.prize_description}</div>
          )}
          {magnet.description && (
            <p className={styles.description}>{magnet.description}</p>
          )}
          <p className={styles.subtitle}>Escolhe o teu número da sorte!</p>
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={`${styles.statValue} ${styles.statValueGreen}`}>{available}</span>
            <span className={styles.statLabel}>Disponíveis</span>
          </div>
          <div className={styles.stat}>
            <span className={`${styles.statValue} ${styles.statValueRed}`}>{takenNumbers.size}</span>
            <span className={styles.statLabel}>Ocupados</span>
          </div>
          <div className={styles.stat}>
            <span className={`${styles.statValue} ${styles.statValueBlue}`}>{gridSize}</span>
            <span className={styles.statLabel}>Total</span>
          </div>
        </div>

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: 'rgba(139,92,246,0.3)', border: '2px solid rgba(139,92,246,0.5)' }} />
            Disponível
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.2)' }} />
            Ocupado
          </div>
          {winningNumbers.length > 0 && (
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: 'rgba(245,158,11,0.2)', border: '2px solid #f59e0b' }} />
              Vencedor
            </div>
          )}
        </div>

        <div className={styles.grid}>
          {[...Array(gridSize)].map((_, i) => {
            const num = i + 1
            const isWinner = winningNumbers.includes(num)
            const isTaken = takenNumbers.has(num)

            if (isWinner) return (
              <div key={num} className={styles.numberWinner}>⭐</div>
            )
            if (isTaken) return (
              <div key={num} className={styles.numberTaken}>{num}</div>
            )
            return (
              <div key={num} className={styles.number} onClick={() => handleNumberClick(num)}>
                {num}
              </div>
            )
          })}
        </div>
      </div>

      {selectedNumber !== null && (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) setSelectedNumber(null) }}>
          <div className={styles.modal}>
            <h2>🎰 Número escolhido</h2>
            <p className={styles.modalSubtitle}>Preenche os teus dados para confirmar a participação</p>
            <div className={styles.selectedNumber}>{selectedNumber}</div>

            <div className={styles.formGroup}>
              <label>Nome *</label>
              <input className={styles.input} type="text" placeholder="O teu nome" value={modal.name}
                onChange={e => setModal(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label>Email *</label>
              <input className={styles.input} type="email" placeholder="O teu email" value={modal.email}
                onChange={e => setModal(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label>Telefone (opcional)</label>
              <input className={styles.input} type="tel" placeholder="O teu telefone" value={modal.phone}
                onChange={e => setModal(p => ({ ...p, phone: e.target.value }))} />
            </div>

            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={modal.consent}
                onChange={e => setModal(p => ({ ...p, consent: e.target.checked }))} />
              Aceito receber comunicações sobre o prémio, promoções e publicidade.
            </label>

            <div className={styles.btnRow}>
              <button className={styles.btnCancel} onClick={() => setSelectedNumber(null)}>Cancelar</button>
              <button className={styles.btnSubmit} disabled={submitting || !modal.name || !modal.email || !modal.consent}
                onClick={handleSubmit}>
                {submitting ? 'A registar...' : '🎯 Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
