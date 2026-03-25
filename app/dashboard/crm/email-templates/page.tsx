'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { fetchEmailTemplates, createEmailTemplate, updateEmailTemplate, deleteEmailTemplate, type EmailTemplate } from '@/lib/crm/emailTemplates'

export default function EmailTemplatesPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [formData, setFormData] = useState({ name: '', category: 'Geral', subject: '', body: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)

  const categories = ['Geral', 'Agradecimento', 'Follow-up', 'Imobiliário', 'Excursões']

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      await loadTemplates(user.id)
    }
    getUser()
  }, [])

  const loadTemplates = async (uid: string) => {
    try {
      setLoading(true)
      const { data, error: err } = await fetchEmailTemplates({ userId: uid })
      if (err) throw err
      setTemplates(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template)
      setFormData({ name: template.name, category: template.category, subject: template.subject, body: template.body })
    } else {
      setEditingTemplate(null)
      setFormData({ name: '', category: 'Geral', subject: '', body: '' })
    }
    setShowNewCategory(false)
    setNewCategory('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.body) {
      setError('Preenche todos os campos')
      return
    }

    try {
      setSaving(true)
      setError(null)

      if (editingTemplate) {
        const { error: err } = await updateEmailTemplate({
          templateId: editingTemplate.id,
          name: formData.name,
          category: formData.category,
          subject: formData.subject,
          body: formData.body,
        })
        if (err) throw err
        setSuccess('Template atualizado com sucesso!')
      } else {
        if (!userId) throw new Error('Utilizador não identificado')
        const { error: err } = await createEmailTemplate({
          userId,
          name: formData.name,
          category: formData.category,
          subject: formData.subject,
          body: formData.body,
        })
        if (err) throw err
        setSuccess('Template criado com sucesso!')
      }

      setShowModal(false)
      await loadTemplates(userId!)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Tem a certeza que quer apagar este template?')) return
    try {
      const { error: err } = await deleteEmailTemplate({ templateId })
      if (err) throw err
      setSuccess('Template apagado com sucesso!')
      await loadTemplates(userId!)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0 }}>Email Templates</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: '8px 0 0 0' }}>Cria e gere templates de email para usar no CRM</p>
        </div>
        <button onClick={() => handleOpenModal()} style={{ padding: '12px 20px', borderRadius: 10, background: '#8b5cf6', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>+ Novo Template</button>
      </div>

      {error && <div style={{ padding: 12, borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', marginBottom: 16, fontSize: 13 }}>{error}</div>}
      {success && <div style={{ padding: 12, borderRadius: 10, background: 'rgba(34,197,94,0.15)', color: '#86efac', marginBottom: 16, fontSize: 13 }}>{success}</div>}

      {loading ? <p style={{ color: 'rgba(255,255,255,0.7)' }}>A carregar templates...</p> : templates.length === 0 ? <p style={{ color: 'rgba(255,255,255,0.7)' }}>Nenhum template criado ainda.</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 900, fontSize: 13, color: '#fff' }}>Nome</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 900, fontSize: 13, color: '#fff' }}>Categoria</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 900, fontSize: 13, color: '#fff' }}>Assunto</th>
              <th style={{ textAlign: 'center', padding: '12px 8px', fontWeight: 900, fontSize: 13, color: '#fff' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 8px', fontSize: 13, color: '#fff' }}>{t.name}</td>
                <td style={{ padding: '12px 8px', fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{t.category}</td>
                <td style={{ padding: '12px 8px', fontSize: 13, color: 'rgba(255,255,255,0.8)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  <button onClick={() => handleOpenModal(t)} style={{ padding: '6px 12px', borderRadius: 6, background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 12, marginRight: 8 }}>Editar</button>
                  <button onClick={() => handleDelete(t.id)} style={{ padding: '6px 12px', borderRadius: 6, background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>Apagar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 600, width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: '0 0 16px 0' }}>{editingTemplate ? 'Editar Template' : 'Novo Template'}</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 900, fontSize: 13, color: '#111827' }}>Nome</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.18)', fontSize: 13, boxSizing: 'border-box', color: '#111827' }} placeholder="Ex: Follow-up Pós-Evento" />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 900, fontSize: 13, color: '#111827' }}>Categoria</label>
              {!showNewCategory ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.18)', fontSize: 13, boxSizing: 'border-box', color: '#111827' }}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={() => setShowNewCategory(true)} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.18)', background: '#f3f4f6', color: '#111827', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>+ Nova</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && newCategory.trim()) { setFormData({ ...formData, category: newCategory }); setShowNewCategory(false); setNewCategory('') } }} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.18)', fontSize: 13, boxSizing: 'border-box', color: '#111827' }} placeholder="Ex: Eventos" autoFocus />
                  <button onClick={() => { if (newCategory.trim()) { setFormData({ ...formData, category: newCategory }); setShowNewCategory(false); setNewCategory('') } }} style={{ padding: '10px 12px', borderRadius: 10, background: '#8b5cf6', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>OK</button>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 900, fontSize: 13, color: '#111827' }}>Assunto</label>
              <input type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.18)', fontSize: 13, boxSizing: 'border-box', color: '#111827' }} placeholder="Ex: Obrigado pela presença!" />
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6, color: '#666' }}>Variáveis: {'{nome}'}, {'{email}'}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 900, fontSize: 13, color: '#111827' }}>Mensagem</label>
              <textarea value={formData.body} onChange={(e) => setFormData({ ...formData, body: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.18)', fontSize: 13, boxSizing: 'border-box', minHeight: 200, fontFamily: 'monospace', color: '#111827' }} placeholder="Ex: Olá {nome},\n\nObrigado por estar presente..." />
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6, color: '#666' }}>Variáveis: {'{nome}'}, {'{email}'}</div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(0,0,0,0.1)', color: '#111827', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '10px 20px', borderRadius: 10, background: '#8b5cf6', color: '#fff', border: 'none', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, opacity: saving ? 0.6 : 1 }}>{saving ? 'A guardar...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
