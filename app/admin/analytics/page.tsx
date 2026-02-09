'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type AnalyticsData = {
  date: string
  views: number
  leads: number // form
  saves: number // vCard
}

type CardSummary = {
  card_id: string
  card_name: string
  user_email: string
  total_views: number
  total_leads: number // form
  total_saves: number // vCard
  conversion_form: number
  conversion_save: number
}

type ClientSummary = {
  user_email: string
  total_views: number
  total_leads: number // form
  total_saves: number // vCard
  conversion_form: number
  conversion_save: number
  card_count: number
}

type KPIData = {
  totalViews: number
  totalLeads: number // form
  totalSaves: number // vCard
  conversionForm: number
  conversionSave: number
  activeCards: number
  prevViews: number
  prevLeads: number
  prevSaves: number
}

function KPICard({ label, value, trend, unit = '', color }: any) {
  const trendUp = trend > 0
  return (
    <div style={{ background: `${color}15`, borderRadius: 12, padding: 16, border: `1px solid ${color}50` }}>
      <p style={{ color: 'rgba(96, 165, 250, 0.7)', fontSize: 12, margin: 0, marginBottom: 8 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <p style={{ color, fontSize: 28, fontWeight: 800, margin: 0 }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit}
        </p>
        {trend !== undefined && (
          <p style={{ color: trendUp ? '#22c55e' : '#ef4444', fontSize: 12, fontWeight: 600, margin: 0 }}>
            {trendUp ? '↑' : '↓'} {Math.abs(trend).toFixed(0)}%
          </p>
        )}
      </div>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(false)
  const [chartData, setChartData] = useState<AnalyticsData[]>([])
  const [cardSummary, setCardSummary] = useState<CardSummary[]>([])
  const [clientSummary, setClientSummary] = useState<ClientSummary[]>([])
  const [kpis, setKpis] = useState<KPIData>({
    totalViews: 0,
    totalLeads: 0,
    totalSaves: 0,
    conversionForm: 0,
    conversionSave: 0,
    activeCards: 0,
    prevViews: 0,
    prevLeads: 0,
    prevSaves: 0,
  })

  useEffect(() => {
    loadAnalytics()
  }, [days])

  async function loadAnalytics() {
    setLoading(true)

    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const startIso = startDate.toISOString()

      const prevStartDate = new Date()
      prevStartDate.setDate(prevStartDate.getDate() - days * 2)
      const prevStartIso = prevStartDate.toISOString()
      const prevEndIso = startDate.toISOString()

      const { data: events } = await supabase
        .from('card_events')
        .select('card_id, event_type, created_at')
        .gte('created_at', startIso)
        .order('created_at', { ascending: true })

      const { data: prevEvents } = await supabase
        .from('card_events')
        .select('card_id, event_type, created_at')
        .gte('created_at', prevStartIso)
        .lt('created_at', prevEndIso)

      const { data: cards } = await supabase.from('cards').select('id, name, user_id')
      const { data: profiles } = await supabase.from('profiles').select('id, email')

      const cardMap = new Map(cards?.map((c: any) => [c.id, c]) || [])
      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || [])

      const dateMap = new Map<string, { views: number; leads: number; saves: number }>()
      const cardMap2 = new Map<string, CardSummary>()
      let totalViews = 0
      let totalLeads = 0 // form
      let totalSaves = 0 // vCard
      const activeCardIds = new Set<string>()

      events?.forEach((e: any) => {
        const date = new Date(e.created_at).toLocaleDateString('pt-PT')
          const current = dateMap.get(date) || { views: 0, leads: 0, saves: 0 }

        if (e.event_type === 'view') {
          current.views++
          totalViews++
          activeCardIds.add(e.card_id)
        } else if (e.event_type === 'lead') {
          current.leads++
          totalLeads++
        } else if (e.event_type === 'save_contact') {
          current.saves++
          totalSaves++
        }

        dateMap.set(date, current)

        const card = cardMap.get(e.card_id)
        if (card) {
          const profile = profileMap.get(card.user_id)
          const key = e.card_id
          const current = cardMap2.get(key) || {
            card_id: e.card_id,
            card_name: card.name || 'Sem título',
            user_email: profile?.email || 'Desconhecido',
            total_views: 0,
            total_leads: 0,
            total_saves: 0,
            conversion_form: 0,
            conversion_save: 0,
          }

          if (e.event_type === 'view') current.total_views++
          else if (e.event_type === 'lead') current.total_leads++
          else if (e.event_type === 'save_contact') current.total_saves++

          current.conversion_form = current.total_views > 0 ? (current.total_leads / current.total_views) * 100 : 0
          current.conversion_save = current.total_views > 0 ? (current.total_saves / current.total_views) * 100 : 0
          cardMap2.set(key, current)
        }
      })

      let prevViews = 0
      let prevLeads = 0
      let prevSaves = 0

      prevEvents?.forEach((e: any) => {
        if (e.event_type === 'view') prevViews++
        else if (e.event_type === 'lead') prevLeads++
        else if (e.event_type === 'save_contact') prevSaves++
      })

      const clientMap = new Map<string, ClientSummary>()
      Array.from(cardMap2.values()).forEach((card) => {
        const current = clientMap.get(card.user_email) || {
          user_email: card.user_email,
          total_views: 0,
          total_leads: 0,
          total_saves: 0,
          conversion_form: 0,
          conversion_save: 0,
          card_count: 0,
        }

        current.total_views += card.total_views
        current.total_leads += card.total_leads
        current.total_saves += card.total_saves
        current.card_count++
        current.conversion_form = current.total_views > 0 ? (current.total_leads / current.total_views) * 100 : 0
        current.conversion_save = current.total_views > 0 ? (current.total_saves / current.total_views) * 100 : 0

        clientMap.set(card.user_email, current)
      })

      const chartArray = Array.from(dateMap.entries()).map(([date, data]) => ({ date, ...data }))
      const cardArray = Array.from(cardMap2.values()).sort((a, b) => b.total_leads - a.total_leads)
      const clientArray = Array.from(clientMap.values()).sort((a, b) => b.total_leads - a.total_leads)

      setChartData(chartArray)
      setCardSummary(cardArray)
      setClientSummary(clientArray)
      setKpis({
        totalViews,
        totalLeads,
        totalSaves,
        conversionForm: totalViews > 0 ? (totalLeads / totalViews) * 100 : 0,
        conversionSave: totalViews > 0 ? (totalSaves / totalViews) * 100 : 0,
        activeCards: activeCardIds.size,
        prevViews,
        prevLeads,
        prevSaves,
      })
    } catch (err) {
      console.error('Erro ao carregar analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const viewsTrend = kpis.prevViews > 0 ? ((kpis.totalViews - kpis.prevViews) / kpis.prevViews) * 100 : 0
  const leadsTrend = kpis.prevLeads > 0 ? ((kpis.totalLeads - kpis.prevLeads) / kpis.prevLeads) * 100 : 0
  const savesTrend = kpis.prevSaves > 0 ? ((kpis.totalSaves - kpis.prevSaves) / kpis.prevSaves) * 100 : 0

  return (
    <div style={{ display: 'grid', gap: 24, padding: '24px 0' }}>
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
            }}
          >
            {d} dias
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#60a5fa', textAlign: 'center', padding: 40 }}>A carregar analytics…</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <KPICard label="Aberturas" value={kpis.totalViews} trend={viewsTrend} color="#3b82f6" />
            <KPICard label="Leads (Form)" value={kpis.totalLeads} trend={leadsTrend} color="#22c55e" />
            <KPICard label="Contactos guardados" value={kpis.totalSaves} trend={savesTrend} color="#f59e0b" />
            <KPICard label="Conv. Form" value={kpis.conversionForm.toFixed(1)} unit="%" color="#a855f7" />
          </div>

          {chartData.length > 0 && (
            <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: 18, border: '1px solid rgba(96, 165, 250, 0.2)', padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#60a5fa', margin: '0 0 20px 0' }}>
                📊 Atividade: Aberturas vs Leads
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(96, 165, 250, 0.1)" />
                  <XAxis dataKey="date" stroke="rgba(96, 165, 250, 0.6)" />
                  <YAxis stroke="rgba(96, 165, 250, 0.6)" />
                  <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(96, 165, 250, 0.3)', borderRadius: 8, color: '#60a5fa' }} />
                  <Legend wrapperStyle={{ color: '#60a5fa' }} />
                  <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} name="Aberturas" />
                  <Line type="monotone" dataKey="leads" stroke="#22c55e" strokeWidth={2} name="Leads (Form)" />
                  <Line type="monotone" dataKey="saves" stroke="#f59e0b" strokeWidth={2} name="Contactos guardados" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {cardSummary.length > 0 && (
            <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: 18, border: '1px solid rgba(96, 165, 250, 0.2)', padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#60a5fa', margin: '0 0 20px 0' }}>
                🏆 Top Cartões (por Leads)
              </h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {cardSummary.slice(0, 5).map((card, idx) => (
                  <div key={card.card_id} style={{ background: 'rgba(96, 165, 250, 0.05)', borderRadius: 12, padding: 16, border: '1px solid rgba(96, 165, 250, 0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, color: '#60a5fa', fontWeight: 700 }}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '•'} {card.card_name}
                        </p>
                        <p style={{ margin: '4px 0 0 0', color: 'rgba(96, 165, 250, 0.6)', fontSize: 12 }}>
                          {card.user_email}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, color: '#22c55e', fontWeight: 700 }}>
                          {card.total_leads} leads
                        </p>
                        <p style={{ margin: '4px 0 0 0', color: 'rgba(96, 165, 250, 0.6)', fontSize: 12 }}>
                          {card.total_views} aberturas • Form {card.conversion_form.toFixed(1)}% • Guardar {card.conversion_save.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {clientSummary.length > 0 && (
            <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: 18, border: '1px solid rgba(96, 165, 250, 0.2)', padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#60a5fa', margin: '0 0 20px 0' }}>
                👥 Ranking de Clientes
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(96, 165, 250, 0.2)' }}>
                      <th style={{ padding: 12, color: '#60a5fa', fontWeight: 700 }}>Email</th>
                      <th style={{ padding: 12, color: '#60a5fa', fontWeight: 700 }}>Cartões</th>
                      <th style={{ padding: 12, color: '#60a5fa', fontWeight: 700 }}>Aberturas</th>
                      <th style={{ padding: 12, color: '#60a5fa', fontWeight: 700 }}>Leads (Form)</th>
                      <th style={{ padding: 12, color: '#60a5fa', fontWeight: 700 }}>Guardados</th>
                      <th style={{ padding: 12, color: '#60a5fa', fontWeight: 700 }}>Conv. Form</th>
                      <th style={{ padding: 12, color: '#60a5fa', fontWeight: 700 }}>Conv. Guardar</th>
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
                        <td style={{ padding: 12, color: '#e0e7ff' }}>
                          {idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : ''}
                          {client.user_email}
                        </td>
                        <td style={{ padding: 12, color: '#60a5fa', fontWeight: 700 }}>{client.card_count}</td>
                        <td style={{ padding: 12, color: '#3b82f6', fontWeight: 700 }}>{client.total_views}</td>
                        <td style={{ padding: 12, color: '#22c55e', fontWeight: 700 }}>{client.total_leads}</td>
                        <td style={{ padding: 12, color: '#f59e0b', fontWeight: 700 }}>{client.total_saves}</td>
                        <td style={{ padding: 12, color: '#a855f7', fontWeight: 700 }}>{client.conversion_form.toFixed(1)}%</td>
                        <td style={{ padding: 12, color: '#a855f7', fontWeight: 700 }}>{client.conversion_save.toFixed(1)}%</td>
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
