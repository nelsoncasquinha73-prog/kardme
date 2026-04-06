'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/lib/toast-context'
import { getSegments, createSegment, deleteSegment, getBroadcasts, createBroadcast, deleteBroadcast, addLeadsToSegment, type EmailSegment, type EmailBroadcast } from '@/lib/crm/emailMarketing'
import { FiTrash2 } from 'react-icons/fi'
import EmailCampaignEditor from './EmailCampaignEditor'

interface EmailMarketingViewProps { userId: string; preSelectedLeadId?: string }
type Lead = { id: string; name: string; email: string; step: string }

export default function EmailMarketingView({ userId, preSelectedLeadId }: EmailMarketingViewProps) {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<'audience' | 'broadcasts'>(preSelectedLeadId ? 'broadcasts' : 'audience')
  const [segments, setSegments] = useState<EmailSegment[]>([])
  const [broadcasts, setBroadcasts] = useState<EmailBroadcast[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewSegmentForm, setShowNewSegmentForm] = useState(false)
  const [newSegmentName, setNewSegmentName] = useState('')
  const [newSegmentColor, setNewSegmentColor] = useState(SEGMENT_COLORS[0])
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(preSelectedLeadId ? new Set([preSelectedLeadId]) : new Set())
  const [editorOpen, setEditorOpen] = useState(!!preSelectedLeadId)
  const [editingBroadcastId, setEditingBroadcastId] = useState<string | undefined>(undefined)

  useEffect(() => { loadData() }, [userId])

  async function loadData() {
    setLoading(true)
    try {
      const [segs, bcasts, leadsData] = await Promise.all([getSegments(userId), getBroadcasts(userId), fetchLeads()])
      setSegments(segs); setBroadcasts(bcasts); setLeads(leadsData)
    } catch (e) { console.error(e); addToast('Erro ao carregar dados', 'error') }
    setLoading(false)
  }

  async function fetchLeads(): Promise<Lead[]> {
    const { data, error } = await supabase.from('leads').select('id, name, email, step').eq('user_id', userId)
    return error ? [] : (data || [])
  }

  async function handleCreateSegment() {
    if (!newSegmentName.trim()) { addToast('Dá um nome ao segmento', 'error'); return }
    try {
      await createSegment(userId, newSegmentName.trim(), newSegmentColor)
      setNewSegmentName(''); setNewSegmentColor(SEGMENT_COLORS[0]); setShowNewSegmentForm(false)
      await loadData(); addToast('Segmento criado!', 'success')
    } catch (e) { console.error(e); addToast('Erro ao criar segmento', 'error') }
  }

  async function handleDeleteSegment(segmentId: string) {
    if (!confirm('Apagar segmento?')) return
    try { await deleteSegment(segmentId); await loadData(); addToast('Segmento apagado', 'success') } catch (e) { console.error(e); addToast('Erro ao apagar segmento', 'error') }
  }

  async function handleAddLeadsToSegment(segmentId: string) {
    if (selectedLeads.size === 0) { addToast('Seleciona leads primeiro', 'error'); return }
    try { await addLeadsToSegment(Array.from(selectedLeads), segmentId); setSelectedLeads(new Set()); await loadData(); addToast(`${selectedLeads.size} leads adicionados!`, 'success') } catch (e) { console.error(e); addToast('Erro ao adicionar leads', 'error') }
  }

  async function handleDeleteBroadcast(broadcastId: string) {
    if (!confirm('Apagar campanha?')) return
    try { await deleteBroadcast(broadcastId, userId); await loadData(); addToast('Campanha apagada', 'success') } catch (e) { console.error(e); addToast('Erro ao apagar campanha', 'error') }
  }

  if (loading) return <div style={{ padding: 24, textAlign: 'center', opacity: 0.6 }}>A carregar...</div>

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>📧 Email Marketing</h2>
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(0,0,0,0.1)', marginBottom: 24 }}>
        <button onClick={() => setActiveTab('audience')} style={{ padding: '12px 16px', border: 'none', background: activeTab === 'audience' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'audience' ? '#fff' : '#666', fontWeight: 600, cursor: 'pointer' }}>👥 Audience</button>
        <button onClick={() => setActiveTab('broadcasts')} style={{ padding: '12px 16px', border: 'none', background: activeTab === 'broadcasts' ? 'var(--color-primary)' : 'transparent', color: activeTab === 'broadcasts' ? '#fff' : '#666', fontWeight: 600, cursor: 'pointer' }}>📨 Campanhas</button>
      </div>

      {activeTab === 'audience' && (
        <div>
          <button onClick={() => setShowNewSegmentForm(!showNewSegmentForm)} style={{ padding: '10px 16px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', marginBottom: 24 }}>+ Novo Segmento</button>
          {showNewSegmentForm && (
            <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8, marginBottom: 24 }}>
              <input type="text" placeholder="Nome do segmento" value={newSegmentName} onChange={(e) => setNewSegmentName(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.1)', marginBottom: 12, boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>{SEGMENT_COLORS.map((color) => (<button key={color} onClick={() => setNewSegmentColor(color)} style={{ width: 32, height: 32, borderRadius: 6, background: color, border: newSegmentColor === color ? '2px solid #000' : '1px solid rgba(0,0,0,0.2)', cursor: 'pointer' }} />))}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleCreateSegment} style={{ flex: 1, padding: '10px 16px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Criar</button>
                <button onClick={() => setShowNewSegmentForm(false)} style={{ flex: 1, padding: '10px 16px', background: '#f3f4f6', color: '#111827', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              </div>
            </div>
          )}
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Segmentos</h3>
          {segments.length === 0 ? <p style={{ opacity: 0.6, marginBottom: 24 }}>Sem segmentos ainda.</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
              {segments.map((seg) => (<div key={seg.id} style={{ background: seg.color, padding: 12, borderRadius: 8, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><strong>{seg.name}</strong></div><button onClick={() => handleDeleteSegment(seg.id)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', borderRadius: 6, cursor: 'pointer', padding: '6px 8px' }}><FiTrash2 size={14} /></button></div>))}
            </div>
          )}
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Leads ({leads.length})</h3>
          <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, marginBottom: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, fontSize: 12 }}><input type="checkbox" checked={selectedLeads.size === leads.length && leads.length > 0} onChange={(e) => setSelectedLeads(e.target.checked ? new Set(leads.map((l) => l.id)) : new Set())} /></th>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, fontSize: 12 }}>Nome</th>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, fontSize: 12 }}>Email</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (<tr key={lead.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}><td style={{ padding: 12 }}><input type="checkbox" checked={selectedLeads.has(lead.id)} onChange={(e) => { const newSet = new Set(selectedLeads); if (e.target.checked) newSet.add(lead.id); else newSet.delete(lead.id); setSelectedLeads(newSet) }} /></td><td style={{ padding: 12, fontSize: 13 }}>{lead.name}</td><td style={{ padding: 12, fontSize: 13, opacity: 0.7 }}>{lead.email}</td></tr>))}
              </tbody>
            </table>
          </div>
          {selectedLeads.size > 0 && (<div><p style={{ fontSize: 12, marginBottom: 12, opacity: 0.7 }}>{selectedLeads.size} lead(s) selecionado(s)</p>{segments.length > 0 && (<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{segments.map((seg) => (<button key={seg.id} onClick={() => handleAddLeadsToSegment(seg.id)} style={{ padding: '8px 12px', background: seg.color, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Adicionar a {seg.name}</button>))}</div>)}</div>)}
        </div>
      )}

      {activeTab === 'broadcasts' && (
        <div>
          {!editorOpen ? (
            <>
              <button onClick={() => { setEditorOpen(true); setEditingBroadcastId(undefined); setSelectedLeads(new Set()) }} style={{ padding: '10px 16px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', marginBottom: 24 }}>+ Nova Campanha</button>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Campanhas ({broadcasts.length})</h3>
              {broadcasts.length === 0 ? <p style={{ opacity: 0.6 }}>Sem campanhas ainda.</p> : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {broadcasts.map((bc) => (<div key={bc.id} style={{ background: '#f9fafb', padding: 16, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><strong style={{ color: '#111827' }}>{bc.subject}</strong></div><div style={{ display: 'flex', gap: 8 }}><button onClick={() => { setEditingBroadcastId(bc.id); setEditorOpen(true) }} style={{ padding: '8px 12px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Editar</button><button onClick={() => handleDeleteBroadcast(bc.id)} style={{ padding: '8px 12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Apagar</button></div></div>))}
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
