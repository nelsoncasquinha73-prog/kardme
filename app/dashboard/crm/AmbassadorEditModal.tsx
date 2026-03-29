'use client'

import { useState, useRef, useEffect } from 'react'
import { Ambassador, toggleAmbassadorPublished } from '@/lib/ambassadors/ambassadorService'
import { FiX, FiUpload, FiPlus, FiTrash2 } from 'react-icons/fi'

interface AmbassadorEditModalProps {
  ambassador: Ambassador | null
  onClose: () => void
  onSave: (data: Partial<Ambassador>) => Promise<void>
  onRefresh?: () => void
}

export default function AmbassadorEditModal({ ambassador, onClose, onSave, onRefresh }: AmbassadorEditModalProps) {
  const [formData, setFormData] = useState<Partial<Ambassador>>(ambassador || {})
  const [saving, setSaving] = useState(false)
  const [publishLoading, setPublishLoading] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    console.log('Modal abriu com ambassador:', ambassador);
    setFormData(ambassador || {})
  }, [ambassador])

  if (!formData?.id) return null

  const handlePublish = async () => {
    if (!formData?.id) return
    setPublishLoading(true)
    try {
      const updatedAmbassador = await toggleAmbassadorPublished(
        formData.id!,
        !formData.is_published,
        formData.user_id
      )
      setFormData(updatedAmbassador)
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

  const addCustomField = () => {
    const newField = { id: `custom_${Date.now()}`, label: 'Novo campo', type: 'text' as const, required: false, enabled: true }
    setFormData({ ...formData, custom_fields: [...(formData.custom_fields || []), newField] })
  }

  const updateCustomField = (index: number, updates: any) => {
    const newFields = [...(formData.custom_fields || [])]
    newFields[index] = { ...newFields[index], ...updates }
    setFormData({ ...formData, custom_fields: newFields })
  }

  const deleteCustomField = (index: number) => {
    const newFields = (formData.custom_fields || []).filter((_, i) => i !== index)
    setFormData({ ...formData, custom_fields: newFields })
  }

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
            <button onClick={() => avatarRef.current?.click()} style={{ padding: '8px 16px', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiUpload size={14} /> Upload
            </button>
            <input ref={avatarRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                const reader = new FileReader()
                reader.onload = (event) => setFormData({ ...formData, avatar_url: event.target?.result as string })
                reader.readAsDataURL(file)
              }
            }} />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', color: '#cbd5e1', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Foto de Cover</label>
          {formData.cover_url && (
            <div style={{
              width: '100%',
              height: 120,
              background: `url(${formData.cover_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: 8,
              marginBottom: 12,
            }} />
          )}
          <button onClick={() => coverRef.current?.click()} style={{ padding: '8px 16px', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiUpload size={14} /> Upload
          </button>
          <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              const reader = new FileReader()
              reader.onload = (event) => setFormData({ ...formData, cover_url: event.target?.result as string })
              reader.readAsDataURL(file)
            }
          }} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', color: '#cbd5e1', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Slug (URL do Cartão)</label>
          <input type="text" placeholder="ex: nelson-domingos-4aiuyo" value={formData.slug || ''} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 12 }} />
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>URL pública: kardme.com/embaixador/{formData.slug || 'seu-slug'}</p>
        </div>

        <div style={{ marginBottom: 24, padding: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', margin: '0 0 4px 0' }}>Estado do Cartão</p>
              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                {formData.is_published ? '🔒 Publicado' : '🔓 Despublicado'}
              </p>
            </div>
            <button 
              onClick={handlePublish}
              disabled={publishLoading || formData.subscription_status !== 'active'}
              title={formData.subscription_status !== 'active' ? 'Ativa a subscrição para publicar' : ''}
              style={{ 
                padding: '8px 16px', 
                borderRadius: 8, 
                background: formData.is_published ? '#ef4444' : '#10b981',
                color: '#fff', 
                border: 'none', 
                cursor: (publishLoading || formData.subscription_status !== 'active') ? 'not-allowed' : 'pointer', 
                fontSize: 12, 
                fontWeight: 600,
                opacity: (publishLoading || formData.subscription_status !== 'active') ? 0.5 : 1
              }}
            >
              {publishLoading ? '...' : formData.is_published ? 'Despublicar' : 'Publicar'}
            </button>
          </div>
          {formData.subscription_status !== 'active' && (
            <p style={{ fontSize: 11, color: '#fbbf24', marginTop: 8, margin: '8px 0 0 0' }}>⚠️ Ativa a subscrição para publicar o cartão</p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {['background_color', 'text_color', 'bio_color'].map((field) => (
            <div key={field}>
              <label style={{ display: 'block', color: '#cbd5e1', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                {field === 'background_color' ? 'Cor de Fundo' : field === 'text_color' ? 'Cor do Texto' : 'Cor da Bio'}
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="color" value={(formData as any)[field] || '#000'} onChange={(e) => setFormData({ ...formData, [field]: e.target.value })} style={{ width: 50, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer' }} />
                <input type="text" value={(formData as any)[field] || ''} onChange={(e) => setFormData({ ...formData, [field]: e.target.value })} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 12 }} />
              </div>
            </div>
          ))}
          <div>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Fonte</label>
            <select value={formData.font_family || 'system-ui'} onChange={(e) => setFormData({ ...formData, font_family: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 12 }}>
              <option value="system-ui">System UI</option>
              <option value="serif">Serif</option>
              <option value="monospace">Monospace</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Campos do Formulário</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['show_interest_type', 'show_location', 'show_budget'].map((field) => (
              <label key={field} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', cursor: 'pointer' }}>
                <input type="checkbox" checked={(formData as any)[field] || false} onChange={() => setFormData({ ...formData, [field]: !(formData as any)[field] })} style={{ cursor: 'pointer' }} />
                <span style={{ fontSize: 12 }}>{field === 'show_interest_type' ? 'Tipo de Interesse' : field === 'show_location' ? 'Localização' : 'Orçamento'}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Campos Customizados</h3>
            <button onClick={addCustomField} style={{ padding: '6px 12px', borderRadius: 6, background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiPlus size={14} /> Adicionar
            </button>
          </div>
          {(formData.custom_fields || []).map((field, index) => (
            <div key={field.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input type="text" placeholder="Label" value={field.label} onChange={(e) => updateCustomField(index, { label: e.target.value })} style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 12 }} />
                <select value={field.type} onChange={(e) => updateCustomField(index, { type: e.target.value })} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 12 }}>
                  <option value="text">Texto</option>
                  <option value="textarea">Textarea</option>
                  <option value="select">Select</option>
                </select>
                <button onClick={() => deleteCustomField(index)} style={{ padding: '6px 10px', borderRadius: 6, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FiTrash2 size={14} />
                </button>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={field.required || false} onChange={(e) => updateCustomField(index, { required: e.target.checked })} style={{ cursor: 'pointer' }} />
                <span>Obrigatório</span>
              </label>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '12px 24px', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button onClick={onClose} style={{ flex: 1, padding: '12px 24px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
