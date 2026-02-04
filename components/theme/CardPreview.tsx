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
import VideoBlock from '@/components/blocks/VideoBlock'
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

type DecorationItem = {
  id: string
  src: string
  alt?: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  zIndex: number
  enabled: boolean
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
  themeDecorations?: DecorationItem[]
  onPatchThemeDeco?: (id: string, patch: Partial<DecorationItem>) => void
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

function ThemeDecorationsLayer({
  decorations,
  activeDecoId,
  onSelectDeco,
  isEditing,
}: {
  decorations: DecorationItem[]
  activeDecoId?: string | null
  onSelectDeco?: (id: string | null) => void
  isEditing?: boolean
}) {
  const enabledDecos = decorations.filter((d) => d.enabled !== false && d.src)

  if (enabledDecos.length === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: isEditing ? 'auto' : 'none',
        userSelect: 'none',
        zIndex: 10,
        overflow: 'hidden',
      }}
    >
      {enabledDecos.map((deco) => (
        <img
          key={deco.id}
          src={deco.src}
          alt={deco.alt || ''}
          draggable={false}
          onClick={(e) => {
            if (!isEditing) return
            e.stopPropagation()
            onSelectDeco?.(deco.id)
          }}
          style={{
            position: 'absolute',
            left: `${deco.x}%`,
            top: `${deco.y}%`,
            width: deco.width,
            height: deco.height,
            transform: `translate(-50%, -50%) rotate(${deco.rotation || 0}deg)`,
            opacity: deco.opacity ?? 1,
            zIndex: deco.zIndex ?? 1,
            pointerEvents: isEditing ? 'auto' : 'none',
            cursor: isEditing ? 'pointer' : 'default',
            outline: activeDecoId === deco.id ? '2px solid var(--color-primary)' : 'none',
            outlineOffset: 2,
            borderRadius: 4,
          }}
        />
      ))}
    </div>
  )
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
  themeDecorations,
  onPatchThemeDeco,
}: Props) {
  const headerBlock = blocks?.find((b) => b.type === 'header')
  const isOverlap = headerBlock?.settings?.layout?.avatarDock !== 'inline'

  const safe = fullBleed ? 0 : Number(card?.theme?.layout?.safePadding ?? 10)

  const bgRaw = (cardBg ?? card?.theme?.background)
  const bgV1 = migrateCardBg(bgRaw)
  const bg = migrateCardBg((cardBg ?? card?.theme?.background))

  const allThemeDecorations: DecorationItem[] = themeDecorations ?? card?.theme?.decorations ?? []
  const isEditingThemeDecos = !activeBlockId && !!onSelectDeco

  const handleMainClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement

    if (target.closest('a')) {
      const link = target.closest('a') as HTMLAnchorElement
      const href = link.getAttribute('href') || ''
      const key = link.getAttribute('data-track-key') || href.split('/').pop() || 'link'
      trackEvent(card.id, 'click', key)
    }

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
      style={{
        minHeight: '100dvh',
        padding: 0,
        borderRadius: 0,
        width: '100%',
      } as React.CSSProperties}
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
          {allThemeDecorations.length > 0 && (
            <ThemeDecorationsLayer
              decorations={allThemeDecorations}
              activeDecoId={activeDecoId}
              onSelectDeco={onSelectDeco}
              isEditing={isEditingThemeDecos}
            />
          )}

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

                const c = block.style?.container || {}
                const containerEnabled = c.enabled !== false

                const wrapStyle: React.CSSProperties = {
                  position: 'relative',
                  zIndex: z,
                  cursor: onSelectBlock ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems,
                  ...blockOuterSpacingFromJson(block.style),
                  background: containerEnabled ? (c.bgColor ?? 'transparent') : 'transparent',
                  borderRadius: c.radius != null ? c.radius : 18,
                  padding: c.padding != null ? c.padding : undefined,
                  border:
                    (c.borderWidth ?? 0) > 0
                      ? `${c.borderWidth}px solid ${c.borderColor ?? 'rgba(0,0,0,0.12)'}`
                      : undefined,
                  boxShadow: c.shadow ? '0 14px 40px rgba(0,0,0,0.12)' : undefined,
                  boxSizing: 'border-box',
                  width: c.widthMode === 'custom' && c.customWidthPx ? `${c.customWidthPx}px` : undefined,
                  maxWidth: c.widthMode === 'custom' ? '100%' : undefined,
                  alignSelf: c.widthMode === 'custom' ? 'center' : undefined,
                  marginTop: block.style?.offsetY ? `${block.style.offsetY}px` : undefined,
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
                    ) : block.type === 'video' ? (
                      <VideoBlock settings={block.settings} style={block.style} />
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
