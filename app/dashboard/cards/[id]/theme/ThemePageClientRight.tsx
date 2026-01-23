'use client'

import { useState, useEffect } from 'react'
import CardPublicLink from '@/components/dashboard/CardPublicLink'
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
import SaveAsTemplateModal from '@/components/SaveAsTemplateModal'
import { supabase } from '@/lib/supabaseClient'
import type { CardBg } from '@/lib/cardBg'
import { useSearchParams } from 'next/navigation'

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
  cardBg: CardBg
  onChangeCardBg: (nextBg: CardBg) => void
  onChangeSettings: (nextSettings: any) => void
  onChangeStyle: (nextStyle: any) => void
  onSave: () => void
  saveStatus: string
  slugEdit: string
  setSlugEdit: (slug: string) => void
  slugSaving: boolean
  slugError: string | null
  saveSlug: () => void
  onEditingChange?: (isEditing: boolean) => void
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
}: Props) {
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [templateSaving, setTemplateSaving] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data?.user?.email || null)
    })
  }, [])

  const isAdmin = userEmail === 'nelson@kardme.com' || userEmail === 'admin@kardme.com'

  const searchParams = useSearchParams()
  const templateId = searchParams.get('template_id')

  const handleSaveAsTemplate = async (data: {
    name: string
    description: string
    category: string
    price: number
  }) => {
    setTemplateSaving(true)

    try {
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

      // Se é draft de edição (templateId existe), faz UPDATE
      if (templateId) {
        const { error: updateErr } = await supabase
          .from('templates')
          .update({
            preview_json,
            updated_at: new Date().toISOString(),
          })
          .eq('id', templateId)

        if (updateErr) throw new Error(updateErr.message)

        alert(`✅ Template atualizado com sucesso!`)
        setTemplateSaving(false)
        return
      }

      // Senão, cria novo template (comportamento atual)
      const { error: insertErr } = await supabase.from('templates').insert({
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price,
        preview_json,
        is_active: true,
      })

      if (insertErr) throw new Error(insertErr.message)

      alert(`✅ Template "${data.name}" guardado com sucesso!`)
      setTemplateSaving(false)
    } catch (err) {
      setTemplateSaving(false)
      throw err
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
            <span style={{ fontSize: 12, opacity: 0.6, color: '#111827' }}>
              Bloco: {activeBlock.type}
            </span>
          )}
        </div>
      </div>

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
            color: '#374151',
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
            opacity: slugSaving || slugEdit === card.slug ? 0.6 : 1,
          }}
        >
          {slugSaving ? 'A guardar…' : 'Guardar slug'}
        </button>
      </div>

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
            <PublishToggle cardId={card.id} initialPublished={card.published ?? false} />
          </div>
        )}

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
          >
            {templateId ? '✏️ Atualizar template' : '📦 Guardar como template'}
          </button>
        )}

        <button
          onClick={onSave}
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

      <SaveAsTemplateModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onConfirm={handleSaveAsTemplate}
        isLoading={templateSaving}
      />
    </aside>
  )
}
