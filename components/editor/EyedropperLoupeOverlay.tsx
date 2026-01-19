'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useColorPicker } from './ColorPickerContext'
import html2canvas from 'html2canvas'

type Pos = { x: number; y: number }

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

export default function EyedropperLoupeOverlay() {
  const { picker, closePicker } = useColorPicker()

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const loupeCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const rectRef = useRef<DOMRect | null>(null)
  const captureTimerRef = useRef<number | null>(null)

  const [pos, setPos] = useState<Pos | null>(null)
  const [hex, setHex] = useState('#FFFFFF')
  const [ready, setReady] = useState(false)

  const dpr = useMemo(() => (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1), [])

  function getPreviewEl() {
    return document.getElementById('preview-hitbox')
  }

  function updateRect() {
    const target = getPreviewEl()
    if (!target) return null
    const rect = target.getBoundingClientRect()
    rectRef.current = rect
    return rect
  }

  function clampToRect(x: number, y: number, r: DOMRect) {
    const cx = Math.max(r.left, Math.min(x, r.right - 1))
    const cy = Math.max(r.top, Math.min(y, r.bottom - 1))
    return { x: cx, y: cy }
  }

  function getSamplePoint(x: number, y: number) {
    const r = rectRef.current || updateRect()
    if (!r) return null
    return clampToRect(x, y, r)
  }

  // ESC global enquanto ativo
  useEffect(() => {
    if (!picker.active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePicker()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [picker.active, closePicker])

  useEffect(() => {
    if (!picker.active) return

    let cancelled = false

    async function capturePreview() {
      setReady(false)

      const target = getPreviewEl()
      if (!target) {
        console.warn('Eyedropper: falta #preview-hitbox')
        setReady(true)
        return
      }

      const rect = updateRect()
      if (!rect) {
        setReady(true)
        return
      }

      const shot = await html2canvas(target, {
        backgroundColor: null,
        scale: dpr,
        useCORS: true,
      })

      if (cancelled) return

      const out = canvasRef.current
      if (!out) return

      out.width = Math.round(rect.width * dpr)
      out.height = Math.round(rect.height * dpr)

      const ctx = out.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      ctx.clearRect(0, 0, out.width, out.height)
      ctx.drawImage(shot, 0, 0)

      setReady(true)

      // centro por defeito
      const p = pos ?? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      setPos(p)

      const sp = getSamplePoint(p.x, p.y)
      if (sp) {
        drawLoupe(sp.x, sp.y)
        const px = getPixelCss(sp.x, sp.y)
        if (px) setHex(rgbToHex(px.r, px.g, px.b))
      }
    }

    function scheduleCapture() {
      if (captureTimerRef.current) window.clearTimeout(captureTimerRef.current)
      captureTimerRef.current = window.setTimeout(() => {
        capturePreview()
      }, 90)
    }

    const rect = updateRect()
    if (rect) setPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })

    capturePreview()

    const scroller = document.getElementById('preview-scroll')
    scroller?.addEventListener('scroll', scheduleCapture, { passive: true })
    window.addEventListener('resize', scheduleCapture, { passive: true })

    return () => {
      cancelled = true
      if (captureTimerRef.current) window.clearTimeout(captureTimerRef.current)
      captureTimerRef.current = null
      scroller?.removeEventListener('scroll', scheduleCapture)
      window.removeEventListener('resize', scheduleCapture)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picker.active, dpr])

  if (!picker.active) return null

  function toLocalDpr(xCss: number, yCss: number) {
    const rect = updateRect() || rectRef.current
    if (!rect) return null
    const lx = Math.round((xCss - rect.left) * dpr)
    const ly = Math.round((yCss - rect.top) * dpr)
    return { lx, ly }
  }

  function getPixelCss(xCss: number, yCss: number) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null

    const local = toLocalDpr(xCss, yCss)
    if (!local) return null

    const x = Math.max(0, Math.min(canvas.width - 1, local.lx))
    const y = Math.max(0, Math.min(canvas.height - 1, local.ly))

    const data = ctx.getImageData(x, y, 1, 1).data
    return { r: data[0], g: data[1], b: data[2] }
  }

  function drawLoupe(xCss: number, yCss: number) {
    const src = canvasRef.current
    const out = loupeCanvasRef.current
    if (!src || !out) return
    const ctx = out.getContext('2d')
    if (!ctx) return

    const local = toLocalDpr(xCss, yCss)
    if (!local) return

    const size = out.width // 72
    const zoom = 10

    const sample = Math.round(size / zoom)
    const sampleSize = Math.max(9, sample % 2 === 0 ? sample + 1 : sample)

    let sx = local.lx - Math.floor(sampleSize / 2)
    let sy = local.ly - Math.floor(sampleSize / 2)

    sx = Math.max(0, Math.min(sx, src.width - sampleSize))
    sy = Math.max(0, Math.min(sy, src.height - sampleSize))

    ctx.clearRect(0, 0, size, size)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(src, sx, sy, sampleSize, sampleSize, 0, 0, size, size)

    ctx.strokeStyle = 'rgba(255,255,255,0.95)'
    ctx.lineWidth = 2
    const box = zoom
    ctx.strokeRect(size / 2 - box / 2, size / 2 - box / 2, box, box)
  }

  function updateFromClient(x: number, y: number) {
    setPos({ x, y })
    if (!ready) return

    const sp = getSamplePoint(x, y)
    if (!sp) return

    drawLoupe(sp.x, sp.y)

    const p = getPixelCss(sp.x, sp.y)
    if (p) setHex(rgbToHex(p.r, p.g, p.b))
  }

  function pickAtClient(x: number, y: number) {
    if (!ready) return

    const sp = getSamplePoint(x, y)
    if (!sp) return

    const p = getPixelCss(sp.x, sp.y)
    picker.onPick?.(p ? rgbToHex(p.r, p.g, p.b) : hex)
    closePicker()
  }

  return (
    <>
      {/* overlay fullscreen */}
      <div
        data-no-block-select="1"
        onPointerMove={(e) => {
          e.preventDefault()
          e.stopPropagation()
          updateFromClient(e.clientX, e.clientY)
        }}
        onPointerUp={(e) => {
          e.preventDefault()
          e.stopPropagation()
          pickAtClient(e.clientX, e.clientY)
        }}
        onPointerDown={(e) => {
          // IMPORTANTÍSSIMO: NÃO fechar aqui.
          // Se fechares aqui, nunca chega ao "pick".
          e.preventDefault()
          e.stopPropagation()
          updateFromClient(e.clientX, e.clientY)
        }}
        style={{
          position: 'fixed',
          inset: 0,
          cursor: 'crosshair',
          zIndex: 9999,
          background: 'transparent',
          touchAction: 'none',
        }}
      />

      {/* lupa */}
      {pos && (
        <div
          data-no-block-select="1"
          style={{
            position: 'fixed',
            left: pos.x + 16,
            top: pos.y + 16,
            width: 72,
            height: 72,
            borderRadius: 999,
            overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.85)',
            background: '#fff',
            boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
            zIndex: 10000,
            pointerEvents: 'none',
            opacity: ready ? 1 : 0.75,
          }}
        >
          <canvas ref={loupeCanvasRef} width={72} height={72} style={{ display: 'block', width: 72, height: 72 }} />
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  )
}
