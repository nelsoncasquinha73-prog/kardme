'use client'
import React, { useState, useRef, useEffect } from 'react'
import styles from './PremiumWheel.module.css'

interface WheelSlice {
  id: string
  label: string
  color: string
  percentage: number
  isRetry?: boolean
}

interface PremiumWheelProps {
  slices: WheelSlice[]
  onSpinComplete: (sliceId: string) => void
  isSpinning?: boolean
}

export default function PremiumWheel({ slices, onSpinComplete, isSpinning = false }: PremiumWheelProps) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const canvasRef = useRef<SVGSVGElement>(null)

  const handleSpin = () => {
    if (spinning || isSpinning) return

    setSpinning(true)
    const spins = 5 + Math.random() * 3
    const randomAngle = Math.random() * 360
    const totalRotation = spins * 360 + randomAngle

    setRotation(prev => prev + totalRotation)

    setTimeout(() => {
      setSpinning(false)
      const normalizedAngle = (rotation + totalRotation) % 360
      const selectedSlice = getSliceAtAngle(normalizedAngle)
      if (selectedSlice) {
        onSpinComplete(selectedSlice.id)
        triggerConfetti()
      }
    }, 3000)
  }

  const getSliceAtAngle = (angle: number) => {
    let currentAngle = 0
    for (const slice of slices) {
      const sliceAngle = (slice.percentage / 100) * 360
      if (angle >= currentAngle && angle < currentAngle + sliceAngle) {
        return slice
      }
      currentAngle += sliceAngle
    }
    return slices[0]
  }

  const triggerConfetti = () => {
    console.log('🎉 Confetti!')
  }

  const renderWheel = () => {
    const radius = 150
    const centerX = 200
    const centerY = 200
    let currentAngle = -90

    return slices.map((slice, idx) => {
      const sliceAngle = (slice.percentage / 100) * 360
      const startAngle = (currentAngle * Math.PI) / 180
      const endAngle = ((currentAngle + sliceAngle) * Math.PI) / 180

      const x1 = centerX + radius * Math.cos(startAngle)
      const y1 = centerY + radius * Math.sin(startAngle)
      const x2 = centerX + radius * Math.cos(endAngle)
      const y2 = centerY + radius * Math.sin(endAngle)

      const largeArc = sliceAngle > 180 ? 1 : 0
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        'Z',
      ].join(' ')

      const textAngle = (currentAngle + sliceAngle / 2) * (Math.PI / 180)
      const textRadius = radius * 0.65
      const textX = centerX + textRadius * Math.cos(textAngle)
      const textY = centerY + textRadius * Math.sin(textAngle)

      currentAngle += sliceAngle

      return (
        <g key={slice.id}>
          <defs>
            <radialGradient id={`grad-${slice.id}`} cx="30%" cy="30%">
              <stop offset="0%" stopColor={slice.color} stopOpacity="1" />
              <stop offset="100%" stopColor={adjustColor(slice.color, -30)} stopOpacity="1" />
            </radialGradient>
            <filter id={`shadow-${slice.id}`}>
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
            </filter>
          </defs>

          <path
            d={pathData}
            fill={`url(#grad-${slice.id})`}
            stroke="#fff"
            strokeWidth="2"
            filter={`url(#shadow-${slice.id})`}
          />

          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            dominantBaseline="middle"
            className={styles.sliceText}
            transform={`rotate(${currentAngle - sliceAngle / 2} ${textX} ${textY})`}
            fill="#fff"
            fontSize="12"
            fontWeight="bold"
          >
            {slice.label}
          </text>
        </g>
      )
    })
  }

  const adjustColor = (color: string, percent: number) => {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = Math.max(0, Math.min(255, (num >> 16) + amt))
    const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt))
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt))
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
  }

  return (
    <div className={styles.wheelContainer}>
      <div className={styles.wheelWrapper}>
        <svg
          ref={canvasRef}
          width="400"
          height="400"
          viewBox="0 0 400 400"
          className={styles.wheelSvg}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
          }}
        >
          <defs>
            <filter id="wheelShadow">
              <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.4" />
            </filter>
            <radialGradient id="wheelGlow" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="200" cy="200" r="155" fill="#1a1a2e" filter="url(#wheelShadow)" />
          <circle cx="200" cy="200" r="150" fill="url(#wheelGlow)" />

          {renderWheel()}

          <circle cx="200" cy="200" r="20" fill="#2a2a3e" stroke="#fff" strokeWidth="2" />
          <circle cx="200" cy="200" r="15" fill="#3a3a4e" />
          <circle cx="200" cy="200" r="8" fill="#ffd700" />
        </svg>

        <div className={styles.pointer} />
      </div>

      <div className={styles.stand}>
        <div className={styles.standTop} />
        <div className={styles.standMiddle} />
        <div className={styles.standBase} />
      </div>

      <button
        onClick={handleSpin}
        disabled={spinning || isSpinning}
        className={styles.spinButton}
      >
        {spinning ? '🎡 Girando...' : '✨ Girar Roleta'}
      </button>
    </div>
  )
}
