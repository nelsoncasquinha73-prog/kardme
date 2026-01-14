'use client'

import { useEffect, useState } from 'react'
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

  if (loading) return <p>A carregar cartões…</p>

  return (
    <div>
      <h1>Os meus cartões</h1>

      <Link href="/dashboard/cards/new">+ Criar cartão</Link>

      {error && <p style={{ color: 'crimson', marginTop: 12 }}>{error}</p>}

      {!error && cards.length === 0 && (
        <div style={{ marginTop: 16 }}>
          <p>Ainda não tens cartões.</p>
          <Link href="/dashboard/templates">Escolher um template</Link>
        </div>
      )}

      {cards.length > 0 && (
        <ul style={{ marginTop: 20 }}>
          {cards.map((card) => (
            <li key={card.id}>
              <strong>{card.name}</strong>
              <br />
              {card.job} {card.company && `· ${card.company}`}
              <br />
              <small>kardme.com/{card.slug}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
