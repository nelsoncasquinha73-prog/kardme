'use client'

import React from 'react'

const BASE_COLORS = [
  '#0B1220',
  '#111827',
  '#374151',
  '#6B7280',
  '#9CA3AF',
  '#FFFFFF',
  '#2563EB',
  '#22C55E',
  '#F59E0B',
  '#EF4444',
  '#A855F7',
]

function stop(e: any) {
  e.preventDefault?.()
  e.stopPropagation?.()
}

type Props = {
  value: string
  onChange: (hex: string) => void
  onEyedropper: () => void
  colors?: string[]
  size?: number
}

export default function SwatchRow({
  value,
  onChange,
  onEyedropper,
  colors = BASE_COLORS,
  size = 16,
}: Props) {
  return (
    <div
      className="flex items-center gap-1"
      style={{
        position: 'relative',
        overflowX: 'auto',
        overflowY: 'hidden',
        paddingBottom: 2,
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          data-no-block-select="1"
          onPointerDown={stop}
          onMouseDown={stop}
          onClick={(e) => {
            stop(e)
            onChange(c)
          }}
          style={{
            width: size,
            height: size,
            borderRadius: 6,
            background: c,
            border: c === value ? '2px solid black' : '1px solid rgba(0,0,0,0.2)',
            flex: '0 0 auto',
          }}
          title={c}
        />
      ))}

      <button
        type="button"
        data-no-block-select="1"
        onPointerDown={stop}
        onMouseDown={stop}
        onClick={(e) => {
          stop(e)
          onEyedropper()
        }}
        title="Escolher do preview"
        style={{
          marginLeft: 6,
          fontSize: 13,
          cursor: 'crosshair',
          position: 'relative',
          zIndex: 3,
          flex: '0 0 auto',
        }}
      >
        🖊️
      </button>
    </div>
  )
}
