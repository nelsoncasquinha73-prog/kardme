'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type ClientRow = {
  id: string
  email: string | null
  nome: string | null
  apelido: string | null
  plan: string | null
  billing: string | null
  published_card_limit: number | null
  created_at: string | null
  cards_count: number | null
}

type CountsByUser = Record<
  string,
  {
    total: number
    published: number
  }
>

export default function AdminClientesPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<ClientRow[]>([])
  const [counts, setCounts] = useState<CountsByUser>({})
  const [q, setQ] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id,email,nome,apelido,plan,billing,published_card_limit,created_at,cards_count')
        .order('created_at', { ascending: false })

      if (error) {
        alert('Erro a carregar clientes: ' + error.message)
        setLoading(false)
        return
      }

      const list = (profiles ?? []) as ClientRow[]
      setRows(list)

      const userIds = list.map((p) => p.id).filter(Boolean)
      if (userIds.length > 0) {
        const { data: cards, error: cardsError } = await supabase
          .from('cards')
          .select('user_id,published')
          .in('user_id', userIds)

        if (!cardsError && cards) {
          const next: CountsByUser = {}
          for (const c of cards as any[]) {
            const uid = c.user_id as string
            if (!next[uid]) next[uid] = { total: 0, published: 0 }
            next[uid].total += 1
            if (c.published) next[uid].published += 1
          }
          setCounts(next)
        }
      }

      setLoading(false)
    }

    load()
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return rows

    return rows.filter((r) => {
      const fullName = `${r.nome ?? ''} ${r.apelido ?? ''}`.trim().toLowerCase()
      const email = (r.email ?? '').toLowerCase()
      const plan = (r.plan ?? '').toLowerCase()
      return fullName.includes(query) || email.includes(query) || plan.includes(query)
    })
  }, [rows, q])

  if (loading) return <div style={{ padding: 24, color: '#fff' }}>A carregar clientes…</div>

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
          <h1 style={{ margin: 0, fontSize: 22, color: '#fff' }}>Clientes</h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.7)' }}>Lista de contas + acesso ao detalhe</p>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Pesquisar por nome, email ou plano…"
          style={{
            width: 360,
            maxWidth: '100%',
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
          }}
        />
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}>
              <th style={{ padding: 12, color: '#fff', fontWeight: 700 }}>Cliente</th>
              <th style={{ padding: 12, color: '#fff', fontWeight: 700 }}>Email</th>
              <th style={{ padding: 12, color: '#fff', fontWeight: 700 }}>Plano</th>
              <th style={{ padding: 12, color: '#fff', fontWeight: 700 }}>Billing</th>
              <th style={{ padding: 12, color: '#fff', fontWeight: 700 }}>Limite</th>
              <th style={{ padding: 12, color: '#fff', fontWeight: 700 }}>Cartões</th>
              <th style={{ padding: 12, color: '#fff', fontWeight: 700 }}>Publicados</th>
              <th style={{ padding: 12, color: '#fff', fontWeight: 700 }}>Criado</th>
              <th style={{ padding: 12 }} />
            </tr>
          </thead>

          <tbody>
            {filtered.map((r, idx) => {
              const name = `${r.nome ?? ''} ${r.apelido ?? ''}`.trim() || '—'
              const c = counts[r.id]
              const total = c?.total ?? r.cards_count ?? 0
              const published = c?.published ?? 0

              return (
                <tr
                  key={r.id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  }}
                >
                  <td style={{ padding: 12, fontWeight: 600, color: '#fff' }}>{name}</td>
                  <td style={{ padding: 12, color: 'rgba(255,255,255,0.8)' }}>{r.email ?? '—'}</td>
                  <td style={{ padding: 12, color: 'rgba(255,255,255,0.8)' }}>{r.plan ?? '—'}</td>
                  <td style={{ padding: 12, color: 'rgba(255,255,255,0.8)' }}>{r.billing ?? '—'}</td>
                  <td style={{ padding: 12, color: 'rgba(255,255,255,0.8)' }}>{r.published_card_limit ?? '—'}</td>
                  <td style={{ padding: 12, color: 'rgba(255,255,255,0.8)' }}>{total}</td>
                  <td style={{ padding: 12, color: 'rgba(255,255,255,0.8)' }}>{published}</td>
                  <td style={{ padding: 12, color: 'rgba(255,255,255,0.8)' }}>
                    {r.created_at ? new Date(r.created_at).toLocaleString('pt-PT') : '—'}
                  </td>
                  <td style={{ padding: 12, textAlign: 'right' }}>
                    <Link
                      href={`/admin/clientes/${r.id}`}
                      style={{
                        display: 'inline-block',
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: '#7c3aed',
                        color: 'white',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              )
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: 16, color: 'rgba(255,255,255,0.6)' }}>
                  Sem resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
