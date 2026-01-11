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
}

export default function DashboardPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)

  const loadCards = async () => {
    const { data } = await supabase
      .from('cards')
      .select('*')
      .order('created_at', { ascending: true })

    if (data) setCards(data)
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

      {cards.length === 0 && <p>Ainda não tens cartões</p>}

      <ul style={{ marginTop: 20 }}>
        {cards.map(card => (
          <li key={card.id}>
            <strong>{card.name}</strong><br />
            {card.job} {card.company && `· ${card.company}`}<br />
            <small>kardme.com/{card.slug}</small>
          </li>
        ))}
      </ul>
    </div>
  )
}
