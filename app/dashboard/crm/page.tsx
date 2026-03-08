'use client'
import { useLanguage } from '@/components/language/LanguageProvider'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Lead = {
  id: string
  name: string
  email: string
  phone: string
  zone: string | null
  message: string
  marketing_opt_in: boolean
  consent_given: boolean
  created_at: string
  contacted: boolean
  card_id: string
}

export default function CrmProPage() {
  const { t } = useLanguage()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filterMarketing, setFilterMarketing] = useState<boolean | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const loadLeads = async () => {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLeads([])
      setLoading(false)
      return
    }

    let query = supabase
      .from('leads')
      .select(`
        id,
        name,
        email,
        phone,
        zone,
        message,
        marketing_opt_in,
        consent_given,
        created_at,
        contacted,
        card_id,
        cards!inner (
          user_id
        )
      `)
      .eq('cards.user_id', user.id)

    if (filterMarketing !== null) {
      query = query.eq('marketing_opt_in', filterMarketing)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Erro a carregar leads:', error)
      setLeads([])
    } else {
      setLeads(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadLeads()
  }, [filterMarketing])

  const toggleContacted = async (id: string, current: boolean) => {
    await supabase
      .from('leads')
      .update({ contacted: !current })
      .eq('id', id)

    setLeads(prev =>
      prev.map(l =>
        l.id === id ? { ...l, contacted: !current } : l
      )
    )
  }

  const filteredLeads = leads.filter(l =>
    searchTerm === '' ||
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.zone && l.zone.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return <p style={{ padding: 32 }}>A carregar leads…</p>
  }

  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ marginBottom: 24 }}>CRM Pro</h1>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Pesquisar por nome, email ou zona…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.12)',
            fontSize: 13,
            flex: 1,
            minWidth: 200,
          }}
        />

        <select
          value={filterMarketing === null ? '' : filterMarketing ? 'true' : 'false'}
          onChange={(e) => {
            if (e.target.value === '') setFilterMarketing(null)
            else setFilterMarketing(e.target.value === 'true')
          }}
          style={{
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.12)',
            fontSize: 13,
            background: '#fff',
          }}
        >
          <option value="">Todos (Marketing)</option>
          <option value="true">Opt-in Marketing</option>
          <option value="false">Sem opt-in</option>
        </select>
      </div>

      {filteredLeads.length === 0 && (
        <p style={{ opacity: 0.6 }}>
          {leads.length === 0 ? 'Ainda não tens leads.' : 'Nenhuma lead corresponde aos filtros.'}
        </p>
      )}

      {filteredLeads.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                <th style={th}>✓</th>
                <th style={th}>Nome</th>
                <th style={th}>Email</th>
                <th style={th}>Zona</th>
                <th style={th}>Marketing</th>
                <th style={th}>Data</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => (
                <tr key={lead.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <td style={td}>
                    <input
                      type="checkbox"
                      checked={lead.contacted}
                      onChange={() => toggleContacted(lead.id, lead.contacted)}
                    />
                  </td>
                  <td style={td}>
                    <strong>{lead.name}</strong>
                    {lead.phone && <div style={{ fontSize: 11, opacity: 0.6 }}>{lead.phone}</div>}
                  </td>
                  <td style={td}>{lead.email}</td>
                  <td style={td}>{lead.zone || '—'}</td>
                  <td style={td}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      background: lead.marketing_opt_in ? '#d1fae5' : '#fee2e2',
                      color: lead.marketing_opt_in ? '#065f46' : '#7f1d1d',
                    }}>
                      {lead.marketing_opt_in ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td style={td}>{new Date(lead.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 20, fontSize: 12, opacity: 0.6 }}>
        Total: {filteredLeads.length} lead(s)
      </div>
    </main>
  )
}

const th = {
  textAlign: 'left' as const,
  padding: '12px 10px',
  fontWeight: 700,
  fontSize: 12,
}

const td = {
  padding: '12px 10px',
}
