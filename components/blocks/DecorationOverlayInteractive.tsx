'use client'

import React, { useRef, useState } from 'react'
import type { DecorationItem } from './DecorationBlock'

type Props = {
  settings: {
    decorations?: DecorationItem[]
  }
  activeDecoId: string | null
  onSelectDeco: (id: string | null) => void
  onPatchDeco: (id: string, patch: Partial<DecorationItem>) => void
  style?: React.CSSProperties
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function pctToPx(pct: number, total: number) {
  return (pct / 100) * total
}

function toPct(px: number, total: number) {
  if (!total || total <= 0) return 0
  return (px / total) * 100
}

export default function DecorationOverlayInteractive({
  settings,
  activeDecoId,
  onSelectDeco,
  onPatchDeco,
  style,
}: Props) {
  const decorations = (settings?.decorations ?? []).filter((d) => d.enabled && d.src && d.src.trim() !== '')

  const containerRef = useRef<HTMLDivElement | null>(null)
  const gestureRef = useRef<{
    mode: 'drag' | 'resize' | 'rotate' | null
    id: string | null
    startClientX: number
    startClientY: number
    startX: number
    startY: number
    startW: number
    startH: number
    startRot: number
    centerPxX: number
    centerPxY: number
    rectW: number
    rectH: number
  } | null>(null)

  function getContainerRect() {
    const el = containerRef.current
    if (!el) return null
    return el.getBoundingClientRect()
  }

  function onPointerDownDecoration(e: React.PointerEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    onSelectDeco(id)

    const rect = getContainerRect()
    const item = decorations.find((d) => d.id === id)
    if (!rect || !item) return

    gestureRef.current = {
      mode: 'drag',
      id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: item.x,
      startY: item.y,
      startW: item.width,
      startH: item.height,
      startRot: item.rotation,
      centerPxX: pctToPx(item.x, rect.width),
      centerPxY: pctToPx(item.y, rect.height),
      rectW: rect.width,
      rectH: rect.height,
    }
  }

  function onPointerDownResize(e: React.PointerEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    onSelectDeco(id)

    const rect = getContainerRect()
    const item = decorations.find((d) => d.id === id)
    if (!rect || !item) return

    gestureRef.current = {
      mode: 'resize',
      id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: item.x,
      startY: item.y,
      startW: item.width,
      startH: item.height,
      startRot: item.rotation,
      centerPxX: pctToPx(item.x, rect.width),
      centerPxY: pctToPx(item.y, rect.height),
      rectW: rect.width,
      rectH: rect.height,
    }
  }

  function onPointerDownRotate(e: React.PointerEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    onSelectDeco(id)

    const rect = getContainerRect()
    const item = decorations.find((d) => d.id === id)
    if (!rect || !item) return

    const centerPxX = pctToPx(item.x, rect.width)
    const centerPxY = pctToPx(item.y, rect.height)

    gestureRef.current = {
      mode: 'rotate',
      id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: item.x,
      startY: item.y,
      startW: item.width,
      startH: item.height,
      startRot: item.rotation,
      centerPxX,
      centerPxY,
      rectW: rect.width,
      rectH: rect.height,
    }
  }

  function onPointerMoveContainer(e: React.PointerEvent) {
    const g = gestureRef.current
    if (!g || !g.mode || !g.id) return

    const rect = getContainerRect()
    if (!rect) return

    const dx = e.clientX - g.startClientX
    const dy = e.clientY - g.startClientY

    if (g.mode === 'drag') {
      const nextX = clamp(Math.round(g.startX + toPct(dx, rect.width)), 0, 100)
      const nextY = clamp(Math.round(g.startY + toPct(dy, rect.height)), 0, 100)
      onPatchDeco(g.id, { x: nextX, y: nextY })
      return
    }

    if (g.mode === 'resize') {
      const nextW = clamp(Math.round(g.startW + dx), 10, 2000)
      const nextH = clamp(Math.round(g.startH + dy), 10, 2000)
      onPatchDeco(g.id, { width: nextW, height: nextH })
      return
    }

    if (g.mode === 'rotate') {
      const cx = rect.left + g.centerPxX
      const cy = rect.top + g.centerPxY
      const a0 = Math.atan2(g.startClientY - cy, g.startClientX - cx)
      const a1 = Math.atan2(e.clientY - cy, e.clientX - cx)
      const delta = ((a1 - a0) * 180) / Math.PI
      const nextRot = Math.round(g.startRot + delta)
      onPatchDeco(g.id, { rotation: nextRot })
      return
    }
  }

  function onPointerUpContainer() {
    gestureRef.current = null
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={onPointerMoveContainer}
      onPointerUp={onPointerUpContainer}
      onPointerCancel={onPointerUpContainer}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'auto',
        userSelect: 'none',
        touchAction: 'none',
        ...style,
      }}
    >
      {decorations
        .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
        .map((d) => {
          const selected = d.id === activeDecoId
          return (
            <div
              key={d.id}
              onPointerDown={(e) => onPointerDownDecoration(e, d.id)}
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
                cursor: 'grab',
                touchAction: 'none',
                border: selected ? '2px solid var(--color-primary)' : undefined,
                borderRadius: selected ? 14 : undefined,
                boxShadow: selected ? '0 0 12px rgba(0,0,0,0.3)' : undefined,
              }}
            >
              <img
                src={d.src}
                alt={d.alt || 'Decoration'}
                draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
              />

              {selected && (
                <>
                  <div
                    onPointerDown={(e) => onPointerDownRotate(e, d.id)}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: -18,
                      transform: 'translateX(-50%)',
                      width: 14,
                      height: 14,
                      borderRadius: 999,
                      background: 'var(--color-primary)',
                      border: '2px solid #fff',
                      boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
                      cursor: 'grab',
                      pointerEvents: 'auto',
                    }}
                    title="Rodar"
                  />
                  <div
                    onPointerDown={(e) => onPointerDownResize(e, d.id)}
                    style={{
                      position: 'absolute',
                      right: -10,
                      bottom: -10,
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      background: 'var(--color-primary)',
                      border: '2px solid #fff',
                      boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
                      cursor: 'nwse-resize',
                      pointerEvents: 'auto',
                    }}
                    title="Redimensionar"
                  />
                </>
              )}
            </div>
          )
        })}
    </div>
  )
}
