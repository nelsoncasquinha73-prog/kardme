'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { migrateCardBg } from '@/lib/cardBg'

const CardPreview = dynamic(() => import('@/components/theme/CardPreview'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'rgba(255,255,255,0.5)',
      fontSize: 12,
    }}>
      A carregar...
    </div>
  ),
})

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
      type: block.type || 'unknown',
      order: block.order ?? index,
      settings: block.settings || {},
      style: block.style || {},
      title: block.title || null,
      enabled: block.enabled !== false,
    }))
  }, [template])

  const cardBg = useMemo(() => {
    try {
      return migrateCardBg(template.theme_json?.background)
    } catch {
      return undefined
    }
  }, [template])

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
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        Sem preview
      </div>
    )
  }

  return (
    <div style={{
      height,
      overflow: 'hidden',
      borderRadius: 12,
      position: 'relative',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{
        height: '100%',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        <div style={{ 
          transform: 'scale(0.45)', 
          transformOrigin: 'top center', 
          width: '222%',
          marginLeft: '-61%',
        }}>
          <CardPreview
            card={fakeCard as any}
            blocks={blocks as any}
            showTranslations={false}
            fullBleed={true}
            cardBg={cardBg}
          />
        </div>
      </div>
    </div>
  )
}
