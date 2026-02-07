'use client'
import { useLanguage } from '@/components/language/LanguageProvider'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Lead = {
  id: string
  name: string
  email: string
  phone: string
  message: string
  created_at: string
  contacted: boolean
}

export default function LeadsPage() {
  const { t } = useLanguage()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  // 🔹 Carregar leads do utilizador
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

    const { data, error } = await supabase
      .from('leads')
      .select(`
        id,
        name,
        email,
        phone,
        message,
        created_at,
        contacted,
        cards!inner (
          user_id
        )
      `)
      .eq('cards.user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(t('dashboard.error_loading_data'), error)
      setLeads([])
    } else {
      setLeads(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadLeads()
  }, [])

  // 🔹 Marcar como contactado
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

  // 🔹 Exportar CSV
  const exportCSV = () => {
    const headers = [
      'Nome',
      'Email',
      'Telemóvel',
      'Mensagem',
      'Contactado',
      'Data',
    ]

    const rows = leads.map(l => [
      l.name,
      l.email,
      l.phone,
      l.message,
      l.contacted ? 'Sim' : 'Não',
      new Date(l.created_at).toLocaleDateString(),
    ])

    const csv =
      [headers, ...rows]
        .map(r => r.map(v => `"${v ?? ''}"`).join(','))
        .join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'leads.csv')
    link.click()
  }

  if (loading) {
    return <p style={{ padding: 32 }}>A carregar leads…</p>
  }

  return (
    <main style={{ padding: 32 }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1>Leads</h1>

        {leads.length > 0 && (
          <button onClick={exportCSV}>
            Exportar CSV
          </button>
        )}
      </header>

      {leads.length === 0 && (
        <p style={{ opacity: 0.6, marginTop: 20 }}>
          Ainda não tens leads.
        </p>
      )}

      {leads.length > 0 && (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: 24,
          }}
        >
          <thead>
            <tr>
              <th style={th}>Contactado</th>
              <th style={th}>Nome</th>
              <th style={th}>Email</th>
              <th style={th}>Telemóvel</th>
              <th style={th}>Mensagem</th>
              <th style={th}>Data</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id}>
                <td style={td}>
                  <input
                    type="checkbox"
                    checked={lead.contacted}
                    onChange={() =>
                      toggleContacted(
                        lead.id,
                        lead.contacted
                      )
                    }
                  />
                </td>
                <td style={td}>{lead.name}</td>
                <td style={td}>{lead.email}</td>
                <td style={td}>{lead.phone}</td>
                <td style={td}>{lead.message}</td>
                <td style={td}>
                  {new Date(
                    lead.created_at
                  ).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}

const th = {
  textAlign: 'left' as const,
  borderBottom: '1px solid #ddd',
  padding: 10,
}

const td = {
  borderBottom: '1px solid #eee',
  padding: 10,
}
