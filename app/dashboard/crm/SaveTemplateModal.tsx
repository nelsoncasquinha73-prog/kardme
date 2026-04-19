'use client'

import { useState } from 'react'

interface SaveTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  templateName: string
  setTemplateName: (name: string) => void
  templateCategory: string
  setTemplateCategory: (category: string) => void
  blocksCount: number
  onSave: () => void
}

export default function SaveTemplateModal({
  isOpen,
  onClose,
  templateName,
  setTemplateName,
  templateCategory,
  setTemplateCategory,
  blocksCount,
  onSave,
}: SaveTemplateModalProps) {
  const [categories, setCategories] = useState([
    'Geral',
    'Agradecimento',
    'Follow-up',
    'Imobiliário',
    'Excursões',
  ])
  const [newCategoryInput, setNewCategoryInput] = useState('')
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)

  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim()
    if (!trimmed) {
      alert('Categoria não pode estar vazia')
      return
    }
    if (categories.includes(trimmed)) {
      alert('Esta categoria já existe')
      return
    }
    setCategories([...categories, trimmed])
    setTemplateCategory(trimmed)
    setNewCategoryInput('')
    setShowNewCategoryInput(false)
  }

  if (!isOpen) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2001 }}>
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, maxWidth: 500, width: '90%', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 16px 0' }}>💾 Guardar como Template</h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13, color: '#fff' }}>Nome</label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Ex: Follow-up Imobiliário"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 13, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13, color: '#fff' }}>Categoria</label>
          <select
            value={templateCategory}
            onChange={(e) => {
              if (e.target.value === '__new__') {
                setShowNewCategoryInput(true)
              } else {
                setTemplateCategory(e.target.value)
              }
            }}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 13, boxSizing: 'border-box', minHeight: '42px' }}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="__new__">+ Nova categoria…</option>
          </select>
        </div>

        {showNewCategoryInput && (
          <div style={{ marginBottom: 16, padding: 12, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13, color: '#fff' }}>Nova Categoria</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCategory()
                }}
                placeholder="Ex: Restaurantes"
                style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 13, boxSizing: 'border-box' }}
                autoFocus
              />
              <button
                onClick={handleAddCategory}
                style={{ padding: '10px 16px', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}
              >
                ✓ Adicionar
              </button>
            </div>
          </div>
        )}

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '0 0 16px 0' }}>📦 Vão ser guardados {blocksCount} blocos neste template.</p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
          <button onClick={onSave} style={{ padding: '10px 16px', borderRadius: 8, background: '#10b981', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Guardar Template</button>
        </div>
      </div>
    </div>
  )
}
