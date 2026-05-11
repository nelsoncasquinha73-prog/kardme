'use client'

import { useEffect, useState } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'

export type ChecklistItem = {
  id: string
  text: string
  completed?: boolean
}

interface ChecklistConfiguratorProps {
  config: ChecklistItem[] | null
  onChange: (items: ChecklistItem[]) => void
}

export default function ChecklistConfigurator({ config, onChange }: ChecklistConfiguratorProps) {
  const [items, setItems] = useState<ChecklistItem[]>(config || [])

  useEffect(() => {
    setItems(config || [])
  }, [config])

  const addItem = () => {
    const newItem: ChecklistItem = {
      id: `item-${Date.now()}`,
      text: 'Novo item',
      completed: false,
    }
    const updated = [...items, newItem]
    setItems(updated)
    onChange(updated)
  }

  const updateItem = (id: string, text: string) => {
    const updated = items.map((item) => (item.id === id ? { ...item, text } : item))
    setItems(updated)
    onChange(updated)
  }

  const removeItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id)
    setItems(updated)
    onChange(updated)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
          {items.length} item{items.length !== 1 ? 'ns' : ''}
        </span>
        <button
          onClick={addItem}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            borderRadius: 6,
            border: 'none',
            background: '#10b981',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <FiPlus size={14} /> Adicionar item
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, idx) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(255,255,255,0.07)',
              borderRadius: 8,
              padding: 12,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', minWidth: 20 }}>
              ✓
            </span>
            <input
              type="text"
              value={item.text}
              onChange={(e) => updateItem(item.id, e.target.value)}
              placeholder="Item da checklist"
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: 12,
                outline: 'none',
              }}
            />
            <button
              onClick={() => removeItem(item.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                padding: 0,
              }}
              title="Remover"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
          Nenhum item ainda. Clica em "Adicionar item" para começar.
        </div>
      )}
    </div>
  )
}
