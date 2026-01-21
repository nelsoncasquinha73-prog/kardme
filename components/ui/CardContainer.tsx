'use client'

import React from 'react'

type Props = {
  children: React.ReactNode
  padding?: number | string
  variant?: 'card' | 'flat'
  hover?: boolean
}

export default function CardContainer({
  children,
  padding = '20px',
  variant = 'card',
  hover = true,
}: Props) {
  const isFlat = variant === 'flat'

  // “Glass” por cima do background do cartão
  const glassBg = 'rgba(255,255,255,0.72)' // ajusta para 0.60–0.85 conforme gostares

  return (
    <div
      style={{
        background: isFlat ? 'transparent' : glassBg,
        borderRadius: isFlat ? 0 : 20,
        padding: isFlat ? 0 : padding,
        boxShadow: isFlat ? 'none' : '0 8px 24px rgba(0,0,0,0.06)',
        transition: hover ? 'transform 0.25s ease, box-shadow 0.25s ease' : undefined,

        // ✅ deixa ver os patterns e dá look “premium”
        backdropFilter: isFlat ? undefined : 'blur(10px) saturate(1.05)',
        WebkitBackdropFilter: isFlat ? undefined : 'blur(10px) saturate(1.05)',
        border: isFlat ? undefined : '1px solid rgba(255,255,255,0.35)',
      }}
      onMouseEnter={(e) => {
        if (!hover || isFlat) return
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.08)'
      }}
      onMouseLeave={(e) => {
        if (!hover || isFlat) return
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'
      }}
    >
      {children}
    </div>
  )
}
