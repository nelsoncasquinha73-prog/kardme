'use client'

import '@/styles/dashboard-modal.css'
import { useState } from 'react'

type SaveAsTemplateModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: {
    name: string
    description: string
    category: string
    price: number
  }) => Promise<void>
  isLoading: boolean
}

export default function SaveAsTemplateModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: SaveAsTemplateModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('geral')
  const [price, setPrice] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }

    try {
      await onConfirm({ name, description, category, price })
      setName('')
      setDescription('')
      setCategory('geral')
      setPrice(0)
      setError(null)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar template')
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Guardar como template</h2>
        <p className="modal-description">
          Este cartão será guardado como template e disponibilizado no catálogo.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Nome */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, color: 'rgba(255,255,255,0.92)' }}>
              Nome do template *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Imobiliário Premium"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.92)',
                marginTop: 6,
                fontSize: 13,
              }}
            />
          </div>

          {/* Descrição */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, color: 'rgba(255,255,255,0.92)' }}>
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Template premium para agentes imobiliários"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.92)',
                marginTop: 6,
                fontSize: 13,
                minHeight: 60,
                resize: 'none',
              }}
            />
          </div>

          {/* Categoria */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, color: 'rgba(255,255,255,0.92)' }}>
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.92)',
                marginTop: 6,
                fontSize: 13,
              }}
            >
              <option value="geral">Geral</option>
              <option value="imobiliario">Imobiliário</option>
              <option value="restaurante">Restaurante</option>
              <option value="vendas">Vendas</option>
              <option value="consultoria">Consultoria</option>
              <option value="tech">Tech</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          {/* Preço */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, color: 'rgba(255,255,255,0.92)' }}>
              Preço (€) — 0 = grátis
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.5"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.92)',
                marginTop: 6,
                fontSize: 13,
              }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: 'rgba(255, 120, 120, 0.95)', marginTop: 4 }}>
              {error}
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button className="modal-btn modal-btn-cancel" onClick={onClose} disabled={isLoading}>
            Cancelar
          </button>
          <button className="modal-btn modal-btn-confirm" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'A guardar…' : 'Guardar template'}
          </button>
        </div>
      </div>
    </div>
  )
}
