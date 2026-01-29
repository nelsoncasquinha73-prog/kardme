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

type CountsByUser = Record<string, { total: number; published: number }>

export default function AdminClientesPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<ClientRow[]>([])
  const [counts, setCounts] = useState<CountsByUser>({})
  const [q, setQ] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newClient, setNewClient] = useState({
    email: '',
    password: '',
    nome: '',
    apelido: '',
    plan: 'free',
    published_card_limit: 1,
  })

  const loadClients = async () => {
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

  useEffect(() => { loadClients() }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((r) => {
      const fullName = (r.nome ?? '') + ' ' + (r.apelido ?? '')
      const email = r.email ?? ''
      const plan = r.plan ?? ''
      return fullName.toLowerCase().includes(query) || email.toLowerCase().includes(query) || plan.toLowerCase().includes(query)
    })
  }, [rows, q])

  const handleCreateClient = async () => {
    if (!newClient.email || !newClient.password) {
      alert('Email e password são obrigatórios')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient),
      })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Erro ao criar cliente')
      alert('Cliente criado com sucesso!')
      setShowModal(false)
      setNewClient({ email: '', password: '', nome: '', apelido: '', plan: 'free', published_card_limit: 1 })
      loadClients()
    } catch (e: any) {
      alert('Erro: ' + (e?.message || 'Desconhecido'))
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <div style={{ padding: 24, color: '#fff' }}>A carregar clientes…</div>

  const inputStyle = { padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: '#fff', width: '100%' }
  const labelStyle = { display: 'grid', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.8)' }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, color: '#fff' }}>Clientes</h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.7)' }}>Lista de contas + acesso ao detalhe</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar por nome, email ou plano…"
            style={{ width: 300, maxWidth: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#fff' }}
          />
          <button onClick={() => setShowModal(true)} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#22c55e', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
            + Criar Cliente
          </button>
        </div>
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
              const name = ((r.nome ?? '') + ' ' + (r.apelido ?? '')).trim() || '—'
              const c = counts[r.id]
              const total = c?.total ?? r.cards_count ?? 0
              const published = c?.published ?? 0
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                  <td style={{ padding: 12, fontWeight: 600, color: '#fff' }}>{name}</td>
                  <td style={{ padding: 12, color: 'rgba(255,255,255,0.8)' }}>{r.email ?? '—'}</td>
                  <td style={{ padding: 12, color: 'rgba(255,255,255,0.8)' }}>{r.plan ?? '—'}</td>
                  <td style={{ padding: 12, color: 'rgba(255,255,255,0.8)' }}>{r.billing ?? '—'}</td>
                  <td style={{ padding: 12, color: 'rgba(255,255,255,0.8)' }}>{r.published_card_limit ?? '—'}</td>
                  <td style={{ padding: 12, color: 'rgba(255,255,255,0.8)' }}>{total}</td>
                  <td style={{ padding: 12, color: 'rgba(255,255,255,0.8)' }}>{published}</td>
                  <td style={{ padding: 12, color: 'rgba(255,255,255,0.8)' }}>{r.created_at ? new Date(r.created_at).toLocaleString('pt-PT') : '—'}</td>
                  <td style={{ padding: 12, textAlign: 'right' }}>
                    <Link href={'/admin/clientes/' + r.id} style={{ display: 'inline-block', padding: '8px 10px', borderRadius: 10, background: '#7c3aed', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
                      Abrir
                    </Link>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} style={{ padding: 16, color: 'rgba(255,255,255,0.6)' }}>Sem resultados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: '#1e1e2e', borderRadius: 16, padding: 24, width: 420, maxWidth: '90vw', border: '1px solid rgba(255,255,255,0.1)' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, color: '#fff' }}>Criar Novo Cliente</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={labelStyle}>
                Email *
                <input type="email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} placeholder="cliente@exemplo.com" style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Password *
                <input type="text" value={newClient.password} onChange={(e) => setNewClient({ ...newClient, password: e.target.value })} placeholder="Password inicial" style={inputStyle} />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={labelStyle}>
                  Nome
                  <input type="text" value={newClient.nome} onChange={(e) => setNewClient({ ...newClient, nome: e.target.value })} placeholder="Nome" style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Apelido
                  <input type="text" value={newClient.apelido} onChange={(e) => setNewClient({ ...newClient, apelido: e.target.value })} placeholder="Apelido" style={inputStyle} />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={labelStyle}>
                  Plano
                  <select value={newClient.plan} onChange={(e) => setNewClient({ ...newClient, plan: e.target.value })} style={inputStyle}>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="agency">Agency</option>
                  </select>
                </label>
                <label style={labelStyle}>
                  Limite cartões
                  <input type="number" value={newClient.published_card_limit} onChange={(e) => setNewClient({ ...newClient, published_card_limit: parseInt(e.target.value || '1', 10) })} min={1} style={inputStyle} />
                </label>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={handleCreateClient} disabled={creating} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: 'none', background: '#22c55e', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                  {creating ? 'A criar…' : 'Criar Cliente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
