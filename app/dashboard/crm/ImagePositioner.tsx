'use client'

import { useState, useRef, useEffect } from 'react'
import { FiRotateCcw } from 'react-icons/fi'

interface ImagePositionerProps {
  imageUrl: string
  onConfirm: (settings: { positionX: number; positionY: number; scale: number }) => void
  onCancel: () => void
  title: string
  isCircle?: boolean
}

export default function ImagePositioner({
  imageUrl,
  onConfirm,
  onCancel,
  title,
  isCircle = false,
}: ImagePositionerProps) {
  const [positionX, setPositionX] = useState(50)
  const [positionY, setPositionY] = useState(50)
  const [scale, setScale] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    const containerRect = containerRef.current.getBoundingClientRect()
    const moveX = (deltaX / containerRect.width) * 100
    const moveY = (deltaY / containerRect.height) * 100

    setPositionX(Math.max(0, Math.min(100, positionX + moveX)))
    setPositionY(Math.max(0, Math.min(100, positionY + moveY)))
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleReset = () => {
    setPositionX(50)
    setPositionY(50)
    setScale(1)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <div
        style={{
          background: '#1e293b',
          borderRadius: 16,
          padding: 32,
          maxWidth: 500,
          width: '90%',
        }}
      >
        <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 24px 0' }}>
          {title}
        </h3>

        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            width: '100%',
            height: isCircle ? 300 : 200,
            background: '#111827',
            borderRadius: isCircle ? '50%' : 8,
            border: '2px solid #374151',
            overflow: 'hidden',
            cursor: isDragging ? 'grabbing' : 'grab',
            marginBottom: 24,
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: `${scale * 100}%`,
              backgroundPosition: `${positionX}% ${positionY}%`,
              backgroundRepeat: 'no-repeat',
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', color: '#cbd5e1', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
            Zoom: {(scale * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="1"
            max="250"
            value={scale * 100}
            onChange={(e) => setScale(parseInt(e.target.value) / 100)}
            style={{
              width: '100%',
              height: 6,
              borderRadius: 3,
              background: '#374151',
              outline: 'none',
              WebkitAppearance: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleReset}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.1)',
              color: '#cbd5e1',
              border: 'none',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <FiRotateCcw size={14} /> Repor
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.1)',
              color: '#cbd5e1',
              border: 'none',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm({ positionX, positionY, scale })}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 8,
              background: '#10b981',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
