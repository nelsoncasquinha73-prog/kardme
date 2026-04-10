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
    { id: 'name', label: 'Nome', type: 'text', required: true },
    { id: 'email', label: 'Email', type: 'email', required: true },
    { id: 'phone', label: 'Telefone', type: 'tel', required: false },
  ])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (formId) {
      loadForm()
    }
  }, [formId])

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
        setForm(data)
        setFields(Array.isArray(data.fields) && data.fields.length > 0 ? data.fields : [
          { id: 'name', label: 'Nome', type: 'text', required: true },
          { id: 'email', label: 'Email', type: 'email', required: true },
          { id: 'phone', label: 'Telefone', type: 'tel', required: false },
        ])
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const sanitizedFields = fields.map((field) => ({
        id: field.id,
        label: field.label,
        type: field.type,
        required: !!field.required,
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
        alert('Formulário guardado com sucesso!')
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
        alert('Formulário criado com sucesso!')
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
  }

  function updateField(id: string, updates: Partial<FormField>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id))
  }

  if (loading) {
    return <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>A carregar...</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        {fields.map((field) => (
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

              <div style={{ width: 120 }}>
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
          </div>
        ))}
      </div>

      <button
        onClick={addField}
        style={{
          width: '100%',
          padding: '10px 0',
          borderRadius: 8,
          border: '1px dashed rgba(59,130,246,0.4)',
          background: 'rgba(59,130,246,0.08)',
          color: '#93c5fd',
          fontWeight: 700,
          fontSize: 12,
          cursor: 'pointer',
          marginBottom: 12,
        }}
      >
        + Adicionar pergunta
      </button>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          padding: '10px 0',
          borderRadius: 8,
          border: 'none',
          background: 'rgba(16,185,129,0.2)',
          color: '#10b981',
          fontWeight: 700,
          fontSize: 12,
          cursor: 'pointer',
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? '💾 A guardar...' : '✓ Guardar formulário'}
      </button>
    </div>
  )
}
