'use client'

import { useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ColorPickerProvider } from '@/components/editor/ColorPickerContext'
import AddBlockModal from '@/components/editor/AddBlockModal'
import ThemePageClientLeft from './ThemePageClientLeft'
import ThemePageClientCenter from './ThemePageClientCenter'
import ThemePageClientRight from './ThemePageClientRight'
import type { BlockItem } from '@/components/editor/BlocksRailSortable'
import type { CardBg } from '@/lib/cardBg'

type CardBlock = {
  id: string
  type: string
  enabled: boolean
  order: number
  settings: any
  style: any
  title?: string
}

type Props = {
  card: any
  blocks: CardBlock[]
}

type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

export default function ThemePageClient({ card, blocks }: Props) {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [activeDecoId, setActiveDecoId] = useState<string | null>(null)

  const [localBlocks, setLocalBlocks] = useState<CardBlock[]>(
    blocks.map((b) => ({ ...b, style: b.style ?? {}, settings: b.settings ?? {} }))
  )

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [addOpen, setAddOpen] = useState(false)

  const [localTheme, setLocalTheme] = useState<any>(() => card?.theme ?? {})

  const [cardBg, setCardBg] = useState<CardBg>(() => {
  const bg = card?.theme?.background || card?.theme
  if (bg && typeof bg === 'object' && 'mode' in bg) return bg
  return { mode: 'solid', color: '#ffffff', opacity: 1 }
})


  const enabledBlocksSorted = useMemo(
    () => localBlocks.filter((b) => b.enabled).sort((a, b) => a.order - b.order),
    [localBlocks]
  )

  const allBlocksSorted = useMemo(() => [...localBlocks].sort((a, b) => a.order - b.order), [localBlocks])

  const activeBlock = useMemo(
    () => localBlocks.find((b) => b.id === activeBlockId) || null,
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
      settings: (b.settings ?? {}) as any,
      style: (b.style ?? {}) as any,
      title: b.title,
    }))
  }

  function toggleBlockEnabled(id: string, enabled: boolean) {
    setSaveStatus('dirty')
    setLocalBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, enabled } : b)))
  }

  function updateActiveSettings(nextSettings: any) {
    if (!activeBlock) return
    setSaveStatus('dirty')
    setLocalBlocks((prev) => prev.map((b) => (b.id === activeBlock.id ? { ...b, settings: nextSettings } : b)))
  }

  function updateActiveStyle(nextStyle: any) {
    if (!activeBlock) return
    setSaveStatus('dirty')
    setLocalBlocks((prev) => prev.map((b) => (b.id === activeBlock.id ? { ...b, style: nextStyle } : b)))
  }

  async function saveChanges() {
  console.log('🟢 saveChanges STARTED')
  setSaveStatus('saving')
  console.log('🔵 saveChanges iniciado. card.id=', card.id)
  console.log('🔵 localBlocks=', localBlocks)

  try {
    // 1) Atualizar cada bloco individualmente (por ID, não por tipo!)
    for (const block of localBlocks) {
      console.log(`🟡 Atualizando bloco id=${block.id}, type=${block.type}`)

      const { error, data } = await supabase
        .from('card_blocks')
        .update({
          settings: block.settings,
          style: block.style,
          enabled: block.enabled,
          order: block.order,
        })
        .eq('id', block.id)
        .select('id, card_id, type')

      console.log(`🔴 UPDATE RESULT id=${block.id}`, { error, data })

      if (error) {
        console.error('❌ Erro ao atualizar bloco:', block.id, error)
        setSaveStatus('error')
        alert('Erro ao guardar alterações nos blocos ❌: ' + error.message)
        return
      }

      if (!data || data.length === 0) {
        console.warn(`⚠️ Nenhuma linha foi atualizada para bloco ${block.id}`)
      }
    }

    // 2) Atualizar tema do card
    // 2) Atualizar tema do card
const nextTheme = structuredClone(localTheme || {})

// ✅ CORRETO: Preserva a estrutura antiga, só atualiza o que mudou
// ✅ CORRETO: Substitui o background inteiro, preservando opacity/version/overlays
if (nextTheme.background && typeof nextTheme.background === 'object') {
  nextTheme.background = {
    ...nextTheme.background,  // Preserva opacity, version, overlays
    base: cardBg,  // Atualiza só o base
  }
} else {
  nextTheme.background = cardBg
}


console.log('🟡 Atualizando tema:', nextTheme)


    const { error: themeError, data: themeData } = await supabase
      .from('cards')
      .update({ theme: nextTheme })
      .eq('id', card.id)
      .select('id, theme')

    console.log('🟡 Resultado tema:', { error: themeError, data: themeData })

    if (themeError) {
      console.error('❌ Erro ao guardar tema:', themeError)
      setSaveStatus('error')
      alert('Erro ao guardar tema do cartão ❌: ' + themeError.message)
      return
    }

    // 3) Atualizar template (se existir)
    const templateId = card?.template_id
    if (templateId) {
      console.log('🔵 Atualizando template:', templateId)

      const preview_Json = localBlocks.map((b) => ({
        type: b.type,
        order: b.order ?? 0,
        title: b.title ?? null,
        enabled: b.enabled ?? true,
        settings: b.settings ?? {},
        style: b.style ?? {},
      }))

      const { error: templateError } = await supabase
        .from('templates')
        .update({
          preview_json: preview_Json,
          theme_json: nextTheme,
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId)
        .select('id')

      console.log('🟡 Resultado template: error=', templateError)

      if (templateError) {
        console.error('❌ Erro ao atualizar template:', templateError)
        alert('Aviso: Cartão guardado, mas template não foi atualizado ⚠️')
      } else {
        console.log('✅ Template atualizado com sucesso!')
      }
    }

    setLocalTheme(nextTheme)
    setSaveStatus('saved')
    window.setTimeout(() => setSaveStatus('idle'), 1200)
    console.log('✅ saveChanges concluído com sucesso!')
    alert('Alterações guardadas com sucesso ✅')
  } catch (err) {
    console.error('❌ Erro geral em saveChanges:', err)
    setSaveStatus('error')
    alert('Erro ao guardar: ' + (err instanceof Error ? err.message : 'Desconhecido'))
  }
}

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

  return (
    <ColorPickerProvider>
      <div
        className="editor-scope"
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
        <ThemePageClientLeft
          blocks={allBlocksSorted}
          selectedId={activeBlockId}
          onSelect={selectBlock}
          onToggle={toggleBlockEnabled}
          onReorder={(next) => {
            setSaveStatus('dirty')
            setLocalBlocks(ensureCardBlocks(next))
          }}
          onOpenAddModal={() => setAddOpen(true)}
          onSave={saveChanges}
          saveStatus={saveStatus}
          cardTitle={card?.title}
          enabledCount={enabledBlocksSorted.length}
        />

        <ThemePageClientCenter
          card={card}
          theme={localTheme}
          cardBg={cardBg}
          blocksEnabledSorted={enabledBlocksSorted}
          activeBlockId={activeBlockId}
          onSelectBlock={selectBlock}
          activeDecoId={activeDecoId}
          onSelectDeco={setActiveDecoId}
        />

        <ThemePageClientRight
          card={card}
          activeBlock={activeBlock}
          activeDecoId={activeDecoId}
          onSelectDeco={setActiveDecoId}
          cardBg={cardBg}
          onChangeCardBg={(nextBg) => {
            setCardBg(nextBg)

            const nextTheme = structuredClone(localTheme || {})
            nextTheme.background = nextBg
            setLocalTheme(nextTheme)

            setSaveStatus('dirty')
          }}
          onChangeSettings={updateActiveSettings}
          onChangeStyle={updateActiveStyle}
          onSave={saveChanges}
          saveStatus={saveStatus}
          slugEdit={slugEdit}
          setSlugEdit={setSlugEdit}
          slugSaving={slugSaving}
          slugError={slugError}
          saveSlug={saveSlug}
        />

        <AddBlockModal
          open={addOpen}
          cardId={card.id}
          existingBlocks={allBlocksSorted}
          onClose={() => setAddOpen(false)}
          onCreated={(newBlock) => {
            setLocalBlocks((prev) => [...prev, { ...newBlock, style: newBlock.style ?? {}, settings: newBlock.settings ?? {} }])
            setActiveBlockId(newBlock.id)
            setSaveStatus('idle')
          }}
        />
      </div>
    </ColorPickerProvider>
  )
}
