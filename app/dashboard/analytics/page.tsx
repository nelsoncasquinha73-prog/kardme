'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import '@/styles/dashboard.css'

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

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DailyStats[]>([])
  const [cardSummary, setCardSummary] = useState<CardSummary[]>([])
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

      // Stats diários com nome do cartão
      const { data: dailyData, error: dailyError } = await supabase
        .from('card_daily_stats')
        .select('day, card_id, views, clicks, leads, cards(name)')
        .eq('user_id', userId)
        .gte('day', startDate.toISOString().split('T')[0])
        .order('day', { ascending: false })

      if (dailyError) {
        setError(dailyError.message)
        setLoading(false)
        return
      }

      const formattedDaily = (dailyData || []).map((d: any) => ({
        day: d.day,
        card_id: d.card_id,
        card_name: d.cards?.name || 'Sem nome',
        views: d.views,
        clicks: d.clicks,
        leads: d.leads,
      }))

      setStats(formattedDaily)

      // Resumo por cartão (últimos N dias)
      const { data: summaryData, error: summaryError } = await supabase
        .from('card_daily_stats')
        .select('card_id, views, clicks, leads')
        .eq('user_id', userId)
        .gte('day', startDate.toISOString().split('T')[0])

      if (summaryError) {
        setError(summaryError.message)
        setLoading(false)
        return
      }

      // Agregar por card_id
      const summary: { [key: string]: CardSummary } = {}
      for (const row of summaryData || []) {
        const key = row.card_id
        if (!summary[key]) {
          summary[key] = {
            card_id: row.card_id,
            card_name: (row.cards as any)?.[0]?.name || 'Sem nome',
            total_views: 0,
            total_clicks: 0,
            total_leads: 0,
          }
        }
        summary[key].total_views += row.views
        summary[key].total_clicks += row.clicks
        summary[key].total_leads += row.leads
      }

      setCardSummary(
        Object.values(summary).sort((a, b) => b.total_views - a.total_views)
      )
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
              Visualiza views, clicks e leads dos teus cartões.
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
          <p style={{ padding: 24 }}>A carregar analytics…</p>
        ) : (
          <>
            {/* Top Cards */}
            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.95)', marginBottom: 16 }}>
                Top Cartões
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
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Daily Stats Table */}
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.95)', marginBottom: 16 }}>
                Histórico Diário
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
                          Clicks
                        </th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                          Leads
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
                          <td style={{ padding: '12px 16px', textAlign: 'center', color: 'rgba(168,85,247,0.95)', fontWeight: 600 }}>
                            {stat.clicks}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', color: 'rgba(34,197,94,0.95)', fontWeight: 600 }}>
                            {stat.leads}
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
