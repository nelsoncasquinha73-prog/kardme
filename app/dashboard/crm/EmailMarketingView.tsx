'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/lib/toast-context'
import {
  fetchEmailSegments,
  createEmailSegment,
  deleteEmailSegment,
  fetchBroadcasts,
  createBroadcast,
  deleteBroadcast,
  addLeadsToSegment,
  SEGMENT_COLORS,
  type EmailSegment,
  type EmailBroadcast,
} from '@/lib/crm/emailMarketing'
import { FiTrash2 } from 'react-icons/fi'

interface EmailMarketingViewProps {
  userId: string
}

type Lead = {
  id: string
  name: string
  email: string
  step: string
}

export default function EmailMarketingView({ userId }: EmailMarketingViewProps) {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<'audience' | 'broadcasts'>('audience')
  const [segments, setSegments] = useState<EmailSegment[]>([])
  const [broadcasts, setBroadcasts] = useState<EmailBroadcast[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewSegmentForm, setShowNewSegmentForm] = useState(false)
  const [newSegmentName, setNewSegmentName] = useState('')
  const [newSegmentColor, setNewSegmentColor] = useState(SEGMENT_COLORS[0])
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadData()
  }, [userId])

  async function loadData() {
    setLoading(true)
    try {
      const [segs, bcasts, leadsData] = await Promise.all([
        fetchEmailSegments(userId),
        fetchBroadcasts(userId),
        fetchLeads(),
      ])
      setSegments(segs)
      setBroadcasts(bcasts)
      setLeads(leadsData)
    } catch (e) {
      console.error(e)
      addToast('Erro ao carregar dados', 'error')
    }
    setLoading(false)
  }

  async function fetchLeads(): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('leads')
      .select('id, name, email, step')
      .eq('user_id', userId)
    if (error) return []
    return data || []
  }

  async function handleCreateSegment() {
    if (!newSegmentName.trim()) {
      addToast('Dá um nome ao segmento', 'error')
      return
    }
    try {
      await createEmailSegment(userId, newSegmentName.trim(), newSegmentColor)
      setNewSegmentName('')
      setNewSegmentColor(SEGMENT_COLORS[0])
      setShowNewSegmentForm(false)
      await loadData()
      addToast('Segmento criado!', 'success')
    } catch (e) {
      console.error(e)
      addToast('Erro ao criar segmento', 'error')
    }
  }

  async function handleDeleteSegment(segmentId: string) {
    if (!confirm('Apagar segmento?')) return
    try {
      await deleteEmailSegment(segmentId)
      await loadData()
      addToast('Segmento apagado', 'success')
    } catch (e) {
      console.error(e)
      addToast('Erro ao apagar segmento', 'error')
    }
  }

  async function handleAddLeadsToSegment(segmentId: string) {
    if (selectedLeads.size === 0) {
      addToast('Seleciona leads primeiro', 'error')
      return
    }
    try {
      await addLeadsToSegment(Array.from(selectedLeads), segmentId)
      setSelectedLeads(new Set())
      await loadData()
      addToast(`\${selectedLeads.size} leads adicionados`, 'success')
    } catch (e) {
      console.error(e)
      addToast('Erro ao adicionar leads', 'error')
    }
  }

  async function handleDeleteBroadcast(broadcastId: string) {
    if (!confirm('Apagar campanha?')) return
    try {
      await deleteBroadcast(broadcastId, userId)
      await loadData()
      addToast('Campanha apagada', 'success')
    } catch (e) {
      console.error(e)
      addToast('Erro ao apagar campanha', 'error')
    }
  }

  if (loading) {
    return <div style={{ color: 'rgba(255,255,255,0.5)', padding: 40, textAlign: 'center' }}>A carregar...</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>📧 Email Marketing</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>Segmentos, campanhas e rastreamento</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={() => setActiveTab('audience')}
          style={{
            padding: '12px 16px',
            background: activeTab === 'audience' ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'audience' ? '2px solid #10b981' : 'none',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          👥 Audiência
        </button>
        <button
          onClick={() => setActiveTab('broadcasts')}
          style={{
            padding: '12px 16px',
            background: activeTab === 'broadcasts' ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'broadcasts' ? '2px solid #10b981' : 'none',
            color: '#fff',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          📨 Campanhas
        </button>
      </div>

      {activeTab === 'audience' && (
        <div>
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Segmentos</h3>
              <button
                onClick={() => setShowNewSegmentForm(!showNewSegmentForm)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#10b981',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                + Novo
              </button>
            </div>

            {showNewSegmentForm && (
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <input
                  type="text"
                  value={newSegmentName}
                  onChange={(e) => setNewSegmentName(e.target.value)}
                  placeholder="Nome do segmento"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontSize: 14,
                    marginBottom: 12,
                  }}
                />
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {SEGMENT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewSegmentColor(color)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: color,
                        border: newSegmentColor === color ? '2px solid #fff' : 'none',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleCreateSegment}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#10b981',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Criar
                  </button>
                  <button
                    onClick={() => setShowNewSegmentForm(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'transparent',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {segments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.5)' }}>
                Nenhum segmento criado
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {segments.map((seg) => (
                  <div
                    key={seg.id}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: 12,
                      padding: 16,
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: seg.color }} />
                      <h4 style={{ color: '#fff', fontWeight: 700, margin: 0, flex: 1 }}>{seg.name}</h4>
                      <button
                        onClick={() => handleDeleteSegment(seg.id)}
                        style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: 16 }}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                    <button
                      onClick={() => handleAddLeadsToSegment(seg.id)}
                      disabled={selectedLeads.size === 0}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: 'none',
                        background: selectedLeads.size > 0 ? '#10b981' : 'rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: selectedLeads.size > 0 ? 'pointer' : 'not-allowed',
                      }}
                    >
                      Adicionar {selectedLeads.size > 0 ? `(\${selectedLeads.size})` : ''}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 16px' }}>Leads</h3>
            {leads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.5)' }}>
                Nenhum lead
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 12 }}>
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeads(new Set(leads.map((l) => l.id)))
                            } else {
                              setSelectedLeads(new Set())
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 12 }}>Nome</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 12 }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 12 }}>Step</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="checkbox"
                            checked={selectedLeads.has(lead.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedLeads)
                              if (e.target.checked) {
                                newSelected.add(lead.id)
                              } else {
                                newSelected.delete(lead.id)
                              }
                              setSelectedLeads(newSelected)
                            }}
                            style={{ cursor: 'pointer' }}
 />
                        </td>
                        <td style={{ padding: '12px', color: '#fff', fontSize: 14 }}>{lead.name}</td>
                        <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{lead.email}</td>
                        <td style={{ padding: '12px', color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{lead.step}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'broadcasts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Campanhas</h3>
            <button
              onClick={async () => {
                try {
                  const created = await createBroadcast(userId, {
                    title: 'Nova Campanha',
                    subject: 'Novo assunto',
                    html_content: {},
                  })
                  setBroadcasts((prev) => [created, ...prev])
                  addToast('Campanha criada!', 'success')
                } catch (e) {
                  console.error(e)
                  addToast('Erro ao criar campanha', 'error')
                }
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#10b981',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              + Nova Campanha
            </button>
          </div>

          {broadcasts.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 16,
                border: '1px dashed rgba(255,255,255,0.1)',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
              <h3 style={{ color: '#fff', fontWeight: 800, margin: '0 0 8px' }}>Nenhuma campanha ainda</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: 13 }}>
                Cria a tua primeira campanha de email
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {broadcasts.map((bc) => (
                <div
                  key={bc.id}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    padding: 16,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ color: '#fff', fontWeight: 800, margin: '0 0 4px' }}>{bc.title}</h4>
                      <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: 13 }}>{bc.subject}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: 6,
                          background:
                            bc.status === 'draft'
                              ? 'rgba(255,255,255,0.1)'
                              : bc.status === 'sent'
                                ? 'rgba(16,185,129,0.2)'
                                : 'rgba(59,130,246,0.2)',
                          color:
                            bc.status === 'draft'
                              ? 'rgba(255,255,255,0.7)'
                              : bc.status === 'sent'
                                ? '#10b981'
                                : '#3b82f6',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {bc.status === 'draft' ? 'Rascunho' : bc.status === 'sent' ? 'Enviado' : 'Agendado'}
                      </span>
                      <button
                        onClick={() => handleDeleteBroadcast(bc.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ff6b6b',
                          cursor: 'pointer',
                          fontSize: 16,
                        }}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 12 }}>
                      <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', fontSize: 12 }}>Destinatários</p>
                      <p style={{ color: '#fff', fontWeight: 800, margin: 0, fontSize: 16 }}>{bc.total_recipients}</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 12 }}>
                      <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', fontSize: 12 }}>Abertos</p>
                      <p style={{ color: '#fff', fontWeight: 800, margin: 0, fontSize: 16 }}>{bc.opened}</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 12 }}>
                      <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', fontSize: 12 }}>Cliques</p>
                      <p style={{ color: '#fff', fontWeight: 800, margin: 0, fontSize: 16 }}>{bc.clicked}</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 12 }}>
                      <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 4px', fontSize: 12 }}>Taxa Abertura</p>
                      <p style={{ color: '#fff', fontWeight: 800, margin: 0, fontSize: 16 }}>
                        {bc.total_recipients > 0 ? Math.round((bc.opened / bc.total_recipients) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
