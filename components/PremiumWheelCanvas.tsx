'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import styles from './PremiumWheelCanvas.module.css'

interface WheelSlice {
  id: string
  label: string
  color: string
  is_prize: boolean
  percentage?: number
}

interface PremiumWheelCanvasProps {
  slices: WheelSlice[]
  rotation: number
  wheelSize: number
  onDraw?: () => void
}

export default function PremiumWheelCanvas({ slices, rotation, wheelSize, onDraw }: PremiumWheelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offscreenRef = useRef<HTMLCanvasElement | null>(null)
  const [needsRedraw, setNeedsRedraw] = useState(true)

  // Criar offscreen canvas na montagem
  useEffect(() => {
    if (typeof document !== 'undefined') {
      offscreenRef.current = document.createElement('canvas')
      offscreenRef.current.width = wheelSize
      offscreenRef.current.height = wheelSize
    }
  }, [wheelSize])

  // Desenhar roda estática no offscreen (quando slices mudam)
  useEffect(() => {
    setNeedsRedraw(true)
  }, [slices])

  const lightenColor = useCallback((hex: string, amount: number): string => {
    try {
      const clean = (hex || '').trim()
      if (!clean.startsWith('#')) return '#3b82f6'
      const full = clean.length === 4
        ? '#' + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3]
        : clean
      if (full.length !== 7) return '#3b82f6'
      const num = parseInt(full.slice(1), 16)
      const r = Math.min(255, (num >> 16) + amount)
      const g = Math.min(255, ((num >> 8) & 0xff) + amount)
      const b = Math.min(255, (num & 0xff) + amount)
      return `rgb(${r},${g},${b})`
    } catch {
      return '#3b82f6'
    }
  }, [])

  const drawWheelStatic = useCallback(() => {
    if (!offscreenRef.current) return
    const ctx = offscreenRef.current.getContext('2d')
    if (!ctx) return

    const n = slices.length
    const arc = (2 * Math.PI) / n
    const cx = wheelSize / 2
    const cy = wheelSize / 2
    const R = cx - 12

    ctx.clearRect(0, 0, wheelSize, wheelSize)

    // 🌟 GLOW PREMIUM (fundo)
    const glowGrad = ctx.createRadialGradient(cx, cy, R - 20, cx, cy, R + 20)
    glowGrad.addColorStop(0, 'rgba(245,158,11,0.4)')
    glowGrad.addColorStop(0.5, 'rgba(245,158,11,0.1)')
    glowGrad.addColorStop(1, 'rgba(245,158,11,0)')
    ctx.beginPath()
    ctx.arc(cx, cy, R + 20, 0, 2 * Math.PI)
    ctx.fillStyle = glowGrad
    ctx.fill()

    // 🎨 FATIAS com gradiente radial
    slices.forEach((slice, i) => {
      const start = i * arc
      const end = start + arc
      const mid = start + arc / 2

      const sliceColor = slice.color && slice.color.startsWith('#') ? slice.color : '#3b82f6'
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
      grad.addColorStop(0, lightenColor(sliceColor, 50))
      grad.addColorStop(1, sliceColor)

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, R, start, end)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()

      // ✨ SEPARADOR DOURADO (premium)
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + R * Math.cos(start), cy + R * Math.sin(start))
      ctx.strokeStyle = 'rgba(245,158,11,0.8)'
      ctx.lineWidth = 2.5
      ctx.stroke()

      // Borda externa (sombra)
      ctx.beginPath()
      ctx.arc(cx, cy, R, start, end)
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'
      ctx.lineWidth = 2
      ctx.stroke()

      // 📝 TEXTO (premium): fora maior, dentro menor
      drawFunnelText(ctx, slice.label, cx, cy, R, mid, n)
    })

    // ✨ BORDA DUPLA (premium)
    ctx.beginPath()
    ctx.arc(cx, cy, R + 2, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(245,158,11,0.9)'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx, cy, R + 5, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(245,158,11,0.3)'
    ctx.lineWidth = 1
    ctx.stroke()

    // 💎 HUB 3D (centro)
    const hubGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 45)
    hubGrad.addColorStop(0, '#2d2d44')
    hubGrad.addColorStop(0.5, '#1a1a2e')
    hubGrad.addColorStop(1, '#0f0f1a')
    ctx.beginPath()
    ctx.arc(cx, cy, 42, 0, 2 * Math.PI)
    ctx.fillStyle = hubGrad
    ctx.fill()

    // Hub borda
    ctx.beginPath()
    ctx.arc(cx, cy, 42, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(245,158,11,0.7)'
    ctx.lineWidth = 2
    ctx.stroke()

    // ✨ GLOSS (highlight no topo do hub)
    const glossGrad = ctx.createLinearGradient(cx - 30, cy - 30, cx + 30, cy + 10)
    glossGrad.addColorStop(0, 'rgba(255,255,255,0.3)')
    glossGrad.addColorStop(0.5, 'rgba(255,255,255,0)')
    ctx.beginPath()
    ctx.arc(cx, cy, 40, 0, 2 * Math.PI)
    ctx.fillStyle = glossGrad
    ctx.fill()

    // Emoji no centro
    ctx.font = '28px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🎡', cx, cy)
  }, [slices, wheelSize, lightenColor])

  const drawFunnelText = useCallback((ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, R: number, mid: number, totalSlices: number) => {
    const clean = (text || '').trim()
    if (!clean) return

    let maxLen: number
    let fontSize: number
    let positionRadius: number

    if (totalSlices <= 4) {
      maxLen = 24
      fontSize = 18
      positionRadius = R - 20
    } else if (totalSlices <= 6) {
      maxLen = 18
      fontSize = 16
      positionRadius = R - 22
    } else if (totalSlices <= 8) {
      maxLen = 14
      fontSize = 14
      positionRadius = R - 24
    } else {
      maxLen = 12
      fontSize = 13
      positionRadius = R - 26
    }

    const label = clean.length > maxLen ? clean.substring(0, maxLen) + '…' : clean

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(mid)

    ctx.fillStyle = '#fff'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(0,0,0,0.95)'
    ctx.shadowBlur = 6
    ctx.font = `bold ${fontSize}px Inter, sans-serif`
    ctx.fillText(label, positionRadius, 0)

    ctx.restore()
  }, [])

  // Draw frame (com rotação)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Se precisa redraw estático, faz
    if (needsRedraw && offscreenRef.current) {
      drawWheelStatic()
      setNeedsRedraw(false)
    }

    // Limpa canvas principal
    ctx.clearRect(0, 0, wheelSize, wheelSize)

    // Desenha offscreen rotacionado
    if (offscreenRef.current) {
      ctx.save()
      ctx.translate(wheelSize / 2, wheelSize / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.translate(-wheelSize / 2, -wheelSize / 2)
      ctx.drawImage(offscreenRef.current, 0, 0)
      ctx.restore()
    }

    onDraw?.()
  }, [rotation, wheelSize, needsRedraw, drawWheelStatic, onDraw])

  return (
    <canvas
      ref={canvasRef}
      width={wheelSize}
      height={wheelSize}
      className={styles.canvas}
    />
  )
}
