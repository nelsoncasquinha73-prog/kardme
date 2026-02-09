'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/language/LanguageProvider'
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
  total_views: number
  total_leads: number // form
  total_saves: number // vCard
  conversion_form: number
  conversion_save: number
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
    <div style={{ background: `\${color}15`, borderRadius: 12, padding: 16, border: `1px solid \${color}50` }}>
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

export default function UserAnalyticsPage() {
  const { t } = useLanguage()
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(false)
  const [chartData, setChartData] = useState<AnalyticsData[]>([])
  const [cardSummary, setCardSummary] = useState<CardSummary[]>([])
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
      // 1. Obter user logado
      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user?.id) {
        setLoading(false)
        return
      }

      const userId = authData.user.id

      // 2. Buscar cartões do user
      const { data: userCards } = await supabase
        .from('cards')
        .select('id')
        .eq('user_id', userId)

      const userCardIds = (userCards || []).map((c: any) => c.id)

      if (userCardIds.length === 0) {
        setChartData([])
        setCardSummary([])
        setKpis({
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
        setLoading(false)
        return
      }

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const startIso = startDate.toISOString()

      const prevStartDate = new Date()
      prevStartDate.setDate(prevStartDate.getDate() - days * 2)
      const prevStartIso = prevStartDate.toISOString()
      const prevEndIso = startDate.toISOString()

      // 3. Buscar eventos do user (filtrado por card_ids)
      const { data: events } = await supabase
        .from('card_events')
        .select('card_id, event_type, created_at')
        .in('card_id', userCardIds)
        .gte('created_at', startIso)
        .order('created_at', { ascending: true })


      console.log('[analytics] userCardIds', userCardIds)
      console.log('[analytics] events length', events?.length)
      console.log('[analytics] saves in events', (events || []).filter((e:any) => e.event_type === 'save_contact').length)

      const { data: prevEvents } = await supabase
        .from('card_events')
        .select('card_id, event_type, created_at')
        .in('card_id', userCardIds)
        .gte('created_at', prevStartIso)
        .lt('created_at', prevEndIso)

      // 4. Buscar nomes dos cartões
      const { data: cards } = await supabase
        .from('cards')
        .select('id, name')
        .in('id', userCardIds)

      const cardMap = new Map(cards?.map((c: any) => [c.id, c]) || [])

      const dateMap = new Map<string, { views: number; leads: number; saves: number }>()
      const cardMap2 = new Map<string, CardSummary>()
      let totalViews = 0
      let totalLeads = 0
      let totalSaves = 0
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
          const key = e.card_id
          const current = cardMap2.get(key) || {
            card_id: e.card_id,
            card_name: card.name || 'Sem título',
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

      const chartArray = Array.from(dateMap.entries()).map(([date, data]) => ({ date, ...data }))
      const cardArray = Array.from(cardMap2.values()).sort((a, b) => b.total_leads - a.total_leads)

      setChartData(chartArray)
      setCardSummary(cardArray)
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
            {d} {t('analytics.days')}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#60a5fa', textAlign: 'center', padding: 40 }}>A carregar analytics…</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <KPICard label={t('analytics.opens')} value={kpis.totalViews} trend={viewsTrend} color="#3b82f6" />
            <KPICard label={t('analytics.leads_form')} value={kpis.totalLeads} trend={leadsTrend} color="#22c55e" />
            <KPICard label={t('analytics.saved_contacts')} value={kpis.totalSaves} trend={savesTrend} color="#f59e0b" />
            <KPICard label={t('analytics.conv_form')} value={kpis.conversionForm.toFixed(1)} unit="%" color="#a855f7" />
          </div>

          {chartData.length > 0 && (
            <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: 18, border: '1px solid rgba(96, 165, 250, 0.2)', padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#60a5fa', margin: '0 0 20px 0' }}>
                {t('analytics.activity_chart')}
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(96, 165, 250, 0.1)" />
                  <XAxis dataKey="date" stroke="rgba(96, 165, 250, 0.6)" />
                  <YAxis stroke="rgba(96, 165, 250, 0.6)" />
                  <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(96, 165, 250, 0.3)', borderRadius: 8, color: '#60a5fa' }} />
                  <Legend wrapperStyle={{ color: '#60a5fa' }} />
                  <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} name={t('analytics.opens')} />
                  <Line type="monotone" dataKey="leads" stroke="#22c55e" strokeWidth={2} name={t('analytics.leads_form')} />
                  <Line type="monotone" dataKey="saves" stroke="#f59e0b" strokeWidth={2} name={t('analytics.saved_contacts')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {cardSummary.length > 0 && (
            <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: 18, border: '1px solid rgba(96, 165, 250, 0.2)', padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#60a5fa', margin: '0 0 20px 0' }}>
                {t('analytics.top_cards')}
              </h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {cardSummary.slice(0, 5).map((card, idx) => (
                  <div key={card.card_id} style={{ background: 'rgba(96, 165, 250, 0.05)', borderRadius: 12, padding: 16, border: '1px solid rgba(96, 165, 250, 0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: 0, color: '#60a5fa', fontWeight: 700 }}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '•'} {card.card_name}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, color: '#22c55e', fontWeight: 700 }}>
                          {card.total_leads} {t('analytics.leads_form')}
                        </p>
                        <p style={{ margin: '4px 0 0 0', color: 'rgba(96, 165, 250, 0.6)', fontSize: 12 }}>
                          {card.total_views} {t('analytics.opens')} • Form {card.conversion_form.toFixed(1)}% • {t('analytics.conv_save')} {card.conversion_save.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                
</div>
                ))}
              </div>
            </div>
          )}

          {cardSummary.length > 0 && (
            <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: 18, border: '1px solid rgba(96, 165, 250, 0.2)', padding: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#60a5fa', margin: '0 0 20px 0' }}>
                {t('analytics.cards_ranking')}
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(96, 165, 250, 0.2)' }}>
                      <th style={{ padding: 12, color: '#60a5fa', fontWeight: 700 }}>{t('analytics.card')}</th>
                      <th style={{ padding: 12, color: '#60a5fa', fontWeight: 700 }}>{t('analytics.opens')}</th>
                      <th style={{ padding: 12, color: '#60a5fa', fontWeight: 700 }}>{t('analytics.leads_form')}</th>
                      <th style={{ padding: 12, color: '#60a5fa', fontWeight: 700 }}>{t('analytics.saved_contacts')}</th>
                      <th style={{ padding: 12, color: '#60a5fa', fontWeight: 700 }}>{t('analytics.conv_form')}</th>
                      <th style={{ padding: 12, color: '#60a5fa', fontWeight: 700 }}>{t('analytics.conv_save')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cardSummary.map((card, idx) => (
                      <tr
                        key={card.card_id}
                        style={{
                          borderBottom: '1px solid rgba(96, 165, 250, 0.1)',
                          background: idx % 2 === 0 ? 'rgba(96, 165, 250, 0.05)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: 12, color: '#e0e7ff' }}>
                          {idx === 0 ? '🥇 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : ''}
                          {card.card_name}
                        </td>
                        <td style={{ padding: 12, color: '#3b82f6', fontWeight: 700 }}>{card.total_views}</td>
                        <td style={{ padding: 12, color: '#22c55e', fontWeight: 700 }}>{card.total_leads}</td>
                        <td style={{ padding: 12, color: '#f59e0b', fontWeight: 700 }}>{card.total_saves}</td>
                        <td style={{ padding: 12, color: '#a855f7', fontWeight: 700 }}>{card.conversion_form.toFixed(1)}%</td>
                        <td style={{ padding: 12, color: '#a855f7', fontWeight: 700 }}>{card.conversion_save.toFixed(1)}%</td>
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
