'use client'

import React from 'react'

type Props = {
  children: React.ReactNode
  padding?: number | string
}

export default function CardContainer({
  children,
  padding = '20px',
}: Props) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: 20,
        padding,
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        transition:
          'transform 0.25s ease, box-shadow 0.25s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform =
          'translateY(-2px)'
        e.currentTarget.style.boxShadow =
          '0 12px 30px rgba(0,0,0,0.08)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow =
          '0 8px 24px rgba(0,0,0,0.06)'
      }}
    >
      {children}
    </div>
  )
}
