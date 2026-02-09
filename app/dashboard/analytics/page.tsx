'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import '@/styles/dashboard.css'

type DailyStats = {
  day: string
  card_id: string
  card_name?: string
  views: number
  clicks: number
  leads: number
  saves: number
}

type CardSummary = {
  card_id: string
  card_name: string
  total_views: number
  total_clicks: number
  total_leads: number
  total_saves: number
}

type ChartData = {
  date: string
  views: number
  clicks: number
  leads: number
  saves: number
}

type KPIData = {
  totalViews: number
  totalLeads: number
  totalSaves: number
  formConversion: number
  saveConversion: number
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DailyStats[]>([])
  const [cardSummary, setCardSummary] = useState<CardSummary[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [kpi, setKpi] = useState<KPIData>({ totalViews: 0, totalLeads: 0, totalSaves: 0, formConversion: 0, saveConversion: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(7)

  useEffect(() => {
    loadAnalytics()
  }, [days])

  const loadAnalytics = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user?.id) {
        setError('Sem sessão')
        setLoading(false)
        return
      }

      const userId = authData.user.id
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // 1. Buscar cartões do user
      const { data: userCards } = await supabase
        .from('cards')
        .select('id, name')
        .eq('user_id', userId)

      const cardIds = (userCards || []).map((c: any) => c.id)
      const cardNameMap: { [key: string]: string } = {}
      userCards?.forEach((c: any) => {
        cardNameMap[c.id] = c.name
      })

      if (cardIds.length === 0) {
        setStats([])
        setChartData([])
        setCardSummary([])
        setKpi({ totalViews: 0, totalLeads: 0, totalSaves: 0, formConversion: 0, saveConversion: 0 })
        setLoading(false)
        return
      }

      // 2. Buscar eventos (views, leads, saves)
      const { data: events } = await supabase
        .from('card_events')
        .select('card_id, event_type, created_at')
        .in('card_id', cardIds)
        .gte('created_at', startDate.toISOString())

      // Agregar eventos por dia
      const eventsByDay: { [key: string]: { [cardId: string]: { views: number; leads: number; saves: number } } } = {}
      const eventTotals = { views: 0, leads: 0, saves: 0 }

      for (const evt of events || []) {
        const day = evt.created_at.split('T')[0]
        if (!eventsByDay[day]) eventsByDay[day] = {}
        if (!eventsByDay[day][evt.card_id]) {
          eventsByDay[day][evt.card_id] = { views: 0, leads: 0, saves: 0 }
        }

        if (evt.event_type === 'view') {
          eventsByDay[day][evt.card_id].views++
          eventTotals.views++
        } else if (evt.event_type === 'lead') {
          eventsByDay[day][evt.card_id].leads++
          eventTotals.leads++
        } else if (evt.event_type === 'save_contact') {
          eventsByDay[day][evt.card_id].saves++
          eventTotals.saves++
        }
      }

      // 3. Construir formattedDaily
      const formattedDaily: DailyStats[] = []
      for (const day in eventsByDay) {
        for (const cardId in eventsByDay[day]) {
          const evt = eventsByDay[day][cardId]
          formattedDaily.push({
            day,
            card_id: cardId,
            card_name: cardNameMap[cardId] || 'Sem nome',
            views: evt.views,
            clicks: 0,
            leads: evt.leads,
            saves: evt.saves,
          })
        }
      }

      setStats(formattedDaily)

      // 4. Agregar para gráfico
      const chartMap: { [key: string]: ChartData } = {}
      for (const row of formattedDaily) {
        if (!chartMap[row.day]) {
          chartMap[row.day] = {
            date: new Date(row.day).toLocaleDateString('pt-PT', { month: 'short', day: 'numeric' }),
            views: 0,
            clicks: 0,
            leads: 0,
            saves: 0,
          }
        }
        chartMap[row.day].views += row.views
        chartMap[row.day].clicks += row.clicks
        chartMap[row.day].leads += row.leads
        chartMap[row.day].saves += row.saves
      }

      const sortedChartData = Object.values(chartMap).sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateA.getTime() - dateB.getTime()
      })

      setChartData(sortedChartData)

      // 5. Resumo por cartão
      const summary: { [key: string]: CardSummary } = {}
      for (const row of formattedDaily) {
        const key = row.card_id
        if (!summary[key]) {
          summary[key] = {
            card_id: row.card_id,
            card_name: row.card_name || 'Sem nome',
            total_views: 0,
            total_clicks: 0,
            total_leads: 0,
            total_saves: 0,
          }
        }
        summary[key].total_views += row.views
        summary[key].total_clicks += row.clicks
        summary[key].total_leads += row.leads
        summary[key].total_saves += row.saves
      }

      setCardSummary(Object.values(summary).sort((a, b) => b.total_views - a.total_views))

      // 6. KPIs
      const formConv = eventTotals.views > 0 ? ((eventTotals.leads / eventTotals.views) * 100).toFixed(1) : 0
      const saveConv = eventTotals.views > 0 ? ((eventTotals.saves / eventTotals.views) * 100).toFixed(1) : 0

      setKpi({
        totalViews: eventTotals.views,
        totalLeads: eventTotals.leads,
        totalSaves: eventTotals.saves,
        formConversion: parseFloat(formConv as string),
        saveConversion: parseFloat(saveConv as string),
      })

      setLoading(false)
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar analytics')
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-wrap">
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Analytics</h1>
            <p className="dashboard-subtitle">
              Visualiza views, leads e contactos guardados dos teus cartões.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link className="btn-secondary" href="/dashboard">
              ← Voltar
            </Link>
            <button className="btn-secondary" onClick={loadAnalytics} disabled={loading}>
              {loading ? 'A atualizar…' : 'Recarregar'}
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12,
              padding: '12px 16px',
              color: 'rgba(252,165,165,0.95)',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {/* Filtro de dias */}
        <div style={{ marginBottom: 24, display: 'flex', gap: 8 }}>
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: '8px 16px',
                borderRadius: 12,
                border: days === d ? '2px solid var(--color-primary)' : '1px solid rgba(255,255,255,0.15)',
                background: days === d ? 'rgba(var(--color-primary-rgb), 0.15)' : 'rgba(255,255,255,0.05)',
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

        {loading ? (
          <p style={{ padding: 24, color: 'rgba(255,255,255,0.7)' }}>A carregar analytics…</p>
        ) : (
          <>
            {/* KPIs */}
            <div style={{ marginBottom: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Aberturas</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: 'rgba(59,130,246,0.95)' }}>{kpi.totalViews}</div>
              </div>
              <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Leads (Form)</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: 'rgba(34,197,94,0.95)' }}>{kpi.totalLeads}</div>
              </div>
              <div style={{ background: 'rgba(236,72,153,0.15)', border: '1px solid rgba(236,72,153,0.3)', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Contactos Guardados</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: 'rgba(236,72,153,0.95)' }}>{kpi.totalSaves}</div>
              </div>
              <div style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Conversão (Form %)</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: 'rgba(168,85,247,0.95)' }}>{kpi.formConversion}%</div>
              </div>
              <div style={{ background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Conversão (Guardar %)</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: 'rgba(14,165,233,0.95)' }}>{kpi.saveConversion}%</div>
              </div>
            </div>

            {/* Gráfico de Linha — Histórico Diário */}
            {chartData.length > 0 && (
              <div style={{ marginBottom: 40, background: 'rgba(255,255,255,0.05)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.10)', padding: 24 }}>
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
                    <Line type="monotone" dataKey="leads" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
<Line type="monotone" dataKey="saves" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Gráfico de Barras — Top Cartões */}
            {cardSummary.length > 0 && (
              <div style={{ marginBottom: 40, background: 'rgba(255,255,255,0.05)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.10)', padding: 24 }}>
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
                    <Bar dataKey="total_leads" fill="#22c55e" />
                    <Bar dataKey="total_saves" fill="#ec4899" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Cards Summary */}
            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.95)', marginBottom: 16 }}>
                Resumo por Cartão
              </h2>
              {cardSummary.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.55)' }}>Sem dados.</p>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 16,
                  }}
                >
                  {cardSummary.map((card) => (
                    <Link
                      key={card.card_id}
                      href={`/dashboard/cards/${card.card_id}/analytics`}
                      style={{ textDecoration: 'none' }}
                    >
                      <div
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.10)',
                          borderRadius: 18,
                          padding: 20,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'
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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
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
                              Leads
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: 'rgba(34,197,94,0.95)' }}>
                              {card.total_leads}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
                              Saves
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: 'rgba(236,72,153,0.95)' }}>
                              {card.total_saves}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>
                              Conv. %
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: 'rgba(168,85,247,0.95)' }}>
                              {card.total_views > 0 ? ((card.total_leads / card.total_views) * 100).toFixed(0) : 0}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Histórico Detalhado */}
            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.95)', marginBottom: 16 }}>
                Histórico Detalhado
              </h2>
              {stats.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.55)' }}>Sem dados.</p>
              ) : (
                <div
                  style={{
                    overflowX: 'auto',
                    borderRadius: 18,
                    border: '1px solid rgba(255,255,255,0.10)',
                  }}
                >
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: 13,
                    }}
                  >
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                          Data
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                          Cartão
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                          Views
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                          Leads
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                          Saves
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.map((stat, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.85)' }}>
                            {new Date(stat.day).toLocaleDateString('pt-PT')}
                          </td>
                          <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.85)' }}>
                            <Link
                              href={`/dashboard/cards/${stat.card_id}/analytics`}
                              style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                            >
                              {stat.card_name}
                            </Link>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', color: 'rgba(59,130,246,0.95)', fontWeight: 600 }}>
                            {stat.views}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', color: 'rgba(34,197,94,0.95)', fontWeight: 600 }}>
                            {stat.leads}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', color: 'rgba(236,72,153,0.95)', fontWeight: 600 }}>
                            {stat.saves}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
