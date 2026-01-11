'use client'

import {
  createContext,
  useContext,
  useMemo,
} from 'react'
import { getTheme } from '@/lib/getTheme'

/* ───────────── TYPES ───────────── */

export type ResolvedTheme = ReturnType<typeof getTheme>

type ThemeContextValue = {
  theme: ResolvedTheme
}

/* ───────────── CONTEXT ───────────── */

const ThemeContext =
  createContext<ThemeContextValue | null>(null)

/* ───────────── PROVIDER ───────────── */

export function ThemeProvider({
  theme,
  children,
}: {
  theme?: Partial<ResolvedTheme>
  children: React.ReactNode
}) {
  const resolvedTheme = useMemo(
    () => getTheme(theme),
    [theme]
  )

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme }}>
      <div
        style={
          {
            /* 🎨 CSS VARIABLES — FONTE ÚNICA DE VERDADE */
            '--color-background': resolvedTheme.background,
            '--color-surface': resolvedTheme.surface,
            '--color-text': resolvedTheme.text,
            '--color-primary': resolvedTheme.primary,
            '--color-muted': resolvedTheme.mutedText,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

/* ───────────── HOOK ───────────── */

export function useTheme() {
  const ctx = useContext(ThemeContext)

  if (!ctx) {
    throw new Error(
      'useTheme must be used inside ThemeProvider'
    )
  }

  return ctx.theme
}
