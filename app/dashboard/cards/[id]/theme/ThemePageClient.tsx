'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import CardPreview from '@/components/theme/CardPreview'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { supabase } from '@/lib/supabaseClient'
import CardPublicLink from '@/components/dashboard/CardPublicLink'
import BioBlockEditor from '@/components/dashboard/block-editors/BioBlockEditor'
import HeaderBlockEditor from '@/components/dashboard/block-editors/HeaderBlockEditor'
import ProfileBlockEditor from '@/components/dashboard/block-editors/ProfileBlockEditor'
import InfoUtilitiesBlockEditor from '@/components/dashboard/block-editors/InfoUtilitiesBlockEditor'
import ServicesBlockEditor from '@/components/dashboard/block-editors/ServicesBlockEditor'
import LeadFormBlockEditor from '@/components/dashboard/block-editors/LeadFormBlockEditor'
import InfoUtilitiesBlock from '@/components/blocks/InfoUtilitiesBlock'
import ServicesBlock from '@/components/blocks/ServicesBlock'
import LeadFormBlock from '@/components/blocks/LeadFormBlock'
import BlocksRailSortable from '@/components/editor/BlocksRailSortable'
import AddBlockModal from '@/components/editor/AddBlockModal'
import { ColorPickerProvider } from '@/components/editor/ColorPickerContext'
import EmbedBlock from '@/components/blocks/EmbedBlock'
import EmbedBlockEditor from '@/components/dashboard/block-editors/EmbedBlockEditor'
import DecorationBlock from '@/components/blocks/DecorationBlock'
import DecorationBlockEditor from '@/components/dashboard/block-editors/DecorationBlockEditor'
import ContactBlockEditor from '@/components/dashboard/block-editors/ContactBlockEditor'
import SocialBlockEditor from '@/components/dashboard/block-editors/SocialBlockEditor'
import GalleryBlockEditor from '@/components/dashboard/block-editors/GalleryBlockEditor'
import BusinessHoursBlockEditor from '@/components/dashboard/block-editors/BusinessHoursBlockEditor'
import type { BlockItem } from '@/components/editor/BlocksRailSortable'
import PublishToggle from './PublishToggle'

type CardBlock = {
  id: string
  type: string
  enabled: boolean
  order: number
  settings: any
  style: any
  title?: string
}

type CardBg =
  | { mode: 'solid'; color: string; opacity?: number }
  | { mode: 'gradient'; from: string; to: string; angle?: number; opacity?: number }

type Props = {
  card: any
  blocks: CardBlock[]
}

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

export default function ThemePageClient({ card, blocks }: Props) {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [activeDecoId, setActiveDecoId] = useState<string | null>(null)
  const [localBlocks, setLocalBlocks] = useState<CardBlock[]>(
    blocks.map(b => ({ ...b, style: b.style ?? {} }))
  )
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const debounceRef = useRef<number | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [localTheme, setLocalTheme] = useState<any>(card?.theme ?? {})
  const [cardBg, setCardBg] = useState<CardBg>(() => {
    const bg = card?.theme?.background
    if (bg) return bg
    return { mode: 'solid', color: '#ffffff', opacity: 1 }
  })

  const enabledBlocksSorted = useMemo(
    () => localBlocks.filter(b => b.enabled).sort((a, b) => a.order - b.order),
    [localBlocks]
  )

  const allBlocksSorted = useMemo(
    () => [...localBlocks].sort((a, b) => a.order - b.order),
    [localBlocks]
  )

  const activeBlock = useMemo(
    () => localBlocks.find(b => b.id === activeBlockId) || null,
    [localBlocks, activeBlockId]
  )

  function selectBlock(id: string) {
    setActiveBlockId(id)

    const next = localBlocks.find((b) => b.id === id) || null
    if (!next || next.type !== 'decorations') {
      setActiveDecoId(null)
    }
  }

  function ensureCardBlocks(next: BlockItem[]): CardBlock[] {
    return next.map((b) => ({
      id: b.id,
      type: b.type,
      enabled: b.enabled ?? true,
      order: b.order ?? 0,
      settings: (b as any).settings ?? {},
      style: (b as any).style ?? {},
      title: (b as any).title,
    }))
  }

function toggleBlockEnabled(id: string, enabled: boolean) {
  setSaveStatus('dirty')
  setLocalBlocks(prev => prev.map(b => (b.id === id ? { ...b, enabled } : b)))
}

  function updateActiveSettings(nextSettings: any) {
    if (!activeBlock) return
    setSaveStatus('dirty')
    setLocalBlocks(prev =>
      prev.map(b => (b.id === activeBlock.id ? { ...b, settings: nextSettings } : b))
    )
  }

  async function saveChanges() {
    setSaveStatus('saving')

    for (const block of localBlocks) {
      const { error } = await supabase
        .from('card_blocks')
        .update({
          settings: block.settings,
          style: block.style,
          enabled: block.enabled,
          order: block.order,
        })
        .eq('id', block.id)

      if (error) {
        console.error(error)
        setSaveStatus('error')
        alert('Erro ao guardar alterações ❌')
        return
      }
    }

    setSaveStatus('saved')
    window.setTimeout(() => setSaveStatus('idle'), 1200)
    alert('Alterações guardadas com sucesso ✅')
  }
  const statusLabel =
    saveStatus === 'saving'
      ? 'A guardar…'
      : saveStatus === 'saved'
      ? 'Guardado ✅'
      : saveStatus === 'error'
      ? 'Erro ao guardar ❌'
      : saveStatus === 'dirty'
      ? 'Alterações por guardar…'
      : ''

  // Slug editing states
  const [slugEdit, setSlugEdit] = useState(card.slug)
  const [slugSaving, setSlugSaving] = useState(false)
  const [slugError, setSlugError] = useState<string | null>(null)

  async function saveSlug() {
    if (!slugEdit || slugEdit === card.slug) return

    setSlugSaving(true)
    setSlugError(null)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      if (!accessToken) throw new Error('Sessão inválida')

      const res = await fetch('/api/cards/update-slug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ cardId: card.id, newSlugRaw: slugEdit }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Erro ao guardar slug')

      setSlugEdit(json.newSlug)
      alert('Slug atualizado com sucesso ✅')
    } catch (e: any) {
      setSlugError(e.message || 'Erro ao guardar slug')
    } finally {
      setSlugSaving(false)
    }
  }

  useEffect(() => {
    if (!activeBlock) return
    if (saveStatus !== 'dirty') return
    if (debounceRef.current) window.clearTimeout(debounceRef.current)

    debounceRef.current = window.setTimeout(async () => {
      setSaveStatus('saving')

      const { error } = await supabase
        .from('card_blocks')
        .update({ settings: activeBlock.settings, style: activeBlock.style })
        .eq('id', activeBlock.id)

      if (error) {
        console.error(error)
        setSaveStatus('error')
        return
      }

      setSaveStatus('saved')
      window.setTimeout(() => setSaveStatus('idle'), 1200)
    }, 600)

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [activeBlock?.id, activeBlock?.settings, activeBlock?.style, saveStatus])

  return (
    <ColorPickerProvider>
      <div
        style={{
          height: '100vh',
          minWidth: 0,
          display: 'grid',
          gridTemplateColumns: '260px minmax(420px, 1fr) 420px',
          gap: 16,
          padding: 16,
          background: '#f3f4f6',
        }}
      >
        {/* LEFT */}
        <aside
          style={{
            background: '#fff',
            borderRadius: 16,
            border: '1px solid rgba(0,0,0,0.08)',
            overflow: 'hidden',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            color: '#111827',
          }}
        >
          <div
            style={{
              padding: 12,
              borderBottom: '1px solid rgba(0,0,0,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <strong style={{ fontSize: 13, color: '#111827' }}>Blocos</strong>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6, color: '#111827' }}>
              {card?.title || 'Cartão'} · {enabledBlocksSorted.length} ativos
            </div>
            <button
              onClick={() => setAddOpen(true)}
              style={{
                height: 36,
                padding: '0 12px',
                borderRadius: 12,
                border: '1px solid rgba(0,0,0,0.12)',
                background: '#fff',
                cursor: 'pointer',
                fontWeight: 800,
                color: '#111827',
              }}
            >
              + Adicionar
            </button>
          </div>

          <div style={{ overflow: 'auto', minHeight: 0 }}>
            <BlocksRailSortable
              blocks={allBlocksSorted}
              selectedId={activeBlockId}
              onSelect={selectBlock}
              onToggle={toggleBlockEnabled}
              onReorder={(next) => {
                setSaveStatus('dirty')
                setLocalBlocks(ensureCardBlocks(next))
              }}
            />
          </div>

          <div style={{ padding: 12, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            <button
              onClick={saveChanges}
              style={{
                width: '100%',
                height: 44,
                borderRadius: 14,
                border: '1px solid rgba(0,0,0,0.12)',
                background: '#fff',
                fontWeight: 800,
                cursor: 'pointer',
                opacity: saveStatus === 'saving' ? 0.7 : 1,
                color: '#111827',
              }}
              disabled={saveStatus === 'saving'}
            >
              💾 Guardar
            </button>

            {statusLabel && (
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.65, color: '#111827' }}>{statusLabel}</div>
            )}
          </div>
        </aside>

        {/* CENTER */}
        <main
          id="preview-scroll"
          style={{
            minHeight: 0,
            minWidth: 0,
            overflow: 'auto',
            display: 'grid',
            placeItems: 'start center',
            padding: '12px 0 40px',
          }}
        >
          <div style={{ width: '100%', maxWidth: 420, display: 'grid', placeItems: 'center' }}>
            <div
              id="preview-hitbox"
              style={{
                width: 360,
                borderRadius: 44,
                padding: 3,
                background: 'linear-gradient(180deg, #0B1220 0%, #111827 100%)',
                boxShadow: '0 22px 70px rgba(0,0,0,0.28)',
                border: '1px solid rgba(255,255,255,0.03)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 44,
                  background:
                    'radial-gradient(120px 220px at 25% 15%, rgba(255,255,255,0.10), transparent 60%)',
                  pointerEvents: 'none',
                }}
              />

              <div
                style={{
                  borderRadius: 28,
                  overflow: 'auto',
                  border: '1px solid rgba(0,0,0,0.08)',
                  height: 680,
                  background:
                    cardBg.mode === 'solid'
                      ? cardBg.color
                      : `linear-gradient(${cardBg.angle ?? 180}deg, ${cardBg.from}, ${cardBg.to})`,
                  opacity: cardBg.opacity ?? 1,
                }}
              >
                <div id="card-preview-root" style={{ height: '100%' }}>
                  <ThemeProvider theme={localTheme}>
                    <CardPreview
                      card={{ ...card, theme: localTheme }}
                      blocks={enabledBlocksSorted}
                      activeBlockId={activeBlockId || undefined}
                      onSelectBlock={(b: any) => selectBlock(b.id)}
                      activeDecoId={activeDecoId}
                      onSelectDeco={setActiveDecoId}
                      showTranslations={false}
                      fullBleed
                    />
                  </ThemeProvider>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.55, color: '#111827' }}>
              Dica: arrasta blocos à esquerda para reordenar.
            </div>
          </div>
        </main>

        {/* RIGHT */}
        <aside
          style={{
            background: '#fff',
            color: '#111827',
            borderRadius: 18,
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: 12,
              borderBottom: '1px solid rgba(0,0,0,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <strong style={{ fontSize: 14, color: '#111827' }}>Editor</strong>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {activeBlock && (
                <span style={{ fontSize: 12, opacity: 0.6, color: '#111827' }}>Bloco: {activeBlock.type}</span>
              )}
            </div>
          </div>

          {/* Campo para editar slug */}
          <div style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <label style={{ fontWeight: 700, fontSize: 12, opacity: 0.7, color: '#111827' }}>
              Editar slug (link do cartão)
            </label>
            <input
              type="text"
              value={slugEdit}
              onChange={(e) => setSlugEdit(e.target.value)}
              disabled={slugSaving}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid rgba(0,0,0,0.15)',
                marginTop: 4,
                fontSize: 14,
                color: '#111827',
              }}
            />
            {slugError && <div style={{ color: 'red', marginTop: 4 }}>{slugError}</div>}
            <button
              onClick={saveSlug}
              disabled={slugSaving || slugEdit === card.slug}
              style={{
                marginTop: 6,
                padding: '8px 12px',
                borderRadius: 8,
                backgroundColor: '#111827',
                color: '#fff',
                fontWeight: 'bold',
                cursor: slugSaving || slugEdit === card.slug ? 'not-allowed' : 'pointer',
              }}
            >
              {slugSaving ? 'A guardar…' : 'Guardar slug'}
            </button>
          </div>

          {/* Link público do cartão (sempre visível) */}
          <div style={{ padding: 12, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            {card?.slug ? <CardPublicLink slug={card.slug} /> : null}
          </div>

          <div style={{ padding: 12, overflow: 'auto' }}>
            {!activeBlock && (
              <p style={{ fontSize: 13, opacity: 0.5, paddingTop: 20, textAlign: 'center' }}>
                Seleciona um bloco à esquerda para editar.
              </p>
            )}

            {activeBlock?.type === 'header' && (
  <HeaderBlockEditor
    cardId={card.id}
    settings={activeBlock.settings || {}}
    onChange={(nextSettings) => updateActiveSettings(nextSettings)}
    cardBg={cardBg}
    onChangeCardBg={(nextBg) => {
      // mantém o teu update de background do cartão (se já tinhas)
      setCardBg(nextBg)

      const nextTheme = structuredClone(localTheme || {})
      nextTheme.background = nextBg
      setLocalTheme(nextTheme)

      setSaveStatus('dirty')
      supabase.from('cards').update({ theme: nextTheme }).eq('id', card.id)
    }}
  />
)}


            {activeBlock?.type === 'profile' && (
  <ProfileBlockEditor
    cardId={card.id}
    settings={activeBlock.settings || {}}
    onChange={(nextSettings) => updateActiveSettings(nextSettings)}
  />
)}

            {activeBlock?.type === 'bio' && (
              <BioBlockEditor
                settings={activeBlock.settings || {}}
                style={activeBlock.style || {}}
                onChangeSettings={updateActiveSettings}
                onChangeStyle={(style) =>
                  setLocalBlocks((prev) =>
                    prev.map((b) => (b.id === activeBlock.id ? { ...b, style } : b))
                  )
                }
              />
            )}

            {activeBlock?.type === 'contact' && (
  <ContactBlockEditor
    settings={activeBlock.settings || {}}
    onChangeSettings={updateActiveSettings}
    onChangeStyle={(style) =>
      setLocalBlocks((prev) =>
        prev.map((b) => (b.id === activeBlock.id ? { ...b, style } : b))
      )
    }
  />
)}


            {activeBlock?.type === 'social' && (
              <SocialBlockEditor
                settings={activeBlock.settings || {}}
                style={activeBlock.style || {}}
                onChangeSettings={updateActiveSettings}
                onChangeStyle={(style) =>
                  setLocalBlocks((prev) =>
                    prev.map((b) => (b.id === activeBlock.id ? { ...b, style } : b))
                  )
                }
              />
            )}

            {activeBlock?.type === 'gallery' && (
              <GalleryBlockEditor
                settings={activeBlock.settings || {}}
                style={activeBlock.style || {}}
                onChangeSettings={updateActiveSettings}
                onChangeStyle={(style) =>
                  setLocalBlocks((prev) =>
                    prev.map((b) => (b.id === activeBlock.id ? { ...b, style } : b))
                  )
                }
              />
            )}

            {activeBlock?.type === 'info_utilities' && (
              <InfoUtilitiesBlockEditor
                settings={activeBlock.settings || {}}
                style={activeBlock.style || {}}
                onChangeSettings={updateActiveSettings}
                onChangeStyle={(style) =>
                  setLocalBlocks((prev) =>
                    prev.map((b) => (b.id === activeBlock.id ? { ...b, style } : b))
                  )
                }
              />
            )}

            {activeBlock?.type === 'lead_form' && (
              <LeadFormBlockEditor
                settings={activeBlock.settings || {}}
                style={activeBlock.style || {}}
                onChangeSettings={updateActiveSettings}
                onChangeStyle={(style) =>
                  setLocalBlocks((prev) =>
                    prev.map((b) => (b.id === activeBlock.id ? { ...b, style } : b))
                  )
                }
              />
            )}

            {activeBlock?.type === 'embed' && (
              <EmbedBlockEditor
                settings={activeBlock.settings || {}}
                style={activeBlock.style || {}}
                onChangeSettings={updateActiveSettings}
                onChangeStyle={(style) =>
                  setLocalBlocks((prev) =>
                    prev.map((b) => (b.id === activeBlock.id ? { ...b, style } : b))
                  )
                }
              />
            )}

            {activeBlock?.type === 'services' && (
              <ServicesBlockEditor
                settings={activeBlock.settings || {}}
                style={activeBlock.style || {}}
                onChangeSettings={updateActiveSettings}
                onChangeStyle={(style) =>
                  setLocalBlocks((prev) =>
                    prev.map((b) => (b.id === activeBlock.id ? { ...b, style } : b))
                  )
                }
              />
            )}

            {activeBlock?.type === 'decorations' && (
              <DecorationBlockEditor
                settings={activeBlock.settings || {}}
                style={activeBlock.style || {}}
                onChangeSettings={updateActiveSettings}
                onChangeStyle={(style) =>
                  setLocalBlocks((prev) =>
                    prev.map((b) => (b.id === activeBlock.id ? { ...b, style } : b))
                  )
                }
                activeDecoId={activeDecoId}
                onSelectDeco={setActiveDecoId}
              />
            )}

            {activeBlock?.type === 'business_hours' && (
              <BusinessHoursBlockEditor
                settings={activeBlock.settings || {}}
                style={activeBlock.style || {}}
                onChangeSettings={updateActiveSettings}
                onChangeStyle={(style) =>
                  setLocalBlocks((prev) =>
                    prev.map((b) => (b.id === activeBlock.id ? { ...b, style } : b))
                  )
                }
              />
            )}

            {activeBlock &&
              activeBlock.type !== 'header' &&
              activeBlock.type !== 'profile' &&
              activeBlock.type !== 'bio' &&
              activeBlock.type !== 'contact' &&
              activeBlock.type !== 'social' &&
              activeBlock.type !== 'gallery' &&
              activeBlock.type !== 'info_utilities' &&
              activeBlock.type !== 'lead_form' &&
              activeBlock.type !== 'embed' &&
              activeBlock.type !== 'services' &&
              activeBlock.type !== 'decorations' &&
              activeBlock.type !== 'business_hours' && (
                <p style={{ fontSize: 14, opacity: 0.65 }}>
                  Editor ainda não disponível para: <b>{activeBlock.type}</b>
                </p>
              )}
          </div>

          <div
            style={{
              padding: 12,
              borderTop: '1px solid rgba(0,0,0,0.08)',
              background: '#fff',
            }}
          >
            {activeBlock && (
              <div style={{ padding: '12px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                <PublishToggle cardId={card.id} initialPublished={card.published ?? false} />
              </div>
            )}

            <button
              onClick={saveChanges}
              style={{
                width: '100%',
                height: 44,
                borderRadius: 14,
                border: 'none',
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                opacity: saveStatus === 'saving' ? 0.7 : 1,
              }}
              disabled={saveStatus === 'saving'}
            >
              💾 Guardar alterações
            </button>

            <p style={{ marginTop: 10, fontSize: 12, opacity: 0.55 }}>
              Auto-save: guarda automaticamente o bloco ativo ~600ms após parares de mexer.
            </p>
          </div>
        </aside>

        <AddBlockModal
          open={addOpen}
          cardId={card.id}
          existingBlocks={allBlocksSorted}
          onClose={() => setAddOpen(false)}
          onCreated={(newBlock) => {
            setLocalBlocks((prev) => [...prev, { ...newBlock, style: newBlock.style ?? {} }])
            setActiveBlockId(newBlock.id)
            setSaveStatus('idle')
          }}
        />
      </div>
    </ColorPickerProvider>
  )
}
