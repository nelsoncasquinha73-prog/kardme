'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FONT_OPTIONS, CATEGORY_LABELS } from '@/lib/fontes'

type Props = {
  value: string
  onChange: (value: string) => void
}

const CATEGORIES = ['sans-serif', 'serif', 'display', 'handwriting', 'monospace'] as const

export default function FontPicker({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const selectedFont = FONT_OPTIONS.find(f => f.value === value) || FONT_OPTIONS[0]

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredFonts = FONT_OPTIONS.filter(f => 
    f.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div ref={ref} style={{ position: 'relative', minWidth: 160 }}>
      {/* Trigger */}
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)} 
        style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
      >
        <span style={{ fontFamily: selectedFont.value || 'inherit', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedFont.label}
        </span>
        <span style={{ fontSize: 10, opacity: 0.5 }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div style={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          right: 0, 
          marginTop: 4, 
          background: '#fff', 
          borderRadius: 14, 
          border: '1px solid rgba(0,0,0,0.1)', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)', 
          zIndex: 9999,
          overflow: 'hidden'
        }}>
          {/* Search */}
          <div style={{ padding: 10, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Pesquisar fonte..."
              autoFocus
              style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.1)', fontSize: 12, outline: 'none' }}
            />
          </div>

          {/* Font List */}
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {CATEGORIES.map(category => {
              const fontsInCategory = filteredFonts.filter(f => f.category === category)
              if (fontsInCategory.length === 0) return null
              
              return (
                <div key={category}>
                  <div style={{ padding: '10px 14px 6px', fontSize: 11, fontWeight: 700, color: '#666', background: 'rgba(0,0,0,0.03)', position: 'sticky', top: 0, zIndex: 1 }}>
                    {CATEGORY_LABELS[category]}
                  </div>
                  {fontsInCategory.map((font) => (
                    <button
                      key={font.value || 'default'}
                      type="button"
                      onClick={() => { onChange(font.value); setIsOpen(false); setSearch('') }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: 'none',
                        background: value === font.value ? 'rgba(59,130,246,0.1)' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: font.value || 'inherit',
                        fontSize: 14,
                        fontWeight: 500,
                        color: value === font.value ? '#3b82f6' : '#333',
                        borderLeft: value === font.value ? '3px solid #3b82f6' : '3px solid transparent',
                      }}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              )
            })}

            {filteredFonts.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', fontSize: 12, opacity: 0.5 }}>
                Nenhuma fonte encontrada
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
// force rebuild qui 12 fev 2026 17:06:45 WET
