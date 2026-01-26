'use client'

import React from 'react'
import Image from 'next/image'
import { migrateCardBg, isV1, type CardBg, type CardBgV1 } from '@/lib/cardBg'

export type BadgeSettings = {
  enabled?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  sizePx?: number
  offsetX?: number
  offsetY?: number
  bgEnabled?: boolean
  bgColor?: string
  radiusPx?: number
  shadow?: boolean
}

export type HeaderSettings = {
  coverImage?: string
  badgeImage?: string
  layout?: {
    showCover?: boolean
    height?: number
    coverMode?: 'full' | 'tile' | 'auto'
    tileRadius?: number
    tilePadding?: number
    overlay?: boolean
    overlayOpacity?: number
    overlayColor?: string
    overlayGradient?: boolean
    coverFadeEnabled?: boolean
    coverFadeStrength?: number
    coverFadeHeightPx?: number
    badge?: BadgeSettings
    avatarDock?: 'overlap' | 'inline'
    widthMode?: 'full' | 'fixed' | 'custom'
    customWidthPx?: number
    headerBgEnabled?: boolean
    headerBgColor?: string
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

/**
 * Converte v1 CardBg para CSS background string
 */
function v1ToCss(v1: CardBgV1): string {
  if (v1.base.kind === 'solid') {
    return v1.base.color
  }

  // gradient
  const angle = typeof v1.base.angle === 'number' ? v1.base.angle : 180
  const stops = v1.base.stops ?? [
    { color: '#ffffff', pos: 0 },
    { color: '#f3f4f6', pos: 100 },
  ]

  const gradientStops = stops.map((s) => `${s.color} ${s.pos ?? 0}%`).join(', ')
  return `linear-gradient(${angle}deg, ${gradientStops})`
}

/**
 * Extrai a cor "de fundo" (última cor do gradient ou cor sólida)
 */
function v1ToFadeTarget(v1: CardBgV1): string {
  if (v1.base.kind === 'solid') {
    return v1.base.color
  }

  // gradient: pega na última cor
  const stops = v1.base.stops ?? [
    { color: '#ffffff', pos: 0 },
    { color: '#f3f4f6', pos: 100 },
  ]
  return stops[stops.length - 1]?.color ?? '#ffffff'
}

/**
 * Converte "rgb(r,g,b)" em "rgba(r,g,b,a)" com a opacidade pedida
 */
function rgbToRgba(rgb: string, a: number) {
  const m = rgb.match(/^rgb$(.+)$$/)
  if (!m) return rgb
  return `rgba(${m[1]}, ${a})`
}

export default function HeaderBlock({
  settings,
  cardBg,
}: {
  settings?: HeaderSettings | null
  cardBg?: CardBg
}) {
  const safeSettings: HeaderSettings = settings ?? {}
  const layout = safeSettings.layout ?? {}

  // ✅ Normaliza sempre para v1 (aceita legacy + v1)
  const v1 = migrateCardBg(cardBg)

  const headerBgEnabled = (layout as any)?.headerBgEnabled === true
  const headerBgColor = (layout as any)?.headerBgColor ?? '#ffffff'

  const showCover = layout.showCover !== false
  const height = typeof layout.height === 'number' ? layout.height : 220

  const coverMode = (layout.coverMode ?? 'tile') as 'full' | 'tile' | 'auto'
  const tileRadius = typeof layout.tileRadius === 'number' ? layout.tileRadius : 18
  const tilePadding = typeof layout.tilePadding === 'number' ? layout.tilePadding : 10

  const overlayEnabled = layout.overlay === true
  const overlayOpacity = typeof layout.overlayOpacity === 'number' ? clamp(layout.overlayOpacity, 0, 0.95) : 0.25
  const overlayColor = layout.overlayColor ?? '#000000'
  const overlayGradient = layout.overlayGradient === true

  const coverFadeEnabled = layout.coverFadeEnabled === true
  const coverFadeStrength = typeof layout.coverFadeStrength === 'number' ? clamp(layout.coverFadeStrength, 0, 100) : 55
  const coverFadeHeightPx = typeof layout.coverFadeHeightPx === 'number' ? layout.coverFadeHeightPx : 140

  // ✅ Usa v1 para tudo
  const bgCss = v1ToCss(v1)
  const fadeTargetBase = headerBgEnabled ? headerBgColor : v1ToFadeTarget(v1)
  const fadeTargetOpacity = typeof v1.opacity === 'number' ? clamp(v1.opacity, 0, 1) : 1

  const fadeTarget = (() => {
    if (!fadeTargetBase) return '#ffffff'
    if (fadeTargetOpacity < 1 && fadeTargetBase.startsWith('rgb(') && !fadeTargetBase.startsWith('rgba(')) {
      return rgbToRgba(fadeTargetBase, fadeTargetOpacity)
    }
    return fadeTargetBase
  })()

  const badge = layout.badge ?? {}
  const badgeEnabled = badge.enabled === true && !!safeSettings.badgeImage

  const badgePos = badge.position ?? 'top-right'
  const badgeSizePx = typeof badge.sizePx === 'number' ? badge.sizePx : 56
  const badgeOffsetX = typeof badge.offsetX === 'number' ? badge.offsetX : 10
  const badgeOffsetY = typeof badge.offsetY === 'number' ? badge.offsetY : 10
  const badgeBgEnabled = badge.bgEnabled === true
  const badgeBgColor = badge.bgColor ?? 'rgba(255,255,255,0.85)'
  const badgeRadiusPx = typeof badge.radiusPx === 'number' ? badge.radiusPx : 12
  const badgeShadow = badge.shadow === true

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    width: badgeSizePx,
    height: badgeSizePx,
    borderRadius: badgeRadiusPx,
    overflow: 'hidden',
    background: badgeBgEnabled ? badgeBgColor : 'transparent',
    boxShadow: badgeShadow ? '0 6px 18px rgba(0,0,0,0.18)' : undefined,
    zIndex: 20,
    pointerEvents: 'none',
  }

  if (badgePos === 'top-left') {
    badgeStyle.top = badgeOffsetY
    badgeStyle.left = badgeOffsetX
  } else if (badgePos === 'top-right') {
    badgeStyle.top = badgeOffsetY
    badgeStyle.right = badgeOffsetX
  } else if (badgePos === 'bottom-left') {
    badgeStyle.bottom = badgeOffsetY
    badgeStyle.left = badgeOffsetX
  } else {
    badgeStyle.bottom = badgeOffsetY
    badgeStyle.right = badgeOffsetX
  }

  const coverSrc = safeSettings.coverImage

  // Bleed horizontal para cover
  const horizontalBleed = 16

  return (
    <div
      style={{
        position: 'relative',
        width: `calc(100% + ${horizontalBleed * 2}px)`,
        left: `-${horizontalBleed}px`,
        height,
        background: headerBgEnabled ? headerBgColor : bgCss,
        overflow: 'hidden',
        marginLeft: 0,
        marginRight: 0,
      }}
    >
      {showCover && coverSrc ? (
        coverMode === 'full' ? (
          <div style={{ position: 'absolute', inset: 0 }}>
            <Image src={coverSrc} alt="Cover" fill style={{ objectFit: 'cover' }} />
          </div>
        ) : coverMode === 'auto' ? (
          <div style={{ position: 'absolute', inset: 0 }}>
            <Image
              src={coverSrc}
              alt="Cover blur"
              fill
              style={{
                objectFit: 'cover',
                filter: 'blur(18px)',
                transform: 'scale(1.08)',
                opacity: 0.9,
              }}
            />
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 14 }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  maxWidth: 420,
                  borderRadius: 18,
                  overflow: 'hidden',
                }}
              >
                <Image src={coverSrc} alt="Cover" fill style={{ objectFit: 'contain' }} />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ position: 'absolute', inset: 0, padding: tilePadding }}>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                borderRadius: tileRadius,
                overflow: 'hidden',
              }}
            >
              <Image src={coverSrc} alt="Cover" fill style={{ objectFit: 'cover' }} />
            </div>
          </div>
        )
      ) : null}

      {overlayEnabled ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 10,
            background: overlayGradient
              ? `linear-gradient(to bottom, rgba(0,0,0,0) 0%, ${overlayColor} 100%)`
              : overlayColor,
            opacity: overlayOpacity,
          }}
        />
      ) : null}

      {coverFadeEnabled ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: coverFadeHeightPx,
            pointerEvents: 'none',
            zIndex: 12,
            background: `linear-gradient(to bottom, rgba(0,0,0,0), ${fadeTarget})`,
            opacity: coverFadeStrength / 100,
          }}
        />
      ) : null}

      {badgeEnabled ? (
        <div style={badgeStyle}>
          <Image
            src={safeSettings.badgeImage!}
            alt="Badge"
            width={badgeSizePx}
            height={badgeSizePx}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
      ) : null}
    </div>
  )
}
