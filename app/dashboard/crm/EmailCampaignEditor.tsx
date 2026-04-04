'use client'
import ImageUploadInput from './ImageUploadInput'
import VideoUploadInput from './VideoUploadInput'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/lib/toast-context'
import {
  fetchEmailSegments,
  createBroadcast,
  updateBroadcast,
  type EmailSegment,
} from '@/lib/crm/emailMarketing'
import { DEFAULT_EMAIL_BLOCKS, type EmailBlockType } from '@/lib/crm/emailEditor'
import EmailPreviewModal from './EmailPreviewModal'
import { FiX, FiPlus, FiTrash2, FiEye } from 'react-icons/fi'

export type EmailBlock = {
  id: string
  type: EmailBlockType
  content: Record<string, any>
}

interface EmailCampaignEditorProps {
  userId: string
  broadcastId?: string
  onClose: () => void
  onSave: () => void
}

export default function EmailCampaignEditor({ userId, broadcastId, onClose, onSave }: EmailCampaignEditorProps) {
  const { addToast } = useToast()
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [preheader, setPreheader] = useState('')
  const [blocks, setBlocks] = useState<EmailBlock[]>([])
  const [segments, setSegments] = useState<EmailSegment[]>([])
  const [selectedSegments, setSelectedSegments] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [userId, broadcastId])

  async function loadData() {
    setLoading(true)
    try {
      const segs = await fetchEmailSegments(userId)
      setSegments(segs)

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
      onClose()
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

              {renderBlockInspector(userId, selectedBlock, (updates) => updateBlock(selectedBlock.id, updates))}

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

      {showPreviewModal && (
        <EmailPreviewModal
          blocks={blocks}
          title={title}
          subject={subject}
          preheader={preheader}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </>
  )
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
          {content.text}
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
              background: '#000',
              borderRadius: 8,
              overflow: 'hidden',
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
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  paddingBottom: '56.25%',
                  background: '#1a1a1a',
                }}
              />
            )}
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
                cursor: 'pointer',
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
        <>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
              Texto
            </label>
            <textarea
              value={content.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: 12,
                minHeight: 120,
                resize: 'vertical',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
              Tamanho: {content.fontSize || 16}px
            </label>
            <input
              type="range"
              min="12"
              max="32"
              value={content.fontSize || 16}
              onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
              Cor
            </label>
            <input
              type="color"
              value={content.color || '#111827'}
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
              Alinhamento
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {['left', 'center', 'right'].map((align) => (
                <button
                  key={align}
                  onClick={() => onUpdate({ align })}
                  style={{
                    padding: '6px',
                    borderRadius: 4,
                    border: content.align === align ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.15)',
                    background: content.align === align ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {align}
                </button>
              ))}
            </div>
          </div>
        </>
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
          <VideoUploadInput
            userId={userId}
            currentUrl={content.videoUrl}
            onUpload={(data) => onUpdate({ videoUrl: data.videoUrl, thumbnail: data.thumbnail })}
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

    default:
      return null
  }
}
