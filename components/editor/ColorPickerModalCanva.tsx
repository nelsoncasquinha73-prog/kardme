'use client'

import React, { useState, useMemo } from 'react'

type ColorPickerModalCanvaProps = {
  open: boolean
  onClose: () => void
  onPick: (hex: string) => void
  documentColors: string[] // cores extraídas do tema e blocos
  brandKitColors: string[] // cores guardadas no kit de marca
  onOpenEyedropper: () => void
  disabled?: boolean
}

export default function ColorPickerModalCanva({
  open,
  onClose,
  onPick,
  documentColors,
  brandKitColors,
  onOpenEyedropper,
  disabled = false,
}: ColorPickerModalCanvaProps) {
  const [search, setSearch] = useState('')

  // Filtrar cores por nome ou hex (simples, só hex aqui)
  const filteredDocumentColors = useMemo(() => {
    if (!search) return documentColors
    const lower = search.toLowerCase()
    return documentColors.filter((c) => c.toLowerCase().includes(lower))
  }, [search, documentColors])

  const filteredBrandColors = useMemo(() => {
    if (!search) return brandKitColors
    const lower = search.toLowerCase()
    return brandKitColors.filter((c) => c.toLowerCase().includes(lower))
  }, [search, brandKitColors])

  if (!open) return null

  // Estilo para desativar interações quando disabled
  const disabledStyle: React.CSSProperties = disabled
    ? { opacity: 0.5, pointerEvents: 'none', userSelect: 'none' }
    : {}

  // Handlers que respeitam disabled
  function handlePick(hex: string) {
    if (disabled) return
    onPick(hex)
  }

  function handleOpenEyedropper() {
    if (disabled) return
    onOpenEyedropper()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        ...disabledStyle,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 20,
          width: 360,
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <input
          type="text"
          placeholder='Experimente “azul” ou “#00c4cc”'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid #ccc',
            fontSize: 14,
          }}
          disabled={disabled}
        />

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 'bold' }}>Cores do documento</h3>
            <button
              onClick={handleOpenEyedropper}
              style={{
                border: 'none',
                background: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: 18,
                lineHeight: 1,
                padding: 0,
              }}
              title="Conta-gotas"
              disabled={disabled}
            >
              🎯
            </button>
          </div>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {filteredDocumentColors.map((hex) => (
              <button
                key={hex}
                onClick={() => handlePick(hex)}
                style={{
                  backgroundColor: hex,
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid #ccc',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
                title={hex}
                disabled={disabled}
              />
            ))}
            {filteredDocumentColors.length === 0 && <p style={{ fontSize: 12, color: '#999' }}>Nenhuma cor</p>}
          </div>
        </section>

        <section>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 'bold' }}>Kit de marca</h3>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {filteredBrandColors.map((hex) => (
              <button
                key={hex}
                onClick={() => handlePick(hex)}
                style={{
                  backgroundColor: hex,
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid #ccc',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                }}
                title={hex}
                disabled={disabled}
              />
            ))}
            {filteredBrandColors.length === 0 && <p style={{ fontSize: 12, color: '#999' }}>Nenhuma cor</p>}
          </div>
        </section>

        <button
          onClick={onClose}
          style={{
            marginTop: 16,
            padding: '10px 14px',
            borderRadius: 12,
            border: 'none',
            background: 'var(--color-primary)',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: 14,
          }}
          disabled={disabled}
        >
          Fechar
        </button>
      </div>
    </div>
  )
}
