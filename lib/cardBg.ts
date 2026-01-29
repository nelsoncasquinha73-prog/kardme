export type LegacyCardBg =
  | { mode: 'solid'; color: string; opacity?: number }
  | { mode: 'gradient'; from: string; to: string; angle?: number; opacity?: number }

export type ColorStop = { color: string; pos?: number }

export type PatternKind = 'dots' | 'grid' | 'lines' | 'diagonal' | 'silk' | 'noise' | 'marble'

export type PatternOverlay = {
  kind: PatternKind
  opacity: number
  scale?: number
  density?: number
  angle?: number
  softness?: number
  blendMode?: React.CSSProperties['backgroundBlendMode']
  colorA?: string
  colorB?: string
}

// ✅ NOVO: Overlay para imagem de fundo
export type ImageOverlay = {
  enabled?: boolean
  color?: string
  opacity?: number
  gradient?: boolean
  gradientDirection?: 'to-bottom' | 'to-top' | 'radial'
}

// ✅ NOVO: Configuração de imagem de fundo
export type ImageBase = {
  kind: 'image'
  url: string
  fit?: 'cover' | 'fixed' | 'tile' | 'top-fade'
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  zoom?: number        // 1 = 100%, 1.5 = 150%, etc.
  offsetX?: number     // px
  offsetY?: number     // px
  blur?: number        // px
  fadeToColor?: string // cor para onde faz fade (usado com fit: 'top-fade')
  fadeHeight?: number  // altura do fade em px
}

export type CardBgV1 = {
  version: 1
  opacity?: number
  base:
    | { kind: 'solid'; color: string }
    | { kind: 'gradient'; angle?: number; stops: ColorStop[] }
    | ImageBase
  imageOverlay?: ImageOverlay
  overlays?: PatternOverlay[]
  browserBarColor?: string
}

export type CardBg = LegacyCardBg | CardBgV1

export function isV1(bg: any): bg is CardBgV1 {
  return !!bg && typeof bg === 'object' && bg.version === 1
}

export function migrateCardBg(bg: CardBg | null | undefined): CardBgV1 {
  if (!bg) {
    return { version: 1, opacity: 1, base: { kind: 'solid', color: '#ffffff' }, overlays: [] }
  }

  if (isV1(bg)) {
    return {
      ...bg,
      opacity: typeof bg.opacity === 'number' ? bg.opacity : 1,
      overlays: bg.overlays ?? [],
    }
  }

  if (bg.mode === 'solid') {
    return {
      version: 1,
      opacity: typeof bg.opacity === 'number' ? bg.opacity : 1,
      base: { kind: 'solid', color: bg.color },
      overlays: [],
    }
  }

  return {
    version: 1,
    opacity: typeof bg.opacity === 'number' ? bg.opacity : 1,
    base: {
      kind: 'gradient',
      angle: typeof bg.angle === 'number' ? bg.angle : 180,
      stops: [
        { color: bg.from, pos: 0 },
        { color: bg.to, pos: 100 },
      ],
    },
    overlays: [],
  }
}
