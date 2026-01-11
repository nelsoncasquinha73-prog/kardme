'use client'

import { useEffect, useRef, useState } from 'react'
import { useColorPicker } from './ColorPickerContext'

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

function stop(e: any) {
  e.preventDefault?.()
  e.stopPropagation?.()
}

export default function EyedropperOverlay() {
  const { picker, closePicker } = useColorPicker()

  const overlayRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [hex, setHex] = useState('#FFFFFF')

  useEffect(() => {
    if (!picker.active) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    // capturar o viewport inteiro
    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = width
    canvas.height = height

    // desenhar o DOM no canvas via drawWindow (fallback simples)
    ctx.clearRect(0, 0, width, height)
  }, [picker.active])

  if (!picker.active) return null

  function getColorAt(x: number, y: number) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null

    const pixel = ctx.getImageData(x, y, 1, 1).data
    return rgbToHex(pixel[0], pixel[1], pixel[2])
  }

  function onMove(e: React.MouseEvent) {
    stop(e)

    const x = e.clientX
    const y = e.clientY
    setPos({ x, y })

    const c = getColorAt(x, y)
    if (c) setHex(c)
  }

  function onPick(e: any) {
    stop(e)
    picker.onPick?.(hex)
    closePicker()
  }

  return (
    <>
      {/* OVERLAY */}
      <div
        ref={overlayRef}
        data-no-block-select="1"
        onPointerDown={stop}
        onMouseDown={stop}
        onMouseMove={onMove}
        onClick={onPick}
        style={{
          position: 'fixed',
          inset: 0,
          cursor: 'crosshair',
          zIndex: 9999,
          background: 'transparent',
        }}
      />

      {/* LUPA */}
      {pos && (
        <div
          data-no-block-select="1"
          style={{
            position: 'fixed',
            left: pos.x + 14,
            top: pos.y + 14,
            width: 48,
            height: 48,
            borderRadius: 12,
            background: hex,
            border: '2px solid white',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        />
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  )
}
