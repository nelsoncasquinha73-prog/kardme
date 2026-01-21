'use client'

import CardPreview from '@/components/theme/CardPreview'
import CardContainer from '@/components/ui/CardContainer'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
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
  theme: any
  cardBg: CardBg
  blocksEnabledSorted: CardBlock[]
  activeBlockId: string | null
  onSelectBlock: (blockId: string) => void
  activeDecoId: string | null
  onSelectDeco: (decoId: string | null) => void
}

export default function ThemePageClientCenter({
  card,
  theme,
  cardBg,
  blocksEnabledSorted,
  activeBlockId,
  onSelectBlock,
  activeDecoId,
  onSelectDeco,
}: Props) {
  return (
    <main
      id="preview-scroll"
      style={{
        minHeight: 0,
        minWidth: 0,
        overflow: 'auto',
        display: 'grid',
        placeItems: 'start center',
        padding: '12px 0 40px',
        background: 'transparent',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420, display: 'grid', placeItems: 'center' }}>
        <div
          id="preview-hitbox"
          style={{
            width: 420,
            borderRadius: 44,
            padding: 3,
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 22px 70px rgba(0,0,0,0.28)',
            border: '1px solid rgba(0,0,0,0.06)',
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
    overflow: 'hidden', // ✅ importante para o html2canvas
    border: '1px solid rgba(0,0,0,0.08)',
    minHeight: 680,
    background: 'transparent',
  }}
>


            <div id="card-preview-root" style={{ minHeight: '100%' }}>
              <ThemeProvider theme={theme}>
                <CardContainer variant="flat" hover={false}>
                  <CardPreview
                    card={{ ...card, theme }}
                    blocks={blocksEnabledSorted}
                    activeBlockId={activeBlockId || undefined}
                    onSelectBlock={(b: any) => onSelectBlock(b.id)}
                    activeDecoId={activeDecoId}
                    onSelectDeco={onSelectDeco}
                    showTranslations={false}
                    fullBleed
                    cardBg={cardBg}
                  />
                </CardContainer>
              </ThemeProvider>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.55, color: '#111827' }}>
          Dica: arrasta blocos à esquerda para reordenar.
        </div>
      </div>
    </main>
  )
}
