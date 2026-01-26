'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type AnalyticsData = {
  date: string
  views: number
  clicks: number
  leads: number
}

type CardSummary = {
  card_id: string
  card_name: string
  user_email: string
  total_views: number
  total_clicks: number
  total_leads: number
}

type ClientSummary = {
  user_id: string
  user_email: string
  total_views: number
  total_clicks: number
  total_leads: number
  card_count: number
}

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [chartData, setChartData] = useState<AnalyticsData[]>([])
  const [cardSummary, setCardSummary] = useState<CardSummary[]>([])
  const [clientSummary, setClientSummary] = useState<ClientSummary[]>([])

  useEffect(() => {
    loadAnalytics()
  }, [days])

  async function loadAnalytics() {
    setAnalyticsLoading(true)

    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const startIso = startDate.toISOString()

      // 1) Carregar eventos de analytics
      const { data: events, error: eventsErr } = await supabase
        .from('card_events')
        .select('card_id, event_type, created_at')
        .gte('created_at', startIso)
        .order('created_at', { ascending: true })

      if (eventsErr) throw new Error(eventsErr.message)

      // 2) Carregar cards com user_id
      const { data: cards, error: cardsErr } = await supabase
        .from('cards')
        .select('id, title, user_id')

      if (cardsErr) throw new Error(cardsErr.message)

      // 3) Carregar profiles para emails
      const { data: profiles, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, email')

      if (profilesErr) throw new Error(profilesErr.message)

      // Maps para lookup rápido
      const cardMap = new Map(cards?.map((c: any) => [c.id, c]) || [])
      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || [])

      // 4) Agrupar por data
      const dateMap = new Map<string, { views: number; clicks: number; leads: number }>()

      events?.forEach((e: any) => {
        const date = new Date(e.created_at).toLocaleDateString('pt-PT')
        const current = dateMap.get(date) || { views: 0, clicks: 0, leads: 0 }

        if (e.event_type === 'view') current.views++
        else if (e.event_type === 'click') current.clicks++
        else if (e.event_type === 'lead') current.leads++

        dateMap.set(date, current)
      })

      const chartArray = Array.from(dateMap.entries()).map(([date, data]) => ({
        date,
        ...data,
      }))

      setChartData(chartArray)

      // 5) Resumo por cartão
      const cardMap2 = new Map<string, CardSummary>()

      events?.forEach((e: any) => {
        const card = cardMap.get(e.card_id)
        if (!card) return

        const profile = profileMap.get(card.user_id)
        const key = e.card_id

        const current = cardMap2.get(key) || {
          card_id: e.card_id,
          card_name: card.title || 'Sem título',
          user_email: profile?.email || 'Desconhecido',
          total_views: 0,
          total_clicks: 0,
          total_leads: 0,
        }

        if (e.event_type === 'view') current.total_views++
        else if (e.event_type === 'click') current.total_clicks++
        else if (e.event_type === 'lead') current.total_leads++

        cardMap2.set(key, current)
      })

      const cardArray = Array.from(cardMap2.values()).sort((a, b) => b.total_views - a.total_views)
      setCardSummary(cardArray)

      // 6) Resumo por cliente
      const clientMap = new Map<string, ClientSummary>()

      cardArray.forEach((card) => {
        const current = clientMap.get(card.user_email) || {
          user_id: '',
          user_email: card.user_email,
          total_views: 0,
          total_clicks: 0,
          total_leads: 0,
          card_count: 0,
        }

        current.total_views += card.total_views
        current.total_clicks += card.total_clicks
        current.total_leads += card.total_leads
        current.card_count++

        clientMap.set(card.user_email, current)
      })

      const clientArray = Array.from(clientMap.values()).sort((a, b) => b.total_views - a.total_views)
      setClientSummary(clientArray)
    } catch (err) {
      console.error('Erro ao carregar analytics:', err)
      alert('Erro ao carregar dados')
    } finally {
      setAnalyticsLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* Filtro de dias */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            style={{
              padding: '8px 16px',
              borderRadius: 12,
              border: days === d ? '2px solid #60a5fa' : '1px solid rgba(96, 165, 250, 0.2)',
              background: days === d ? 'rgba(96, 165, 250, 0.2)' : 'rgba(30, 58, 138, 0.1)',
              color: '#60a5fa',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease',
            }}
          >
            Últimos {d} dias
          </button>
        ))}
      </div>

      {analyticsLoading ? (
        <p style={{ color: '#60a5fa', textAlign: 'center', padding: 40 }}>A carregar analytics…</p>
      ) : (
        <>
          {/* Gráfico de Linha */}
          {chartData.length > 0 && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(10px)',
                borderRadius: 18,
                border: '1px solid rgba(96, 165, 250, 0.2)',
                padding: 24,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#60a5fa', marginTop: 0, marginBottom: 20 }}>
                Histórico Diário (Todos os Cartões)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(96, 165, 250, 0.1)" />
                  <XAxis dataKey="date" stroke="rgba(96, 165, 250, 0.6)" />
                  <YAxis stroke="rgba(96, 165, 250, 0.6)" />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(96, 165, 250, 0.3)',
                      borderRadius: 8,
                      color: '#60a5fa',
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                  <Legend wrapperStyle={{ color: '#60a5fa' }} />
                  <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                  <Line type="monotone" dataKey="clicks" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', r: 4 }} />
                  <Line type="monotone" dataKey="leads" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Gráfico de Barras - Top Cartões */}
          {cardSummary.length > 0 && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(10px)',
                borderRadius: 18,
                border: '1px solid rgba(96, 165, 250, 0.2)',
                padding: 24,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#60a5fa', marginTop: 0, marginBottom: 20 }}>
                Top 10 Cartões (Views)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cardSummary.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(96, 165, 250, 0.1)" />
                  <XAxis dataKey="card_name" stroke="rgba(96, 165, 250, 0.6)" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="rgba(96, 165, 250, 0.6)" />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(96, 165, 250, 0.3)',
                      borderRadius: 8,
                      color: '#60a5fa',
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                  <Legend wrapperStyle={{ color: '#60a5fa' }} />
                  <Bar dataKey="total_views" fill="#3b82f6" />
                  <Bar dataKey="total_clicks" fill="#a855f7" />
                  <Bar dataKey="total_leads" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Resumo por Cliente */}
          {clientSummary.length > 0 && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#60a5fa', marginBottom: 16 }}>
                Resumo por Cliente
              </h2>
              <div
                style={{
                  overflowX: 'auto',
                  background: 'rgba(15, 23, 42, 0.4)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 18,
                  border: '1px solid rgba(96, 165, 250, 0.2)',
                  padding: 24,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(96, 165, 250, 0.2)' }}>
                      <th style={{ padding: 12, color: '#60a5fa', fontWeight: 700 }}>Email</th>
                      <th style={{ padding: 12, color: '#60a5fa', fontWeight: 700 }}>Cartões</th>
                      <th style={{ padding: 12, color: '#60a5fa', fontWeight: 700 }}>Views</th>
                      <th style={{ padding: 12, color: '#60a5fa', fontWeight: 700 }}>Clicks</th>
                      <th style={{ padding: 12, color: '#60a5fa', fontWeight: 700 }}>Leads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientSummary.map((client, idx) => (
                      <tr
                        key={client.user_email}
                        style={{
                          borderBottom: '1px solid rgba(96, 165, 250, 0.1)',
                          background: idx % 2 === 0 ? 'rgba(96, 165, 250, 0.05)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: 12, color: '#e0e7ff' }}>{client.user_email}</td>
                        <td style={{ padding: 12, color: '#60a5fa', fontWeight: 700 }}>{client.card_count}</td>
                        <td style={{ padding: 12, color: '#3b82f6', fontWeight: 700 }}>{client.total_views}</td>
                        <td style={{ padding: 12, color: '#a855f7', fontWeight: 700 }}>{client.total_clicks}</td>
                        <td style={{ padding: 12, color: '#22c55e', fontWeight: 700 }}>{client.total_leads}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {chartData.length === 0 && cardSummary.length === 0 && (
            <p style={{ color: 'rgba(96, 165, 250, 0.55)', textAlign: 'center', padding: 40 }}>Sem dados de analytics.</p>
          )}
        </>
      )}
    </div>
  )
}
