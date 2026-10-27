'use client'

import BlocksRailSortable from '@/components/editor/BlocksRailSortable'
import type { BlockItem } from '@/components/editor/BlocksRailSortable'
import { useLanguage } from '@/components/language/LanguageProvider'

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
  blocks: CardBlock[]
  selectedId: string | null
  onSelect: (id: string) => void
  onSelectTheme: () => void
  onToggle: (id: string, enabled: boolean) => void
  onReorder: (next: BlockItem[]) => void
  onDelete?: (id: string) => void
  onOpenAddModal: () => void
  onSave: () => void
  saveStatus: string
  cardTitle?: string
  enabledCount: number
}

export default function ThemePageClientLeft({
  blocks,
  selectedId,
  onSelect,
  onSelectTheme,
  onToggle,
  onReorder,
  onDelete,
  onOpenAddModal,
  onSave,
  saveStatus,
  cardTitle,
  enabledCount,
}: Props) {
  const { t } = useLanguage()
  return (
    <aside
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid rgba(0,0,0,0.08)',
        overflow: 'hidden',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        color: '#374151',
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
        <strong style={{ fontSize: 13, color: '#111827' }}>{t('editor.blocks_label')}</strong>
        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6, color: '#111827' }}>
          {cardTitle} · {enabledCount} {t('editor.active')}
        </div>
        <button
          onClick={onOpenAddModal}
          style={{
            height: 36,
            padding: '0 12px',
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.12)',
            background: '#fff',
            cursor: 'pointer',
            fontWeight: 800,
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            width: '100%',
            whiteSpace: 'nowrap',
          }}
        >
          + {t('editor.add_block')}
        </button>
      </div>

      {/* Botão Tema */}
      <div style={{ padding: '12px 12px 0' }}>
        <button
          onClick={onSelectTheme}
          style={{
            width: '100%',
            height: 44,
            borderRadius: 14,
            border: selectedId === null ? '2px solid var(--color-primary, #3b82f6)' : '1px solid rgba(0,0,0,0.12)',
            background: selectedId === null ? 'rgba(59, 130, 246, 0.08)' : '#fff',
            fontWeight: 800,
            cursor: 'pointer',
            color: selectedId === null ? 'var(--color-primary, #3b82f6)' : '#111827',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 14,
          }}
        >
          🎨 {t('editor.theme_decorations')}
        </button>
      </div>

      <div style={{ overflow: 'auto', minHeight: 0 }}>
        <BlocksRailSortable
          blocks={blocks}
          selectedId={selectedId}
          onSelect={onSelect}
          onToggle={onToggle}
          onReorder={onReorder}
          onDelete={onDelete}
        />
      </div>

      <div style={{ padding: 12, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <button
          onClick={onSave}
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
          💾 {t('common.save')}
        </button>

        {saveStatus && (
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.65, color: '#111827' }}>
            {saveStatus === 'saving'
              ? t('dashboard.saving')
              : saveStatus === 'saved'
              ? 'Guardado ✅'
              : saveStatus === 'error'
              ? 'Erro ao guardar ❌'
              : saveStatus === 'dirty'
              ? 'Alterações por guardar…'
              : ''}
          </div>
        )}
      </div>
    </aside>
  )
}
