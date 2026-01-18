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

  return (
    <div
      style={{
        background: isFlat ? 'transparent' : 'var(--color-surface)',
        borderRadius: isFlat ? 0 : 20,
        padding: isFlat ? 0 : padding,
        boxShadow: isFlat ? 'none' : '0 8px 24px rgba(0,0,0,0.06)',
        transition: hover ? 'transform 0.25s ease, box-shadow 0.25s ease' : undefined,
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
