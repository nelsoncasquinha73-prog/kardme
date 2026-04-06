'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/lib/toast-context'
import { getBroadcasts, deleteBroadcast, type EmailBroadcast } from '@/lib/crm/emailMarketing'
import { fetchLeadTypes, type LeadType } from '@/lib/crm/leadTypes'
import { FiTrash2 } from 'react-icons/fi'
import EmailCampaignEditor from './EmailCampaignEditor'

interface EmailMarketingViewProps { userId: string; preSelectedLeadId?: string }
type Lead = { id: string; name: string; email: string; step: string; audience_ids: string[] }

export default function EmailMarketingView({ userId, preSelectedLeadId }: EmailMarketingViewProps) {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<'audience' | 'broadcasts'>(preSelectedLeadId ? 'broadcasts' : 'audience')
  const [audiences, setAudiences] = useState<LeadType[]>([])
  const [broadcasts, setBroadcasts] = useState<EmailBroadcast[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(preSelectedLeadId ? new Set([preSelectedLeadId]) : new Set())
  const [editorOpen, setEditorOpen] = useState(!!preSelectedLeadId)
  const [editingBroadcastId, setEditingBroadcastId] = useState<string | undefined>(undefined)
  const [activeAudienceFilter, setActiveAudienceFilter] = useState<string | null>(null)

  useEffect(() => { loadData() }, [userId])

  async function loadData() {
    setLoading(true)
    try {
      const [auds, bcasts, leadsData] = await Promise.all([
        fetchLeadTypes(userId),
        getBroadcasts(userId),
        fetchLeads()
      ])
      setAudiences(auds)
      setBroadcasts(bcasts)
      setLeads(leadsData)
    } catch (e) { console.error(e); addToast('Erro ao carregar dados', 'error') }
    setLoading(false)
  }

  async function fetchLeads(): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('id, name, email, step, audience_ids')
      .eq('user_id', userId)
    return error ? [] : (data || []).map(l => ({ ...l, audience_ids: l.audience_ids || [] }))
  }

  async function handleDeleteBroadcast(broadcastId: string) {
    if (!confirm('Apagar campanha?')) return
    try {
      await deleteBroadcast(broadcastId, userId)
      await loadData()
      addToast('Campanha apagada', 'success')
    } catch (e) { console.error(e); addToast('Erro ao apagar campanha', 'error') }
  }

  const filteredLeads = activeAudienceFilter
    ? leads.filter(l => l.audience_ids.includes(activeAudienceFilter))
    : leads

  const audienceCounts = audiences.map(a => ({
    ...a,
    count: leads.filter(l => l.audience_ids.includes(a.id)).length
  }))

  if (loading) return <div style={{ padding: 24, textAlign: 'center', opacity: 0.6 }}>A carregar...</div>

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>📧 Email Marketing</h2>
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(0,0,0,0.1)', marginBottom: 24 }}>
        <button onClick={() => setActiveTab('audience')} style={{ padding: '12px 16px', borderRadius: '8px 8px 0 0', border: 'none', background: activeTab === 'audience' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'audience' ? '#fff' : '#666', fontWeight: 600, cursor: 'pointer' }}>🎯 Audiências</button>
        <button onClick={() => setActiveTab('broadcasts')} style={{ padding: '12px 16px', borderRadius: '8px 8px 0 0', border: 'none', background: activeTab === 'broadcasts' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'broadcasts' ? '#fff' : '#666', fontWeight: 600, cursor: 'pointer' }}>📨 Campanhas</button>
      </div>

      {activeTab === 'audience' && (
        <div>
          {/* Audiências como filtros */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Filtrar por Audiência</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveAudienceFilter(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  border: activeAudienceFilter === null ? '2px solid #6366f1' : '1.5px solid rgba(0,0,0,0.15)',
                  background: activeAudienceFilter === null ? '#6366f1' : 'transparent',
                  color: activeAudienceFilter === null ? '#fff' : '#374151',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                Todos ({leads.length})
              </button>
              {audienceCounts.map(a => (
                <button
                  key={a.id}
                  onClick={() => setActiveAudienceFilter(activeAudienceFilter === a.id ? null : a.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: `2px solid ${a.color}`,
                    background: activeAudienceFilter === a.id ? a.color : 'transparent',
                    color: activeAudienceFilter === a.id ? '#fff' : a.color,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    opacity: activeAudienceFilter === a.id ? 1 : 0.8,
                  }}
                >
                  {a.name} ({a.count})
                </button>
              ))}
            </div>
            {audiences.length === 0 && (
              <p style={{ opacity: 0.5, fontSize: 13, marginTop: 12, fontStyle: 'italic' }}>
                Ainda não tens audiências. Define-as na Lista de Contactos com o botão &quot;Audiências&quot;.
              </p>
            )}
          </div>

          {/* Lista de leads filtrada */}
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            Leads {activeAudienceFilter ? `— ${audiences.find(a => a.id === activeAudienceFilter)?.name}` : ''} ({filteredLeads.length})
          </h3>
          <div style={{ maxHeight: 450, overflowY: 'auto', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, marginBottom: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, fontSize: 12 }}>
                    <input
                      type="checkbox"
                      checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                      onChange={(e) => setSelectedLeads(e.target.checked ? new Set(filteredLeads.map(l => l.id)) : new Set())}
                    />
                  </th>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, fontSize: 12 }}>Nome</th>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, fontSize: 12 }}>Email</th>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, fontSize: 12 }}>Audiências</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr key={lead.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <td style={{ padding: 12 }}>
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedLeads)
                          if (e.target.checked) newSet.add(lead.id)
                          else newSet.delete(lead.id)
                          setSelectedLeads(newSet)
                        }}
                      />
                    </td>
                    <td style={{ padding: 12, fontSize: 13 }}>{lead.name || '—'}</td>
                    <td style={{ padding: 12, fontSize: 13, opacity: 0.7 }}>{lead.email}</td>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {lead.audience_ids.length > 0 ? lead.audience_ids.map(aid => {
                          const aud = audiences.find(a => a.id === aid)
                          if (!aud) return null
                          return (
                            <span
                              key={aid}
                              style={{
                                padding: '2px 8px',
                                borderRadius: 12,
                                background: aud.color,
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {aud.name}
                            </span>
                          )
                        }) : (
                          <span style={{ fontSize: 11, opacity: 0.3, fontStyle: 'italic' }}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ações com leads selecionados */}
          {selectedLeads.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
              <p style={{ fontSize: 13, opacity: 0.7, margin: 0 }}>
                {selectedLeads.size} lead(s) selecionado(s)
              </p>
              <button
                onClick={() => {
                  setActiveTab('broadcasts')
                  setEditorOpen(true)
                  setEditingBroadcastId(undefined)
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                📨 Enviar Campanha
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'broadcasts' && (
        <div>
          {!editorOpen ? (
            <>
              <button
                onClick={() => { setEditorOpen(true); setEditingBroadcastId(undefined); setSelectedLeads(new Set()) }}
                style={{ padding: '10px 16px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', marginBottom: 24 }}
              >
                + Nova Campanha
              </button>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Campanhas ({broadcasts.length})</h3>
              {broadcasts.length === 0 ? (
                <p style={{ opacity: 0.6 }}>Sem campanhas ainda.</p>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {broadcasts.map(bc => (
                    <div key={bc.id} style={{ background: '#f9fafb', padding: 16, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div><strong style={{ color: '#111827' }}>{bc.subject}</strong></div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setEditingBroadcastId(bc.id); setEditorOpen(true) }} style={{ padding: '8px 12px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Editar</button>
                        <button onClick={() => handleDeleteBroadcast(bc.id)} style={{ padding: '8px 12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Apagar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <EmailCampaignEditor
              userId={userId}
              broadcastId={editingBroadcastId}
              onClose={() => {
                setEditorOpen(false)
                setEditingBroadcastId(undefined)
                setSelectedLeads(new Set())
                loadData()
              }}
              onSave={() => {
                setEditorOpen(false)
                setEditingBroadcastId(undefined)
                loadData()
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}
