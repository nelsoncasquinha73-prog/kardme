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
 * Fonte única do background do cartão:
 * - Aplica o fundo num layer absoluto (não afeta opacidade do conteúdo)
 * - Define --card-bg com uma “base” consistente (solid/gradient)
 */
export default function CardBackground({ bg, borderRadius, className, children, style }: Props) {
  const { style: bgStyle, opacity, cssStringForOutside } = bgToStyle(bg)

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
          opacity,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', borderRadius }}>{children}</div>
    </div>
  )
}
