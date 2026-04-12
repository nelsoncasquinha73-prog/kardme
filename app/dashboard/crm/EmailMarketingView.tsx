'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/lib/toast-context'
import { getBroadcasts, deleteBroadcast, getBroadcastRecipients, type EmailBroadcast } from '@/lib/crm/emailMarketing'
import { fetchLeadTypes, type LeadType } from '@/lib/crm/leadTypes'
import { FiTrash2 } from 'react-icons/fi'
import EmailCampaignEditor from './EmailCampaignEditor'

interface EmailMarketingViewProps { userId: string; preSelectedLeadId?: string }
type Lead = { id: string; name: string; email: string; step: string; audience_ids: string[] }

export default function EmailMarketingView({ userId, preSelectedLeadId }: EmailMarketingViewProps) {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<'audience' | 'broadcasts' | 'unsubscribes'>(preSelectedLeadId ? 'broadcasts' : 'audience')
  const [unsubscribes, setUnsubscribes] = useState<Array<{email: string, unsubscribed_at: string}>>([])

  const loadUnsubscribes = async () => {
    const { data } = await supabase
      .from('email_unsubscribes')
      .select('email, unsubscribed_at')
      .eq('user_id', userId)
      .order('unsubscribed_at', { ascending: false })
    setUnsubscribes(data || [])
  }
  const [audiences, setAudiences] = useState<LeadType[]>([])
  const [broadcasts, setBroadcasts] = useState<EmailBroadcast[]>([])
  const [showRecipientsModal, setShowRecipientsModal] = useState(false)
  const [recipientsModalBc, setRecipientsModalBc] = useState<EmailBroadcast | null>(null)
  const [recipients, setRecipients] = useState<any[]>([])
  const [loadingRecipients, setLoadingRecipients] = useState(false)
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

  async function silentReload() {
    try {
      const [auds, bcasts, leadsData] = await Promise.all([
        fetchLeadTypes(userId),
        getBroadcasts(userId),
        fetchLeads()
      ])
      setAudiences(auds)
      setBroadcasts(bcasts)
      setLeads(leadsData)
    } catch (e) { console.error(e) }
  }

  async function fetchLeads(): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('id, name, email, step, audience_ids')
      .eq('user_id', userId)
    return error ? [] : (data || []).map(l => ({ ...l, audience_ids: l.audience_ids || [] }))
  }

  async function handleDuplicateBroadcast(bc: any) {
    try {
      const { error } = await supabase
        .from('email_broadcasts')
        .insert({
          user_id: userId,
          title: bc.title + ' (cópia)',
          subject: bc.subject,
          preheader: bc.preheader,
          html_content: bc.html_content,
          status: 'draft',
        })
      if (error) throw error
      await silentReload()
    } catch (e) {
      console.error('Erro ao duplicar campanha:', e)
    }
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
        <button onClick={() => { setActiveTab('unsubscribes'); loadUnsubscribes() }} style={{ padding: '12px 16px', borderRadius: '8px 8px 0 0', border: 'none', background: activeTab === 'unsubscribes' ? '#ef4444' : 'transparent', color: activeTab === 'unsubscribes' ? '#fff' : '#666', fontWeight: 600, cursor: 'pointer' }}>🚫 Unsubscribes</button>
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

      {activeTab === 'unsubscribes' && (
        <div style={{ padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🚫 Unsubscribes ({unsubscribes.length})</h3>
          {unsubscribes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <p>Nenhum unsubscribe ainda.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#9ca3af' }}>Email</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: '#9ca3af' }}>Data</th>
                </tr>
              </thead>
              <tbody>
                {unsubscribes.map((u, i) => (
                  <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '10px 12px', color: '#f1f5f9' }}>{u.email}</td>
                    <td style={{ padding: '10px 12px', color: '#9ca3af' }}>{new Date(u.unsubscribed_at).toLocaleDateString('pt-PT')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal Destinatários */}
      {showRecipientsModal && recipientsModalBc && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => setShowRecipientsModal(false)}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 520, width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#111827' }}>👥 Destinatários</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>{recipientsModalBc.subject}</p>
              </div>
              <button onClick={() => setShowRecipientsModal(false)} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingRecipients ? (
                <p style={{ textAlign: 'center', padding: 24, color: '#6b7280' }}>A carregar...</p>
              ) : recipients.length === 0 ? (
                <p style={{ textAlign: 'center', padding: 24, color: '#6b7280' }}>Sem destinatários registados.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Email</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Estado</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '10px 12px', color: '#111827' }}>{r.email}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: r.status === 'sent' ? '#d1fae5' : '#fee2e2', color: r.status === 'sent' ? '#065f46' : '#991b1b' }}>
                            {r.status === 'sent' ? '✅ Enviado' : r.status === 'failed' ? '❌ Falhou' : r.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#6b7280', fontSize: 12 }}>
                          {r.created_at ? new Date(r.created_at).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{recipients.length} destinatário(s)</span>
              <button onClick={() => setShowRecipientsModal(false)} style={{ padding: '8px 20px', background: '#111827', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Fechar</button>
            </div>
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
                  {broadcasts.map(bc => {
                    const isSent = bc.status === 'sent'
                    const sentDate = bc.sent_at ? new Date(bc.sent_at).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null
                    return (
                      <div key={bc.id} style={{ background: '#f9fafb', padding: 16, borderRadius: 8, border: `1.5px solid ${isSent ? '#d1fae5' : '#e5e7eb'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <strong style={{ color: '#111827', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bc.subject}</strong>
                            <span style={{ flexShrink: 0, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: isSent ? '#d1fae5' : '#fef9c3', color: isSent ? '#065f46' : '#854d0e' }}>
                              {isSent ? '✅ Enviado' : '📝 Rascunho'}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', gap: 12 }}>
                            {isSent && sentDate && <span>📅 {sentDate}</span>}

                            {bc.title && bc.title !== bc.subject && <span style={{ opacity: 0.7 }}>{bc.title}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          <button
                            onClick={async () => {
                              setRecipientsModalBc(bc)
                              setShowRecipientsModal(true)
                              setLoadingRecipients(true)
                              try {
                                const data = await getBroadcastRecipients(bc.id)
                                setRecipients(data)
                              } catch (e) {
                                setRecipients([])
                              }
                              setLoadingRecipients(false)
                            }}
                            style={{ padding: '8px 12px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            📬 Enviados {(bc.total_recipients ?? 0) > 0 ? `(${bc.total_recipients})` : ''}
                          </button>
                          <button onClick={() => { setEditingBroadcastId(bc.id); setEditorOpen(true) }} style={{ padding: '8px 12px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Editar</button>
                          <button onClick={() => handleDuplicateBroadcast(bc)} style={{ padding: '8px 12px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Duplicar</button>
                          <button onClick={() => handleDeleteBroadcast(bc.id)} style={{ padding: '8px 12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Apagar</button>
                        </div>
                      </div>
                    )
                  })}
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
                silentReload()
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}
