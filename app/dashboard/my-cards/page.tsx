'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type CardRow = {
  id: string
  name: string | null
  slug: string | null
  published: boolean | null
  created_at: string | null
  network_enabled: boolean
}

export default function MyCardsPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<CardRow[]>([])
  const [q, setQ] = useState('')
  const [publishingId, setPublishingId] = useState<string | null>(null)

  const loadCards = async () => {
    setLoading(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session) {
        router.push('/login')
        return
      }

      const userId = sessionData.session.user.id

      const { data: cards, error } = await supabase
        .from('cards')
        .select(`
          id,
          name,
          slug,
          published,
          created_at,
          card_network_listings (
            is_enabled
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const normalized: CardRow[] = (cards ?? []).map((card: any) => ({
        id: card.id,
        name: card.name,
        slug: card.slug,
        published: card.published,
        created_at: card.created_at,
        network_enabled: Array.isArray(card.card_network_listings)
          ? card.card_network_listings[0]?.is_enabled ?? false
          : card.card_network_listings?.is_enabled ?? false,
      }))

      setRows(normalized)
    } catch (e: any) {
      alert('Erro ao carregar cartões: ' + (e?.message || 'Desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCards()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()

    if (!query) return rows

    return rows.filter((r) => {
      const name = r.name ?? ''
      const slug = r.slug ?? ''

      return (
        name.toLowerCase().includes(query) ||
        slug.toLowerCase().includes(query)
      )
    })
  }, [rows, q])

  const deleteCard = async (card: CardRow) => {
    if (
      !window.confirm(
        `Tens a certeza que queres apagar "${card.name || 'Sem nome'}"? Esta ação não pode ser desfeita.`
      )
    ) {
      return
    }

    try {
      setPublishingId(card.id)

      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', card.id)

      if (error) throw error

      setRows((prev) => prev.filter((r) => r.id !== card.id))

      alert('Cartão apagado com sucesso!')
    } catch (e: any) {
      alert('Erro ao apagar cartão: ' + (e?.message || 'Desconhecido'))
    } finally {
      setPublishingId(null)
    }
  }

  const togglePublish = async (card: CardRow) => {
    try {
      if (!card?.id) return

      setPublishingId(card.id)

      const nextPublished = !card.published

      const { error } = await supabase
        .from('cards')
        .update({ published: nextPublished })
        .eq('id', card.id)

      if (error) throw error

      setRows((prev) =>
        prev.map((r) =>
          r.id === card.id
            ? { ...r, published: nextPublished }
            : r
        )
      )
    } catch (e: any) {
      alert(
        'Erro ao atualizar publicação: ' +
          (e?.message || 'Desconhecido')
      )
    } finally {
      setPublishingId(null)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24, color: '#fff' }}>
        A carregar cartões…
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, color: '#fff' }}>
            Os Meus Cartões
          </h1>

          <p
            style={{
              margin: '6px 0 0',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            Total: {rows.length} cartões
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Procurar cartão…"
            style={{
              width: 300,
              maxWidth: '100%',
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
            }}
          />

          <Link
            href="/dashboard/cards/new"
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: '#22c55e',
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 14,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            + Criar do Zero
          </Link>

          <Link
            href="/dashboard/catalog"
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              border: 'none',
              background: '#3b82f6',
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 14,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            📚 Ver Catálogo
          </Link>
        </div>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 12 }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: 1100,
          }}
        >
          <thead>
            <tr
              style={{
                textAlign: 'left',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
              }}
            >
              <th style={{ padding: 12, color: '#fff' }}>Nome</th>
              <th style={{ padding: 12, color: '#fff' }}>Slug</th>
              <th style={{ padding: 12, color: '#fff' }}>Estado</th>

              <th style={{ padding: 12, color: '#fff' }}>
                Kardme Network
              </th>

              <th style={{ padding: 12, color: '#fff' }}>Data</th>
              <th style={{ padding: 12, color: '#fff' }}>Ações</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: 24,
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.5)',
                  }}
                >
                  Nenhum cartão encontrado
                </td>
              </tr>
            ) : (
              filtered.map((card) => (
                <tr
                  key={card.id}
                  style={{
                    borderBottom:
                      '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <td style={{ padding: 12, color: '#fff' }}>
                    {card.name || '(sem nome)'}
                  </td>

                  <td
                    style={{
                      padding: 12,
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: 13,
                    }}
                  >
                    {card.slug
                      ? `kardme.com/${card.slug}`
                      : '—'}
                  </td>

                  <td style={{ padding: 12 }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        background: card.published
                          ? '#10b981'
                          : '#6366f1',
                        color: 'white',
                      }}
                    >
                      {card.published
                        ? '✓ Publicado'
                        : '○ Rascunho'}
                    </span>
                  </td>

                  <td style={{ padding: 12 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          background: card.network_enabled
                            ? 'rgba(34,197,94,0.16)'
                            : 'rgba(255,255,255,0.06)',
                          color: card.network_enabled
                            ? '#22c55e'
                            : 'rgba(255,255,255,0.65)',
                          border: card.network_enabled
                            ? '1px solid rgba(34,197,94,0.35)'
                            : '1px solid rgba(255,255,255,0.10)',
                        }}
                      >
                        {card.network_enabled
                          ? '🌐 Ativo'
                          : 'Inativo'}
                      </span>

                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/cards/${card.id}/network`
                          )
                        }
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: 'none',
                          background: '#0ea5e9',
                          color: 'white',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: 12,
                        }}
                      >
                        Configurar
                      </button>
                    </div>
                  </td>

                  <td
                    style={{
                      padding: 12,
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: 13,
                    }}
                  >
                    {card.created_at
                      ? new Date(
                          card.created_at
                        ).toLocaleDateString('pt-PT')
                      : '-'}
                  </td>

                  <td style={{ padding: 12 }}>
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/cards/${card.id}/theme`
                          )
                        }
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: 'none',
                          background: '#6366f1',
                          color: 'white',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: 12,
                        }}
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => togglePublish(card)}
                        disabled={publishingId === card.id}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: 'none',
                          background: card.published
                            ? '#ef4444'
                            : '#22c55e',
                          color: 'white',
                          fontWeight: 700,
                          cursor:
                            publishingId === card.id
                              ? 'not-allowed'
                              : 'pointer',
                          fontSize: 12,
                          opacity:
                            publishingId === card.id ? 0.7 : 1,
                        }}
                      >
                        {publishingId === card.id
                          ? 'A atualizar…'
                          : card.published
                          ? 'Despublicar'
                          : 'Publicar'}
                      </button>

                      {card.slug ? (
                        <a
                          href={`https://kardme.com/${card.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            background: '#334155',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: 12,
                            textDecoration: 'none',
                          }}
                        >
                          Ver
                        </a>
                      ) : null}

                      <button
                        onClick={() => deleteCard(card)}
                        disabled={publishingId === card.id}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: 'none',
                          background: '#ef4444',
                          color: 'white',
                          fontWeight: 700,
                          cursor:
                            publishingId === card.id
                              ? 'not-allowed'
                              : 'pointer',
                          fontSize: 12,
                          opacity:
                            publishingId === card.id ? 0.7 : 1,
                        }}
                      >
                        {publishingId === card.id
                          ? 'A apagar…'
                          : 'Apagar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
