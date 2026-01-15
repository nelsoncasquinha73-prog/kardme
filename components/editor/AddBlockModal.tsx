'use client'

import { useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type CatalogItem = {
  type: string
  title: string
  description?: string
  defaultSettings?: any
  defaultStyle?: any
}

type CardBlock = {
  id: string
  type: string
  enabled: boolean
  order: number
  settings: any
  style: any
  title?: string
}

export default function AddBlockModal({
  open,
  cardId,
  existingBlocks,
  onClose,
  onCreated,
}: {
  open: boolean
  cardId: string
  existingBlocks: { id: string; type: string; enabled: boolean; order: number }[]
  onClose: () => void
  onCreated: (block: CardBlock) => void
}) {
  const [creatingType, setCreatingType] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const catalog: CatalogItem[] = useMemo(
    () => [
      { type: 'header', title: 'Header', description: 'Capa, avatar e topo do cartão', defaultSettings: {}, defaultStyle: {} },
      { type: 'profile', title: 'Perfil', description: 'Nome, cargo, empresa, avatar', defaultSettings: {}, defaultStyle: {} },
      { type: 'bio', title: 'Bio', description: 'Texto curto / apresentação', defaultSettings: { text: '' }, defaultStyle: {} },
      { type: 'contact', title: 'Contacto', description: 'Telefone, email, WhatsApp, etc.', defaultSettings: {}, defaultStyle: {} },
      { type: 'social', title: 'Redes sociais', description: 'Links sociais e botões', defaultSettings: {}, defaultStyle: {} },
      { type: 'gallery', title: 'Galeria', description: 'Imagens / carrossel', defaultSettings: {}, defaultStyle: {} },
      { type: 'services', title: 'Serviços', description: 'Lista de serviços', defaultSettings: {}, defaultStyle: {} },
      { type: 'info_utilities', title: 'Info & Utilidades', description: 'Menus, WiFi, horários rápidos', defaultSettings: {}, defaultStyle: {} },
      { type: 'lead_form', title: 'Formulário lead', description: 'Captura de leads', defaultSettings: {}, defaultStyle: {} },
      { type: 'embed', title: 'Embed', description: 'Iframe / widgets externos', defaultSettings: {}, defaultStyle: {} },
      { type: 'decorations', title: 'Decorações', description: 'PNG/SVG decorativos', defaultSettings: {}, defaultStyle: {} },
      { type: 'business_hours', title: 'Horário', description: 'Horário de funcionamento', defaultSettings: {}, defaultStyle: {} },
    ],
    []
  )

  const existingTypes = useMemo(() => new Set(existingBlocks.map(b => b.type)), [existingBlocks])

  const isSingleInstance = (type: string) => ['header', 'profile'].includes(type)

  const available = useMemo(() => {
    return catalog.filter(item => !(isSingleInstance(item.type) && existingTypes.has(item.type)))
  }, [catalog, existingTypes])

  if (!open) return null

  async function createBlock(item: CatalogItem) {
    setError(null)
    setCreatingType(item.type)

    try {
      const maxOrder = existingBlocks.reduce((acc, b) => Math.max(acc, b.order ?? 0), 0)
      const nextOrder = Number.isFinite(maxOrder) ? maxOrder + 1 : existingBlocks.length

      const payload = {
        card_id: cardId,
        type: item.type,
        enabled: true,
        order: nextOrder,
        settings: item.defaultSettings ?? {},
        style: item.defaultStyle ?? {},
        title: item.title,
      }

      const { data, error } = await supabase.from('card_blocks').insert(payload).select('*').single()
      if (error) throw error
      if (!data) throw new Error('Falha ao criar bloco')

      onCreated(data as CardBlock)
      onClose()
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar bloco')
    } finally {
      setCreatingType(null)
    }
  }

  return (
    <div
      onMouseDown={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        onMouseDown={e => e.stopPropagation()}
        style={{
          width: 560,
          maxWidth: '100%',
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          color: '#374151!important', // força cor escura para todo o texto no modal
        }}
      >
        <div
          style={{
            padding: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <strong style={{ fontSize: 14, color: '#111827' }}>Adicionar bloco</strong>
          <button
            onClick={onClose}
            style={{
              height: 34,
              padding: '0 10px',
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.12)',
              background: '#fff',
              cursor: 'pointer',
              color: '#374151',
            }}
          >
            Fechar
          </button>
        </div>

        <div style={{ padding: 14 }}>
          <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 12 }}>
            Escolhe um bloco para adicionar ao cartão.
          </p>

          {error && <p style={{ color: '#b91c1c', fontSize: 13, marginBottom: 10 }}>{error}</p>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {available.map(item => (
              <button
                key={item.type}
                onClick={() => createBlock(item)}
                disabled={creatingType === item.type}
                style={{
                  textAlign: 'left',
                  padding: 12,
                  borderRadius: 14,
                  border: '1px solid rgba(0,0,0,0.10)',
                  background: '#fff',
                  cursor: creatingType === item.type ? 'not-allowed' : 'pointer',
                  opacity: creatingType === item.type ? 0.7 : 1,
                  color: '#374151',
                }}
              >
                <div style={{ fontWeight: 900, fontSize: 13, color: '#111827' }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{item.description || item.type}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>{item.type}</div>
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            padding: 14,
            borderTop: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button
            onClick={onClose}
            style={{
              height: 40,
              padding: '0 14px',
              borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.12)',
              background: '#fff',
              cursor: 'pointer',
              fontWeight: 800,
              color: '#374151',
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
