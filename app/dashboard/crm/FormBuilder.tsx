'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { FormField } from '@/lib/crm/leadMagnets'

interface Form {
  id: string
  lead_magnet_id: string
  title: string
  fields: FormField[]
  created_at: string
  updated_at: string
}

interface FormBuilderProps {
  userId: string
  leadMagnetId: string
  formId?: string
  title: string
  onSave?: (form: Form) => void
}

export default function FormBuilder({
  userId,
  leadMagnetId,
  formId,
  title,
  onSave,
}: FormBuilderProps) {
  const [form, setForm] = useState<Form | null>(null)
  const [fields, setFields] = useState<FormField[]>([
    { id: 'name', label: 'Nome', type: 'text', required: true, placeholder: 'O teu nome' },
    { id: 'email', label: 'Email', type: 'email', required: true, placeholder: 'O teu email' },
    { id: 'phone', label: 'Telefone', type: 'tel', required: false, placeholder: 'O teu telefone' },
  ])
  const [optionsTextMap, setOptionsTextMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (formId) {
      loadForm()
    } else {
      const defaults = [
        { id: 'name', label: 'Nome', type: 'text', required: true, placeholder: 'O teu nome' },
        { id: 'email', label: 'Email', type: 'email', required: true, placeholder: 'O teu email' },
        { id: 'phone', label: 'Telefone', type: 'tel', required: false, placeholder: 'O teu telefone' },
      ] as FormField[]
      setFields(defaults)
      syncOptionsText(defaults)
    }
  }, [formId])

  function syncOptionsText(nextFields: FormField[]) {
    const nextMap: Record<string, string> = {}
    nextFields.forEach((field) => {
      nextMap[field.id] = (field.options || []).join('\n')
    })
    setOptionsTextMap(nextMap)
  }

  async function loadForm() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('lead_magnet_forms')
        .select('*')
        .eq('id', formId)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        const nextFields =
          Array.isArray(data.fields) && data.fields.length > 0
            ? data.fields
            : [
                { id: 'name', label: 'Nome', type: 'text', required: true, placeholder: 'O teu nome' },
                { id: 'email', label: 'Email', type: 'email', required: true, placeholder: 'O teu email' },
                { id: 'phone', label: 'Telefone', type: 'tel', required: false, placeholder: 'O teu telefone' },
              ]

        const normalized = normalizeFields(nextFields)

        setForm(data)
        setFields(normalized)
        syncOptionsText(normalized)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  function normalizeFields(nextFields: FormField[]): FormField[] {
    return nextFields.map((field, idx) => {
      if (!field.showIf) return field

      const previousFieldsWithOptions = nextFields
        .slice(0, idx)
        .filter((f) => isFieldTypeWithOptions(f.type) && (f.options || []).length > 0)

      if (previousFieldsWithOptions.length === 0) {
        return { ...field, showIf: undefined }
      }

      const closestField = previousFieldsWithOptions[previousFieldsWithOptions.length - 1]
      const closestOptions = closestField.options || []

      return {
        ...field,
        showIf: {
          fieldId: closestField.id,
          value: closestOptions.includes(field.showIf.value) ? field.showIf.value : (closestOptions[0] || ''),
        },
      }
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      const sanitizedFields = fields.map((field) => ({
        id: field.id,
        label: field.label,
        type: field.type,
        required: !!field.required,
        placeholder: field.placeholder || undefined,
        options: field.options && field.options.length > 0 ? field.options : undefined,
        showIf: field.showIf || undefined,
      }))

      if (form) {
        const { error } = await supabase
          .from('lead_magnet_forms')
          .update({
            title,
            fields: sanitizedFields,
            updated_at: new Date().toISOString(),
          })
          .eq('id', form.id)

        if (error) throw error

        await supabase
          .from('lead_magnets')
          .update({
            form_fields: sanitizedFields,
            updated_at: new Date().toISOString(),
          })
          .eq('id', leadMagnetId)

        const updated = {
          ...form,
          title,
          fields: sanitizedFields,
          updated_at: new Date().toISOString(),
        }

        setForm(updated)
        if (onSave) onSave(updated)
        alert('Perguntas guardadas com sucesso!')
      } else {
        const { data, error } = await supabase
          .from('lead_magnet_forms')
          .insert([
            {
              lead_magnet_id: leadMagnetId,
              title,
              fields: sanitizedFields,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single()

        if (error) throw error

        const { error: magnetError } = await supabase
          .from('lead_magnets')
          .update({
            form_id: data.id,
            form_fields: sanitizedFields,
            updated_at: new Date().toISOString(),
          })
          .eq('id', leadMagnetId)

        if (magnetError) throw magnetError

        setForm(data)
        if (onSave) onSave(data)
        alert('Perguntas guardadas com sucesso!')
      }
    } catch (e: any) {
      alert('Erro ao guardar: ' + e.message)
    }
    setSaving(false)
  }

  function addField() {
    const newField: FormField = {
      id: 'field-' + Date.now(),
      label: 'Nova pergunta',
      type: 'text',
      required: false,
    }
    setFields((prev) => [...prev, newField])
    setOptionsTextMap((prev) => ({ ...prev, [newField.id]: '' }))
  }

  function updateField(id: string, updates: Partial<FormField>) {
    setFields((prev) => {
      const next = prev.map((f) => {
        if (f.id !== id) return f

        const merged = { ...f, ...updates }

        if (updates.type && !isFieldTypeWithOptions(updates.type)) {
          delete merged.options
        }

        if (updates.type && ['select', 'radio', 'checkbox'].includes(updates.type) && !merged.options) {
          merged.options = []
        }

        if (merged.showIf) {
          const sourceField = prev.find((field) => field.id === merged.showIf?.fieldId)
          const sourceOptions = sourceField?.options || []
          if (!sourceOptions.includes(merged.showIf.value)) {
            merged.showIf = {
              fieldId: merged.showIf.fieldId,
              value: sourceOptions[0] || '',
            }
          }
        }

        return merged
      })

      return next.map((field) => {
        if (!field.showIf) return field

        const sourceField = next.find((f) => f.id === field.showIf?.fieldId)
        if (!sourceField || !isFieldTypeWithOptions(sourceField.type)) {
          return { ...field, showIf: undefined }
        }

        const sourceOptions = sourceField.options || []
        if (!sourceOptions.includes(field.showIf.value)) {
          return {
            ...field,
            showIf: {
              fieldId: field.showIf.fieldId,
              value: sourceOptions[0] || '',
            },
          }
        }

        return field
      })
    })
  }

  function updateOptionsText(id: string, text: string) {
    setOptionsTextMap((prev) => ({ ...prev, [id]: text }))
    const options = text
      .split('\n')
      .map((v) => v.trim())
      .filter(Boolean)
    updateField(id, { options })
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id))
    setOptionsTextMap((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  function isFieldTypeWithOptions(type: FormField['type']): boolean {
    return ['select', 'radio', 'checkbox'].includes(type)
  }

  function getFieldIndex(fieldId: string): number {
    return fields.findIndex((f) => f.id === fieldId)
  }

  function getClosestPreviousFieldWithOptions(currentFieldId: string): FormField | undefined {
    const currentIndex = getFieldIndex(currentFieldId)
    if (currentIndex <= 0) return undefined

    for (let i = currentIndex - 1; i >= 0; i--) {
      const field = fields[i]
      if (isFieldTypeWithOptions(field.type) && (field.options || []).length > 0) {
        return field
      }
    }

    return undefined
  }

  function getFieldById(fieldId: string): FormField | undefined {
    return fields.find((f) => f.id === fieldId)
  }

  if (loading) {
    return <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>A carregar...</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        {fields.map((field, idx) => (
          <div
            key={field.id}
            style={{
              marginBottom: 12,
              padding: 12,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>
                  Pergunta
                </label>
                <input
                  value={field.label}
                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    height: 32,
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: 12,
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ width: 140 }}>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>
                  Tipo
                </label>
                <select
                  value={field.type}
                  onChange={(e) => updateField(field.id, { type: e.target.value as FormField['type'] })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    height: 32,
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: 12,
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="text">Texto</option>
                  <option value="email">Email</option>
                  <option value="tel">Telefone</option>
                  <option value="textarea">Área de texto</option>
                  <option value="select">Dropdown</option>
                  <option value="radio">Radio buttons</option>
                  <option value="checkbox">Checkboxes</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 32 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                    style={{ cursor: 'pointer' }}
                  />
                  Obrigatório
                </label>
              </div>

              <button
                onClick={() => removeField(field.id)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(239,68,68,0.3)',
                  background: 'transparent',
                  color: '#ef4444',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                🗑
              </button>
            </div>

            {['text', 'email', 'tel', 'textarea'].includes(field.type) && (
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>
                  Placeholder (opcional)
                </label>
                <input
                  value={field.placeholder || ''}
                  onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    height: 32,
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: 12,
                    background: 'rgba(255,255,255,0.05)',
                    
 color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {isFieldTypeWithOptions(field.type) && (
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>
                  Opções (uma por linha)
                </label>
                <textarea
                  value={optionsTextMap[field.id] ?? (field.options || []).join('\n')}
                  onChange={(e) => updateOptionsText(field.id, e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    minHeight: 80,
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: 12,
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                    whiteSpace: 'pre-wrap',
                  }}
                  placeholder={'Opção 1\nOpção 2\nOpção 3'}
                />
              </div>
            )}

            {idx > 0 && (
              <div style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {!field.showIf ? (
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      const closestField = getClosestPreviousFieldWithOptions(field.id)
                      if (closestField) {
                        updateField(field.id, {
                          showIf: {
                            fieldId: closestField.id,
                            value: closestField.options?.[0] || '',
                          },
                        })
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'transparent',
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      zIndex: 10,
                      position: 'relative',
                    }}
                  >
                    + Adicionar condição
                  </button>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}>
                    <div
                      style={{
                        padding: '8px 10px',
                        height: 32,
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.75)',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        pointerEvents: 'none',
                      }}
                    >
                      {getFieldById(field.showIf.fieldId)?.label || 'Campo não encontrado'}
                    </div>

                    <select
                      value={field.showIf.value}
                      onChange={(e) =>
                        updateField(field.id, {
                          showIf: {
                            fieldId: field.showIf!.fieldId,
                            value: e.target.value,
                          },
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        height: 32,
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: 12,
                        background: 'rgba(255,255,255,0.05)',
                        color: '#fff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    >
                      {(getFieldById(field.showIf.fieldId)?.options || []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => updateField(field.id, { showIf: undefined })}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid rgba(239,68,68,0.3)',
                        background: 'transparent',
                        color: '#ef4444',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                        height: 32,
                      }}
                    >
                      Remover
                    </button>
                  </div>
                )}

                {!getClosestPreviousFieldWithOptions(field.id) && (
                  <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                    Para usar lógica condicional, cria antes uma pergunta do tipo dropdown, radio ou checkbox.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={addField}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          + Adicionar pergunta
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: 'none',
            background: saving ? 'rgba(59,130,246,0.5)' : '#3b82f6',
            color: '#fff',
            fontWeight: 700,
            fontSize: 12,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'A guardar...' : 'Guardar perguntas'}
        </button>
      </div>
    </div>
  )
}
