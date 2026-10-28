'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { cardOrderAdminFetch } from '@/lib/cardOrderAdminFetch'

type Order = {
  id: string
  slug: string
  status: string
  submitted_at: string | null
}

type RequestItem = {
  id: string
  name: string
  email: string
  phone: string | null
  language: string
  created_at: string
  request_status: string
  email_status: string | null
  email_sent_at: string | null
  order: Order | null
}

type Team = {
  id: string
  name: string
  slug: string
  default_language: string
  active: boolean
}

const statusLabels: Record<string, string> = {
  rascunho: 'Por preencher',
  submetido: 'Submetido',
  em_producao: 'Em produção',
  concluido: 'Concluído',
}

export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [team, setTeam] = useState<Team | null>(null)
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await cardOrderAdminFetch(
          `/api/admin/teams/${encodeURIComponent(id)}/requests`
        )
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.error || 'Erro ao carregar pedidos')
        }

        if (!cancelled) {
          setTeam(json.team)
          setRequests(json.requests || [])
          setHasMore(Boolean(json.hasMore))
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Erro inesperado'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [id])

  if (loading) return <main style={{ padding: 24 }}>A carregar equipa...</main>

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <p role="alert" style={{ color: '#ef4444' }}>{error}</p>
        <Link href="/admin/teams">Voltar às equipas</Link>
      </main>
    )
  }

  const count = (status: string) =>
    requests.filter(item => item.order?.status === status).length

  const stats = [
    { label: 'Inscrições', value: requests.length },
    { label: 'Por preencher', value: count('rascunho') },
    { label: 'Submetidos', value: count('submetido') },
    { label: 'Em produção', value: count('em_producao') },
    { label: 'Concluídos', value: count('concluido') },
  ]

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <Link href="/admin/teams">← Voltar às equipas</Link>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 20 }}>
        {team?.name || 'Equipa'}
      </h1>

      <p style={{ opacity: 0.7, marginBottom: 24 }}>
        Formulário: /teams/{team?.slug}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 12,
        marginBottom: 30,
      }}>
        {stats.map(stat => (
          <div key={stat.label} style={{
            padding: 20,
            border: '1px solid #475569',
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 30, fontWeight: 800 }}>
              {stat.value}
            </div>
            <div style={{ opacity: 0.75 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
        Pedidos dos membros
      </h2>

      {hasMore && (
        <p style={{ color: '#f59e0b' }}>
          A mostrar apenas os primeiros 500 pedidos.
        </p>
      )}

      {requests.length === 0 ? (
        <p>Ainda não existem inscrições nesta equipa.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
          }}>
            <thead>
              <tr>
                {['Nome', 'Email', 'Idioma', 'Estado', 'Email enviado', 'Data', 'Pedido'].map(label => (
                  <th key={label} style={{
                    padding: 12,
                    borderBottom: '1px solid #64748b',
                  }}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map(item => (
                <tr key={item.id}>
                  <td style={{ padding: 12 }}>{item.name}</td>
                  <td style={{ padding: 12 }}>{item.email}</td>
                  <td style={{ padding: 12 }}>{item.language}</td>
                  <td style={{ padding: 12 }}>
                    {item.order
                      ? statusLabels[item.order.status] || item.order.status
                      : 'Sem pedido associado'}
                  </td>
                  <td style={{ padding: 12 }}>
                    {item.email_status === 'enviado'
                      ? 'Sim'
                      : item.email_status === 'erro'
                        ? 'Erro'
                        : item.email_status || 'Pendente'}
                  </td>
                  <td style={{ padding: 12 }}>
                    {new Date(item.created_at).toLocaleDateString('pt-PT')}
                  </td>
                  <td style={{ padding: 12 }}>
                    {item.order ? (
                      <Link href={`/admin/card-orders/${item.order.slug}`}>
                        Ver pedido
                      </Link>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
