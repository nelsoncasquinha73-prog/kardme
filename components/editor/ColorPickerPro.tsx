'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

// Ícone SVG de Pipeta (Eyedropper)
function EyedropperIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#3b82f6"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 22l1-1h3l9-9" />
      <path d="M3 21v-3l9-9" />
      <path d="M14.5 5.5l4 4" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3l-3 3-4-4 3-3z" />
    </svg>
  )
}

const BASE_COLORS = [
  '#0B1220', '#111827', '#374151', '#6B7280', '#9CA3AF', '#FFFFFF',
  '#2563EB', '#3B82F6', '#60A5FA', '#22C55E', '#4ADE80',
  '#F59E0B', '#FBBF24', '#EF4444', '#F87171', '#A855F7', '#C084FC',
  '#EC4899', '#F472B6', '#14B8A6', '#2DD4BF',
]

const GRADIENT_PRESETS = [
  { name: 'Azul Roxo', value: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' },
  { name: 'Rosa Laranja', value: 'linear-gradient(135deg, #ec4899, #f59e0b)' },
  { name: 'Verde Azul', value: 'linear-gradient(135deg, #22c55e, #3b82f6)' },
  { name: 'Roxo Rosa', value: 'linear-gradient(135deg, #8b5cf6, #ec4899)' },
  { name: 'Laranja Vermelho', value: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
  { name: 'Azul Ciano', value: 'linear-gradient(135deg, #3b82f6, #06b6d4)' },
  { name: 'Escuro Premium', value: 'linear-gradient(135deg, #1e293b, #334155)' },
  { name: 'Dourado', value: 'linear-gradient(135deg, #fbbf24, #f59e0b)' },
  { name: 'Oceano', value: 'linear-gradient(135deg, #0ea5e9, #6366f1)' },
  { name: 'Sunset', value: 'linear-gradient(135deg, #f97316, #db2777)' },
  { name: 'Floresta', value: 'linear-gradient(135deg, #22c55e, #15803d)' },
  { name: 'Noite', value: 'linear-gradient(135deg, #1e1b4b, #312e81)' },
]

const DIRECTIONS = [
  { label: '↗', value: '135deg' },
  { label: '→', value: '90deg' },
  { label: '↘', value: '45deg' },
  { label: '↓', value: '180deg' },
  { label: '↙', value: '225deg' },
  { label: '←', value: '270deg' },
  { label: '↖', value: '315deg' },
  { label: '↑', value: '0deg' },
]

type Props = {
  value: string
  onChange: (value: string) => void
  onEyedropper?: () => void
  disabled?: boolean
  label?: string
  supportsGradient?: boolean
}

export default function ColorPickerPro({
  value,
  onChange,
  onEyedropper,
  disabled = false,
  label,
  supportsGradient = true,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [tab, setTab] = useState<'solid' | 'gradient'>(
    value?.includes('gradient') ? 'gradient' : 'solid'
  )
  const [gradientStart, setGradientStart] = useState('#3b82f6')
  const [gradientEnd, setGradientEnd] = useState('#8b5cf6')
  const [gradientDirection, setGradientDirection] = useState('135deg')
  const [recentColors, setRecentColors] = useState<string[]>([])
  const buttonRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value?.includes('linear-gradient')) {
      const match = value.match(/linear-gradient$(\d+deg),\s*([^,]+),\s*([^)]+)$/)
      if (match) {
        setGradientDirection(match[1])
        setGradientStart(match[2].trim())
        setGradientEnd(match[3].trim())
        setTab('gradient')
      }
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem('kardme_recent_colors')
    if (stored) {
      try {
        setRecentColors(JSON.parse(stored))
      } catch {}
    }
  }, [])

  const addToRecent = (color: string) => {
    if (color.includes('gradient')) return
    const updated = [color, ...recentColors.filter(c => c !== color)].slice(0, 8)
    setRecentColors(updated)
    localStorage.setItem('kardme_recent_colors', JSON.stringify(updated))
  }

  const handleSolidChange = (hex: string) => {
    addToRecent(hex)
    onChange(hex)
  }

  const handleGradientChange = (start: string, end: string, dir: string) => {
    const gradient = `linear-gradient(\${dir}, \${start}, \${end})`
    onChange(gradient)
  }

  const updateGradient = (start: string, end: string, dir: string) => {
    setGradientStart(start)
    setGradientEnd(end)
    setGradientDirection(dir)
    handleGradientChange(start, end, dir)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const isGradient = value?.includes('gradient')
  const displayColor = isGradient ? value : value || '#ffffff'

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {label && (
        <span style={{ fontSize: 12, opacity: 0.75, marginRight: 8 }}>{label}</span>
      )}
      
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          width: 36,
          height: 24,
          borderRadius: 6,
          border: '2px solid rgba(0,0,0,0.15)',
          background: displayColor,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
        title="Escolher cor"
      />

      {onEyedropper && (
        <button
          type="button"
          onClick={() => !disabled && onEyedropper()}
          disabled={disabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.12)',
            background: '#fff',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.15s',
          }}
          title="Pipeta - escolher do preview"
        >
          <EyedropperIcon size={16} />
        </button>
      )}

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={modalRef}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            padding: 20,
            zIndex: 10000,
            width: 320,
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Escolher Cor</h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 20,
                cursor: 'pointer',
                opacity: 0.5,
              }}
            >
              ×
            </button>
          </div>

          {supportsGradient && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <TabButton active={tab === 'solid'} onClick={() => setTab('solid')}>
                Sólido
              </TabButton>
              <TabButton active={tab === 'gradient'} onClick={() => setTab('gradient')}>
                Degradê
              </TabButton>
            </div>
          )}

          {tab === 'solid' ? (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, opacity: 0.7, display: 'block', marginBottom: 6 }}>
                  Código HEX
                </label>
                <input
                  type="text"
                  value={isGradient ? '' : value || ''}
                  onChange={(e) => handleSolidChange(e.target.value)}
                  placeholder="#000000"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.15)',
                    fontSize: 14,
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              {recentColors.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, opacity: 0.7, display: 'block', marginBottom: 8 }}>
                    Recentes
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {recentColors.map((c, i) => (
                      <ColorSwatch
                        key={i}
                        color={c}
                        selected={value === c}
                        onClick={() => handleSolidChange(c)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, opacity: 0.7, display: 'block', marginBottom: 8 }}>
                  Paleta
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {BASE_COLORS.map((c) => (
                    <ColorSwatch
                      key={c}
                      color={c}
                      selected={value === c}
                      onClick={() => handleSolidChange(c)}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, opacity: 0.7, display: 'block', marginBottom: 8 }}>
                  Presets
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {GRADIENT_PRESETS.map((g) => (
                    <button
                      key={g.name}
                      type="button"
                      onClick={() => onChange(g.value)}
                      title={g.name}
                      style={{
                        width: 40,
                        height: 28,
                        borderRadius: 8,
                        background: g.value,
                        border: value === g.value ? '2px solid #000' : '1px solid rgba(0,0,0,0.15)',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, opacity: 0.7, display: 'block', marginBottom: 8 }}>
                  Personalizado
                </label>
                
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, opacity: 0.6, display: 'block', marginBottom: 4 }}>
                      Cor 1
                    </label>
                    <input
                      type="color"
                      value={gradientStart}
                      onChange={(e) => updateGradient(e.target.value, gradientEnd, gradientDirection)}
                      style={{ width: '100%', height: 36, borderRadius: 8, border: 'none', cursor: 'pointer' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, opacity: 0.6, display: 'block', marginBottom: 4 }}>
                      Cor 2
                    </label>
                    <input
                      type="color"
                      value={gradientEnd}
                      onChange={(e) => updateGradient(gradientStart, e.target.value, gradientDirection)}
                      style={{ width: '100%', height: 36, borderRadius: 8, border: 'none', cursor: 'pointer' }}
                    />
                  </div>
                </div>

                <label style={{ fontSize: 11, opacity: 0.6, display: 'block', marginBottom: 6 }}>
                  Direção
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {DIRECTIONS.map((d) => (
                    <button
                      key={d.value
}
                      type="button"
                      onClick={() => updateGradient(gradientStart, gradientEnd, d.value)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: gradientDirection === d.value ? '2px solid #000' : '1px solid rgba(0,0,0,0.15)',
                        background: gradientDirection === d.value ? 'rgba(0,0,0,0.05)' : '#fff',
                        cursor: 'pointer',
                        fontSize: 14,
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 11, opacity: 0.6, display: 'block', marginBottom: 6 }}>
                    Preview
                  </label>
                  <div
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 12,
                      background: `linear-gradient(${gradientDirection}, ${gradientStart}, ${gradientEnd})`,
                      border: '1px solid rgba(0,0,0,0.1)',
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}

function TabButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 16px',
        borderRadius: 10,
        border: 'none',
        background: active ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(0,0,0,0.05)',
        color: active ? '#fff' : '#333',
        fontWeight: 600,
        fontSize: 13,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  )
}

function ColorSwatch({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        background: color,
        border: selected ? '2px solid #000' : '1px solid rgba(0,0,0,0.15)',
        cursor: 'pointer',
        transition: 'transform 0.1s',
      }}
      title={color}
    />
  )
}
