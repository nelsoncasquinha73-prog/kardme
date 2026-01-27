'use client'

import '@/styles/dashboard-modal.css'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type CategoryRow = { id: number; name: string; slug: string; sort_order: number; is_active: boolean }
type SubcategoryRow = { id: number; category_id: number; name: string; slug: string; sort_order: number }

type SaveAsTemplateModalProps = {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: {
    name: string
    description: string
    category: string
    category_id: number | null
    subcategory_id: number | null
    price: number
  }) => Promise<void>
  isLoading: boolean
}

export default function SaveAsTemplateModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: SaveAsTemplateModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('geral')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null)
  const [price, setPrice] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [subcategories, setSubcategories] = useState<SubcategoryRow[]>([])
  const [catsLoading, setCatsLoading] = useState(false)

  // Carregar categorias quando o modal abre
  useEffect(() => {
    if (isOpen) {
      loadCategories()
    }
  }, [isOpen])

  const loadCategories = async () => {
    setCatsLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (!error) setCategories((data || []) as CategoryRow[])
    setCatsLoading(false)
  }

  const loadSubcategories = async (catId: number | null) => {
    if (!catId) {
      setSubcategories([])
      return
    }

    const { data, error } = await supabase
      .from('subcategories')
      .select('id, category_id, name, slug, sort_order')
      .eq('category_id', catId)
      .order('sort_order', { ascending: true })

    if (!error) setSubcategories((data || []) as SubcategoryRow[])
  }

  const handleCategoryChange = async (newCatId: number | null) => {
    setCategoryId(newCatId)
    setSubcategoryId(null)
    
    if (newCatId) {
      const cat = categories.find((c) => c.id === newCatId)
      setCategory(cat?.slug || 'geral')
      await loadSubcategories(newCatId)
    } else {
      setCategory('geral')
      setSubcategories([])
    }
  }

  const handleConfirm = async () => {
    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }

    try {
      await onConfirm({
        name,
        description,
        category,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        price,
      })
      setName('')
      setDescription('')
      setCategory('geral')
      setCategoryId(null)
      setSubcategoryId(null)
      setPrice(0)
      setError(null)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar template')
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Guardar como template</h2>
        <p className="modal-description">
          Este cartão será guardado como template e disponibilizado no catálogo.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Nome */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, color: 'rgba(255,255,255,0.92)' }}>
              Nome do template *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Imobiliário Premium"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.92)',
                marginTop: 6,
                fontSize: 13,
              }}
            />
          </div>

          {/* Descrição */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, color: 'rgba(255,255,255,0.92)' }}>
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Template premium para agentes imobiliários"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.92)',
                marginTop: 6,
                fontSize: 13,
                minHeight: 60,
                resize: 'none',
              }}
            />
          </div>

          {/* Categoria */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, color: 'rgba(255,255,255,0.92)' }}>
              Categoria
            </label>
            <select
              value={categoryId ?? ''}
              onChange={(e) => handleCategoryChange(e.target.value ? Number(e.target.value) : null)}
              disabled={catsLoading}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.92)',
                marginTop: 6,
                fontSize: 13,
              }}
            >
              <option value="">— Selecionar categoria —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategoria */}
          {categoryId && subcategories.length > 0 && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, color: 'rgba(255,255,255,0.92)' }}>
                Subcategoria (opcional)
              </label>
              <select
                value={subcategoryId ?? ''}
                onChange={(e) => setSubcategoryId(e.target.value ? Number(e.target.value) : null)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.92)',
                  marginTop: 6,
                  fontSize: 13,
                }}
              >
                <option value="">— Selecionar subcategoria —</option>
                {subcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Preço */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, color: 'rgba(255,255,255,0.92)' }}>
              Preço (€) — 0 = grátis
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.5"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.92)',
                marginTop: 6,
                fontSize: 13,
              }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: 'rgba(255, 120, 120, 0.95)', marginTop: 4 }}>
              {error}
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: 20 }}>
          <button className="modal-btn modal-btn-cancel" onClick={onClose} disabled={isLoading}>
            Cancelar
          </button>
          <button className="modal-btn modal-btn-confirm" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'A guardar…' : 'Guardar template'}
          </button>
        </div>
      </div>
    </div>
  )
}
