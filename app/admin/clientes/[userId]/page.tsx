'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type Profile = {
  id: string
  email: string | null
  nome: string | null
  apelido: string | null
  plan: string | null
  billing: string | null
  published_card_limit: number | null
  plan_started_at: string | null
  plan_expires_at: string | null
  plan_auto_renew: boolean | null
  created_at: string | null
}


type CardRow = {
  id: string
  title: string | null
  slug: string | null
  published: boolean | null
  created_at: string | null
}

type DailyStats = {
  day: string
  card_id: string
  card_name?: string
  views: number
  clicks: number
  leads: number
}

type CardSummary = {
  card_id: string
  card_name: string
  total_views: number
  total_clicks: number
  total_leads: number
}

type ChartData = {
  date: string
  views: number
  clicks: number
  leads: number
}

export default function AdminClienteDetailPage() {
  const params = useParams<{ userId: string }>()
  const userId = params.userId

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [cards, setCards] = useState<CardRow[]>([])
  const [activeTab, setActiveTab] = useState<'resumo' | 'cartoes' | 'analytics'>('resumo')

  const [plan, setPlan] = useState('free')
  const [limit, setLimit] = useState<number>(1)
  // Sync profile com estado local para datas
useEffect(() => {
  if (profile) {
    setPlan(profile.plan ?? 'free')
    setLimit(profile.published_card_limit ?? 1)
  }
}, [profile])

  const [saving, setSaving] = useState(false)

  // Analytics
  const [stats, setStats] = useState<DailyStats[]>([])
  const [cardSummary, setCardSummary] = useState<CardSummary[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [days, setDays] = useState(7)

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

  const loadAnalytics = async () => {
    setAnalyticsLoading(true)

    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data: dailyData, error: dailyError } = await supabase
        .from('card_daily_stats')
        .select('day, card_id, views, clicks, leads, cards(name)')
        .eq('user_id', userId)
        .gte('day', startDate.toISOString().split('T')[0])
        .order('day', { ascending: false })

      if (dailyError) {
        alert('Erro a carregar analytics: ' + dailyError.message)
        setAnalyticsLoading(false)
        return
      }

      const formattedDaily = (dailyData || []).map((d: any) => ({
        day: d.day,
        card_id: d.card_id,
        card_name: Array.isArray(d.cards) ? d.cards[0]?.name : d.cards?.name || 'Sem nome',
        views: d.views,
        clicks: d.clicks,
        leads: d.leads,
      }))

      setStats(formattedDaily)

      // Agregar dados por dia para o gráfico
      const chartMap: { [key: string]: ChartData } = {}
      for (const row of formattedDaily) {
        if (!chartMap[row.day]) {
          chartMap[row.day] = {
            date: new Date(row.day).toLocaleDateString('pt-PT', { month: 'short', day: 'numeric' }),
            views: 0,
            clicks: 0,
            leads: 0,
          }
        }
        chartMap[row.day].views += row.views
        chartMap[row.day].clicks += row.clicks
        chartMap[row.day].leads += row.leads
      }

      const sortedChartData = Object.values(chartMap).sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateA.getTime() - dateB.getTime()
      })

      setChartData(sortedChartData)

      // Resumo por cartão
      const { data: summaryData, error: summaryError } = await supabase
        .from('card_daily_stats')
        .select('card_id, views, clicks, leads')
        .eq('user_id', userId)
        .gte('day', startDate.toISOString().split('T')[0])

      if (summaryError) {
        alert('Erro a carregar resumo: ' + summaryError.message)
        setAnalyticsLoading(false)
        return
      }

      const summary: { [key: string]: CardSummary } = {}

      for (const row of formattedDaily) {
        const key = row.card_id
        if (!summary[key]) {
          summary[key] = {
            card_id: row.card_id,
            card_name: row.card_name,
            total_views: 0,
            total_clicks: 0,
            total_leads: 0,
          }
        }
      }

      for (const row of summaryData || []) {
        const key = row.card_id
        if (!summary[key]) {
          summary[key] = {
            card_id: row.card_id,
            card_name: 'Sem nome',
            total_views: 0,
            total_clicks: 0,
            total_leads: 0,
          }
        }
        summary[key].total_views += row.views
        summary[key].total_clicks += row.clicks
        summary[key].total_leads += row.leads
      }

      setCardSummary(Object.values(summary).sort((a, b) => b.total_views - a.total_views))
      setAnalyticsLoading(false)
    } catch (err: any) {
      alert('Erro: ' + (err?.message || 'Desconhecido'))
      setAnalyticsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics()
    }
  }, [activeTab, days, userId])

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
        plan_started_at: profile?.plan_started_at,
        plan_expires_at: profile?.plan_expires_at,
        plan_auto_renew: profile?.plan_auto_renew,
      }),
    })

    const json = await res.json()
    if (!res.ok || !json?.success) throw new Error(json?.error || 'Erro ao atualizar plano')

    alert('Plano atualizado ✅')

    const { data: p2 } = await supabase
      .from('profiles')
      .select('id,email,nome,apelido,plan,billing,published_card_limit,plan_started_at,plan_expires_at,plan_auto_renew,created_at')
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.10)', paddingBottom: 12 }}>
        {(['resumo', 'cartoes', 'analytics'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeTab === tab ? 'rgba(124,58,237,0.3)' : 'transparent',
              color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.6)',
              fontWeight: activeTab === tab ? 700 : 500,
              cursor: 'pointer',
              fontSize: 14,
              textTransform: 'capitalize',
            }}
          >
            {tab === 'resumo' && '📋 Resumo'}
            {tab === 'cartoes' && '📇 Cartões'}
            {tab === 'analytics' && '📊 Analytics'}
          </button>
        ))}
      </div>

      {/* TAB: RESUMO */}
      {activeTab === 'resumo' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
         <div
  style={{
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(255,255,255,0.04)',
    padding: 16,
  }}
>
  <h2 style={{ marginTop: 0, fontSize: 16, color: '#fff' }}>Alterar Plano</h2>

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

    <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
      Plano começa em
      <input
        type="datetime-local"
        value={profile.plan_started_at ? new Date(profile.plan_started_at).toISOString().slice(0, 16) : ''}
        onChange={(e) => {
          const newDate = e.target.value ? new Date(e.target.value).toISOString() : null
          setProfile({ ...profile, plan_started_at: newDate })
        }}
        style={{
          padding: '10px 12px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'rgba(255,255,255,0.06)',
          color: '#fff',
        }}
      />
    </label>

    <label style={{ display: 'grid', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
      Plano expira em
      <input
        type="datetime-local"
        value={profile.plan_expires_at ? new Date(profile.plan_expires_at).toISOString().slice(0, 16) : ''}
        onChange={(e) => {
          const newDate = e.target.value ? new Date(e.target.value).toISOString() : null
          setProfile({ ...profile, plan_expires_at: newDate })
        }}
        style={{
          padding: '10px 12px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'rgba(255,255,255,0.06)',
          color: '#fff',
        }}
      />
    </label>

    <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={profile.plan_auto_renew ?? false}
        onChange={(e) => setProfile({ ...profile, plan_auto_renew: e.target.checked })}
        style={{ cursor: 'pointer' }}
      />
      <span>Auto-renovar plano</span>
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
      )}

      {/* TAB: CARTÕES */}
      {activeTab === 'cartoes' && (
        <div
          style={{
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(255,255,255,0.04)',
            padding: 16,
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: 16, color: '#fff' }}>Cartões do Cliente</h2>

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
      )}

      {/* TAB: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Filtro de dias */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 12,
                  border: days === d ? '2px solid #7c3aed' : '1px solid rgba(255,255,255,0.15)',
                  background: days === d ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Últimos {d} dias
              </button>
            ))}
          </div>

          {analyticsLoading ? (
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>A carregar analytics…</p>
          ) : (
            <>
              {/* Gráfico de Linha */}
              {chartData.length > 0 && (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 18,
                    border: '1px solid rgba(255,255,255,0.10)',
                    padding: 24,
                  }}
                >
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.95)', marginTop: 0, marginBottom: 20 }}>
                    Histórico Diário
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.10)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" />
                      <YAxis stroke="rgba(255,255,255,0.6)" />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: 8,
                          color: '#fff',
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                      <Line type="monotone" dataKey="clicks" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', r: 4 }} />
                      <Line type="monotone" dataKey="leads" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Gráfico de Barras */}
              {cardSummary.length > 0 && (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 18,
                    border: '1px solid rgba(255,255,255,0.10)',
                    padding: 24,
                  }}
                >
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.95)', marginTop: 0, marginBottom: 20 }}>
                    Top Cartões (Views)
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cardSummary.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.10)" />
                      <XAxis dataKey="card_name" stroke="rgba(255,255,255,0.6)" angle={-45} textAnchor="end" height={100} />
                      <YAxis stroke="rgba(255,255,255,0.6)" />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: 8,
                          color: '#fff',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="total_views" fill="#3b82f6" />
                      <Bar dataKey="total_clicks" fill="#a855f7" />
                      <Bar dataKey="total_leads" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Cards Summary */}
              {cardSummary.length > 0 && (
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.95)', marginBottom: 16 }}>
                    Resumo por Cartão
                  </h2>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: 16,
                    }}
                  >
                    {cardSummary.map((card) => (
                      <div
                        key={card.card_id}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.10)',
                          borderRadius: 18,
                          padding: 20,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: 'rgba(255,255,255,0.95)',
                          }}
                        >
                          {card.card_name}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                          <div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
                              Views
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: 'rgba(59,130,246,0.95)' }}>
                              {card.total_views}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
                              Clicks
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: 'rgba(168,85,247,0.95)' }}>
                              {card.total_clicks}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
                              Leads
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: 'rgba(34,197,94,0.95)' }}>
                              {card.total_leads}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {chartData.length === 0 && cardSummary.length === 0 && (
                <p style={{ color: 'rgba(255,255,255,0.55)' }}>Sem dados de analytics.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
