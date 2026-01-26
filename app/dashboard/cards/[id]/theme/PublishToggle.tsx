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
  const [slug, setSlug] = useState<string | null>(null)
  const [editingSlug, setEditingSlug] = useState(false)
  const [newSlug, setNewSlug] = useState('')
  const [slugLoading, setSlugLoading] = useState(false)

  useEffect(() => {
    checkPlanStatus()
    if (initialPublished) {
      loadSlug()
    }
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

  async function loadSlug() {
    try {
      const { data: card, error } = await supabase
        .from('cards')
        .select('slug')
        .eq('id', cardId)
        .single()

      if (error) {
        console.error('Erro ao carregar slug:', error)
        return
      }

      setSlug(card?.slug || null)
      setNewSlug(card?.slug || '')
    } catch (err) {
      console.error('Erro ao carregar slug:', err)
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
      if (data.published) {
        await loadSlug()
        alert('Cartão publicado ✅')
      } else {
        alert('Cartão despublicado ✅')
      }
    } else {
      alert('Erro: ' + (data?.error || 'Desconhecido'))
    }

    setLoading(false)
  }

  async function updateSlug() {
    if (!newSlug || newSlug === slug) {
      setEditingSlug(false)
      return
    }

    setSlugLoading(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      if (!accessToken) throw new Error('Sessão inválida')

      const res = await fetch('/api/cards/update-slug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ cardId, newSlugRaw: newSlug }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Erro ao guardar slug')

      setSlug(json.newSlug)
      setNewSlug(json.newSlug)
      setEditingSlug(false)
      alert('Link atualizado com sucesso ✅')
    } catch (e: any) {
      alert('Erro: ' + (e.message || 'Desconhecido'))
      setNewSlug(slug || '')
    } finally {
      setSlugLoading(false)
    }
  }

  function copyToClipboard() {
    if (slug) {
      const fullUrl = `${window.location.origin}/${slug}`
      navigator.clipboard.writeText(fullUrl)
      alert('Link copiado para a área de transferência ✅')
    }
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
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

      {published && slug && (
        <div
          style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 8,
            padding: '12px',
            fontSize: 13,
            color: '#111827',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>🔗 Link do teu cartão</div>
          <p style={{ margin: '0 0 10px 0', lineHeight: 1.5, opacity: 0.8 }}>
            Este é o teu link pessoal deste cartão, aquele que vais partilhar para acederem ao teu cartão. Se alterares o link, quem tiver o link antigo (QR code/cartão impresso) pode deixar de conseguir aceder.
          </p>

          {!editingSlug ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                value={`${window.location.origin}/${slug}`}
                readOnly
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(0,0,0,0.15)',
                  fontSize: 12,
                  backgroundColor: '#f9fafb',
                  color: '#374151',
                }}
              />
              <button
                onClick={copyToClipboard}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid rgba(0,0,0,0.15)',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                }}
              >
                Copiar
              </button>
              <button
                onClick={() => {
                  setEditingSlug(true)
                  setNewSlug(slug)
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid rgba(0,0,0,0.15)',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                }}
              >
                Alterar link
              </button>
            </div>
          ) : (
            <div>
              <div
                style={{
                  background: 'rgba(244, 67, 54, 0.15)',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  marginBottom: 10,
                  fontSize: 12,
                  color: 'rgba(244, 67, 54, 0.95)',
                }}
              >
                ⚠️ Alterar o link pode quebrar links existentes (cartões de visita, QR codes, etc.)
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="novo-link"
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(0,0,0,0.15)',
                    fontSize: 12,
                    color: '#374151',
                  }}
                />
                <button
                  onClick={updateSlug}
                  disabled={slugLoading}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: 'none',
                    backgroundColor: '#111827',
                    color: '#fff',
                    cursor: slugLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                    opacity: slugLoading ? 0.6 : 1,
                  }}
                >
                  {slugLoading ? 'A guardar...' : 'Confirmar'}
                </button>
                <button
                  onClick={() => {
                    setEditingSlug(false)
                    setNewSlug(slug || '')
                  }}
                  disabled={slugLoading}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid rgba(0,0,0,0.15)',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {published && !slug && (
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
          ⚠️ Erro ao carregar link. Tenta publicar de novo.
        </div>
      )}

      {!published && (
        <div
          style={{
            background: 'rgba(156, 163, 175, 0.15)',
            border: '1px solid rgba(156, 163, 175, 0.3)',
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 12,
            color: 'rgba(107, 114, 128, 0.95)',
          }}
        >
          O link será criado quando publicares este cartão.
        </div>
      )}
    </div>
  )
}
