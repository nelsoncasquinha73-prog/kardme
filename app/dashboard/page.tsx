'use client'

import '@/styles/dashboard.css'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Link from 'next/link'

type Card = {
  id: string
  name: string
  job: string | null
  company: string | null
  slug: string
  user_id: string | null
}

export default function DashboardPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCards = async () => {
    setLoading(true)
    setError(null)

    const { data: authData, error: authErr } = await supabase.auth.getUser()
    if (authErr) {
      setError(authErr.message)
      setLoading(false)
      return
    }

    const userId = authData?.user?.id
    if (!userId) {
      setError('Sem sessão. Faz login novamente.')
      setLoading(false)
      return
    }

    const { data, error: cardsErr } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (cardsErr) {
      setError(cardsErr.message)
      setCards([])
    } else {
      setCards((data || []) as Card[])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadCards()
  }, [])

  const hasCards = cards.length > 0

  const subtitle = useMemo(() => {
    if (loading) return 'A carregar…'
    if (error) return 'Não foi possível carregar os teus cartões.'
    if (!hasCards) return 'Cria o teu primeiro cartão e partilha num só link.'
    return `${cards.length} cartão(ões) na tua conta`
  }, [loading, error, hasCards, cards.length])

  if (loading) return <p style={{ padding: 24 }}>A carregar cartões…</p>

  return (
    <div className="dashboard-wrap">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">{subtitle}</p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link className="btn-secondary" href="/dashboard/templates">
            Ver templates
          </Link>
          <Link className="btn-primary" href="/dashboard/cards/new">
            + Criar cartão
          </Link>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {!error && !hasCards && (
        <div className="empty">
          <p className="empty-title">Cria o teu primeiro cartão em 60 segundos</p>
          <p className="empty-desc">
            Escolhe um template premium, adiciona os teus dados e partilha o link.  
            Mais tarde podes ativar NFC, analytics e leads.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn-primary" href="/dashboard/cards/new">
              Criar cartão grátis
            </Link>
            <Link className="btn-secondary" href="/dashboard/templates">
              Escolher template
            </Link>
          </div>
        </div>
      )}

      {hasCards && (
        <div className="cards-grid">
          {cards.map((card) => (
            <Link key={card.id} className="card-tile" href={`/dashboard/cards/${card.id}/theme`}>
              <p className="card-name">{card.name}</p>
              <p className="card-meta">
                {(card.job || '—')}{card.company ? ` · ${card.company}` : ''}
              </p>
              <div className="card-link">kardme.com/{card.slug}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
