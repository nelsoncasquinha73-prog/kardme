'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Profile = {
  id: string
  email: string | null
  nome: string | null
  apelido: string | null
  plan: string | null
  billing: string | null
  published_card_limit: number | null
  created_at: string | null
}

type CardRow = {
  id: string
  title: string | null
  slug: string | null
  published: boolean | null
  created_at: string | null
}

export default function AdminClienteDetailPage() {
  const params = useParams<{ userId: string }>()
  const userId = params.userId

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [cards, setCards] = useState<CardRow[]>([])

  const [plan, setPlan] = useState('free')
  const [limit, setLimit] = useState<number>(1)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const { data: p, error: pErr } = await supabase
        .from('profiles')
        .select('id,email,nome,apelido,plan,billing,published_card_limit,created_at')
        .eq('id', userId)
        .single()

      if (pErr || !p) {
        alert('Erro a carregar cliente: ' + (pErr?.message ?? 'não encontrado'))
        setLoading(false)
        return
      }

      setProfile(p as any)
      setPlan((p as any).plan ?? 'free')
      setLimit((p as any).published_card_limit ?? 1)

      const { data: c, error: cErr } = await supabase
        .from('cards')
        .select('id,title,slug,published,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (cErr) {
        alert('Erro a carregar cartões: ' + cErr.message)
        setCards([])
      } else {
        setCards((c ?? []) as any)
      }

      setLoading(false)
    }

    load()
  }, [userId])

  const fullName = useMemo(() => {
    if (!profile) return 'Cliente'
    return `${profile.nome ?? ''} ${profile.apelido ?? ''}`.trim() || '—'
  }, [profile])

  async function savePlan() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/users/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          plan,
          published_card_limit: limit,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Erro ao atualizar plano')

      alert('Plano atualizado ✅')

      const { data: p2 } = await supabase
        .from('profiles')
        .select('id,email,nome,apelido,plan,billing,published_card_limit,created_at')
        .eq('id', userId)
        .single()

      if (p2) setProfile(p2 as any)
    } catch (e: any) {
      alert('Erro: ' + (e?.message || 'Desconhecido'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 24, color: '#fff' }}>A carregar…</div>

  if (!profile) {
    return (
      <div style={{ padding: 24, color: '#fff' }}>
        <p>Cliente não encontrado.</p>
        <Link href="/admin/clientes" style={{ color: '#93c5fd' }}>
          ← Voltar
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, color: '#fff' }}>{fullName}</h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.7)' }}>{profile.email ?? '—'}</p>
        </div>
        <Link href="/admin/clientes" style={{ textDecoration: 'none', fontWeight: 700, color: '#93c5fd' }}>
          ← Voltar
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div
          style={{
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(255,255,255,0.04)',
            padding: 16,
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: 16, color: '#fff' }}>Resumo</h2>
          <div style={{ display: 'grid', gap: 8, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
            <div>
              <strong style={{ color: '#fff' }}>Nome:</strong> {fullName}
            </div>
            <div>
              <strong style={{ color: '#fff' }}>Email:</strong> {profile.email ?? '—'}
            </div>
            <div>
              <strong style={{ color: '#fff' }}>Plano:</strong> {profile.plan ?? '—'}
            </div>
            <div>
              <strong style={{ color: '#fff' }}>Billing:</strong> {profile.billing ?? '—'}
            </div>
            <div>
              <strong style={{ color: '#fff' }}>Limite publicados:</strong> {profile.published_card_limit ?? '—'}
            </div>
            <div>
              <strong style={{ color: '#fff' }}>Criado:</strong>{' '}
              {profile.created_at ? new Date(profile.created_at).toLocaleString('pt-PT') : '—'}
            </div>
          </div>
        </div>

        <div
          style={{
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(255,255,255,0.04)',
            padding: 16,
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: 16, color: '#fff' }}>Alterar plano</h2>

          <div style={{ display: 'grid', gap: 10 }}>
            <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
              Plano
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                }}
              >
                <option value="free">free</option>
                <option value="pro">pro</option>
                <option value="agency">agency</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
              Limite de cartões publicados
              <input
                type="number"
                value={limit}
                min={0}
                onChange={(e) => setLimit(parseInt(e.target.value || '0', 10))}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                }}
              />
            </label>

            <button
              onClick={savePlan}
              disabled={saving}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: 'none',
                background: '#7c3aed',
                color: 'white',
                fontWeight: 900,
                cursor: 'pointer',
              }}
            >
              {saving ? 'A guardar…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.10)',
          background: 'rgba(255,255,255,0.04)',
          padding: 16,
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 16, color: '#fff' }}>Cartões</h2>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
                <th style={{ padding: 12, color: '#fff' }}>Título</th>
                <th style={{ padding: 12, color: '#fff' }}>Slug</th>
                <th style={{ padding: 12, color: '#fff' }}>Publicado</th>
                <th style={{ padding: 12, color: '#fff' }}>Criado</th>
                <th style={{ padding: 12 }} />
              </tr>
            </thead>
            <tbody>
              {cards.map((c, idx) => {
                const publicUrl = c.slug ? `/${c.slug}` : null
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                      background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 12, fontWeight: 700, color: '#fff' }}>{c.title ?? '—'}</td>
                    <td style={{ padding: 12, color: 'rgba(255,255,255,0.85)' }}>{c.slug ?? '—'}</td>
                    <td style={{ padding: 12, color: 'rgba(255,255,255,0.85)' }}>{c.published ? 'Sim' : 'Não'}</td>
                    <td style={{ padding: 12, color: 'rgba(255,255,255,0.85)' }}>
                      {c.created_at ? new Date(c.created_at).toLocaleString('pt-PT') : '—'}
                    </td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      {publicUrl ? (
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-block',
                            padding: '8px 10px',
                            borderRadius: 10,
                            background: '#2563eb',
                            color: 'white',
                            textDecoration: 'none',
                            fontWeight: 900,
                            fontSize: 13,
                          }}
                        >
                          Ver público
                        </a>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}

              {cards.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 16, color: 'rgba(255,255,255,0.6)' }}>
                    Sem cartões.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
