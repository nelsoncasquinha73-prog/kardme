'use client'

import React from 'react'

export type DecorationItem = {
  id: string
  src: string
  alt?: string
  x: number // % (centro)
  y: number // % (centro)
  width: number // px
  height: number // px
  rotation: number // deg
  opacity: number // 0..1
  zIndex: number
  enabled: boolean
}

export type DecorationSettings = {
  decorations?: DecorationItem[]
}

type Props = {
  settings: DecorationSettings
  style?: any
}

export default function DecorationBlock({ settings, style }: Props) {
  const decorations = (settings?.decorations ?? []).filter((d) => d.enabled && d.src && d.src.trim() !== '')

  return (
    <>
      {decorations.map((d) => (
        <img
          key={d.id}
          src={d.src}
          alt={d.alt || 'Decoration'}
          draggable={false}
          style={{
            position: 'absolute',
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.width,
            height: d.height,
            transform: `translate(-50%, -50%) rotate(${d.rotation}deg)`,
            transformOrigin: 'center center',
            opacity: d.opacity,
            zIndex: d.zIndex,
            pointerEvents: 'none',
            userSelect: 'none',
            ...style,
          }}
        />
      ))}
    </>
  )
}
