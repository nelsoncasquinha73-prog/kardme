// lib/generateTheme.ts

type Theme = {
  primary: string
  bg: string
  card: string
  text: string
  muted: string
  accent: string
}

/* ───────────────────────────────
   Helpers simples de cor
─────────────────────────────── */

function clamp(value: number) {
  return Math.min(255, Math.max(0, value))
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const bigint = parseInt(clean, 16)
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  }
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    '#' +
    [r, g, b]
      .map(x => clamp(x).toString(16).padStart(2, '0'))
      .join('')
  )
}

function darken(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(
    r * (1 - amount),
    g * (1 - amount),
    b * (1 - amount)
  )
}

function lighten(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount
  )
}

/* ───────────────────────────────
   MOTOR PRINCIPAL
─────────────────────────────── */

export function generateTheme(primary: string): Theme {
  const safePrimary = primary || '#2563EB' // fallback

  return {
    primary: safePrimary,
    bg: darken(safePrimary, 0.85),       // fundo geral
    card: darken(safePrimary, 0.75),     // cards
    text: '#FFFFFF',                     // texto principal
    muted: '#9CA3AF',                    // texto secundário
    accent: lighten(safePrimary, 0.25),  // destaque suave
  }
}
