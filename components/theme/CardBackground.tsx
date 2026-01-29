'use client'

import React from 'react'
import { bgToStyle } from '@/lib/bgToCss'
import { migrateCardBg, type CardBgV1, type ImageBase } from '@/lib/cardBg'

type Props = {
  bg?: CardBgV1 | null
  borderRadius?: number | string
  className?: string
  children?: React.ReactNode
  style?: React.CSSProperties
}

type Overlay = {
  kind?: 'dots' | 'noise' | 'diagonal' | 'grid' | 'silk' | 'marble'
  opacity?: number
  density?: number
  scale?: number
  softness?: number
  angle?: number
  blendMode?: 'soft-light' | 'overlay' | 'multiply' | 'screen' | 'normal'
  colorA?: string
  colorB?: string
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function svgNoiseDataUri(opts: { baseFrequency: number; seed: number; colorA: string; colorB: string }) {
  const { baseFrequency, seed, colorA, colorB } = opts
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
  <filter id="n">
    <feTurbulence type="fractalNoise" baseFrequency="${baseFrequency}" numOctaves="3" seed="${seed}" />
    <feColorMatrix type="matrix" values="
      1 0 0 0 0
      0 1 0 0 0
      0 0 1 0 0
      0 0 0 1 0" />
  </filter>
  <rect width="320" height="320" filter="url(#n)" opacity="1"/>
  <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${colorA}"/>
    <stop offset="1" stop-color="${colorB}"/>
  </linearGradient>
  <rect width="320" height="320" fill="url(#g)" opacity="0.85"/>
</svg>`.trim()

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

function overlayToCss(ov: Overlay): React.CSSProperties {
  const kind = ov.kind ?? 'dots'
  const density = clamp(typeof ov.density === 'number' ? ov.density : 0.6, 0.05, 1)
  const scale = clamp(typeof ov.scale === 'number' ? ov.scale : 1, 0.5, 2)
  const softness = clamp(typeof ov.softness === 'number' ? ov.softness : 0.5, 0, 1)
  const angle = typeof ov.angle === 'number' ? ov.angle : 45
  const opacity = clamp(typeof ov.opacity === 'number' ? ov.opacity : 0.25, 0, 1)
  const blendMode = ov.blendMode ?? 'soft-light'
  const colorA = ov.colorA ?? '#ffffff'
  const colorB = ov.colorB ?? '#000000'

  const baseSize = clamp(140 - density * 110, 18, 140) / scale
  const blurPx = softness * 1.2

  let backgroundImage: string | undefined
  let backgroundSize: string | undefined
  let backgroundRepeat: string | undefined

  if (kind === 'dots') {
    backgroundImage = `radial-gradient(circle, ${colorA} 0, ${colorA} 1.2px, transparent 1.8px)`
    backgroundSize = `${baseSize}px ${baseSize}px`
    backgroundRepeat = 'repeat'
  } else if (kind === 'diagonal') {
    backgroundImage = `repeating-linear-gradient(${angle}deg, ${colorA} 0, ${colorA} 2px, transparent 2px, transparent ${baseSize}px)`
    backgroundSize = undefined
    backgroundRepeat = 'repeat'
  } else if (kind === 'grid') {
    backgroundImage = `
      linear-gradient(${colorA} 1px, transparent 1px),
      linear-gradient(90deg, ${colorA} 1px, transparent 1px)
    `
    backgroundSize = `${baseSize}px ${baseSize}px`
    backgroundRepeat = 'repeat'
  } else if (kind === 'noise') {
    backgroundImage = svgNoiseDataUri({ baseFrequency: 0.9 / baseSize, seed: 7, colorA, colorB })
    backgroundSize = `320px 320px`
    backgroundRepeat = 'repeat'
  } else if (kind === 'silk') {
    backgroundImage = svgNoiseDataUri({ baseFrequency: 0.35 / baseSize, seed: 11, colorA, colorB })
    backgroundSize = `360px 360px`
    backgroundRepeat = 'repeat'
  } else if (kind === 'marble') {
    backgroundImage = svgNoiseDataUri({ baseFrequency: 0.22 / baseSize, seed: 19, colorA, colorB })
    backgroundSize = `420px 420px`
    backgroundRepeat = 'repeat'
  }

  return {
    position: 'absolute',
    inset: 0,
    backgroundImage,
    backgroundSize,
    backgroundRepeat,
    opacity,
    pointerEvents: 'none',
    mixBlendMode: blendMode === 'normal' ? 'normal' : (blendMode as any),
    filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
  }
}

// ✅ NOVO: Renderiza o layer de imagem de fundo
function ImageBackgroundLayer({ image, borderRadius }: { image: ImageBase; borderRadius?: number | string }) {
  const fit = image.fit ?? 'cover'
  const position = image.position ?? 'center'
  const zoom = typeof image.zoom === 'number' ? image.zoom : 1
  const offsetX = typeof image.offsetX === 'number' ? image.offsetX : 0
  const offsetY = typeof image.offsetY === 'number' ? image.offsetY : 0
  const blur = typeof image.blur === 'number' ? image.blur : 0

  // Mapear position para CSS
  const positionMap: Record<string, string> = {
    'center': 'center center',
    'top': 'center top',
    'bottom': 'center bottom',
    'left': 'left center',
    'right': 'right center',
    'top-left': 'left top',
    'top-right': 'right top',
    'bottom-left': 'left bottom',
    'bottom-right': 'right bottom',
  }

  const bgPosition = positionMap[position] ?? 'center center'

  // ✅ Calcular backgroundSize baseado no fit e zoom
  let backgroundSize: string
  let backgroundRepeat: string = 'no-repeat'
  let backgroundAttachment: string = 'scroll'

  if (fit === 'tile') {
    backgroundSize = 'auto'
    backgroundRepeat = 'repeat'
  } else if (fit === 'fixed') {
    backgroundSize = "cover"
    backgroundAttachment = 'fixed'
  } else if (fit === 'top-fade') {
    backgroundSize = "cover"
  } else {
    // cover - mas agora controlado pelo zoom
    // zoom 1 = 100% da largura, zoom 0.5 = 50%, etc.
    backgroundSize = "cover"
  }

  // Estilos base
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url(${image.url})`,
    backgroundPosition: `calc(50% + ${offsetX}px) calc(50% + ${offsetY}px)`,
    backgroundRepeat,
    backgroundSize,
    backgroundAttachment,
    filter: blur > 0 ? `blur(${blur}px)` : undefined,
    pointerEvents: 'none',
    borderRadius,
    overflow: 'hidden',
  }

  // Para top-fade, precisamos de um container extra
  if (fit === 'top-fade') {
    const fadeHeight = typeof image.fadeHeight === 'number' ? image.fadeHeight : 300
    const fadeToColor = image.fadeToColor ?? '#000000'

    return (
      <>
        {/* Imagem no topo */}
        <div aria-hidden style={baseStyle} />
        {/* Gradiente fade para cor */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to bottom, transparent 0%, transparent ${fadeHeight - 100}px, ${fadeToColor} ${fadeHeight}px, ${fadeToColor} 100%)`,
            pointerEvents: 'none',
            borderRadius,
          }}
        />
      </>
    )
  }

  return <div aria-hidden style={baseStyle} />
}


// ✅ NOVO: Renderiza o overlay da imagem (escurecer/clarear)
function ImageOverlayLayer({
  overlay,
  borderRadius,
}: {
  overlay: {
    enabled?: boolean
    color?: string
    opacity?: number
    gradient?: boolean
    gradientDirection?: 'to-bottom' | 'to-top' | 'radial'
  }
  borderRadius?: number | string
}) {
  if (!overlay?.enabled) return null

  const color = overlay.color ?? '#000000'
  const opacity = clamp(typeof overlay.opacity === 'number' ? overlay.opacity : 0.5, 0, 1)
  const gradient = overlay.gradient ?? false
  const direction = overlay.gradientDirection ?? 'to-bottom'

  let background: string

  if (gradient) {
    if (direction === 'radial') {
      background = `radial-gradient(circle at center, transparent 0%, ${color} 100%)`
    } else if (direction === 'to-top') {
      background = `linear-gradient(to top, transparent 0%, ${color} 100%)`
    } else {
      background = `linear-gradient(to bottom, transparent 0%, ${color} 100%)`
    }
  } else {
    background = color
  }

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        background,
        opacity,
        pointerEvents: 'none',
        borderRadius,
      }}
    />
  )
}

export default function CardBackground({ bg, borderRadius, className, children, style }: Props) {
  const v1 = migrateCardBg(bg)
  const result = bgToStyle(v1)

  // ✅ NOVO: Se for imagem, renderiza layers de imagem
  if (result.isImage && result.image) {
    const overlays = (v1.overlays ?? []) as Overlay[]
    const patternOverlay = overlays?.[0] ?? null
    const patternStyle = patternOverlay ? overlayToCss(patternOverlay) : null

    return (
      <div
        className={className}
        style={{
          position: 'relative',
          '--card-bg': result.image.fadeToColor ?? '#000000',
          ...style,
        } as React.CSSProperties}
      >
        {/* Layer 1: Imagem de fundo */}
        <ImageBackgroundLayer image={result.image} borderRadius={borderRadius} />

        {/* Layer 2: Overlay (escurecer/clarear) */}
        <ImageOverlayLayer overlay={result.imageOverlay ?? {}} borderRadius={borderRadius} />

        {/* Layer 3: Patterns (dots, grid, etc.) */}
        {patternStyle ? (
          <div
            aria-hidden
            style={{
              ...patternStyle,
              borderRadius,
            }}
          />
        ) : null}

        {/* Layer 4: Conteúdo */}
        <div style={{ position: 'relative', borderRadius }}>{children}</div>
      </div>
    )
  }

  // Renderização normal (cor/gradiente)
  const { style: bgStyle, opacity: intensity } = result

  const t = Math.max(0, Math.min(1, typeof intensity === 'number' ? intensity : 1))
  const soft = 1 - t

  const sat = Math.max(0.6, 1 - 0.45 * soft)
  const con = Math.max(0.75, 1 - 0.22 * soft)
  const bri = Math.max(0.9, 1 + 0.12 * soft)

  const overlays = (v1.overlays ?? []) as Overlay[]
  const ov = overlays?.[0] ?? null
  const overlayStyle = ov ? overlayToCss(ov) : null

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        '--card-bg': result.cssStringForOutside ?? 'transparent',
        ...style,
      } as React.CSSProperties}
    >
      {/* Base background */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius,
          ...bgStyle,
          filter: `saturate(${sat}) contrast(${con}) brightness(${bri})`,
          pointerEvents: 'none',
        }}
      />

      {/* Overlay / patterns */}
      {overlayStyle ? (
        <div
          aria-hidden
          style={{
            ...overlayStyle,
            borderRadius,
          }}
        />
      ) : null}

      {/* Content */}
      <div style={{ position: 'relative', borderRadius }}>{children}</div>
    </div>
  )
}
