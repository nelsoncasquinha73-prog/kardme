'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import '@/styles/dashboard.css'

type DailyRow = {
  day: string
  views: number
  clicks: number
  leads: number
}

type TopClick = {
  event_key: string
  count: number
}

export default function CardAnalyticsPage() {
  const params = useParams()
  const cardId = params?.id as string

  const [cardName, setCardName] = useState<string>('Cartão')
  const [days, setDays] = useState(30)

  const [daily, setDaily] = useState<DailyRow[]>([])
  const [topClicks, setTopClicks] = useState<TopClick[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const totals = useMemo(() => {
    return daily.reduce(
      (acc, r) => {
        acc.views += r.views
        acc.clicks += r.clicks
        acc.leads += r.leads
        return acc
      },
      { views: 0, clicks: 0, leads: 0 }
    )
  }, [daily])

  useEffect(() => {
    load()
  }, [cardId, days])

  const load = async () => {
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
      const start = startDate.toISOString().split('T')[0]

      // Nome do cartão
      const { data: card, error: cardErr } = await supabase
        .from('cards')
        .select('id, name')
        .eq('id', cardId)
        .eq('user_id', userId)
        .single()

      if (cardErr || !card) {
        setError(cardErr?.message || 'Cartão não encontrado')
        setLoading(false)
        return
      }
      setCardName(card.name || 'Cartão')

      // Daily stats
      const { data: dailyData, error: dailyErr } = await supabase
        .from('card_daily_stats')
        .select('day, views, clicks, leads')
        .eq('user_id', userId)
        .eq('card_id', cardId)
        .gte('day', start)
        .order('day', { ascending: true })

      if (dailyErr) {
        setError(dailyErr.message)
        setLoading(false)
        return
      }

      setDaily((dailyData || []) as DailyRow[])

      // Top clicks (event stream)
      const { data: clickEvents, error: clickErr } = await supabase
        .from('card_events')
        .select('event_key, created_at')
        .eq('user_id', userId)
        .eq('card_id', cardId)
        .eq('event_type', 'click')
        .gte('created_at', startDate.toISOString())
        .limit(5000)

      if (clickErr) {
        setError(clickErr.message)
        setLoading(false)
        return
      }

      const map: Record<string, number> = {}
      for (const ev of clickEvents || []) {
        const k = (ev.event_key || 'unknown').toString()
        map[k] = (map[k] || 0) + 1
      }

      const top = Object.entries(map)
        .map(([event_key, count]) => ({ event_key, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12)

      setTopClicks(top)
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
            <h1 className="dashboard-title">Analytics — {cardName}</h1>
            <p className="dashboard-subtitle">Detalhe por cartão (views, clicks, leads).</p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link className="btn-secondary" href="/dashboard/analytics">
              ← Voltar
            </Link>
            <button className="btn-secondary" onClick={load} disabled={loading}>
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

        <div style={{ marginBottom: 18, display: 'flex', gap: 8 }}>
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: '8px 16px',
                borderRadius: 12,
                border:
                  days === d
                    ? '2px solid var(--color-primary)'
                    : '1px solid rgba(255,255,255,0.15)',
                background:
                  days === d
                    ? 'rgba(var(--color-primary-rgb), 0.15)'
                    : 'rgba(255,255,255,0.05)',
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
          <p style={{ padding: 24 }}>A carregar…</p>
        ) : (
          <>
            {/* Totais */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
                marginBottom: 26,
              }}
            >
              <div
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 18,
                  padding: 18,
                }}
              >
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Views</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'rgba(59,130,246,0.95)' }}>
                  {totals.views}
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 18,
                  padding: 18,
                }}
              >
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Clicks</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'rgba(168,85,247,0.95)' }}>
                  {totals.clicks}
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 18,
                  padding: 18,
                }}
              >
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Leads</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'rgba(34,197,94,0.95)' }}>
                  {totals.leads}
                </div>
              </div>
            </div>

            {/* Top clicks */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.95)', marginBottom: 12 }}>
                Top Clicks (por key)
              </h2>

              {topClicks.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.55)' }}>Sem clicks registados.</p>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: 12,
                  }}
                >
                  {topClicks.map((c) => (
                    <div
                      key={c.event_key}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        borderRadius: 16,
                        padding: 14,
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 700 }}>
                        {c.event_key}
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 800 }}>
                        {c.count}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tabela diária */}
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.95)', marginBottom: 12 }}>
                Diário
              </h2>

              {daily.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.55)' }}>Sem dados diários.</p>
              ) : (
                <div
                  style={{
                    overflowX: 'auto',
                    borderRadius: 18,
                    border: '1px solid rgba(255,255,255,0.10)',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                          Data
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
                      {daily.map((r, idx) => (
                        <tr
                          key={r.day}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.85)' }}>
                            {new Date(r.day).toLocaleDateString('pt-PT')}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', color: 'rgba(59,130,246,0.95)', fontWeight: 700 }}>
                            {r.views}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', color: 'rgba(168,85,247,0.95)', fontWeight: 700 }}>
                            {r.clicks}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center', color: 'rgba(34,197,94,0.95)', fontWeight: 700 }}>
                            {r.leads}
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
