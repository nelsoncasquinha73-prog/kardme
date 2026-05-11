'use client'

import { useEffect, useState } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'

export type FormField = {
  id: string
  label: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select'
  required: boolean
  placeholder?: string
  options?: string[]
}

interface FormConfiguratorProps {
  config: FormField[] | null
  onChange: (fields: FormField[]) => void
}

export default function FormConfigurator({ config, onChange }: FormConfiguratorProps) {
  const [fields, setFields] = useState<FormField[]>(config || [])

  useEffect(() => {
    setFields(config || [])
  }, [config])

  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      label: 'Nova pergunta',
      type: 'text',
      required: true,
      placeholder: '',
    }
    const updated = [...fields, newField]
    setFields(updated)
    onChange(updated)
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    const updated = fields.map((f) => (f.id === id ? { ...f, ...updates } : f))
    setFields(updated)
    onChange(updated)
  }

  const removeField = (id: string) => {
    const updated = fields.filter((f) => f.id !== id)
    setFields(updated)
    onChange(updated)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
          {fields.length} pergunta{fields.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={addField}
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
          <FiPlus size={14} /> Adicionar pergunta
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fields.map((field, idx) => (
          <div
            key={field.id}
            style={{
              background: 'rgba(255,255,255,0.07)',
              borderRadius: 8,
              padding: 12,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                #{idx + 1}
              </span>
              <button
                onClick={() => removeField(field.id)}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="text"
                value={field.label}
                onChange={(e) => updateField(field.id, { label: e.target.value })}
                placeholder="Pergunta"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: 12,
                  outline: 'none',
                }}
              />

              <select
                value={field.type}
                onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: 12,
                  outline: 'none',
                }}
              >
                <option value="text">Texto curto</option>
                <option value="email">Email</option>
                <option value="phone">Telefone</option>
                <option value="textarea">Texto longo</option>
                <option value="select">Dropdown</option>
              </select>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!field.required}
                  onChange={(e) => updateField(field.id, { required: e.target.checked })}
                />
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Obrigatório</span>
              </label>

              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                placeholder="Placeholder (opcional)"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
          Nenhuma pergunta ainda. Clica em "Adicionar pergunta" para começar.
        </div>
      )}
    </div>
  )
}
