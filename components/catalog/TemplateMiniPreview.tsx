'use client'

import { useMemo } from 'react'
import CardPreview from '@/components/theme/CardPreview'
import { migrateCardBg } from '@/lib/cardBg'

type Template = {
  id: string
  name: string
  preview_json: any[] | null
  theme_json: any | null
}

type Props = {
  template: Template
  height?: number
}

export default function TemplateMiniPreview({ template, height = 400 }: Props) {
  const fakeCard = useMemo(() => ({
    id: template.id,
    name: template.name,
    slug: '',
    theme: template.theme_json || {},
  }), [template])

  const blocks = useMemo(() => {
    if (!Array.isArray(template.preview_json)) return []
    return template.preview_json.map((block: any, index: number) => ({
      id: `preview-${index}`,
      card_id: template.id,
      type: block.type,
      order: block.order ?? index,
      settings: block.settings || {},
      style: block.style || {},
      title: block.title || null,
      enabled: block.enabled !== false,
    }))
  }, [template])

  const cardBg = useMemo(() => migrateCardBg(template.theme_json?.background), [template])

  if (blocks.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
      }}>
        Sem preview
      </div>
    )
  }

  return (
    <div style={{
      height,
      overflow: 'auto',
      borderRadius: 12,
      position: 'relative',
    }}>
      <div style={{ transform: 'scale(0.5)', transformOrigin: 'top center', width: '200%' }}>
        <CardPreview
          card={fakeCard as any}
          blocks={blocks as any}
          showTranslations={false}
          fullBleed={true}
          cardBg={cardBg}
        />
      </div>
    </div>
  )
}
