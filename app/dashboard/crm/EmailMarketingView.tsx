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
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>As tuas Audiências</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {audienceCounts.map(a => (
                <div
                  key={a.id}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 12,
                    background: a.color,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {a.name}
                  <span style={{
                    background: 'rgba(255,255,255,0.25)',
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 800,
                  }}>
                    {a.count}
                  </span>
                </div>
              ))}
            </div>
            {audiences.length === 0 && (
              <p style={{ opacity: 0.5, fontSize: 13, marginTop: 12, fontStyle: 'italic' }}>
                Ainda não tens audiências. Define-as na Lista de Contactos com o botão &quot;Audiências&quot;.
              </p>
            )}
          </div>

          <div style={{ background: '#f9fafb', borderRadius: 12, padding: 20, marginTop: 16 }}>
            <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>
              <strong>💡 Como funciona:</strong> As audiências são geridas na <strong>Lista de Contactos</strong>. Aqui podes ver quantas leads tens em cada audiência. Para enviar uma campanha a uma audiência específica, vai a <strong>Campanhas</strong> e seleciona a audiência no envio.
            </p>
          </div>
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
