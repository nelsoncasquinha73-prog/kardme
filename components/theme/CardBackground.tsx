'use client'

import React from 'react'
import type { CardBg } from '@/lib/cardBg'
import { bgToStyle } from '@/lib/bgToCss'

type Props = {
  bg?: CardBg | null
  borderRadius?: number | string
  className?: string
  children?: React.ReactNode
  style?: React.CSSProperties
}

/**
 * Kardme Premium Background:
 * - O slider (opacity) passa a ser "intensidade" do fundo (não transparência)
 * - Nunca revela o fundo de trás (evita o branco acidental)
 * - Conteúdo mantém-se sempre nítido
 */
export default function CardBackground({ bg, borderRadius, className, children, style }: Props) {
  const { style: bgStyle, opacity: intensity, cssStringForOutside } = bgToStyle(bg)

  // intensity: 1 = normal; 0 = mais soft
  const t = Math.max(0, Math.min(1, typeof intensity === 'number' ? intensity : 1))
  const soft = 1 - t

  // filtros só no layer do fundo (nunca afeta o conteúdo)
  const sat = Math.max(0.6, 1 - 0.45 * soft)
  const con = Math.max(0.75, 1 - 0.22 * soft)
  const bri = Math.max(0.9, 1 + 0.12 * soft)

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
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius,
          ...bgStyle,
          // ✅ em vez de transparência: ajustamos “intensidade”
          filter: `saturate(${sat}) contrast(${con}) brightness(${bri})`,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', borderRadius }}>{children}</div>
    </div>
  )
}
