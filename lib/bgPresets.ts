import type { CardBgV1 } from '@/lib/cardBg'

export type CardBgPreset = {
  id: string
  name: string
  bg: CardBgV1
}

export const CARD_BG_PRESETS: CardBgPreset[] = [
  {
    id: 'gold-silk',
    name: 'Gold Silk',
    bg: {
      version: 1,
      opacity: 1,
      base: {
        kind: 'gradient',
        angle: 135,
        stops: [
          { color: '#0B0A07', pos: 0 },
          { color: '#3D2E12', pos: 22 },
          { color: '#D8B45A', pos: 52 },
          { color: '#5A4317', pos: 78 },
          { color: '#0E0C08', pos: 100 },
        ],
      },
      overlays: [
        { kind: 'silk', opacity: 0.42, scale: 1, density: 0.55, softness: 0.75, angle: 18, blendMode: 'soft-light' },
        { kind: 'noise', opacity: 0.18, scale: 1.1, density: 0.6, softness: 0.6, blendMode: 'overlay' },
      ],
    },
  },
  {
    id: 'silver-matte',
    name: 'Silver Matte',
    bg: {
      version: 1,
      opacity: 1,
      base: {
        kind: 'gradient',
        angle: 160,
        stops: [
          { color: '#0B0E14', pos: 0 },
          { color: '#2A313B', pos: 28 },
          { color: '#C7CBD2', pos: 55 },
          { color: '#3C4652', pos: 80 },
          { color: '#0C1017', pos: 100 },
        ],
      },
      overlays: [
        { kind: 'noise', opacity: 0.22, scale: 1.2, density: 0.7, softness: 0.6, blendMode: 'soft-light' },
      ],
    },
  },
  {
    id: 'bronze-diagonal',
    name: 'Bronze Diagonal',
    bg: {
      version: 1,
      opacity: 1,
      base: {
        kind: 'gradient',
        angle: 140,
        stops: [
          { color: '#0B0705', pos: 0 },
          { color: '#3A1F12', pos: 26 },
          { color: '#B06A3C', pos: 55 },
          { color: '#4A2A18', pos: 82 },
          { color: '#0C0806', pos: 100 },
        ],
      },
      overlays: [
        { kind: 'diagonal', opacity: 0.28, scale: 1, density: 0.55, softness: 0.65, angle: 45, blendMode: 'soft-light' },
        { kind: 'noise', opacity: 0.14, scale: 1.15, density: 0.65, softness: 0.6, blendMode: 'overlay' },
      ],
    },
  },
  {
    id: 'graphite-noise',
    name: 'Graphite Noise',
    bg: {
      version: 1,
      opacity: 1,
      base: { kind: 'solid', color: '#0B0F14' },
      overlays: [
        { kind: 'noise', opacity: 0.34, scale: 1.35, density: 0.72, softness: 0.55, blendMode: 'soft-light' },
      ],
    },
  },
  {
    id: 'black-marble',
    name: 'Black Marble',
    bg: {
      version: 1,
      opacity: 1,
      base: {
        kind: 'gradient',
        angle: 165,
        stops: [
          { color: '#05060A', pos: 0 },
          { color: '#0C111A', pos: 40 },
          { color: '#1B2430', pos: 70 },
          { color: '#070A10', pos: 100 },
        ],
      },
      overlays: [
        { kind: 'marble', opacity: 0.32, scale: 1.0, density: 0.55, softness: 0.7, angle: 30, blendMode: 'soft-light' },
        { kind: 'noise', opacity: 0.18, scale: 1.1, density: 0.65, softness: 0.55, blendMode: 'overlay' },
      ],
    },
  },
  {
    id: 'midnight-dots',
    name: 'Midnight Dots',
    bg: {
      version: 1,
      opacity: 1,
      base: {
        kind: 'gradient',
        angle: 180,
        stops: [
          { color: '#060A12', pos: 0 },
          { color: '#0C1422', pos: 55 },
          { color: '#070B14', pos: 100 },
        ],
      },
      overlays: [
        { kind: 'dots', opacity: 0.18, scale: 1.0, density: 0.65, softness: 0.6, blendMode: 'soft-light' },
      ],
    },
  },
  {
    id: 'clean-grid',
    name: 'Clean Grid',
    bg: {
      version: 1,
      opacity: 1,
      base: {
        kind: 'gradient',
        angle: 135,
        stops: [
          { color: '#0B0F16', pos: 0 },
          { color: '#121B28', pos: 45 },
          { color: '#0B0F16', pos: 100 },
        ],
      },
      overlays: [
        { kind: 'grid', opacity: 0.14, scale: 1.0, density: 0.62, softness: 0.6, blendMode: 'soft-light' },
      ],
    },
  },
  {
    id: 'soft-silver-silk',
    name: 'Soft Silver Silk',
    bg: {
      version: 1,
      opacity: 1,
      base: {
        kind: 'gradient',
        angle: 155,
        stops: [
          { color: '#0A0F16', pos: 0 },
          { color: '#2B3441', pos: 30 },
          { color: '#D7DBE0', pos: 55 },
          { color: '#374353', pos: 80 },
          { color: '#0A0F16', pos: 100 },
        ],
      },
      overlays: [
        { kind: 'silk', opacity: 0.26, scale: 1.0, density: 0.55, softness: 0.75, angle: 22, blendMode: 'soft-light' },
      ],
    },
  },
]

export function getBgPresetById(id: string) {
  return CARD_BG_PRESETS.find((p) => p.id === id) || null
}
