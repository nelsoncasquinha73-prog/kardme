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
    
    const { data, error } = await supabase
      .rpc('publish_card', {
        card_id: cardId,
        should_publish: !published,
      })

    if (error) {
      alert('Erro: ' + error.message)
      setLoading(false)
      return
    }

    if (data?.success) {
      setPublished(data.published)
      alert(published ? 'Cartão despublicado ✅' : 'Cartão publicado ✅')
    } else {
      alert('Erro: ' + (data?.error || 'Desconhecido'))
    }

    setLoading(false)
  }

  return (
    <button
      onClick={togglePublish}
      disabled={loading}
      style={{
        padding: '6px 12px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: published ? '#4CAF50' : '#f44336',
        color: 'white',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
      }}
    >
      {loading ? 'A guardar...' : published ? 'Despublicar' : 'Publicar'}
    </button>
  )
}
