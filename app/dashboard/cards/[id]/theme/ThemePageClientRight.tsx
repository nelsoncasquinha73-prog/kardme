'use client'

import { useState, useEffect } from 'react'
import PublishToggle from './PublishToggle'
import HeaderBlockEditor from '@/components/dashboard/block-editors/HeaderBlockEditor'
import ProfileBlockEditor from '@/components/dashboard/block-editors/ProfileBlockEditor'
import BioBlockEditor from '@/components/dashboard/block-editors/BioBlockEditor'
import ContactBlockEditor from '@/components/dashboard/block-editors/ContactBlockEditor'
import SocialBlockEditor from '@/components/dashboard/block-editors/SocialBlockEditor'
import GalleryBlockEditor from '@/components/dashboard/block-editors/GalleryBlockEditor'
import InfoUtilitiesBlockEditor from '@/components/dashboard/block-editors/InfoUtilitiesBlockEditor'
import LeadFormBlockEditor from '@/components/dashboard/block-editors/LeadFormBlockEditor'
import EmbedBlockEditor from '@/components/dashboard/block-editors/EmbedBlockEditor'
import ServicesBlockEditor from '@/components/dashboard/block-editors/ServicesBlockEditor'
import DecorationBlockEditor from '@/components/dashboard/block-editors/DecorationBlockEditor'
import BusinessHoursBlockEditor from '@/components/dashboard/block-editors/BusinessHoursBlockEditor'
import FreeTextBlockEditor from '@/components/dashboard/block-editors/FreeTextBlockEditor'
import CTAButtonsBlockEditor from '@/components/dashboard/block-editors/CTAButtonsBlockEditor'
import VideoBlockEditor from '@/components/dashboard/block-editors/VideoBlockEditor'
import FloatingActionsEditor from "@/components/dashboard/block-editors/FloatingActionsEditor"
import ThemeDecorationsEditor from '@/components/dashboard/block-editors/ThemeDecorationsEditor'
import SaveAsTemplateModal from '@/components/SaveAsTemplateModal'
import { supabase } from '@/lib/supabaseClient'
import type { CardBgV1 } from '@/lib/cardBg'
import type { DecorationItem } from '@/components/dashboard/block-editors/ThemeDecorationsEditor'

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
  activeBlock: CardBlock | null
  activeDecoId: string | null
  onSelectDeco: (decoId: string | null) => void
  cardBg: CardBgV1
  onChangeCardBg: (nextV1: CardBgV1) => void
  onChangeSettings: (nextSettings: any) => void
  onChangeStyle: (nextStyle: any) => void
  onSave: () => Promise<void>
  saveStatus: string
  slugEdit: string
  setSlugEdit: (slug: string) => void
  slugSaving: boolean
  slugError: string | null
  saveSlug: () => void
  onEditingChange?: (isEditing: boolean) => void
  floatingActions?: any
  onChangeFloatingActions?: (settings: any) => void
  themeDecorations?: DecorationItem[]
  onChangeThemeDecorations?: (decorations: DecorationItem[]) => void
}

function isFormEl(el: HTMLElement | null) {
  if (!el) return false
  if (el.matches('input, textarea, select')) return true
  if (el.closest('input, textarea, select')) return true
  return false
}

export default function ThemePageClientRight({
  card,
  activeBlock,
  activeDecoId,
  onSelectDeco,
  cardBg,
  onChangeCardBg,
  onChangeSettings,
  onChangeStyle,
  onSave,
  saveStatus,
  slugEdit,
  setSlugEdit,
  slugSaving,
  slugError,
  saveSlug,
  onEditingChange,
  floatingActions,
  onChangeFloatingActions,
  themeDecorations,
  onChangeThemeDecorations,
}: Props) {
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [templateSaving, setTemplateSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase.auth.getUser()
      const email = data?.user?.email
      const ADMIN_EMAILS = ['admin@kardme.com', 'nelson@kardme.com']
      setIsAdmin(email ? ADMIN_EMAILS.includes(email) : false)
    }
    checkAdmin()
  }, [])

  const handleSaveAsTemplate = async (data: {
    name: string
    description: string
    category: string
    category_id: number | null
    subcategory_id: number | null
    pricing_tier: 'free' | 'paid' | 'premium'
    price: number
  }) => {
    setTemplateSaving(true)

    try {
      await onSave()

      const { data: currentCard, error: cardErr } = await supabase
        .from('cards')
        .select('theme')
        .eq('id', card.id)
        .single()

      if (cardErr) throw new Error(cardErr.message)

      const currentTheme = currentCard?.theme || { background: cardBg }

      const { data: blocks, error: blocksErr } = await supabase
        .from('card_blocks')
        .select('*')
        .eq('card_id', card.id)
        .order('order', { ascending: true })

      if (blocksErr) throw new Error(blocksErr.message)

      const preview_json = (blocks || []).map((b) => ({
        type: b.type,
        order: b.order ?? 0,
        title: b.title ?? null,
        enabled: b.enabled ?? true,
        settings: b.settings ?? {},
        style: b.style ?? {},
      }))

      const { data: inserted, error: insertErr } = await supabase
        .from('templates')
        .insert({
          name: data.name,
          description: data.description,
          category: data.category,
          category_id: data.category_id,
          subcategory_id: data.subcategory_id,
          pricing_tier: data.pricing_tier,
          price: data.price,
          preview_json,
          theme_json: currentTheme,
          is_active: true,
        })
        .select('id')

      if (insertErr) throw new Error(insertErr.message)
      if (!inserted || inserted.length === 0) throw new Error('Template não foi inserido (RLS?)')

      setTemplateModalOpen(false)
    } catch (err) {
      console.error('❌ Error in handleSaveAsTemplate:', err)
      alert(`❌ Erro: ${err instanceof Error ? err.message : 'Desconhecido'}`)
    } finally {
      setTemplateSaving(false)
    }
  }

  return (
    <aside
      style={{
        background: '#fff',
        color: '#374151',
        borderRadius: 18,
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        overflow: 'hidden',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
      onFocusCapture={(e) => {
        const el = e.target as HTMLElement | null
        if (isFormEl(el)) onEditingChange?.(true)
      }}
      onBlurCapture={(e) => {
        const el = e.target as HTMLElement | null
        if (isFormEl(el)) onEditingChange?.(false)
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

      <div style={{ padding: 12, overflow: 'auto', flex: 1 }}>
        {!activeBlock && (
          <>
            <FloatingActionsEditor
              settings={floatingActions || {}}
              onChange={(s) => onChangeFloatingActions?.(s)}
            />
            <div style={{ marginTop: 16 }}>
              <ThemeDecorationsEditor
                cardId={card.id}
                decorations={themeDecorations || []}
                onChange={(d) => onChangeThemeDecorations?.(d)}
                activeDecoId={activeDecoId}
                onSelectDeco={onSelectDeco}
              />
            </div>
          </>
        )}

        {activeBlock?.type === 'header' && (
          <HeaderBlockEditor
            cardId={card.id}
            settings={activeBlock.settings || {}}
            onChange={(nextSettings) => onChangeSettings(nextSettings)}
            cardBg={cardBg}
            onChangeCardBg={onChangeCardBg}
          />
        )}

        {activeBlock?.type === 'profile' && (
          <ProfileBlockEditor
            cardId={card.id}
            settings={activeBlock.settings || {}}
            onChange={(nextSettings) => onChangeSettings(nextSettings)}
          />
        )}

        {activeBlock?.type === 'bio' && (
          <BioBlockEditor
            settings={activeBlock.settings || {}}
            style={activeBlock.style || {}}
            onChangeSettings={onChangeSettings}
            onChangeStyle={onChangeStyle}
          />
        )}

        {activeBlock?.type === 'contact' && (
          <ContactBlockEditor
            settings={activeBlock.settings || {}}
            style={activeBlock.style || {}}
            onChangeSettings={onChangeSettings}
            onChangeStyle={onChangeStyle}
          />
        )}

        {activeBlock?.type === 'social' && (
          <SocialBlockEditor
            settings={activeBlock.settings || {}}
            style={activeBlock.style || {}}
            onChange={({ settings, style }) => {
              onChangeSettings(settings)
              onChangeStyle(style)
            }}
          />
        )}

        {activeBlock?.type === 'gallery' && (
          <GalleryBlockEditor
            settings={activeBlock.settings || {}}
            style={activeBlock.style || {}}
            onChangeSettings={onChangeSettings}
            onChangeStyle={onChangeStyle}
          />
        )}

        {activeBlock?.type === 'video' && (
          <VideoBlockEditor
            settings={activeBlock.settings || {}}
            style={activeBlock.style || {}}
            onChangeSettings={onChangeSettings}
            onChangeStyle={onChangeStyle}
          />
        )}

        {activeBlock?.type === 'info_utilities' && (
          <InfoUtilitiesBlockEditor
            settings={activeBlock.settings || {}}
            style={activeBlock.style || {}}
            onChangeSettings={onChangeSettings}
            onChangeStyle={onChangeStyle}
          />
        )}

        {activeBlock?.type === 'lead_form' && (
          <LeadFormBlockEditor
            settings={activeBlock.settings || {}}
            style={activeBlock.style || {}}
            onChangeSettings={onChangeSettings}
            onChangeStyle={onChangeStyle}
          />
        )}

        {activeBlock?.type === 'embed' && (
          <EmbedBlockEditor
            settings={activeBlock.settings || {}}
            style={activeBlock.style || {}}
            onChangeSettings={onChangeSettings}
            onChangeStyle={onChangeStyle}
          />
        )}

        {activeBlock?.type === 'services' && (
          <ServicesBlockEditor
            settings={activeBlock.settings || {}}
            style={activeBlock.style || {}}
            onChangeSettings={onChangeSettings}
            onChangeStyle={onChangeStyle}
          />
        )}

        {activeBlock?.type === 'decorations' && (
          <DecorationBlockEditor
            settings={activeBlock.settings || {}}
            style={activeBlock.style || {}}
            onChangeSettings={onChangeSettings}
            onChangeStyle={onChangeStyle}
            activeDecoId={activeDecoId}
            onSelectDeco={onSelectDeco}
          />
        )}

        {activeBlock?.type === 'business_hours' && (
          <BusinessHoursBlockEditor
            settings={activeBlock.settings || {}}
            style={activeBlock.style || {}}
            onChangeSettings={onChangeSettings}
            onChangeStyle={onChangeStyle}
          />
        )}

        {activeBlock?.type === 'free_text' && (
          <FreeTextBlockEditor
            settings={activeBlock.settings || { text: '' }}
            style={activeBlock.style || {}}
            onChangeSettings={onChangeSettings}
            onChangeStyle={onChangeStyle}
          />
        )}

        {activeBlock?.type === 'cta_buttons' && (
          <CTAButtonsBlockEditor
            cardId={card.id}
            settings={activeBlock.settings || { buttons: [] }}
            style={activeBlock.style || {}}
            onChangeSettings={onChangeSettings}
            onChangeStyle={onChangeStyle}
          />
        )}

        {activeBlock &&
          ![
            'header',
            'profile',
            'bio',
            'contact',
            'social',
            'gallery',
            'info_utilities',
            'lead_form',
            'embed',
            'services',
            'decorations',
            'business_hours',
            'free_text',
            'cta_buttons',
          ].includes(activeBlock.type) && (
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
            {!isAdmin && <PublishToggle cardId={card.id} initialPublished={card.published ?? false} />}
          </div>
        )}

        <button
          onClick={onSave}
          style={{
            width: '100%',
            height: 44,
            borderRadius: 14,
            border: 'none',
            background: '#111827',
            color: '#fff',
            fontWeight: 800,
            fontSize: 14,
            cursor: 'pointer',
            marginBottom: 8,
            opacity: saveStatus === 'saving' ? 0.7 : 1,
          }}
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? 'A guardar…' : '💾 Guardar'}
        </button>

        {isAdmin && (
          <button
            onClick={() => setTemplateModalOpen(true)}
            style={{
              width: '100%',
              height: 44,
              borderRadius: 14,
              border: '1px solid rgba(124, 58, 237, 0.3)',
              background: 'rgba(124, 58, 237, 0.1)',
              color: 'rgba(168, 85, 247, 0.95)',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              marginBottom: 8,
            }}
            disabled={templateSaving}
          >
            {templateSaving ? 'A guardar…' : '📦 Guardar como template'}
          </button>
        )}

        <p style={{ marginTop: 10, fontSize: 12, opacity: 0.55 }}>
          Auto-save: guarda automaticamente o bloco ativo ~600ms após parares de mexer.
        </p>
      </div>

      <SaveAsTemplateModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onConfirm={handleSaveAsTemplate}
        isLoading={templateSaving}
      />
    </aside>
  )
}
