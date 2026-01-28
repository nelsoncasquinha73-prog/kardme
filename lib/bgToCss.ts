import type React from 'react'
import type { CardBg, CardBgV1, PatternOverlay, ImageBase } from '@/lib/cardBg'
import { migrateCardBg } from '@/lib/cardBg'

function clamp(n: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n))
}

function normalizeStops(stops: { color: string; pos?: number }[]) {
  if (!stops?.length) return []
  const hasPos = stops.some((s) => typeof s.pos === 'number')
  if (hasPos) return stops.map((s) => ({ ...s, pos: typeof s.pos === 'number' ? s.pos : 0 }))
  const step = 100 / Math.max(1, stops.length - 1)
  return stops.map((s, i) => ({ ...s, pos: i * step }))
}

function stopsToCss(stops: { color: string; pos?: number }[]) {
  const ns = normalizeStops(stops)
  return ns.map((s) => `${s.color} ${Number(s.pos ?? 0).toFixed(1)}%`).join(', ')
}

function overlayToLayer(ov: PatternOverlay): { image: string; size?: string; repeat?: string } | null {
  const opacity = clamp(ov.opacity ?? 0)
  const scale = Math.max(0.2, ov.scale ?? 1)
  const density = clamp(ov.density ?? 0.5)
  const softness = clamp(ov.softness ?? 0.5)
  const angle = ov.angle ?? 0

  const inkA = ov.colorA ?? `rgba(255,255,255,${0.9 * opacity})`
  const inkB = ov.colorB ?? `rgba(0,0,0,${0.35 * opacity})`

  switch (ov.kind) {
    case 'dots': {
      const gap = (12 + (1 - density) * 20) * scale
      const dot = (1 + (1 - density) * 2) * scale
      return {
        image: `radial-gradient(circle, ${inkA} ${dot}px, rgba(255,255,255,0) ${dot + 0.8}px)`,
        size: `${gap}px ${gap}px`,
        repeat: 'repeat',
      }
    }

    case 'grid': {
      const cell = (18 + (1 - density) * 24) * scale
      const line = 1 * scale
      return {
        image: `linear-gradient(${inkA} ${line}px, rgba(255,255,255,0) ${line}px),
               linear-gradient(90deg, ${inkA} ${line}px, rgba(255,255,255,0) ${line}px)`,
        size: `${cell}px ${cell}px`,
        repeat: 'repeat',
      }
    }

    case 'diagonal': {
      const thickness = (1 + softness * 1.2) * scale
      const spacing = (12 + (1 - density) * 26) * scale
      return {
        image: `repeating-linear-gradient(${angle || 45}deg,
          ${inkA} 0px,
          ${inkA} ${thickness}px,
          rgba(255,255,255,0) ${thickness}px,
          rgba(255,255,255,0) ${spacing}px)`,
        repeat: 'repeat',
      }
    }

    case 'silk': {
      const a = angle || 20
      const thickness = (0.8 + softness * 1.6) * scale
      const spacing = (10 + (1 - density) * 30) * scale
      return {
        image: `repeating-linear-gradient(${a}deg,
                  rgba(255,255,255,${0.20 * opacity}) 0px,
                  rgba(255,255,255,${0.20 * opacity}) ${thickness}px,
                  rgba(255,255,255,0) ${thickness}px,
                  rgba(255,255,255,0) ${spacing}px),
                repeating-linear-gradient(${a + 12}deg,
                  rgba(0,0,0,${0.12 * opacity}) 0px,
                  rgba(0,0,0,${0.12 * opacity}) ${thickness}px,
                  rgba(0,0,0,0) ${thickness}px,
                  rgba(0,0,0,0) ${spacing * 1.2}px)`,
        repeat: 'repeat',
      }
    }

    case 'noise': {
      const n = 140 * scale
      return {
        image: `radial-gradient(circle at 20% 30%, rgba(255,255,255,${0.10 * opacity}) 0 1px, rgba(255,255,255,0) 2px),
               radial-gradient(circle at 80% 40%, rgba(0,0,0,${0.10 * opacity}) 0 1px, rgba(0,0,0,0) 2px),
               radial-gradient(circle at 40% 80%, rgba(255,255,255,${0.08 * opacity}) 0 1px, rgba(255,255,255,0) 2px)`,
        size: `${n}px ${n}px`,
        repeat: 'repeat',
      }
    }

    case 'marble': {
      return {
        image: `radial-gradient(circle at 15% 25%, rgba(255,255,255,${0.22 * opacity}) 0%, rgba(255,255,255,0) 55%),
               radial-gradient(circle at 70% 30%, rgba(0,0,0,${0.18 * opacity}) 0%, rgba(0,0,0,0) 60%),
               radial-gradient(circle at 50% 85%, rgba(255,255,255,${0.16 * opacity}) 0%, rgba(255,255,255,0) 62%),
               linear-gradient(${angle || 35}deg, rgba(255,255,255,${0.06 * opacity}), rgba(0,0,0,${0.06 * opacity}))`,
        repeat: 'no-repeat',
      }
    }

    default:
      return null
  }
}

// ✅ NOVO: Tipo de retorno expandido para imagens
export type BgStyleResult = {
  style: React.CSSProperties
  opacity: number
  cssStringForOutside?: string
  // Campos específicos para imagem
  isImage?: boolean
  image?: ImageBase
  imageOverlay?: {
    enabled?: boolean
    color?: string
    opacity?: number
    gradient?: boolean
    gradientDirection?: 'to-bottom' | 'to-top' | 'radial'
  }
}

export function bgToStyle(bg: CardBg | null | undefined): BgStyleResult {
  const v1: CardBgV1 = migrateCardBg(bg)
  const opacity = clamp(typeof v1.opacity === 'number' ? v1.opacity : 1)

  // ✅ NOVO: Se for imagem, retorna dados separados
  if (v1.base.kind === 'image') {
    return {
      style: {},
      opacity,
      isImage: true,
      image: v1.base as ImageBase,
      imageOverlay: v1.imageOverlay,
      cssStringForOutside: v1.base.url,
    }
  }

  const layers: string[] = []
  const blendModes: string[] = []
  const sizes: string[] = []
  const repeats: string[] = []
  const positions: string[] = []

  if (v1.base.kind === 'gradient') {
    const angle = typeof v1.base.angle === 'number' ? v1.base.angle : 180
    layers.push(`linear-gradient(${angle}deg, ${stopsToCss(v1.base.stops)})`)
  }

  for (const ov of v1.overlays ?? []) {
    const out = overlayToLayer(ov)
    if (!out) continue
    layers.push(out.image)
    blendModes.push(ov.blendMode ?? 'soft-light')
    sizes.push(out.size ?? 'auto')
    repeats.push(out.repeat ?? 'repeat')
    positions.push('0% 0%')
  }

  const style: React.CSSProperties = {
    backgroundColor: v1.base.kind === 'solid' ? v1.base.color : undefined,
    backgroundImage: layers.length ? layers.join(', ') : undefined,
    backgroundBlendMode: blendModes.length ? (['normal', ...blendModes].join(', ') as any) : undefined,
    backgroundSize: sizes.length ? (['auto', ...sizes].join(', ') as any) : undefined,
    backgroundRepeat: repeats.length ? (['no-repeat', ...repeats].join(', ') as any) : undefined,
    backgroundPosition: positions.length ? (['0% 0%', ...positions].join(', ') as any) : undefined,
  }

  const cssStringForOutside =
    v1.base.kind === 'solid'
      ? v1.base.color
      : `linear-gradient(${(v1.base.angle ?? 180)}deg, ${stopsToCss(v1.base.stops)})`

  return { style, opacity, cssStringForOutside }
}

export function bgToCssString(bg?: CardBg | null): string | null {
  if (!bg) return null

  if ((bg as any).version === 1) {
    let base = (bg as any).base
    if (base && (base as any).base && !(base as any).kind) base = (base as any).base

    if (!base) return null

    if (base.kind === 'solid') return base.color ?? null

    if (base.kind === 'gradient') {
      const angle = typeof base.angle === 'number' ? base.angle : 180
      const stops = Array.isArray(base.stops) ? base.stops : []
      if (!stops.length) return null
      const parts = stops.map((s: any) => `${s.color} ${s.pos}%`)
      return `linear-gradient(${angle}deg, ${parts.join(', ')})`
    }

    if (base.kind === 'image') {
      return base.url ?? null
    }

    return null
  }

  const mode = (bg as any).mode
  if (mode === 'solid') return (bg as any).color ?? null
  if (mode === 'gradient') {
    const angle = typeof (bg as any).angle === 'number' ? (bg as any).angle : 180
    return `linear-gradient(${angle}deg, ${(bg as any).from}, ${(bg as any).to})`
  }

  return null
}
