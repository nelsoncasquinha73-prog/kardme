'use client'

import React from 'react'
import ContactBlock from '@/components/blocks/ContactBlock'
import DecorationBlock from '@/components/blocks/DecorationBlock'
import ServicesBlock from '@/components/blocks/ServicesBlock'
import LeadFormBlock from '@/components/blocks/LeadFormBlock'
import BusinessHoursBlock from '@/components/blocks/BusinessHoursBlock'
import HeaderBlock from '@/components/blocks/HeaderBlock'
import SocialBlock from '@/components/blocks/SocialBlock'
import DecorationOverlayInteractive from '@/components/blocks/DecorationOverlayInteractive'
import LanguageSwitcher from '@/components/language/LanguageSwitcher'
import GalleryBlock from '@/components/blocks/GalleryBlock'
import ProfileBlock from '@/components/blocks/ProfileBlock'
import InfoUtilitiesBlock from '@/components/blocks/InfoUtilitiesBlock'
import CardBackground from '@/components/theme/CardBackground'
import BioBlock from '@/components/blocks/BioBlock'
import FreeTextBlock from '@/components/blocks/FreeTextBlock'
import CTAButtonsBlock from '@/components/blocks/CTAButtonsBlock'
import { trackEvent } from '@/lib/trackEvent'
import { migrateCardBg, type CardBg } from '@/lib/cardBg'

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
  cardBg?: any
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

function shouldIgnoreBlockSelect(e: React.MouseEvent | React.PointerEvent) {
  const t = (e.target as HTMLElement) || null
  if (!t) return false

  if (t.closest('[data-no-block-select="1"]')) return true
  if (t.closest('button, a, input, select, textarea, label')) return true

  const role = t.getAttribute('role')
  if (role === 'button' || role === 'link' || role === 'switch' || role === 'checkbox') return true

  if (t.closest('svg')) return true

  return false
}

function mapHeadingAlignToItems(align?: 'left' | 'center' | 'right') {
  if (align === 'left') return 'flex-start'
  if (align === 'right') return 'flex-end'
  return 'center'
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
  cardBg,
}: Props) {
  const headerBlock = blocks?.find((b) => b.type === 'header')
  const isOverlap = headerBlock?.settings?.layout?.avatarDock !== 'inline'

  const safe = fullBleed ? 0 : Number(card?.theme?.layout?.safePadding ?? 10)

  const bgRaw = (cardBg ?? card?.theme?.background) as CardBg | null | undefined
const bgV1 = migrateCardBg(bgRaw)
  const bg = migrateCardBg((cardBg ?? card?.theme?.background) as CardBg | null | undefined)

  const handleMainClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement

    // Track links
    if (target.closest('a')) {
      const link = target.closest('a') as HTMLAnchorElement
      const href = link.getAttribute('href') || ''
      const key = link.getAttribute('data-track-key') || href.split('/').pop() || 'link'
      trackEvent(card.id, 'click', key)
    }

    // Track buttons (exceto submit do form)
    if (target.closest('button')) {
      const btn = target.closest('button') as HTMLButtonElement
      if (btn.type !== 'submit') {
        const key = btn.getAttribute('data-track-key') || btn.textContent?.trim() || 'button'
        trackEvent(card.id, 'click', key)
      }
    }
  }

  return (
    <CardBackground
      bg={bg}
      style={
        {
          minHeight: 'auto',
          padding: 0,
          borderRadius: 0,
          width: '100%',
        } as React.CSSProperties
      }
    >
      {showTranslations && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '0 16px 12px',
            maxWidth: 'var(--card-max, 420px)',
            margin: '0 auto',
          }}
        >
          <LanguageSwitcher />
        </div>
      )}

      <main
        className="cardMain"
        style={{
          width: '100%',
          maxWidth: 'var(--card-max, 420px)',
          margin: '0 auto',
          padding: 0,
          boxSizing: 'border-box',
        }}
        onClick={handleMainClick}
      >
        <div
          style={{
            position: 'relative',
            background: 'transparent',
            borderRadius: fullBleed ? 0 : 32,
            padding: fullBleed ? 0 : '24px 20px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 40,
            boxShadow: fullBleed ? 'none' : '0 30px 80px rgba(0,0,0,0.25)',
          }}
        >
          {/* DECORATIONS */}
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
                    userSelect: 'none',
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
                  <DecorationBlock settings={block.settings} style={block.style} />

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

          {/* HEADER */}
          {headerBlock ? (
            <div
              style={{
                position: 'relative',
                zIndex: isOverlap ? 8 : 10,
                cursor: onSelectBlock ? 'pointer' : 'default',
                marginLeft: fullBleed ? 0 : -36,
                marginRight: fullBleed ? 0 : -36,
              }}
              onPointerDownCapture={(e) => {
                if (shouldIgnoreBlockSelect(e)) return
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

              <HeaderBlock settings={headerBlock.settings} cardBg={bg} />
            </div>
          ) : null}

          {/* OUTROS BLOCOS */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 40,
              paddingLeft: fullBleed ? 0 : safe,
              paddingRight: fullBleed ? 0 : safe,
            }}
          >
            {blocks
              ?.filter((b) => b.type !== 'decorations' && b.type !== 'header')
              .map((block) => {
                const selected = activeBlockId === block.id

                let z = 10
                if (block.type === 'profile' && isOverlap) z = 12

                const alignItems =
                  block.type === 'contact' || block.type === 'social'
                    ? mapHeadingAlignToItems(block.style?.headingAlign)
                    : undefined

                const wrapStyle: React.CSSProperties = {
                  position: 'relative',
                  zIndex: z,
                  borderRadius: 18,
                  cursor: onSelectBlock ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems,
                  ...blockOuterSpacingFromJson(block.style),
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

                return (
                  <div
                    key={block.id}
                    style={wrapStyle}
                    onPointerDownCapture={(e) => {
                      if (shouldIgnoreBlockSelect(e)) return
                      onSelectBlock?.(block)
                    }}
                  >
                    {Highlight}

                    {block.type === 'contact' ? (
                      <ContactBlock settings={block.settings} style={block.style} />
                    ) : block.type === 'social' ? (
                      <SocialBlock settings={block.settings} style={block.style} />
                    ) : block.type === 'services' ? (
                      <ServicesBlock settings={block.settings} style={block.style} />
                    ) : block.type === 'lead_form' ? (
                      <LeadFormBlock cardId={card.id} settings={block.settings} style={block.style} />
                    ) : block.type === 'business_hours' ? (
                      <BusinessHoursBlock settings={block.settings} style={block.style} />
                    ) : block.type === 'profile' ? (
                      <ProfileBlock settings={block.settings} headerSettings={headerBlock?.settings} />
                    ) : block.type === 'gallery' ? (
                      <GalleryBlock settings={block.settings} style={block.style} />
                    ) : block.type === 'bio' ? (
                      <BioBlock settings={block.settings} style={block.style} />
                    ) : block.type === 'free_text' ? (
                      <FreeTextBlock settings={block.settings} style={block.style} />
                    ) : block.type === 'cta_buttons' ? (
                      <CTAButtonsBlock cardId={card.id} settings={block.settings} style={block.style} />
                    ) : block.type === 'info_utilities' ? (
                      <InfoUtilitiesBlock settings={block.settings} style={block.style} />
                    ) : null}
                  </div>
                )
              })}
          </div>
        </div>
      </main>
    </CardBackground>
  )
}
