'use client'

import React from 'react'
import HeaderBlock from '@/components/blocks/HeaderBlock'
import InfoUtilitiesBlock from '@/components/blocks/InfoUtilitiesBlock'
import EmbedBlock from '@/components/blocks/EmbedBlock'
import ProfileBlock from '@/components/blocks/ProfileBlock'
import GalleryBlock from '@/components/blocks/GalleryBlock'
import ContactBlock from '@/components/blocks/ContactBlock'
import LeadFormBlock from '@/components/blocks/LeadFormBlock'
import SocialBlock from '@/components/blocks/SocialBlock'
import DecorationBlock from '@/components/blocks/DecorationBlock'
import BioBlock from '@/components/blocks/BioBlock'
import ServicesBlock from '@/components/blocks/ServicesBlock'
import LanguageSwitcher from '@/components/language/LanguageSwitcher'
import BusinessHoursBlock from '@/components/blocks/BusinessHoursBlock'
import DecorationOverlayInteractive from '@/components/blocks/DecorationOverlayInteractive'

type Card = {
  id: string
  theme?: any
}

type Block = {
  id: string
  type: string
  settings?: any
  style?: any
}

type Props = {
  card: Card
  blocks: Block[]
  activeBlockId?: string
  onSelectBlock?: (block: Block) => void
  onChangeBlockSettings?: (blockId: string, nextSettings: any) => void
  activeDecoId?: string | null
  onSelectDeco?: (id: string | null) => void
  showTranslations?: boolean
  fullBleed?: boolean
}

function toPx(v: any) {
  if (v === null || v === undefined || v === '') return undefined
  if (typeof v === 'number') return `${v}px`
  return v
}

function blockOuterSpacingFromJson(style: any): React.CSSProperties {
  const s = style || {}
  return {
    margin: s.margin != null ? toPx(s.margin) : undefined,
  }
}

function shouldIgnoreBlockSelect(e: React.MouseEvent) {
  const t = e.target as HTMLElement | null
  if (!t) return false

  if (t.closest('[data-no-block-select="1"]')) return true
  if (t.closest('button, a, input, select, textarea, label')) return true

  const role = t.getAttribute('role')
  if (role === 'button' || role === 'link' || role === 'switch' || role === 'checkbox') return true

  if (t.closest('svg')) return true

  return false
}

export default function CardPreview({
  card,
  blocks,
  activeBlockId,
  onSelectBlock,
  onChangeBlockSettings,
  activeDecoId = null,
  onSelectDeco,
  showTranslations = true,
  fullBleed = false,
}: Props) {
  const headerBlock = blocks?.find((b) => b.type === 'header')
  const isOverlap = headerBlock?.settings?.layout?.avatarDock !== 'inline'

  const safe = Number(card?.theme?.layout?.safePadding ?? 10)
  const cardPadX = fullBleed ? 0 : 20
  const mainPadX = 16
  const headerBleedX = cardPadX + mainPadX

  return (
    <div
      style={{
        minHeight: 'auto',
        background: fullBleed ? 'transparent' : 'var(--color-bg)',
        padding: 0,
        borderRadius: fullBleed ? 0 : 24,
        width: '100%',
      }}
    >
      {showTranslations && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '0 16px 12px',
            maxWidth: 420,
            margin: '0 auto',
          }}
        >
          <LanguageSwitcher />
        </div>
      )}

      <main
        style={{
          maxWidth: 420,
          margin: '0 auto',
          padding: '0 16px',
        }}
      >
        <div
          style={{
            position: 'relative',
            background: 'transparent', // Alterado para transparente para deixar fundo global aparecer
            borderRadius: fullBleed ? 0 : 32,
            padding: fullBleed ? 0 : '24px 20px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 40,
            boxShadow: fullBleed ? 'none' : '0 30px 80px rgba(0,0,0,0.25)',
          }}
        >
          {blocks
            ?.filter((block) => block.type === 'decorations')
            .map((block) => {
              const isActive = activeBlockId === block.id

              return (
                <div
                  key={block.id}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: isActive ? 'auto' : 'none',
                    userSelect: isActive ? 'none' : 'none',
                    zIndex: 10,
                  }}
                  onMouseDown={(e) => {
                    if (!isActive) return
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onPointerDown={(e) => {
                    if (!isActive) return
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <DecorationBlock settings={block.settings} />

                  {isActive && (
                    <DecorationOverlayInteractive
                      settings={block.settings}
                      activeDecoId={activeDecoId}
                      onSelectDeco={(id) => onSelectDeco?.(id)}
                      onPatchDeco={(id, patch) => {
                        const prevDecos = (block.settings?.decorations ?? []) as any[]
                        const nextDecos = prevDecos.map((d) => (d.id === id ? { ...d, ...patch } : d))

                        onChangeBlockSettings?.(block.id, {
                          ...(block.settings || {}),
                          decorations: nextDecos,
                        })
                      }}
                    />
                  )}
                </div>
              )
            })}

          {headerBlock ? (
            <div
              style={{
                position: 'relative',
                zIndex: isOverlap ? 8 : 10,
                cursor: onSelectBlock ? 'pointer' : 'default',
                marginLeft: -headerBleedX,
                marginRight: -headerBleedX,
              }}
              onMouseDown={(e) => {
                if (shouldIgnoreBlockSelect(e)) return
                e.stopPropagation()
                onSelectBlock?.(headerBlock)
              }}
            >
              {activeBlockId === headerBlock.id ? (
                <div
                  style={{
                    position: 'absolute',
                    inset: -6,
                    borderRadius: 22,
                    border: '2px solid var(--color-primary)',
                    pointerEvents: 'none',
                  }}
                />
              ) : null}

              <HeaderBlock settings={headerBlock.settings} cardBg={card.theme?.background} />
            </div>
          ) : null}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 40,
              paddingLeft: fullBleed ? safe : 0,
              paddingRight: fullBleed ? safe : 0,
            }}
          >
            {blocks
              ?.filter((b) => b.type !== 'decorations' && b.type !== 'header')
              .map((block) => {
                const selected = activeBlockId === block.id

                let z = 10
                if (block.type === 'profile' && isOverlap) z = 12

                const wrapperBase: React.CSSProperties = {
                  position: 'relative',
                  zIndex: z,
                  borderRadius: 18,
                  cursor: onSelectBlock ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                }

                const wrapStyle: React.CSSProperties = {
                  ...wrapperBase,
                  ...blockOuterSpacingFromJson(block.style),
                  ...(block.type === 'contact' && block.style?.headingAlign
                    ? {
                        alignItems:
                          block.style.headingAlign === 'left'
                            ? 'flex-start'
                            : block.style.headingAlign === 'right'
                            ? 'flex-end'
                            : 'center',
                      }
                    : {}),
                }

                const commonWrapProps = {
                  style: wrapStyle,
                  onPointerDown: (e: React.PointerEvent) => {
                    if (shouldIgnoreBlockSelect(e as any)) return
                    e.stopPropagation()
                    onSelectBlock?.(block)
                  },
                  onMouseDown: (e: React.MouseEvent) => {
                    if (shouldIgnoreBlockSelect(e)) return
                    e.stopPropagation()
                    onSelectBlock?.(block)
                  },
                }

                const Highlight = selected ? (
                  <div
                    style={{
                      position: 'absolute',
                      inset: -6,
                      borderRadius: 22,
                      border: '2px solid var(--color-primary)',
                      pointerEvents: 'none',
                    }}
                  />
                ) : null

                switch (block.type) {
                  case 'profile':
                    return (
                      <div key={block.id} {...commonWrapProps}>
                        {Highlight}
                        <ProfileBlock settings={block.settings} headerSettings={headerBlock?.settings} />
                      </div>
                    )

                  case 'gallery':
                    return (
                      <div key={block.id} {...commonWrapProps}>
                        {Highlight}
                        <GalleryBlock settings={block.settings} style={block.style} />
                      </div>
                    )

                  case 'bio':
                    return (
                      <div key={block.id} {...commonWrapProps}>
                        {Highlight}
                        <BioBlock settings={block.settings} style={block.style} />
                      </div>
                    )

                  case 'contact':
                    return (
                      <div key={block.id} {...commonWrapProps}>
                        {Highlight}
                        <ContactBlock settings={block.settings} style={block.style} />
                      </div>
                    )

                  case 'info_utilities':
                    return (
                      <div key={block.id} {...commonWrapProps}>
                        {Highlight}
                        <InfoUtilitiesBlock settings={block.settings} style={block.style} />
                      </div>
                    )

                  case 'social':
                    return (
                      <div key={block.id} {...commonWrapProps}>
                        {Highlight}
                        <SocialBlock settings={block.settings} style={block.style} />
                      </div>
                    )

                  case 'services':
                    return (
                      <div key={block.id} {...commonWrapProps}>
                        {Highlight}
                        <ServicesBlock settings={block.settings} style={block.style} />
                      </div>
                    )

                  case 'lead_form':
                    return (
                      <div key={block.id} {...commonWrapProps}>
                        {Highlight}
                        <LeadFormBlock cardId={card.id} settings={block.settings} style={block.style} />
                      </div>
                    )

                  case 'embed':
                    return (
                      <div key={block.id} {...commonWrapProps}>
                        {Highlight}
                        <EmbedBlock settings={block.settings} style={block.style} />
                      </div>
                    )

                  case 'business_hours':
                    return (
                      <div key={block.id} {...commonWrapProps}>
                        {Highlight}
                        <BusinessHoursBlock settings={block.settings} style={block.style} />
                      </div>
                    )

                  default:
                    return null
                }
              })}
          </div>
        </div>
      </main>
    </div>
  )
}
