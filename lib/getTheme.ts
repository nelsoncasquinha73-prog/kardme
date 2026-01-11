// lib/getTheme.ts

import { generateTheme } from './generateTheme'

/* ───────────── TYPES ───────────── */

export type Theme = {
  primary: string
  accent: string
  background: string
  surface: string
  text: string
  mutedText: string
}

/* ───────────── DEFAULTS ───────────── */

const DEFAULT_PRIMARY = '#2563EB' // Azul Kardme (seguro e neutro)

/**
 * Fonte única de verdade para temas.
 * Nunca devolve valores undefined.
 */
export function getTheme(
  theme?: Partial<Theme> | null
): Theme {
  // 🎯 A cor base é SEMPRE a primary (ou default)
  const basePrimary =
    theme?.primary ?? DEFAULT_PRIMARY

  // 🎨 Geração automática a partir da base
  const auto = generateTheme(basePrimary)

  return {
    primary: theme?.primary ?? auto.primary,
    accent: theme?.accent ?? auto.accent,
    background:
      theme?.background ?? auto.background,
    surface: theme?.surface ?? auto.surface,
    text: theme?.text ?? auto.text,
    mutedText:
      theme?.mutedText ?? auto.mutedText,
  }
}
