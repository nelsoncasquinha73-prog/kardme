'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import PhoneFrame from '@/components/theme/PhoneFrame'

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

export default function TemplateMiniPreview({ template, height = 480 }: Props) {
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

  const themeForProvider = useMemo(() => {
    return template.theme_json || {}
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

  // Scale para o PhoneFrame caber no container
  // PhoneFrame tem 420x880, queremos que caiba em ~height
  const scale = height / 880

  return (
    <div style={{
      height,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      overflow: 'hidden',
      borderRadius: 12,
      position: 'relative',
    }}>
      <div style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
      }}>
        <PhoneFrame>
          <div style={{
            height: '100%',
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}>
            <ThemeProvider theme={themeForProvider}>
              <CardPreview
                card={fakeCard as any}
                blocks={blocks as any}
                showTranslations={false}
                fullBleed={true}
              />
            </ThemeProvider>
          </div>
        </PhoneFrame>
      </div>
    </div>
  )
}
