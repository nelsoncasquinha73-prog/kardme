'use client'

import React, { useMemo } from 'react'

type ShapeType = 'circle' | 'pill' | 'roundedSquare'

type ActionType = 'none' | 'link' | 'phone' | 'whatsapp' | 'email' | 'modal'

export type ShapeCanvasItem = {
  id: string
  shapeType?: ShapeType

  xPct?: number
  yPct?: number
  wPx?: number
  hPx?: number
  rotationDeg?: number
  zIndex?: number

  bgColor?: string
  borderColor?: string
  borderWidth?: number
  shadow?: boolean

  textHtml?: string
  fontFamily?: string
  fontSizePx?: number
  lineHeight?: number
  textAlign?: 'left' | 'center' | 'right'
  vAlign?: 'top' | 'center' | 'bottom'
  paddingPx?: number
  textOffsetX?: number
  textOffsetY?: number

  actionType?: ActionType
  url?: string
  openInNewTab?: boolean
  phone?: string
  whatsappMessage?: string
  email?: string
  emailSubject?: string
  emailBody?: string
  modalId?: string
}

type ShapeCanvasSettings = {
  items?: ShapeCanvasItem[]
  selectedId?: string | null
}

type ShapeCanvasStyle = {
  canvas?: {
    heightPx?: number
    bgColor?: string
    radius?: number
    padding?: number
    borderWidth?: number
    borderColor?: string
    shadow?: boolean
    showCanvas?: boolean
  }
}

type Props = {
  cardId?: string
  settings?: ShapeCanvasSettings
  style?: ShapeCanvasStyle

  // Editor-only hooks (opcionais)
  editable?: boolean
  onSelectItem?: (id: string | null) => void
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function shapeBorderRadius(shapeType: ShapeType, radius: number) {
  if (shapeType === 'circle') return 999
  if (shapeType === 'pill') return 999
  return radius
}

export default function ShapeCanvasBlock({ settings, style, editable = false, onSelectItem }: Props) {
  const s = settings || {}
  const st = style || {}

  const canvas = st.canvas || {}
  const heightPx = canvas.heightPx ?? 880
  const showCanvas = canvas.showCanvas === true
const bgColor = showCanvas ? (canvas.bgColor ?? 'transparent') : 'transparent'
  const radius = canvas.radius ?? 18
  const padding = showCanvas ? (canvas.padding ?? 0) : 0
  const borderWidth = showCanvas ? (canvas.borderWidth ?? 0) : 0
  const borderColor = showCanvas ? (canvas.borderColor ?? 'transparent') : 'transparent'
  const shadow = showCanvas ? (canvas.shadow ?? false) : false

  const items = useMemo(() => (Array.isArray(s.items) ? s.items : []), [s.items])
  const selectedId = s.selectedId ?? null

  return (
    <div
      style={{
        width: '100%',
        height: heightPx,
        background: bgColor,
        borderRadius: radius,
        padding,
        border: `${borderWidth}px solid ${borderColor}`,
        boxShadow: shadow ? '0 10px 30px rgba(0,0,0,0.12)' : undefined,
        position: 'relative',
        overflow: 'hidden',
      }}
      onPointerDownCapture={(e) => {
        if (!editable) return
        // click no fundo deseleciona
        if (e.target === e.currentTarget) onSelectItem?.(null)
      }}
    >
      {items.length === 0 ? (
        <div style={{ fontSize: 12, opacity: 0.65 }}>Sem shapes — adiciona o primeiro no editor.</div>
      ) : null}

      {items.map((it) => {
        const shapeType = (it.shapeType ?? 'circle') as ShapeType
        const wPx = it.wPx ?? 160
        const hPx = it.hPx ?? (shapeType === 'pill' ? 64 : 160)
        const xPct = it.xPct ?? 10
        const yPct = it.yPct ?? 10
        const rotationDeg = it.rotationDeg ?? 0
        const zIndex = it.zIndex ?? 1

        const bg = it.bgColor ?? '#ffffff'
        const bw = it.borderWidth ?? 1
        const bc = it.borderColor ?? 'rgba(0,0,0,0.10)'
        const sh = it.shadow ?? true

        const isSelected = editable && selectedId === it.id

        // posição em % (relativa ao canvas)
        const left = `${clamp(xPct, 0, 100)}%`
        const top = `${clamp(yPct, 0, 100)}%`

        return (
          <div
            key={it.id}
            data-shape-id={it.id}
            style={{
              position: 'absolute',
              left,
              top,
              width: wPx,
              height: hPx,
              transform: `translate(-0%, -0%) rotate(${rotationDeg}deg)`,
              zIndex,
              background: bg,
              border: `${bw}px solid ${bc}`,
              borderRadius: shapeBorderRadius(shapeType, 18),
              boxShadow: sh ? '0 10px 24px rgba(0,0,0,0.12)' : undefined,
              display: 'grid',
              placeItems: 'center',
              padding: 12,
              cursor: editable ? 'grab' : 'pointer',
              userSelect: 'none',
              outline: isSelected ? '2px solid var(--color-primary)' : 'none',
              outlineOffset: 2,
            }}
            onPointerDownCapture={(e) => {
              if (!editable) return
              e.stopPropagation()
              onSelectItem?.(it.id)
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent:
                  it.textAlign === 'left' ? 'flex-start' : it.textAlign === 'right' ? 'flex-end' : 'center',
                alignItems:
                  it.vAlign === 'top' ? 'flex-start' : it.vAlign === 'bottom' ? 'flex-end' : 'center',
                padding: it.paddingPx ? `${it.paddingPx}px` : 0,
                color: '#111827',
                overflow: 'hidden',
              }}
            >
              <style jsx>{`strong,b{font-weight:800;} em,i{font-style:italic;} s,del{text-decoration:line-through;}; p{margin:0; line-height:inherit;}`}</style>
              <div
                style={{
                  fontFamily: it.fontFamily || undefined,
                  fontSize: it.fontSizePx ? `${it.fontSizePx}px` : 13,
                  lineHeight: it.lineHeight ?? 1.15,
                  textAlign: it.textAlign ?? 'center',
                  transform: `translate(${it.textOffsetX ?? 0}px, ${it.textOffsetY ?? 0}px)`,
                }}
                dangerouslySetInnerHTML={{ __html: it.textHtml || '' }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
