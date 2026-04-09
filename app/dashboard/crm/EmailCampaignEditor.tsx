'use client'
import ImageUploadInput from './ImageUploadInput'
import VideoUploadInput from './VideoUploadInput'

import { generateEmailHtmlBody } from './emailBlockRenderer'
import { parseVideoLink, getVimeoThumbnail } from '@/lib/crm/videoLinkParser'
import { generateThumbnailFromVideoUrl } from '@/lib/crm/videoThumbnailFromUrl'
import EmailTextBlockEditor from './EmailTextBlockEditor'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/lib/toast-context'
import {
  createBroadcast,
  updateBroadcast,
  sendBroadcast,
} from '@/lib/crm/emailMarketing'
import { DEFAULT_EMAIL_BLOCKS, type EmailBlockType } from '@/lib/crm/emailEditor'
import { fetchLeadTypes, type LeadType } from '@/lib/crm/leadTypes'
import EmailPreviewModal from './EmailPreviewModal'
import TextBlockEditor from './TextBlockEditor'
import { FiX, FiPlus, FiTrash2, FiEye } from 'react-icons/fi'

export type EmailBlock = {
  id: string
  type: EmailBlockType
  content: Record<string, any>
}

interface EmailCampaignEditorProps {
  userId: string
  broadcastId?: string
  preSelectedLeadIds?: string[]
  onClose: () => void
  onSave: () => void
}

export default function EmailCampaignEditor({ userId, broadcastId, preSelectedLeadIds, onClose, onSave }: EmailCampaignEditorProps) {
  const { addToast } = useToast()
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [preheader, setPreheader] = useState('')
  const [blocks, setBlocks] = useState<EmailBlock[]>([])
  const [audiences, setAudiences] = useState<LeadType[]>([])
  const [selectedAudiences, setSelectedAudiences] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiPrompt, setAIPrompt] = useState('')
  const [aiGenerating, setAIGenerating] = useState(false)
  const [aiError, setAIError] = useState<string | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendingTo, setSendingTo] = useState<'audience' | 'all' | 'individual' | 'manual'>(preSelectedLeadIds && preSelectedLeadIds.length === 1 ? 'individual' : preSelectedLeadIds && preSelectedLeadIds.length > 1 ? 'all' : 'audience')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(preSelectedLeadIds?.length === 1 ? preSelectedLeadIds[0] : null)
  const [manualEmail, setManualEmail] = useState<string>('')
  const [leads, setLeads] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [userId, broadcastId])

  async function loadData() {
    setLoading(true)
    try {
      const auds = await fetchLeadTypes(userId)
      const { data: leadsData, error: leadsError } = await supabase.from('leads').select('id, name, email, audience_ids').eq('user_id', userId)
      setLeads(leadsError ? [] : (leadsData || []))
      setAudiences(auds)

      if (broadcastId) {
        const { data, error } = await supabase
          .from('email_broadcasts')
          .select('*')
          .eq('id', broadcastId)
          .eq('user_id', userId)
          .single()

        if (error) throw error
        if (data) {
          setTitle(data.title)
          setSubject(data.subject)
          setPreheader(data.preheader || '')
          setBlocks(data.html_content?.blocks || [])
        }
      }
    } catch (e) {
      console.error(e)
      addToast('Erro ao carregar dados', 'error')
    }
    setLoading(false)
  }

  function addBlock(blockType: EmailBlockType) {
    const template = DEFAULT_EMAIL_BLOCKS.find((b) => b.block_type === blockType)
    if (!template) return

    const newBlock: EmailBlock = {
      id: Date.now().toString(),
      type: blockType,
      content: { ...template.content },
    }

    setBlocks([...blocks, newBlock])
    setSelectedBlockId(newBlock.id)
  }

  function removeBlock(blockId: string) {
    setBlocks(blocks.filter((b) => b.id !== blockId))
    if (selectedBlockId === blockId) setSelectedBlockId(null)
  }

  function updateBlock(blockId: string, updates: Record<string, any>) {
    console.log(`[UPDATE BLOCK] ${blockId}:`, updates)
    setBlocks(
      blocks.map((b) =>
        b.id === blockId
          ? {
              ...b,
              content: { ...b.content, ...updates },
            }
          : b
      )
    )
  }

  function moveBlock(blockId: string, direction: 'up' | 'down') {
    const index = blocks.findIndex((b) => b.id === blockId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === blocks.length - 1) return

    const newBlocks = [...blocks]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[newBlocks[index], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[index]]
    setBlocks(newBlocks)
  }

  async function handleSend() {
    if (!title.trim() || !subject.trim()) {
      addToast('Preenche título e assunto', 'error')
      return
    }

    if (blocks.length === 0) {
      addToast('Adiciona pelo menos um bloco', 'error')
      return
    }

    setSending(true)
    try {
      let recipients: Array<{ email: string; leadId?: string; name?: string | null }> = []

      if (sendingTo === 'audience' && selectedAudiences.size > 0) {
        const audIds = Array.from(selectedAudiences)
        recipients = leads
          .filter((l: any) => {
            const lAuds: string[] = l.audience_ids || []
            return audIds.some(aid => lAuds.includes(aid))
          })
          .map((l: any) => ({ email: l.email, leadId: l.id, name: l.name || null }))
          .filter((r) => r.email)
      } else if (sendingTo === 'all') {
        const pool = preSelectedLeadIds && preSelectedLeadIds.length > 1
          ? leads.filter((l: any) => preSelectedLeadIds.includes(l.id))
          : leads
        recipients = pool.map((l: any) => ({ email: l.email, leadId: l.id, name: l.name || null }))
      } else if (sendingTo === 'individual' && selectedLeadId) {
        const lead = leads.find((l: any) => l.id === selectedLeadId)
        if (lead?.email) {
          recipients = [{ email: lead.email, leadId: lead.id, name: lead.name || null }]
        }
      } else if (sendingTo === 'manual' && manualEmail.trim()) {
        recipients = [{ email: manualEmail.trim() }]
      }

      if (recipients.length === 0) {
        addToast('Sem destinatários selecionados', 'error')
        setSending(false)
        return
      }

      let bcastId = broadcastId
      if (!broadcastId) {
        const htmlContent = { blocks, createdAt: new Date().toISOString() }
        const { data, error } = await supabase
          .from('email_broadcasts')
          .insert({
            user_id: userId,
            title,
            subject,
            preheader,
            html_content: htmlContent,
          })
          .select()
          .single()

        if (error) throw error
        bcastId = data.id
      }

      if (!bcastId) {
        throw new Error('Broadcast inválido')
      }

      // Render blocks to HTML for email
      const htmlBody = generateEmailHtmlBody(blocks, subject, preheader)
      
      const result: { sent: number; failed: number } = await sendBroadcast(userId, bcastId, recipients, subject, htmlBody)
      addToast(`✅ ${result.sent} emails enviados!`, 'success')
      setShowSendModal(false)
      setSelectedLeadId(null)
      setManualEmail('')
      setSendingTo('audience')
      onSave()
      onClose()
    } catch (e: any) {
      console.error(e)
      addToast(e.message || 'Erro ao enviar', 'error')
    }
    setSending(false)
  }

  async function handleSave() {
    if (!title.trim() || !subject.trim()) {
      addToast('Preenche título e assunto', 'error')
      return
    }

    if (blocks.length === 0) {
      addToast('Adiciona pelo menos um bloco', 'error')
      return
    }

    setSaving(true)
    try {
      const htmlContent = {
        blocks,
        createdAt: new Date().toISOString(),
      }

      if (broadcastId) {
        await updateBroadcast(broadcastId, userId, {
          title,
          subject,
          preheader,
          html_content: htmlContent,
        })
        addToast('Campanha atualizada!', 'success')
      } else {
        await createBroadcast(userId, {
          title,
          subject,
          preheader,
          html_content: htmlContent,
        })
        addToast('Campanha criada!', 'success')
      }

      onSave()
    } catch (e) {
      console.error(e)
      addToast('Erro ao guardar campanha', 'error')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
        A carregar...
      </div>
    )
  }

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId)

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '180px 1fr 320px',
          gap: 0,
          height: '100vh',
          background: '#0f172a',
        }}
      >
        {/* COLUNA ESQUERDA: BLOCOS */}
        <div
          style={{
            borderRight: '1px solid rgba(255,255,255,0.1)',
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <h3 style={{ color: '#fff', fontWeight: 800, margin: 0, fontSize: 13 }}>Blocos</h3>
          {DEFAULT_EMAIL_BLOCKS.map((template) => (
            <button
              key={template.block_type}
              onClick={() => addBlock(template.block_type)}
              style={{
                padding: '10px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'
              }}
            >
              + {template.name}
            </button>
          ))}
        </div>

        {/* COLUNA CENTRAL: CANVAS + HEADER */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'auto', flex: 1, minHeight: 0 }}>
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h2 style={{ color: '#fff', fontWeight: 900, margin: '0 0 4px', fontSize: 18 }}>
                Editor de Email
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: 12 }}>
                {title || 'Sem título'}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 20,
              }}
            >
              <FiX />
            </button>
          </div>

          {/* Metadata */}
          <div
            style={{
              padding: '12px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: 4,
                  fontWeight: 700,
                }}
              >
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nome da campanha"
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 12,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: 4,
                  fontWeight: 700,
                }}
              >
                Assunto
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Assunto do email"
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 12,
                }}
              />
              {/* Variáveis disponíveis */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginRight: 4, lineHeight: '22px' }}>Variáveis:</span>
                {[
                  { label: '👤 Nome', value: '{nome}' },
                  { label: '📧 Email', value: '{email}' },
                  { label: '📱 Telefone', value: '{telefone}' },
                  { label: '🏢 Empresa', value: '{empresa}' },
                  { label: '📅 Data', value: '{data}' },
                ].map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setSubject((prev) => prev + v.value)}
                    title={`Inserir ${v.value} no assunto`}
                    style={{
                      padding: '2px 8px',
                      borderRadius: 20,
                      border: '1px solid rgba(139,92,246,0.4)',
                      background: 'rgba(139,92,246,0.1)',
                      color: '#a78bfa',
                      fontSize: 11,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '20px',
              display: 'flex',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div
              style={{
                width: 600,
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                overflow: 'auto',
              }}
            >
              {blocks.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#999' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
                  <p style={{ margin: 0, fontSize: 14 }}>Adiciona blocos para começar</p>
                </div>
              ) : (
                <div style={{ padding: '20px' }}>
                  {blocks.map((block, idx) => (
                    <div
                      key={block.id}
                      onClick={() => setSelectedBlockId(block.id)}
                      style={{
                        marginBottom: idx === blocks.length - 1 ? 0 : 16,
                        padding: '12px',
                        borderRadius: 8,
                        border: selectedBlockId === block.id ? '2px solid #10b981' : '1px solid #e5e7eb',
                        background: selectedBlockId === block.id ? 'rgba(16,185,129,0.05)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {renderEmailBlock(block, userId)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={() => setShowAIModal(true)}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                border: '1px solid rgba(139,92,246,0.5)',
                background: 'rgba(139,92,246,0.15)',
                color: '#a78bfa',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              ✨ AI
            </button>
            <button
              onClick={() => setShowPreviewModal(true)}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: '#fff',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <FiEye size={14} /> Preview
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: '#fff',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => setShowSendModal(true)}
              disabled={saving || sending}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: '#3b82f6',
                color: '#fff',
                fontWeight: 700,
                fontSize: 12,
                cursor: (saving || sending) ? 'not-allowed' : 'pointer',
                opacity: (saving || sending) ? 0.6 : 1,
              }}
            >
              {sending ? 'A enviar...' : '✉️ Enviar'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: '#10b981',
                color: '#fff',
                fontWeight: 700,
                fontSize: 12,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </div>

        {/* COLUNA DIREITA: INSPECTOR */}
        <div
          style={{
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <h3 style={{ color: '#fff', fontWeight: 800, margin: 0, fontSize: 13 }}>Propriedades</h3>

          {selectedBlock ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.6)',
                    marginBottom: 4,
                    fontWeight: 700,
                  }}
                >
                  Tipo: {selectedBlock.type}
                </label>
              </div>

              {renderBlockInspector(userId, selectedBlock, (updates) => {
                console.log('[renderBlockInspector] updates:', updates)
                updateBlock(selectedBlock.id, updates)
              })}

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  onClick={() => moveBlock(selectedBlock.id, 'up')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  ↑ Subir
                </button>
                <button
                  onClick={() => moveBlock(selectedBlock.id, 'down')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  ↓ Baixar
                </button>
                <button
                  onClick={() => removeBlock(selectedBlock.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#ff6b6b',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <FiTrash2 size={14} /> Apagar
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              Seleciona um bloco para editar
            </div>
          )}
        </div>
      </div>

      {/* MODAL AI */}
      {showAIModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#1e1e2e', borderRadius: 16, padding: 28, maxWidth: 560, width: '100%', border: '1px solid rgba(139,92,246,0.3)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>✨ Gerar Email com AI</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                  {selectedLeadId
                    ? `Lead seleccionada: ${leads.find((l: any) => l.id === selectedLeadId)?.name || selectedLeadId}`
                    : sendingTo === 'audience' ? 'Modo: Audiência (email genérico)' : 'Modo: Email genérico'}
                </div>
              </div>
              <button onClick={() => { setShowAIModal(false); setAIError(null); setAIPrompt('') }} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 18, cursor: 'pointer', padding: '4px 10px' }}>✕</button>
            </div>

            {/* Prompt */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6, fontWeight: 700 }}>
                O que queres comunicar? <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>(opcional — deixa em branco para AI decidir com base no histórico)</span>
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAIPrompt(e.target.value)}
                placeholder="Ex: faz um follow-up sobre o patch X39, menciona os benefícios de energia e recuperação..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  fontSize: 13,
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Info */}
            <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              {selectedLeadId
                ? '🧠 O AI vai analisar o histórico desta lead e gerar um email personalizado.'
                : '📧 O AI vai gerar um email com base na tua prompt. Para emails personalizados, selecciona uma lead primeiro.'}
            </div>

            {aiError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#fca5a5' }}>
                {aiError}
              </div>
            )}

            {/* Botões */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowAIModal(false); setAIError(null); setAIPrompt('') }}
                style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setAIGenerating(true)
                  setAIError(null)
                  try {
                    // Buscar histórico se houver lead seleccionada
                    let leadData: any = null
                    let history: any[] = []

                    if (selectedLeadId) {
                      const lead = leads.find((l: any) => l.id === selectedLeadId)
                      leadData = lead || null

                      const { data: acts } = await supabase
                        .from('lead_activities')
                        .select('*')
                        .eq('lead_id', selectedLeadId)
                        .order('created_at', { ascending: false })
                        .limit(10)
                      history = acts || []
                    }

                    const res = await fetch('/api/crm/generate-message', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: 'email_campaign',
                        lead: leadData,
                        history,
                        prompt: aiPrompt.trim() || null,
                        blocks,
                      }),
                    })

                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || 'Erro ao gerar')

                    // Aplicar subject se gerado
                    if (data.subject) setSubject(data.subject)

                    // Converter blocos AI para formato do editor
                    if (data.blocks && data.blocks.length > 0) {
                      const newBlocks = data.blocks.map((b: any, i: number) => ({
                        id: `ai-block-${Date.now()}-${i}`,
                        type: b.type as EmailBlockType,
                        content: b.content || {},
                      }))
                      setBlocks(newBlocks)
                      addToast('✨ Email gerado com sucesso!', 'success')
                      setShowAIModal(false)
                      setAIPrompt('')
                    } else {
                      throw new Error('AI não devolveu blocos válidos')
                    }
                  } catch (e: any) {
                    setAIError(e.message || 'Erro ao gerar email')
                  }
                  setAIGenerating(false)
                }}
                disabled={aiGenerating}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: aiGenerating ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: aiGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {aiGenerating ? '⏳ A gerar...' : '✨ Gerar Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreviewModal && (
        <EmailPreviewModal
          blocks={blocks}
          title={title}
          subject={subject}
          preheader={preheader}
          onClose={() => setShowPreviewModal(false)}
        />
      )}

      {showSendModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#0f172a', borderRadius: 12, padding: 24, maxWidth: 500, width: '90%', color: '#fff' }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>📧 Enviar Campanha</h3>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'rgba(255,255,255,0.7)' }}>Enviar para:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="radio" name="sendTo" value="audience" checked={sendingTo === 'audience'} onChange={(e) => setSendingTo(e.target.value as any)} />
                  <span>Audiências ({selectedAudiences.size})</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="radio" name="sendTo" value="all" checked={sendingTo === 'all'} onChange={(e) => setSendingTo(e.target.value as any)} />
                  <span>
                    {preSelectedLeadIds && preSelectedLeadIds.length > 1
                      ? `Leads selecionadas (${preSelectedLeadIds.length})`
                      : `Todos (${leads.length})`
                    }
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="radio" name="sendTo" value="individual" checked={sendingTo === 'individual'} onChange={(e) => setSendingTo(e.target.value as any)} />
                  <span>Lead específico</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="radio" name="sendTo" value="manual" checked={sendingTo === 'manual'} onChange={(e) => setSendingTo(e.target.value as any)} />
                  <span>Email manual</span>
                </label>
              </div>
            </div>

            {sendingTo === 'audience' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'rgba(255,255,255,0.7)' }}>
                  Selecionar Audiências
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {audiences.map(a => {
                    const count = leads.filter((l: any) => (l.audience_ids || []).includes(a.id)).length
                    const isChecked = selectedAudiences.has(a.id)
                    return (
                      <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: isChecked ? 'rgba(255,255,255,0.08)' : 'transparent', cursor: 'pointer', border: `1.5px solid ${isChecked ? a.color : 'rgba(255,255,255,0.1)'}`, transition: 'all 0.15s' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const newSet = new Set(selectedAudiences)
                            if (isChecked) newSet.delete(a.id)
                            else newSet.add(a.id)
                            setSelectedAudiences(newSet)
                          }}
                          style={{ accentColor: a.color, width: 15, height: 15 }}
                        />
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: a.color, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: '#fff', fontWeight: isChecked ? 700 : 400, flex: 1 }}>{a.name}</span>
                        <span style={{ fontSize: 11, opacity: 0.5 }}>{count} leads</span>
                      </label>
                    )
                  })}
                  {audiences.length === 0 && (
                    <p style={{ fontSize: 12, opacity: 0.5, fontStyle: 'italic', margin: 0 }}>Sem audiências definidas. Cria-as na Lista de Contactos.</p>
                  )}
                </div>
                {selectedAudiences.size === 0 && audiences.length > 0 && (
                  <p style={{ fontSize: 11, color: '#f59e0b', marginTop: 8, margin: '8px 0 0' }}>⚠️ Seleciona pelo menos uma audiência</p>
                )}
              </div>
            )}

            {sendingTo === 'individual' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'rgba(255,255,255,0.7)' }}>
                  Selecionar lead
                </label>
                <select
                  value={selectedLeadId || ''}
                  onChange={(e) => setSelectedLeadId(e.target.value || null)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontSize: 14,
                    maxWidth: '100%',
                    overflow: 'visible',
                    height: 42,
                    lineHeight: '22px',
                    appearance: 'auto',
                  }}
                >
                  <option value="">Escolhe um lead</option>
                  {leads.map((lead: any) => (
                    <option key={lead.id} value={lead.id} style={{ whiteSpace: 'normal' }}>
                      {lead.name || lead.email} {lead.email ? `(${lead.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {sendingTo === 'manual' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'rgba(255,255,255,0.7)' }}>
                  Email manual
                </label>
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="cliente@exemplo.com"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontSize: 14,
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowSendModal(false)} disabled={sending} style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button 
                onClick={() => handleSend()} 
                disabled={sending || 
                  (sendingTo === 'audience' && selectedAudiences.size === 0) || 
                  (sendingTo === 'individual' && !selectedLeadId) ||
                  (sendingTo === 'manual' && !manualEmail.trim())
                } 
                style={{ flex: 1, padding: '10px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: sending ? 0.6 : 1 }}>
                {sending ? 'A enviar...' : '✉️ Enviar Agora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function renderEmailBlocksToHtml(blocks: EmailBlock[], broadcastId?: string): string {
  const blocksHtml = blocks.map(block => {
    const { type, content } = block

    switch (type) {
      case 'text':
        return `<div style="font-size: ${content.fontSize || 16}px; color: ${content.color || '#111827'}; text-align: ${content.align || 'left'}; font-weight: ${content.fontWeight || 400}; line-height: 1.6; white-space: pre-wrap; word-break: break-word;">${content.html || content.text || ''}</div>`

      case 'image':
        return content.url ? `<img src="${content.url}" alt="${content.alt || ''}" style="width: ${content.width || '100%'}; border-radius: ${content.borderRadius || 0}px; display: block; max-width: 100%; height: auto;" />` : `<div style="width: 100%; height: 200px; background: #f3f4f6; border-radius: ${content.borderRadius || 0}px;"></div>`

      case 'button':
        return `<a href="${content.url || '#'}" style="display: inline-block; padding: ${content.padding || '12px 24px'}; background: ${content.bgColor || '#3b82f6'}; color: ${content.textColor || '#fff'}; text-decoration: none; border-radius: ${content.borderRadius || 4}px; font-weight: ${content.fontWeight || 600};">${content.text || 'Clique aqui'}</a>`

      case 'divider':
        return `<hr style="border: none; border-top: ${content.thickness || 1}px solid ${content.color || '#e5e7eb'}; margin: ${content.margin || '20px'} 0;" />`

      case 'spacer':
        return `<div style="height: ${content.height || 20}px;"></div>`

      case 'video': {
        const videoLink = content.previewId ? `https://www.kardme.com/video-preview/${content.previewId}` : content.videoUrl || '#'
        return content.thumbnail ? `<div style="text-align: ${content.align || 'center'}; padding: 16px 0;"><a href="${videoLink}" target="_blank" style="display: inline-block; text-decoration: none;"><img src="${content.thumbnail}" alt="Video" style="display: block; width: ${content.width || '100%'}; max-width: 500px; border-radius: 8px; margin: 0 auto;" /></a></div>` : `<div style="width: 100%; height: 200px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #999;">Vídeo</div>`
      }

      case 'table': {
        const tableHeaders = (content.headers || []).map((h: string) =>
          `<th style="padding: 10px 14px; background: ${content.headerBg || '#1e293b'}; color: ${content.headerColor || '#ffffff'}; text-align: left; font-weight: 700; border: 1px solid ${content.borderColor || '#e5e7eb'};">${h}</th>`
        ).join('')
        const tableRows = (content.rows || []).map((row: string[], ri: number) =>
          `<tr>${row.map((cell: string) =>
            `<td style="padding: 10px 14px; background: ${ri % 2 === 0 ? (content.rowBg || '#ffffff') : (content.rowAltBg || '#f9fafb')}; border: 1px solid ${content.borderColor || '#e5e7eb'}; color: #111827;">${cell}</td>`
          ).join('')}</tr>`
        ).join('')
        return `<div style="overflow-x: auto; padding-top: ${content.paddingTop || 0}px; padding-bottom: ${content.paddingBottom || 0}px;"><table style="width: 100%; border-collapse: collapse; font-size: ${content.fontSize || 14}px;"><thead><tr>${tableHeaders}</tr></thead><tbody>${tableRows}</tbody></table></div>`
      }

      default:
        return ''
    }
  }).join('')

  // Footer com unsubscribe
  const footer = `
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 40px 0 20px 0;" />
    <div style="text-align: center; font-size: 12px; color: #6b7280; line-height: 1.6;">
      <p style="margin: 0 0 10px 0;">Kardme © 2026. Todos os direitos reservados.</p>
      <p style="margin: 0;">
        <a href="{UNSUBSCRIBE_URL}" style="color: #3b82f6; text-decoration: none;">Unsubscribe</a> | 
        <a href="{MANAGE_PREFERENCES_URL}" style="color: #3b82f6; text-decoration: none;">Manage Preferences</a>
      </p>
    </div>
  `

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <style>
    body { margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, sans-serif; }
    .email-wrapper { width: 100%; background-color: #f9fafb; padding: 20px 0; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; padding: 32px 24px; box-sizing: border-box; }
    img { max-width: 100%; height: auto; display: block; }
    @media only screen and (max-width: 600px) {
      .email-container { padding: 24px 16px !important; border-radius: 0 !important; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      ${blocksHtml}
      ${footer}
    </div>
  </div>
</body>
</html>`

  return html
}

function renderEmailBlock(block: EmailBlock, userId: string) {
  const { type, content } = block

  switch (type) {
    case 'text':
      return (
        <div
          style={{
            fontSize: content.fontSize || 16,
            color: content.color || '#111827',
            textAlign: content.align || 'left',
            fontWeight: content.fontWeight || 400,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {content.html ? <div dangerouslySetInnerHTML={{ __html: content.html }} /> : content.text}
        </div>
      )

    case 'image':
      return content.url ? (
        <img
          src={content.url}
          alt={content.alt || ''}
          style={{
            width: content.width || '100%',
            borderRadius: content.borderRadius || 0,
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: 200,
            background: '#f3f4f6',
            borderRadius: content.borderRadius || 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontSize: 14,
          }}
        >
          Sem imagem
        </div>
      )

    case 'video':
      return (
        <div
          style={{
            width: content.width || '100%',
            margin: '0 auto',
            textAlign: content.align || 'center',
            padding: '16px 0',
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              width: '100%',
              maxWidth: 500,
              borderRadius: 8,
              overflow: 'hidden',
              background: '#000',
            }}
          >
            {content.thumbnail ? (
              <img
                src={content.thumbnail}
                alt="Video thumbnail"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = target.nextElementSibling as HTMLElement | null
                  if (fallback) fallback.style.display = 'block'
                }}
              />
            ) : null}

            <video
              src={content.videoUrl}
              style={{
                width: '100%',
                display: content.thumbnail ? 'none' : 'block',
                background: '#000',
              }}
              controls
            />

            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 60,
                height: 60,
                background: 'rgba(16, 185, 129, 0.9)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                pointerEvents: 'none',
              }}
            >
              ▶️
            </div>
          </div>
        </div>
      )

    case 'button':
      return (
        <div style={{ textAlign: content.align || 'center' }}>
          <a
            href={content.url || '#'}
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: content.backgroundColor || '#10b981',
              color: content.textColor || '#ffffff',
              textDecoration: 'none',
              borderRadius: content.borderRadius || 6,
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {content.text}
          </a>
        </div>
      )

    case 'divider':
      return (
        <div
          style={{
            height: content.thickness || 1,
            background: content.color || '#e5e7eb',
            margin: `${content.marginTop || 0}px 0 ${content.marginBottom || 0}px`,
          }}
        />
      )

    case 'spacer':
      return <div style={{ height: content.height || 24 }} />

    case 'table':
      return (
        <div style={{ overflowX: 'auto', paddingTop: content.paddingTop || 0, paddingBottom: content.paddingBottom || 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: content.fontSize || 14 }}>
            <thead>
              <tr>
                {(content.headers || []).map((h: string, i: number) => (
                  <th key={i} style={{ padding: '10px 14px', background: content.headerBg || '#1e293b', color: content.headerColor || '#fff', textAlign: 'left', fontWeight: 700, border: `1px solid ${content.borderColor || '#e5e7eb'}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(content.rows || []).map((row: string[], ri: number) => (
                <tr key={ri}>
                  {row.map((cell: string, ci: number) => (
                    <td key={ci} style={{ padding: '10px 14px', background: ri % 2 === 0 ? (content.rowBg || '#fff') : (content.rowAltBg || '#f9fafb'), border: `1px solid ${content.borderColor || '#e5e7eb'}`, color: '#111827' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    default:
      return <div>Bloco desconhecido</div>
  }
}

function renderBlockInspector(
  userId: string,
  block: EmailBlock,
  onUpdate: (updates: Record<string, any>) => void
) {
  const { type, content } = block

  switch (type) {
    case 'text':
      return (
        <EmailTextBlockEditor
          content={content.html || ''}
          onChange={(html) => onUpdate({ html })}
          placeholder="Escreve o teu texto..."
        />
      )

    case 'image':
      return (
        <>
          <ImageUploadInput
            userId={userId}
            currentUrl={content.url}
            onUpload={(url) => onUpdate({ url })}
          />

          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
              Alt text
            </label>
            <input
              type="text"
              value={content.alt || ''}
              onChange={(e) => onUpdate({ alt: e.target.value })}
              placeholder="Descrição da imagem"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: 12,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
              Largura
            </label>
            <input
              type="text"
              value={content.width || '100%'}
              onChange={(e) => onUpdate({ width: e.target.value })}
              placeholder="100% ou 300px"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: 12,
              }}
            />
          </div>
        </>
      )

    case 'button':
      return (
        <>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
              Texto do botão
            </label>
            <input
              type="text"
              value={content.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              placeholder="Ex: Clica aqui"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: 12,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
              URL
            </label>
            <input
              type="text"
              value={content.url || ''}
              onChange={(e) => onUpdate({ url: e.target.value })}
              placeholder="https://..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: 12,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
              Cor de fundo
            </label>
            <input
              type="color"
              value={content.backgroundColor || '#10b981'}
              onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
              style={{
                width: '100%',
                height: 40,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
              Cor do texto
            </label>
            <input
              type="color"
              value={content.textColor || '#ffffff'}
              onChange={(e) => onUpdate({ textColor: e.target.value })}
              style={{
                width: '100%',
                height: 40,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
              }}
            />
          </div>
        </>
      )

    case 'video':
      return (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
              URL do Vídeo (YouTube, Vimeo ou Upload)
            </label>
            <input
              type="text"
              placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
              onBlur={async (e) => {
                const url = e.currentTarget.value.trim()
                if (!url) return
                
                const info = parseVideoLink(url)
                if (info.type === 'youtube' || info.type === 'vimeo') {
                  const thumb = await generateThumbnailFromVideoUrl(url, userId)
                  onUpdate({ videoUrl: url, thumbnail: thumb || undefined })
                } else if (info.type === 'upload') {
                  onUpdate({ videoUrl: url })
                }
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: 12,
              }}
            />
          </div>

          <VideoUploadInput
            userId={userId}
            currentUrl={content.videoUrl}
            onUpload={(data) => onUpdate({ videoUrl: data.videoUrl, thumbnail: data.thumbnail, previewId: data.previewId })}
          />

          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
              Thumbnail (URL)
            </label>
            <input
              type="text"
              value={content.thumbnail || ''}
              onChange={(e) => onUpdate({ thumbnail: e.target.value })}
              placeholder="https://... (imagem de capa)"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: 12,
              }}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
              Largura
            </label>
            <input
              type="text"
              value={content.width || '100%'}
              onChange={(e) => onUpdate({ width: e.target.value })}
              placeholder="100% ou 500px"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: 12,
              }}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
              Alinhamento
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => onUpdate({ align })}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: 4,
                    border: 'none',
                    background: content.align === align ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: 11,
                    cursor: 'pointer',
                    fontWeight: content.align === align ? 700 : 400,
                  }}
                >
                  {align === 'left' ? '⬅️' : align === 'center' ? '⬇️' : '➡️'} {align}
                </button>
              ))}
            </div>
          </div>
        </>
      )

    case 'divider':
      return (
        <>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
              Cor
            </label>
            <input
              type="color"
              value={content.color || '#e5e7eb'}
              onChange={(e) => onUpdate({ color: e.target.value })}
              style={{
                width: '100%',
                height: 40,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
              Espessura: {content.thickness || 1}px
            </label>
            <input
              type="range"
              min="1"
              max="4"
              value={content.thickness || 1}
              onChange={(e) => onUpdate({ thickness: parseInt(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
        </>
      )

    case 'spacer':
      return (
        <div>
          <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
            Altura: {content.height || 24}px
          </label>
          <input
            type="range"
            min="8"
            max="64"
            step="4"
            value={content.height || 24}
            onChange={(e) => onUpdate({ height: parseInt(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>
      )

    case 'table':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
              Cabeçalhos (separados por vírgula)
            </label>
            <input
              type="text"
              value={(content.headers || []).join(', ')}
              onChange={(e) => onUpdate({ headers: e.target.value.split(',').map((h: string) => h.trim()) })}
              onKeyDown={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: 12,
                boxSizing: 'border-box' as const,
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
              Linhas (uma por linha, colunas separadas por |)
            </label>
            <textarea
              value={(content.rows || []).map((r: string[]) => r.join(' | ')).join('\n')}
              onChange={(e) => onUpdate({ rows: e.target.value.split('\n').map((r: string) => r.split('|').map((c: string) => c.trim())) })}
              onKeyDown={(e) => e.stopPropagation()}
              rows={6}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: 12,
                boxSizing: 'border-box' as const,
                resize: 'vertical' as const,
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
                Cor cabeçalho
              </label>
              <input
                type="color"
                value={content.headerBg || '#1e293b'}
                onChange={(e) => onUpdate({ headerBg: e.target.value })}
                style={{ width: '100%', height: 36, borderRadius: 6, border: 'none', cursor: 'pointer' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
                Texto cabeçalho
              </label>
              <input
                type="color"
                value={content.headerColor || '#ffffff'}
                onChange={(e) => onUpdate({ headerColor: e.target.value })}
                style={{ width: '100%', height: 36, borderRadius: 6, border: 'none', cursor: 'pointer' }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
              Tamanho do texto: {content.fontSize || 14}px
            </label>
            <input
              type="range"
              min="10"
              max="20"
              value={content.fontSize || 14}
              onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )

    default:
      return null
  }
}
