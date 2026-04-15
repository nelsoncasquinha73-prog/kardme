'use client'

import { useState, useRef, useEffect } from 'react'
import { Ambassador, toggleAmbassadorPublished } from '@/lib/ambassadors/ambassadorService'
import { FiX, FiUpload, FiPlus, FiTrash2, FiSliders } from 'react-icons/fi'
import ImagePositioner from './ImagePositioner'

interface AmbassadorEditModalProps {
  ambassador: Ambassador | null
  onClose: () => void
  onSave: (data: Partial<Ambassador>) => Promise<void>
  onRefresh?: () => void
}

type DefaultField = {
  id: 'name' | 'email' | 'phone'
  label: string
  type: 'text' | 'email' | 'tel'
  required: boolean
  enabled: boolean
}

type CustomField = {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select'
  required?: boolean
  enabled?: boolean
  options?: string[]
}

const DEFAULT_FIELDS: DefaultField[] = [
  { id: 'name', label: 'Nome', type: 'text', required: true, enabled: true },
  { id: 'email', label: 'Email', type: 'email', required: true, enabled: true },
  { id: 'phone', label: 'Telefone', type: 'tel', required: false, enabled: true },
]

const PRESET_FIELDS: Array<Pick<CustomField, 'id' | 'label' | 'type'> & { options?: string[] }> = [
  { id: 'interest_type', label: 'Tipo de Interesse', type: 'select', options: ['Comprador', 'Vendedor', 'Investidor'] },
  { id: 'location', label: 'Localização', type: 'text' },
  { id: 'budget', label: 'Orçamento', type: 'text' },
]

function generateUniqueId(): string {
  return `\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}`
}

export default function AmbassadorEditModal({ ambassador, onClose, onSave, onRefresh }: AmbassadorEditModalProps) {
  const [formData, setFormData] = useState<Partial<Ambassador>>(ambassador || {})
  const [saving, setSaving] = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)
  const [showAvatarPositioner, setShowAvatarPositioner] = useState(false)
  const [showCoverPositioner, setShowCoverPositioner] = useState(false)
  const coverRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setFormData({ ...ambassador, default_fields: ambassador?.default_fields || DEFAULT_FIELDS, custom_fields: ambassador?.custom_fields || [] })
  }, [ambassador])

  if (!formData?.id) return null

  const canPublish = true

  const handlePublish = async () => {
    if (!formData?.id) return
    setPublishLoading(true)
    try {
      const updatedAmbassador = await toggleAmbassadorPublished(formData.id!, !formData.is_published, formData.user_id)
      setFormData(updatedAmbassador)
      onRefresh?.()
    } catch (error) {
      console.error('Erro ao publicar:', error)
      alert('Erro ao atualizar publicação')
    } finally {
      setPublishLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(formData)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const defaultFields: DefaultField[] = ((formData as any).default_fields || DEFAULT_FIELDS) as DefaultField[]

  const updateDefaultField = (fieldId: DefaultField['id'], updates: Partial<DefaultField>) => {
    const updated = defaultFields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f))
    setFormData({ ...formData, default_fields: updated } as any)
  }

  const addCustomField = (preset?: (typeof PRESET_FIELDS)[number]) => {
    const newField: CustomField = preset
      ? {
          id: `preset_\${preset.id}_\${generateUniqueId()}`,
          label: preset.label,
          type: preset.type,
          required: false,
          enabled: true,
          options: preset.options,
        }
      : {
          id: `custom_\${generateUniqueId()}`,
          label: 'Novo campo',
          type: 'text',
          required: false,
          enabled: true,
        }

    setFormData({ ...formData, custom_fields: [...(((formData as any).custom_fields || []) as CustomField[]), newField] } as any)
  }

  const updateCustomField = (index: number, updates: Partial<CustomField>) => {
    const current = (((formData as any).custom_fields || []) as CustomField[])
    const next = [...current]
    next[index] = { ...next[index], ...updates }
    setFormData({ ...formData, custom_fields: next } as any)
  }

  const deleteCustomField = (index: number) => {
    const current = (((formData as any).custom_fields || []) as CustomField[])
    const next = current.filter((_, i) => i !== index)
    setFormData({ ...formData, custom_fields: next } as any)
  }

  const customFields = (((formData as any).custom_fields || []) as CustomField[])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#1e293b', borderRadius: 16, padding: 32, maxWidth: 600, maxHeight: '90vh', overflow: 'auto', width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Editar Embaixador</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 24 }}>
            <FiX />
          </button>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', color: '#cbd5e1', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Foto de Perfil</label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {formData.avatar_url && <img src={formData.avatar_url} alt="Avatar" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover' }} />}
            <button
              onClick={() => avatarRef.current?.click()}
              style={{ padding: '8px 16px', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <FiUpload size={14} /> Upload
            </button>
            {formData.avatar_url && (
              <button
                onClick={() => setShowAvatarPositioner(true)}
                style={{ padding: '8px 16px', borderRadius: 8, background: '#8b5cf6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <FiSliders size={14} /> Ajustar
              </button>
            )}
            <input
              ref={avatarRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (event) => setFormData({ ...formData, avatar_url: event.target?.result as string, avatar_settings: undefined })
                  reader.readAsDataURL(file)
                }
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', color: '#cbd5e1', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Foto de Cover</label>
          {formData.cover_url && (
            <div style={{ width: '100%', height: 120, background: `url(\${formData.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 8, marginBottom: 12 }} />
          )}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={() => coverRef.current?.click()}
              style={{ padding: '8px 16px', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <FiUpload size={14} /> Upload
            </button>
            {formData.cover_url && (
              <button
                onClick={() => setShowCoverPositioner(true)}
                style={{ padding: '8px 16px', borderRadius: 8, background: '#8b5cf6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <FiSliders size={14} /> Ajustar
              </button>
            )}
          </div>

          <input
            ref={coverRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                const reader = new FileReader()
                reader.onload = (event) => setFormData({ ...formData, cover_url: event.target?.result as string, cover_settings: undefined })
                reader.readAsDataURL(file)
              }
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', color: '#cbd5e1', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Slug (URL do Cartão)</label>
          <input
            type="text"
            placeholder="ex: nelson-domingos-4aiuyo"
            value={formData.slug || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
              })
            }
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 12 }}
          />
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>URL pública: kardme.com/emb/{formData.slug || 'seu-slug'}</p>
        </div>

        <div style={{ marginBottom: 24, padding: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', margin: '0 0 4px 0' }}>Estado do Cartão</p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{formData.is_published ? '🔒 Publicado' : '🔓 Despublicado'}</p>
            </div>
            <button
              onClick={handlePublish}
              disabled={publishLoading || !canPublish}
              style={{ padding: '8px 16px', borderRadius: 8, background: formData.is_published ? '#ef4444' : '#10b981', color: '#fff', border: 'none', cursor: publishLoading || !canPublish ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, opacity: publishLoading || !canPublish ? 0.5 : 1 }}
            >
              {publishLoading ? '...' : formData.is_published ? 'Despublicar' : 'Publicar'}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Campos do Formulário</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {defaultFields.map((field) => (
              <div key={field.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateDefaultField(field.id, { label: e.target.value })}
                    style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 12 }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#cbd5e1', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={field.enabled} onChange={(e) => updateDefaultField(field.id, { enabled: e.target.checked })} />
                    Ativo
                  </label>
                </div>
                {field.id !== 'name' && field.id !== 'email' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={field.required} onChange={(e) => updateDefaultField(field.id, { required: e.target.checked })} />
                    <span>Obrigatório</span
 <span>Obrigatório</span>
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 12px 0' }}>Adicionar Campo</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {PRESET_FIELDS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => addCustomField(preset)}
                style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', cursor: 'pointer', fontSize: 12, fontWeight: 600, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <FiPlus size={14} /> {preset.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => addCustomField()}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 }}
          >
            <FiPlus size={14} /> Campo Customizado
          </button>

          {customFields.map((field, index) => (
            <div key={`custom_field_${index}`} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  placeholder="Label"
                  value={field.label}
                  onChange={(e) => updateCustomField(index, { label: e.target.value })}
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 12 }}
                />

                <select
                  value={field.type}
                  onChange={(e) => updateCustomField(index, { type: e.target.value as any })}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 12 }}
                >
                  <option value="text">Texto</option>
                  <option value="textarea">Textarea</option>
                  <option value="select">Select</option>
                </select>

                <button
                  onClick={() => deleteCustomField(index)}
                  style={{ padding: '6px 10px', borderRadius: 6, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <FiTrash2 size={14} />
                </button>
              </div>

              {field.type === 'select' && (
                <div style={{ marginBottom: 8 }}>
                  <textarea
                    placeholder="Opções (uma por linha)"
                    value={(field.options || []).join('\n')}
                    onChange={(e) => {
                      const options = e.target.value.split('\n').filter(o => o.trim())
                      updateCustomField(index, { options })
                    }}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 12, minHeight: '60px', fontFamily: 'inherit' }}
                  />
                </div>
              )}

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={field.required || false} onChange={(e) => updateCustomField(index, { required: e.target.checked })} />
                <span>Obrigatório</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 12, cursor: 'pointer', marginTop: 8 }}>
                <input type="checkbox" checked={field.enabled !== false} onChange={(e) => updateCustomField(index, { enabled: e.target.checked })} />
                <span>Ativo</span>
              </label>
            </div>
          ))}
        </div>

        {showAvatarPositioner && formData.avatar_url && (
          <ImagePositioner
            imageUrl={formData.avatar_url}
            title="Ajustar Foto de Perfil"
            isCircle={true}
            onConfirm={(settings) => {
              setFormData({ ...formData, avatar_settings: settings })
              setShowAvatarPositioner(false)
            }}
            onCancel={() => setShowAvatarPositioner(false)}
          />
        )}

        {showCoverPositioner && formData.cover_url && (
          <ImagePositioner
            imageUrl={formData.cover_url}
            title="Ajustar Foto de Cover"
            isCircle={false}
            onConfirm={(settings) => {
              setFormData({ ...formData, cover_settings: settings })
              setShowCoverPositioner(false)
            }}
            onCancel={() => setShowCoverPositioner(false)}
          />
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 1, padding: '12px 24px', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '12px 24px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
