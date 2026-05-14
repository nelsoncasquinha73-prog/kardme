'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FiPlus, FiTrash2, FiChevronDown } from 'react-icons/fi'

export type FormField = {
  id: string
  label: string
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio'
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

  const uid = () => `field-${Date.now()}-${Math.random()}`

  const normalizedConfig = useMemo(() => {
    const next = (config || []).map((f: any) => ({ ...f, id: f?.id || uid() }))
    return next
  }, [config])

  useEffect(() => {
    const hasMissing = (config || []).some((f: any) => !f?.id)
    if (hasMissing) {
      onChange(normalizedConfig as any)
      setFields(normalizedConfig as any)
    }
  }, [config])
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    const next = config || []
    const nextIds = next.map((f) => f.id).join('|')
    const currIds = fields.map((f) => f.id).join('|')

    // Só sincroniza quando a estrutura mudou (add/remove/reorder)
    if (next.length !== fields.length || nextIds !== currIds) {
      setFields(next)
    }
  }, [config, fields])

  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}-${Math.random()}`,
      label: '',
      type: 'text',
      required: true,
      placeholder: '',
    }
    const updated = [...fields, newField]
    setFields(updated)
    onChange(updated)
  }

  const updateField = (id: string, updates: Partial<FormField>) => {
    console.log('🔵 updateField:', { targetId: id, currentFieldIds: fields.map(f => f.id), updates })
    const updated = fields.map((f) => (f.id === id ? { ...f, ...updates } : f))
    console.log('🟢 result:', updated.map(f => ({ id: f.id, label: f.label })))
    setFields(updated)
    onChange(updated)
  }

  const removeField = (id: string) => {
    const updated = fields.filter((f) => f.id !== id)
    setFields(updated)
    onChange(updated)
  }

  const addOption = (fieldId: string) => {
    const updated = fields.map((f) => {
      if (f.id === fieldId) {
        return { ...f, options: [...(f.options || []), 'Nova opção'] }
      }
      return f
    })
    setFields(updated)
    onChange(updated)
  }

  const updateOption = (fieldId: string, optionIdx: number, text: string) => {
    const updated = fields.map((f) => {
      if (f.id === fieldId) {
        const opts = [...(f.options || [])]
        opts[optionIdx] = text
        return { ...f, options: opts }
      }
      return f
    })
    setFields(updated)
    onChange(updated)
  }

  const removeOption = (fieldId: string, optionIdx: number) => {
    const updated = fields.map((f) => {
      if (f.id === fieldId) {
        const opts = (f.options || []).filter((_, i) => i !== optionIdx)
        return { ...f, options: opts.length > 0 ? opts : undefined }
      }
      return f
    })
    setFields(updated)
    onChange(updated)
  }

  const needsOptions = (type: string) => ['select', 'checkbox', 'radio'].includes(type)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
          {fields.length} pergunta{fields.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={addField}
          disabled={editingId !== null}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            borderRadius: 6,
            border: 'none',
            background: editingId !== null ? '#6b7280' : '#10b981',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: editingId !== null ? 'not-allowed' : 'pointer',
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
                placeholder="Escreve a pergunta (ex: Qual é o teu objetivo?)"
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
                <option value="select">Dropdown (uma resposta)</option>
                <option value="radio">Radio buttons (uma resposta)</option>
                <option value="checkbox">Checkboxes (múltiplas respostas)</option>
              </select>

              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!field.required}
                  onChange={(e) => updateField(field.id, { required: e.target.checked })}
                />
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>Obrigatório</span>
              </label>

              {!needsOptions(field.type) && (
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
              )}

              {needsOptions(field.type) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                    Opções
                  </div>
                  {(field.options || []).map((opt, optIdx) => (
                    <div key={optIdx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(field.id, optIdx, e.target.value)}
                        placeholder="Opção"
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          borderRadius: 4,
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(255,255,255,0.03)',
                          color: '#fff',
                          fontSize: 11,
                          outline: 'none',
                        }}
                      />
                      <button
                        onClick={() => removeOption(field.id, optIdx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 12,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(field.id)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 4,
                      border: '1px dashed rgba(255,255,255,0.2)',
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginTop: 4,
                    }}
                  >
                    + Adicionar opção
                  </button>
                </div>
              )}
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
