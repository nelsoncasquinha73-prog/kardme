'use client'

import React from 'react'
import { bgToStyle } from '@/lib/bgToCss'
import { migrateCardBg, type CardBg } from '@/lib/cardBg'
type Props = {
  bg?: CardBg | null
  borderRadius?: number | string
  className?: string
  children?: React.ReactNode
  style?: React.CSSProperties
}

// -----------------------
// Overlay helpers
// -----------------------

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

  // “tamanho” do padrão: quanto maior a density, mais compacto
  const baseSize = clamp(140 - density * 110, 18, 140) / scale
  const blurPx = softness * 1.2

  let backgroundImage: string | undefined
  let backgroundSize: string | undefined
  let backgroundRepeat: string | undefined

  if (kind === 'dots') {
    // ✅ Pontinhos uniformes (sem offset) — cobre sempre o cartão todo
    backgroundImage = `radial-gradient(circle, ${colorA} 0, ${colorA} 1.2px, transparent 1.8px)`
    backgroundSize = `${baseSize}px ${baseSize}px`
    backgroundRepeat = 'repeat'
  } else if (kind === 'diagonal') {
    // Aqui o ângulo faz sentido no próprio gradient (não no layer)
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
    // ✅ IMPORTANTE: não rodar o layer (era isto que cortava o padrão e criava a “faixa”)
    transform: undefined,
    transformOrigin: undefined,
    filter: blurPx > 0 ? `blur(${blurPx}px)` : undefined,
  }
}

/**
 * Kardme Premium Background:
 * - O slider (opacity) passa a ser "intensidade" do fundo (não transparência)
 * - Nunca revela o fundo de trás (evita o branco acidental)
 * - Conteúdo mantém-se sempre nítido
 */
export default function CardBackground({ bg, borderRadius, className, children, style }: Props) {
  const v1 = migrateCardBg(bg)
  const { style: bgStyle, opacity: intensity, cssStringForOutside } = bgToStyle(v1)

  // intensity: 1 = normal; 0 = mais soft
  const t = Math.max(0, Math.min(1, typeof intensity === 'number' ? intensity : 1))
  const soft = 1 - t

  // filtros só no layer do fundo (nunca afeta o conteúdo)
  const sat = Math.max(0.6, 1 - 0.45 * soft)
  const con = Math.max(0.75, 1 - 0.22 * soft)
  const bri = Math.max(0.9, 1 + 0.12 * soft)

  // overlays (v1)
  const overlays = (v1.overlays ?? []) as Overlay[]

  const ov = overlays?.[0] ?? null
  const overlayStyle = ov ? overlayToCss(ov) : null

  return (
    <div
      className={className}
      style={
        {
          position: 'relative',
          '--card-bg': cssStringForOutside ?? 'transparent',
          ...style,
        } as React.CSSProperties
      }
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
