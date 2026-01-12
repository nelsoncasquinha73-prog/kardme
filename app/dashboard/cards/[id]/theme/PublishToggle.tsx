'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type PublishToggleProps = {
  cardId: string
  initialPublished: boolean
}

export default function PublishToggle({ cardId, initialPublished }: PublishToggleProps) {
  const [published, setPublished] = useState(initialPublished)
  const [loading, setLoading] = useState(false)

  async function togglePublish() {
    setLoading(true)
    const { error } = await supabase
      .from('cards')
      .update({ published: !published })
      .eq('id', cardId)

    if (!error) setPublished(!published)
    else alert('Erro ao atualizar estado de publicação')

    setLoading(false)
  }

  return (
    <button onClick={togglePublish} disabled={loading} style={{
      padding: '6px 12px',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: published ? '#4CAF50' : '#f44336',
      color: 'white',
      cursor: 'pointer',
      fontWeight: 'bold',
      fontSize: '14px',
    }}>
      {published ? 'Despublicar' : 'Publicar'}
    </button>
  )
}
