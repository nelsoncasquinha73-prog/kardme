'use client'

import { FiEdit2 } from 'react-icons/fi'

interface RenameCardModalProps {
  isOpen: boolean
  card: any
  newName: string
  onNameChange: (name: string) => void
  onSave: () => void
  onClose: () => void
}

export default function RenameCardModal({
  isOpen,
  card,
  newName,
  onNameChange,
  onSave,
  onClose,
}: RenameCardModalProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a2744',
          padding: '24px',
          borderRadius: '12px',
          minWidth: '300px',
          border: '1px solid #3b82f6',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: '16px', color: '#fff' }}>Editar nome do cartão</h3>
        <input
          type="text"
          value={newName}
          onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSave()}
          style={{
            width: '100%',
            padding: '8px 12px',
            marginBottom: '16px',
            background: '#0f1729',
            border: '1px solid #3b82f6',
            borderRadius: '6px',
            color: '#fff',
            boxSizing: 'border-box',
          }}
          autoFocus
        />
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            style={{
              padding: '8px 16px',
              background: '#a855f7',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

export function CardNameWithEdit({
  name,
  onEdit,
}: {
  name: string
  onEdit: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <p className="card-name">{name}</p>
      <button
        type="button"
        onClick={onEdit}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#60a5fa',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
        }}
        title="Editar nome"
      >
        <FiEdit2 size={16} />
      </button>
    </div>
  )
}
