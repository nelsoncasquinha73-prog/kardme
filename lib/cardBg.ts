export type LegacyCardBg =
  | { mode: 'solid'; color: string; opacity?: number }
  | { mode: 'gradient'; from: string; to: string; angle?: number; opacity?: number }

// v1 preparado para stops/patterns (mantém compatibilidade com legacy)
export type ColorStop = { color: string; pos?: number } // 0..100

export type PatternKind = 'dots' | 'grid' | 'lines' | 'diagonal' | 'silk' | 'noise' | 'marble'

export type PatternOverlay = {
  kind: PatternKind
  opacity: number // 0..1
  scale?: number
  density?: number // 0..1
  angle?: number
  softness?: number // 0..1
  blendMode?: React.CSSProperties['backgroundBlendMode']
  colorA?: string
  colorB?: string
}

export type CardBgV1 = {
  version: 1
  opacity?: number // 0..1 (apenas do fundo)
  base:
    | { kind: 'solid'; color: string }
    | { kind: 'gradient'; angle?: number; stops: ColorStop[] }
  overlays?: PatternOverlay[]
}

// Tipo público: aceita legacy + v1
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

  // gradient legacy
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
