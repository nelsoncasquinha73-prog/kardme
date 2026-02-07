'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useLanguage } from '@/components/language/LanguageProvider'


type Coupon = {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed' | 'free'
  discount_value: number
  max_uses: number | null
  uses_count: number
  valid_from: string
  valid_until: string | null
  template_id: string | null
  is_active: boolean
  created_at: string
  notes: string | null
}

type Template = {
  id: string
  name: string
}

const thStyle: React.CSSProperties = {
  padding: '14px 16px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 700,
  color: '#6b7280',
  textTransform: 'uppercase',
}

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  fontSize: 14,
  color: '#374151',
}

const btnSmall: React.CSSProperties = {
  padding: '6px 10px',
  background: '#f3f4f6',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 14,
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: 14,
  fontWeight: 600,
  color: '#374151',
}

const inputStyle: React.CSSProperties = {
  color: '#111827',
  background: '#fff',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  fontSize: 14,
  outline: 'none',
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const { t } = useLanguage()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [saving, setSaving] = useState(false)

  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'free'>('free')
  const [discountValue, setDiscountValue] = useState(0)
  const [maxUses, setMaxUses] = useState<number | ''>('')
  const [validUntil, setValidUntil] = useState('')
  const [templateId, setTemplateId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [couponsRes, templatesRes] = await Promise.all([
      supabase.from('coupons').select('*').order('created_at', { ascending: false }),
      supabase.from('templates').select('id, name').eq('is_active', true).order('name')
    ])
    if (couponsRes.data) setCoupons(couponsRes.data)
    if (templatesRes.data) setTemplates(templatesRes.data)
    setLoading(false)
  }

  function resetForm() {
    setCode('')
    setDiscountType('free')
    setDiscountValue(0)
    setMaxUses('')
    setValidUntil('')
    setTemplateId('')
    setNotes('')
    setIsActive(true)
    setEditingCoupon(null)
  }

  function openCreateModal() {
    resetForm()
    setShowModal(true)
  }

  function openEditModal(coupon: Coupon) {
    setEditingCoupon(coupon)
    setCode(coupon.code)
    setDiscountType(coupon.discount_type)
    setDiscountValue(coupon.discount_value)
    setMaxUses(coupon.max_uses ?? '')
    setValidUntil(coupon.valid_until ? coupon.valid_until.split('T')[0] : '')
    setTemplateId(coupon.template_id ?? '')
    setNotes(coupon.notes ?? '')
    setIsActive(coupon.is_active)
    setShowModal(true)
  }

  async function saveCoupon() {
    if (!code.trim()) {
      alert(t('dashboard.code_required'))
      return
    }
    setSaving(true)
    const data = {
      code: code.toUpperCase().trim(),
      discount_type: discountType,
      discount_value: discountType === 'free' ? 0 : discountValue,
      max_uses: maxUses === '' ? null : Number(maxUses),
      valid_until: validUntil ? new Date(validUntil).toISOString() : null,
      template_id: templateId || null,
      notes: notes || null,
      is_active: isActive,
    }
    try {
      if (editingCoupon) {
        const { error } = await supabase.from('coupons').update(data).eq('id', editingCoupon.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('coupons').insert(data)
        if (error) throw error
      }
      setShowModal(false)
      resetForm()
      loadData()
    } catch (err: any) {
      alert('Erro ao guardar: ' + (err.message || 'Desconhecido'))
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(coupon: Coupon) {
    await supabase.from('coupons').update({ is_active: !coupon.is_active }).eq('id', coupon.id)
    loadData()
  }

  async function deleteCoupon(coupon: Coupon) {
    if (!confirm(`Eliminar cupão "${coupon.code}"?`)) return
    await supabase.from('coupons').delete().eq('id', coupon.id)
    loadData()
  }

  function formatDate(date: string | null) {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('pt-PT')
  }

  function getDiscountLabel(coupon: Coupon) {
    if (coupon.discount_type === 'free') return '🎁 Grátis'
    if (coupon.discount_type === 'percentage') return `${coupon.discount_value}%`
    return `€${coupon.discount_value.toFixed(2)}`
  }

  function getTemplateName(id: string | null) {
    if (!id) return 'Todos'
    return templates.find(t => t.id === id)?.name ?? 'Desconhecido'
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
      
      <main style={{ flex: 1, padding: 32 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', margin: 0 }}>🎟️ {t('admin.coupons')}</h1>
              <p style={{ color: '#6b7280', marginTop: 4 }}>Cria e gere cupões de desconto para templates</p>
            </div>
            <button onClick={openCreateModal} style={{ padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              + {t('admin.create_coupon')}
            </button>
          </div>

          {loading ? (
            <p>A carregar...</p>
          ) : coupons.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, padding: 48, textAlign: 'center', color: '#6b7280' }}>
              <p style={{ fontSize: 18, marginBottom: 16 }}>Ainda não tens cupões criados</p>
              <button onClick={openCreateModal} style={{ padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>
                {t('admin.create_first_coupon')}
              </button>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={thStyle}>{t('admin.code')}</th>
                    <th style={thStyle}>{t('admin.discount')}</th>
                    <th style={thStyle}>Template</th>
                    <th style={thStyle}>{t('admin.uses')}</th>
                    <th style={thStyle}>Validade</th>
                    <th style={thStyle}>Estado</th>
                    <th style={thStyle}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map(coupon => (
                    <tr key={coupon.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={tdStyle}>
                        <code style={{ background: '#f3f4f6', padding: '4px 8px', borderRadius: 6, fontWeight: 700, fontSize: 13 }}>{coupon.code}</code>
                      </td>
                      <td style={tdStyle}>{getDiscountLabel(coupon)}</td>
                      <td style={tdStyle}>{getTemplateName(coupon.template_id)}</td>
                      <td style={tdStyle}>{coupon.uses_count}{coupon.max_uses ? ` / ${coupon.max_uses}` : ''}</td>
                      <td style={tdStyle}>{formatDate(coupon.valid_until)}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: coupon.is_active ? '#dcfce7' : '#fee2e2', color: coupon.is_active ? '#166534' : '#991b1b' }}>
                          {coupon.is_active ? t('admin.active') : t('admin.inactive')}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => openEditModal(coupon)} style={btnSmall}>✏️</button>
                          <button onClick={() => toggleActive(coupon)} style={btnSmall}>{coupon.is_active ? '⏸️' : '▶️'}</button>
                          <button onClick={() => deleteCoupon(coupon)} style={{ ...btnSmall, color: '#dc2626' }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>
              {editingCoupon ? t('admin.edit_coupon') : t('admin.create_coupon')}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label style={labelStyle}>
                <span>{t('admin.code')} *</span>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ex: GRATIS100" style={{...inputStyle, color: "#111827"}} />
              </label>

              <label style={labelStyle}>
                <span>{t('admin.discount_type')}</span>
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)} style={inputStyle}>
                  <option value="free">🎁 Grátis (100% desconto)</option>
                  <option value="percentage">📊 Percentagem</option>
                  <option value="fixed">💶 Valor fixo</option>
                </select>
              </label>

              {discountType !== 'free' && (
                <label style={labelStyle}>
                  <span>{discountType === 'percentage' ? 'Percentagem (%)' : 'Valor (€)'}</span>
                  <input type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} min={0} max={discountType === 'percentage' ? 100 : undefined} style={inputStyle} />
                </label>
              )}

              <label style={labelStyle}>
                <span>Limite de Usos (vazio = ilimitado)</span>
                <input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value === '' ? '' : Number(e.target.value))} min={1} placeholder="Ilimitado" style={inputStyle} />
              </label>

              <label style={labelStyle}>
                <span>Válido até (vazio = sem limite)</span>
                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} style={inputStyle} />
              </label>

              <label style={labelStyle}>
                <span>Template específico (vazio = todos)</span>
                <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} style={inputStyle}>
                  <option value="">Todos os templates</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                <span>Notas internas</span>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Oferta para cliente X" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span>Cupão ativo</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button onClick={() => { setShowModal(false); resetForm() }} style={{ flex: 1, padding: '12px 24px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>
                {t('dashboard.cancel')}
              </button>
              <button onClick={saveCoupon} disabled={saving} style={{ flex: 1, padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
