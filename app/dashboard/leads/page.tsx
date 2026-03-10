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
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadLeads = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLeads([]); setLoading(false); return }

    const { data, error } = await supabase
      .from('leads')
      .select(`id, name, email, phone, message, created_at, contacted, cards!inner(user_id)`)
      .eq('cards.user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) { console.error(error); setLeads([]) }
    else setLeads(data || [])
    setLoading(false)
  }

  useEffect(() => { loadLeads() }, [])

  const toggleContacted = async (id: string, current: boolean) => {
    await supabase.from('leads').update({ contacted: !current }).eq('id', id)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, contacted: !current } : l))
  }

  const deleteLead = async (id: string) => {
    if (!confirm('Tens a certeza que queres apagar esta lead? Esta ação não pode ser desfeita.')) return
    setDeletingId(id)
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) { alert('Erro ao apagar lead.'); setDeletingId(null); return }
    setLeads(prev => prev.filter(l => l.id !== id))
    setDeletingId(null)
  }

  const exportCSV = () => {
    const headers = ['Nome', 'Email', 'Telemóvel', 'Mensagem', 'Contactado', 'Data']
    const rows = leads.map(l => [l.name, l.email, l.phone, l.message, l.contacted ? 'Sim' : 'Não', new Date(l.created_at).toLocaleDateString()])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'leads.csv')
    link.click()
  }

  if (loading) return <p style={{ padding: 32 }}>A carregar leads…</p>

  const contactedCount = leads.filter(l => l.contacted).length

  return (
    <main style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Leads</h1>
          <p style={{ fontSize: 13, opacity: 0.6, margin: 0 }}>
            {leads.length} lead(s) • {contactedCount} contactada(s) • {leads.length - contactedCount} por contactar
          </p>
        </div>
        {leads.length > 0 && (
          <button
            onClick={exportCSV}
            style={{ padding: '10px 16px', borderRadius: 10, background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
          >
            Exportar CSV
          </button>
        )}
      </div>

      {leads.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.5 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p>Ainda não tens leads.</p>
        </div>
      )}

      {leads.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
                <th style={th}>✓</th>
                <th style={th}>Nome</th>
                <th style={th}>Email</th>
                <th style={th}>Telemóvel</th>
                <th style={th}>Mensagem</th>
                <th style={th}>Data</th>
                <th style={th}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', opacity: deletingId === lead.id ? 0.4 : 1, transition: 'opacity 0.2s' }}>
                  <td style={td}>
                    <input type="checkbox" checked={lead.contacted} onChange={() => toggleContacted(lead.id, lead.contacted)} />
                  </td>
                  <td style={td}>
                    <strong>{lead.name}</strong>
                    {lead.contacted && <span style={{ marginLeft: 6, fontSize: 10, background: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>Contactado</span>}
                  </td>
                  <td style={td}>{lead.email}</td>
                  <td style={td}>{lead.phone || '—'}</td>
                  <td style={{ ...td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.message || '—'}</td>
                  <td style={{ ...td, whiteSpace: 'nowrap' }}>{new Date(lead.created_at).toLocaleDateString()}</td>
                  <td style={td}>
                    <button
                      onClick={() => deleteLead(lead.id)}
                      disabled={deletingId === lead.id}
                      title="Apagar lead"
                      style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}

const th = { textAlign: 'left' as const, padding: '12px 10px', fontWeight: 700, fontSize: 12 }
const td = { padding: '12px 10px' }
