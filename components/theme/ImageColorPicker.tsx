'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Props = {
  imageUrl: string
  open: boolean
  onClose: () => void
  onPick: (hex: string) => void

  // UX tuning (o que tu queres ajustar)
  loupeSize?: number        // tamanho da lupa (px)
  zoom?: number             // zoom da lupa
  swatchSize?: number       // tamanho dos quadrados (px)
  swatches?: string[]       // swatches sugeridos (opcional)
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

export default function ImageColorPicker({
  imageUrl,
  open,
  onClose,
  onPick,
  loupeSize = 72,     // ✅ mais pequeno (era aqui que estava o “monstro”)
  zoom = 5,
  swatchSize = 18,    // ✅ quadrados mais pequenos
  swatches,
}: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [ready, setReady] = useState(false)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [currentHex, setCurrentHex] = useState<string>('#FFFFFF')

  const defaultSwatches = useMemo(
    () =>
      swatches || [
        '#0B0B0F',
        '#111827',
        '#FFFFFF',
        '#2563EB',
        '#22C55E',
        '#F59E0B',
        '#EF4444',
        '#A855F7',
      ],
    [swatches]
  )

  useEffect(() => {
    if (!open) return
    setReady(false)
    setPos(null)
    setCurrentHex('#FFFFFF')
  }, [open])

  function ensureCanvas() {
    const img = imgRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return false
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return false

    // desenhar a imagem “em tamanho real”
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    ctx.drawImage(img, 0, 0)
    return true
  }

  function getColorAt(displayX: number, displayY: number) {
    const img = imgRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return null

    const rect = img.getBoundingClientRect()
    const xRatio = img.naturalWidth / rect.width
    const yRatio = img.naturalHeight / rect.height

    const x = Math.max(0, Math.min(img.naturalWidth - 1, Math.floor(displayX * xRatio)))
    const y = Math.max(0, Math.min(img.naturalHeight - 1, Math.floor(displayY * yRatio)))

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    const pixel = ctx.getImageData(x, y, 1, 1).data
    return { r: pixel[0], g: pixel[1], b: pixel[2], x, y }
  }

  function onMove(e: React.MouseEvent) {
    const img = imgRef.current
    if (!img) return
    const rect = img.getBoundingClientRect()
    const dx = e.clientX - rect.left
    const dy = e.clientY - rect.top

    setPos({ x: dx, y: dy })

    const c = getColorAt(dx, dy)
    if (c) setCurrentHex(rgbToHex(c.r, c.g, c.b))
  }

  function onClickPick() {
    onPick(currentHex)
    onClose()
  }

  if (!open) return null

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={header}>
          <div style={{ fontWeight: 700 }}>🎯 Escolher cor da foto</div>
          <button style={iconBtn} onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <img
              ref={imgRef}
              src={imageUrl}
              alt=""
              style={imgStyle}
              onLoad={() => {
                const ok = ensureCanvas()
                setReady(ok)
              }}
              onMouseMove={onMove}
              onMouseLeave={() => setPos(null)}
            />

            {/* LUPA */}
            {ready && pos && (
              <Loupe
                imageUrl={imageUrl}
                imgEl={imgRef.current!}
                pos={pos}
                size={loupeSize}
                zoom={zoom}
              />
            )}
          </div>

          <div style={side}>
            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 10 }}>
              Cor atual
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ ...chip, background: currentHex }} />
              <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 13 }}>
                {currentHex}
              </div>
            </div>

            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 10 }}>
              Sugestões rápidas
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              {defaultSwatches.map(s => (
                <button
                  key={s}
                  onClick={() => setCurrentHex(s)}
                  style={{
                    width: swatchSize,
                    height: swatchSize,
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.18)',
                    background: s,
                    cursor: 'pointer',
                  }}
                  title={s}
                />
              ))}
            </div>

            <button style={pickBtn(currentHex)} onClick={onClickPick}>
              Aplicar esta cor
            </button>

            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 12, lineHeight: 1.4 }}>
              Dica: passa o rato por cima da foto para veres a lupa.
              Clica “Aplicar” quando estiveres na cor certa.
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  )
}

function Loupe({
  imageUrl,
  imgEl,
  pos,
  size,
  zoom,
}: {
  imageUrl: string
  imgEl: HTMLImageElement
  pos: { x: number; y: number }
  size: number
  zoom: number
}) {
  // a lupa é um “mini viewport” com background-position
  const rect = imgEl.getBoundingClientRect()
  const bgX = (pos.x / rect.width) * 100
  const bgY = (pos.y / rect.height) * 100

  return (
    <div
      style={{
        position: 'absolute',
        left: Math.min(rect.width - size, Math.max(0, pos.x - size / 2)),
        top: Math.min(rect.height - size, Math.max(0, pos.y - size / 2)),
        width: size,
        height: size,
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.22)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
        backgroundImage: `url(${imageUrl})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${rect.width * zoom}px ${rect.height * zoom}px`,
        backgroundPosition: `${bgX}% ${bgY}%`,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* cruz */}
      <div style={crossH} />
      <div style={crossV} />
    </div>
  )
}

/* ───────── styles ───────── */

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
}

const modal: React.CSSProperties = {
  width: 'min(920px, 100%)',
  background: '#0B1220',
  color: '#fff',
  borderRadius: 18,
  padding: 16,
  border: '1px solid rgba(255,255,255,0.10)',
}

const header: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
}

const iconBtn: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  cursor: 'pointer',
}

const imgStyle: React.CSSProperties = {
  width: '100%',
  height: 460,
  objectFit: 'cover',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.10)',
  cursor: 'crosshair',
  userSelect: 'none',
}

const side: React.CSSProperties = {
  padding: 14,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.04)',
}

const chip: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.18)',
}

const pickBtn = (hex: string): React.CSSProperties => ({
  width: '100%',
  padding: 12,
  borderRadius: 14,
  border: 'none',
  cursor: 'pointer',
  background: hex,
  color: '#fff',
  fontWeight: 700,
})

const crossH: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: '50%',
  height: 1,
  background: 'rgba(255,255,255,0.55)',
  transform: 'translateY(-0.5px)',
}

const crossV: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  bottom: 0,
  left: '50%',
  width: 1,
  background: 'rgba(255,255,255,0.55)',
  transform: 'translateX(-0.5px)',
}
