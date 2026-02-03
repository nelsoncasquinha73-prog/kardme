'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useColorPicker } from './ColorPickerContext'
import html2canvas from 'html2canvas'

type Pos = { x: number; y: number }

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

function parseRgb(str: string): { r: number; g: number; b: number } | null {
  const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return null
  return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) }
}

function hasNativeEyeDropper(): boolean {
  return typeof window !== 'undefined' && 'EyeDropper' in window
}

function isSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium')
}

// ============ SAFARI FALLBACK COMPONENT ============
function SafariEyedropper({ picker, closePicker }: { picker: any; closePicker: () => void }) {
  const [pos, setPos] = useState<Pos | null>(null)
  const [hex, setHex] = useState('#FFFFFF')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePicker()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closePicker])

  function getColorAtPoint(x: number, y: number): string {
    const elements = document.elementsFromPoint(x, y)
    
    for (const element of elements) {
      if ((element as HTMLElement).dataset?.eyedropperOverlay) continue
      if ((element as HTMLElement).dataset?.noBlockSelect) continue
      
      const computed = window.getComputedStyle(element as HTMLElement)
      
      // Verifica background-color
      const bgColor = computed.backgroundColor
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        const rgb = parseRgb(bgColor)
        if (rgb && (rgb.r !== 0 || rgb.g !== 0 || rgb.b !== 0 || bgColor.includes('255'))) {
          return rgbToHex(rgb.r, rgb.g, rgb.b)
        }
      }

      // Verifica cor do texto
      const textColor = computed.color
      if (textColor && element.textContent?.trim()) {
        const rgb = parseRgb(textColor)
        if (rgb) return rgbToHex(rgb.r, rgb.g, rgb.b)
      }
    }

    return '#FFFFFF'
  }

  function updateFromClient(x: number, y: number) {
    setPos({ x, y })
    const color = getColorAtPoint(x, y)
    setHex(color)
  }

  function pickAtClient(x: number, y: number) {
    const color = getColorAtPoint(x, y)
    picker.onPick?.(color)
    closePicker()
  }

  return (
    <>
      <div
        data-eyedropper-overlay="1"
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
          e.preventDefault()
          e.stopPropagation()
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

      <button
        onClick={() => closePicker()}
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 10001,
          padding: '8px 16px',
          borderRadius: 8,
          border: 'none',
          background: 'rgba(0,0,0,0.8)',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        ✕ Cancelar (ESC)
      </button>

      <div
        style={{
          position: 'fixed',
          top: 60,
          right: 16,
          zIndex: 10001,
          padding: '10px 14px',
          borderRadius: 10,
          background: 'rgba(245, 158, 11, 0.95)',
          color: '#fff',
          fontSize: 12,
          fontWeight: 500,
          maxWidth: 220,
          lineHeight: 1.4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}
      >
        ⚠️ No Safari só captura cores de fundo. Para todas as cores usa o <b>Chrome</b>.
      </div>

      {pos && (
        <div
          style={{
            position: 'fixed',
            left: pos.x + 20,
            top: pos.y + 20,
            zIndex: 10000,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: hex,
              border: '3px solid rgba(255,255,255,0.9)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(0,0,0,0.1)',
            }}
          />
          <div
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(0,0,0,0.85)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            {hex}
          </div>
        </div>
      )}
    </>
  )
}

// ============ MAIN COMPONENT ============
export default function EyedropperLoupeOverlay() {
  const { picker, closePicker } = useColorPicker()

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const loupeCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const rectRef = useRef<DOMRect | null>(null)
  const captureTimerRef = useRef<number | null>(null)

  const [pos, setPos] = useState<Pos | null>(null)
  const [hex, setHex] = useState('#FFFFFF')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usingNative, setUsingNative] = useState(false)
  const [usingSafari, setUsingSafari] = useState(false)

  const dpr = useMemo(() => (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1), [])

  useEffect(() => {
    if (!picker.active) return

    // Chrome/Edge: usar EyeDropper nativo
    if (hasNativeEyeDropper()) {
      setUsingNative(true)
      setUsingSafari(false)
      
      const tooltip = document.createElement('div')
      tooltip.id = 'eyedropper-tooltip'
      tooltip.innerHTML = '🎨 Clica para escolher cor · <b>ESC</b> para sair'
      tooltip.style.cssText = `
        position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
        padding: 10px 18px; border-radius: 10px; background: rgba(0,0,0,0.85);
        color: #fff; font-size: 13px; font-weight: 500; z-index: 99999;
        pointer-events: none; box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      `
      document.body.appendChild(tooltip)
      
      // @ts-expect-error - EyeDropper API
      const eyeDropper = new window.EyeDropper()
      
      eyeDropper.open()
        .then((result: { sRGBHex: string }) => {
          picker.onPick?.(result.sRGBHex.toUpperCase())
          closePicker()
        })
        .catch(() => closePicker())
        .finally(() => tooltip.remove())
      
      return () => tooltip.remove()
    }

    // Safari: usar fallback simples
    if (isSafari()) {
      setUsingSafari(true)
      setUsingNative(false)
      return
    }

    // Outros browsers: usar html2canvas
    setUsingNative(false)
    setUsingSafari(false)
  }, [picker.active, picker.onPick, closePicker])

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

  function isInsidePreview(x: number, y: number): boolean {
    const rect = rectRef.current || updateRect()
    if (!rect) return false
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
  }

  useEffect(() => {
    if (!picker.active || usingNative || usingSafari) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePicker()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [picker.active, usingNative, usingSafari, closePicker])

  useEffect(() => {
    if (!picker.active || usingNative || usingSafari) return

    let cancelled = false

    async function capturePreview() {
      setReady(false)
      setError(null)

      const target = getPreviewEl()
      if (!target) {
        setError('Preview não encontrado')
        setReady(true)
        return
      }

      const rect = updateRect()
      if (!rect) {
        setError('Não foi possível obter dimensões')
        setReady(true)
        return
      }

      try {
        const shot = await html2canvas(target, {
          backgroundColor: '#ffffff',
          scale: dpr,
          useCORS: true,
          logging: false,
          allowTaint: true,
          foreignObjectRendering: true,
          imageTimeout: 5000,
          removeContainer: true,
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

        const p = pos ?? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        setPos(p)

        const sp = getSamplePoint(p.x, p.y)
        if (sp) {
          drawLoupe(sp.x, sp.y)
          const px = getPixelCss(sp.x, sp.y)
          if (px) setHex(rgbToHex(px.r, px.g, px.b))
        }
      } catch (err) {
        console.error('Eyedropper capture error:', err)
        setError('Erro ao capturar preview')
        setReady(true)
      }
    }

    function scheduleCapture() {
      if (captureTimerRef.current) window.clearTimeout(captureTimerRef.current)
      captureTimerRef.current = window.setTimeout(() => capturePreview(), 90)
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
      scroller?.removeEventListener('scroll', scheduleCapture)
      window.removeEventListener('resize', scheduleCapture)
    }
  }, [picker.active, usingNative, usingSafari, dpr])

  // Se Safari, renderiza o componente simplificado
  if (picker.active && usingSafari) {
    return <SafariEyedropper picker={picker} closePicker={closePicker} />
  }

  if (!picker.active || usingNative) return null

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

    try {
      const data = ctx.getImageData(x, y, 1, 1).data
      return { r: data[0], g: data[1], b: data[2] }
    } catch {
      return null
    }
  }

  function drawLoupe(xCss: number, yCss: number) {
    const src = canvasRef.current
    const out = loupeCanvasRef.current
    if (!src || !out) return
    const ctx = out.getContext('2d')
    if (!ctx) return

    const local = toLocalDpr(xCss, yCss)
    if (!local) return

    const size = out.width
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
    if (!ready || error) return

    const sp = getSamplePoint(x, y)
    if (!sp) return

    drawLoupe(sp.x, sp.y)
    const p = getPixelCss(sp.x, sp.y)
    if (p) setHex(rgbToHex(p.r, p.g, p.b))
  }

  function pickAtClient(x: number, y: number) {
    if (!isInsidePreview(x, y)) {
      closePicker()
      return
    }

    if (!ready || error) {
      closePicker()
      return
    }

    const sp = getSamplePoint(x, y)
    if (!sp) {
      closePicker()
      return
    }

    const p = getPixelCss(sp.x, sp.y)
    picker.onPick?.(p ? rgbToHex(p.r, p.g, p.b) : hex)
    closePicker()
  }

  return (
    <>
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

      <button
        onClick={() => closePicker()}
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 10001,
          padding: '8px 16px',
          borderRadius: 8,
          border: 'none',
          background: 'rgba(0,0,0,0.8)',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        ✕ Cancelar (ESC)
      </button>

      {error && (
        <div
          style={{
            position: 'fixed',
            top: 60,
            right: 16,
            zIndex: 10001,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(220,38,38,0.9)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {error} - clica para fechar
        </div>
      )}

      {pos && !error && (
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

      {pos && !error && (
        <div
          style={{
            position: 'fixed',
            left: pos.x + 16,
            top: pos.y + 92,
            zIndex: 10000,
            padding: '4px 8px',
            borderRadius: 6,
            background: 'rgba(0,0,0,0.85)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'monospace',
            pointerEvents: 'none',
          }}
        >
          {hex}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  )
}
