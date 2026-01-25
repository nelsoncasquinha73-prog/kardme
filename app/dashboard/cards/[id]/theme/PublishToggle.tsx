'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

type PublishToggleProps = {
  cardId: string
  initialPublished: boolean
}

export default function PublishToggle({ cardId, initialPublished }: PublishToggleProps) {
  const [published, setPublished] = useState(initialPublished)
  const [loading, setLoading] = useState(false)
  const [planExpired, setPlanExpired] = useState(false)
  const [expiryDate, setExpiryDate] = useState<string | null>(null)

  useEffect(() => {
    checkPlanStatus()
  }, [])

  async function checkPlanStatus() {
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user?.id) return

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('plan_expires_at')
        .eq('id', authData.user.id)
        .single()

      if (error) {
        console.error('Erro ao carregar plano:', error)
        return
      }

      if (profile?.plan_expires_at) {
        const expiryTime = new Date(profile.plan_expires_at).getTime()
        const nowTime = new Date().getTime()

        if (nowTime > expiryTime) {
          setPlanExpired(true)
          setExpiryDate(new Date(profile.plan_expires_at).toLocaleDateString('pt-PT'))
        } else {
          setPlanExpired(false)
          setExpiryDate(null)
        }
      }
    } catch (err) {
      console.error('Erro ao verificar plano:', err)
    }
  }

  async function togglePublish() {
    if (planExpired) {
      alert(`❌ Plano expirou em ${expiryDate}. Renova o plano para publicar cartões.`)
      return
    }

    setLoading(true)

    const { data, error } = await supabase.rpc('publish_card', {
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
    <div style={{ display: 'grid', gap: 8 }}>
      <button
        onClick={togglePublish}
        disabled={loading || planExpired}
        style={{
          padding: '6px 12px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: planExpired ? '#999' : published ? '#4CAF50' : '#f44336',
          color: 'white',
          cursor: planExpired ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontSize: '14px',
          opacity: planExpired ? 0.6 : 1,
        }}
      >
        {loading ? 'A guardar...' : published ? 'Despublicar' : 'Publicar'}
      </button>

      {planExpired && (
        <div
          style={{
            background: 'rgba(244, 67, 54, 0.15)',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 12,
            color: 'rgba(244, 67, 54, 0.95)',
          }}
        >
          ⚠️ Plano expirou em <strong>{expiryDate}</strong>
        </div>
      )}
    </div>
  )
}
