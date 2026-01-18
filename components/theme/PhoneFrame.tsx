'use client'

import React from 'react'

type Props = {
  children: React.ReactNode
  style?: React.CSSProperties
}

export default function PhoneFrame({ children, style }: Props) {
  // Dimensões e estilo do telemóvel (igual ao mockup editor)
  const phoneW = 420
  const phoneH = 880
  const phoneRadius = 56

  const frameBorder = 10
  const bezel = 16
  const phonePadding = frameBorder + bezel

  return (
    <div
      style={{
        width: phoneW,
        height: phoneH,
        borderRadius: phoneRadius,
        background: '#0b0f19',
        border: `${frameBorder}px solid rgba(255,255,255,0.10)`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.10)',
        position: 'relative',
        padding: phonePadding,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* Brilho lateral */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: phoneRadius,
          pointerEvents: 'none',
          background:
            'linear-gradient(120deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 35%, rgba(255,255,255,0.00) 60%)',
          mixBlendMode: 'overlay',
          opacity: 0.55,
        }}
      />

      {/* Top bezel */}
      <div
        style={{
          position: 'absolute',
          top: frameBorder + 6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 140,
          height: 3,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.10)',
          pointerEvents: 'none',
        }}
      />

      {/* Bottom bezel */}
      <div
        style={{
          position: 'absolute',
          bottom: frameBorder + 8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 120,
          height: 2,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.08)',
          pointerEvents: 'none',
        }}
      />

      {/* Conteúdo (screen) */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: phoneRadius - phonePadding,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  )
}
