'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import '@/styles/dashboard.css'
import '@/styles/admin-templates.css'
import { getBaseTemplateBlocks } from '@/lib/templates/baseTemplateBlocks'
import { TEMPLATE_CATEGORIES, CATEGORY_LABELS } from '@/lib/templates/categories'


type Template = {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number | null
  image_url: string | null
  preview_json: any[] | null
  is_active: boolean | null
  created_at?: string | null
}

type EditDraft = {
  name: string
  description: string
  category: string
  price: number
  image_url: string
}

const ADMIN_EMAIL = 'admin@kardme.com'

function money(n: number | null | undefined) {
  const v = typeof n === 'number' ? n : 0
  return `€${v.toFixed(2)}`
}
type NewTemplateModal = {
  name: string
  category: string
  price: number
}


export default function AdminTemplatesPage() {
  const router = useRouter()

  const [checkingAuth, setCheckingAuth] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')

  const [editId, setEditId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [openingId, setOpeningId] = useState<string | null>(null)

const [showNewModal, setShowNewModal] = useState(false)
const [newModalDraft, setNewModalDraft] = useState<NewTemplateModal>({
  name: '',
  category: 'geral',
  price: 0,
})
const [creatingNew, setCreatingNew] = useState(false)


  useEffect(() => {
    const run = async () => {
      setCheckingAuth(true)
      const { data, error } = await supabase.auth.getUser()
      if (error) {
        setUserEmail(null)
        setCheckingAuth(false)
        return
      }
      setUserEmail(data?.user?.email || null)
      setCheckingAuth(false)
    }
    run()
  }, [])

  const isAdmin = userEmail === ADMIN_EMAIL

  const loadTemplates = async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setTemplates([])
      setLoading(false)
      return
    }

    setTemplates((data || []) as Template[])
    setLoading(false)
  }

  useEffect(() => {
    if (!checkingAuth && isAdmin) loadTemplates()
  }, [checkingAuth, isAdmin])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return templates.filter((t) => {
      const matchesQuery =
        !q ||
        (t.name || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)

      const active = !!t.is_active
      const matchesActive =
        filterActive === 'all' ? true : filterActive === 'active' ? active : !active

      return matchesQuery && matchesActive
    })
  }, [templates, query, filterActive])

  const startEdit = (t: Template) => {
    setEditId(t.id)
    setEditDraft({
      name: t.name || '',
      description: t.description || '',
      category: t.category || 'geral',
      price: typeof t.price === 'number' ? t.price : 0,
      image_url: t.image_url || '',
    })
  }
  const editTemplate = async (templateId: string) => {
    setOpeningId(templateId)
    setError(null)

    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser()
      if (authErr || !authData?.user?.id) {
        setError('Sem sessão. Faz login novamente.')
        setOpeningId(null)
        return
      }

      const userId = authData.user.id
      const template = templates.find((t) => t.id === templateId)
      if (!template) {
        setError('Template não encontrado')
        setOpeningId(null)
        return
      }

      // 1) Criar card "draft" a partir do template
      const { data: newCard, error: cardErr } = await supabase
        .from('cards')
        .insert({
          user_id: userId,
          name: `[DRAFT] ${template.name}`,
          slug: `draft-template-${templateId}-${Date.now()}`,
          template_id: templateId,
          is_template_draft: true,
        })
        .select('id')
        .single()

      if (cardErr) {
        setError(cardErr.message)
        setOpeningId(null)
        return
      }

      const cardId = newCard.id

      // 2) Copiar blocos do template para o card
      const blocks = Array.isArray(template.preview_json) ? template.preview_json : []
      if (blocks.length) {
        const blocksToInsert = blocks.map((block: any, index: number) => ({
          card_id: cardId,
          type: block.type,
          order: block.order !== undefined ? block.order : index,
          settings: block.settings || {},
          style: block.style || {},
          title: block.title || null,
          enabled: block.enabled !== undefined ? block.enabled : true,
        }))

        const { error: blocksErr } = await supabase
          .from('card_blocks')
          .insert(blocksToInsert)

        if (blocksErr) {
          setError(`Erro ao copiar blocos: ${blocksErr.message}`)
          setOpeningId(null)
          return
        }
      }

      // 3) Redirecionar para o editor
      router.push(`/dashboard/cards/${cardId}/theme?template_id=${templateId}`)
    } catch (e: any) {
      setError(e.message || 'Erro ao abrir template para edição')
      setOpeningId(null)
    }
  }

  const cancelEdit = () => {
    setEditId(null)
    setEditDraft(null)
  }

  const saveEdit = async () => {
    if (!editId || !editDraft) return
    setSavingId(editId)
    setError(null)

    try {
      if (!editDraft.name.trim()) throw new Error('Nome é obrigatório.')

      const payload = {
        name: editDraft.name.trim(),
        description: editDraft.description.trim() || null,
        category: editDraft.category.trim() || 'geral',
        price: Number.isFinite(editDraft.price) ? editDraft.price : 0,
        image_url: editDraft.image_url.trim() || null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('templates').update(payload).eq('id', editId)
      if (error) throw new Error(error.message)

      setTemplates((prev) =>
        prev.map((t) => (t.id === editId ? ({ ...t, ...payload } as Template) : t))
      )

      setSavingId(null)
      cancelEdit()
    } catch (e) {
      setSavingId(null)
      setError(e instanceof Error ? e.message : 'Erro ao guardar.')
    }
  }

  const toggleActive = async (t: Template) => {
    setTogglingId(t.id)
    setError(null)

    try {
      const next = !t.is_active
      const { error } = await supabase
        .from('templates')
        .update({ is_active: next, updated_at: new Date().toISOString() })
        .eq('id', t.id)

      if (error) throw new Error(error.message)

      setTemplates((prev) => prev.map((x) => (x.id === t.id ? { ...x, is_active: next } : x)))
      setTogglingId(null)
    } catch (e) {
      setTogglingId(null)
      setError(e instanceof Error ? e.message : 'Erro ao atualizar estado.')
    }
  }

  const deleteTemplate = async (t: Template) => {
    const ok = confirm(`Apagar o template "${t.name}"? Esta ação não dá para reverter.`)
    if (!ok) return

    setDeletingId(t.id)
    setError(null)

    try {
      const { error } = await supabase.from('templates').delete().eq('id', t.id)
      if (error) throw new Error(error.message)

      setTemplates((prev) => prev.filter((x) => x.id !== t.id))
      setDeletingId(null)
    } catch (e) {
      setDeletingId(null)
      setError(e instanceof Error ? e.message : 'Erro ao apagar.')
    }
  }

  const openInEditor = async (t: Template) => {
    setOpeningId(t.id)
    setError(null)

    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser()
      if (authErr || !authData?.user?.id) throw new Error('Sem sessão. Faz login novamente.')
      const userId = authData.user.id

      const { data: newCard, error: cardErr } = await supabase
        .from('cards')
        .insert({
          user_id: userId,
          name: `${t.name} (variação)`,
          slug: `card-${Date.now()}`,
          template_id: t.id,
        })
        .select('id')
        .single()

      if (cardErr) throw new Error(cardErr.message)
      const cardId = newCard.id

      const blocks = Array.isArray(t.preview_json) ? t.preview_json : []
      if (blocks.length) {
        const blocksToInsert = blocks.map((b: any, idx: number) => ({
          card_id: cardId,
          type: b.type,
          order: b.order ?? idx,
          title: b.title ?? null,
          enabled: b.enabled ?? true,
          settings: b.settings ?? {},
          style: b.style ?? {},
        }))

        const { error: blocksErr } = await supabase.from('card_blocks').insert(blocksToInsert)
        if (blocksErr) throw new Error(blocksErr.message)
      }

      router.push(`/dashboard/cards/${cardId}/theme`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao abrir no editor.')
      setOpeningId(null)
      return
    }

    setOpeningId(null)
  }
const createNewTemplate = async () => {
  if (!newModalDraft.name.trim()) {
    setError('Nome é obrigatório.')
    return
  }

  setCreatingNew(true)
  setError(null)

  try {
    const { data: authData, error: authErr } = await supabase.auth.getUser()
    if (authErr || !authData?.user?.id) throw new Error('Sem sessão.')
    const userId = authData.user.id

    const { data: newCard, error: cardErr } = await supabase
      .from('cards')
      .insert({
        user_id: userId,
        name: `[NOVO] ${newModalDraft.name.trim()}`,
        slug: `new-template-${Date.now()}`,
        theme: { background: '#ffffff' },
      })
      .select('id')
      .single()

    if (cardErr) throw new Error(cardErr.message)
    const cardId = newCard.id

    const baseBlocks = getBaseTemplateBlocks()
    const blocksToInsert = baseBlocks.map((b: any) => ({
      card_id: cardId,
      type: b.type,
      order: b.order,
      title: b.title,
      enabled: b.enabled,
      settings: b.settings,
      style: b.style,
    }))

    const { error: blocksErr } = await supabase.from('card_blocks').insert(blocksToInsert)
    if (blocksErr) throw new Error(blocksErr.message)

    setShowNewModal(false)
    setNewModalDraft({ name: '', category: 'geral', price: 0 })
    setCreatingNew(false)

    router.push(`/dashboard/cards/${cardId}/theme`)
  } catch (e) {
    setCreatingNew(false)
    setError(e instanceof Error ? e.message : 'Erro ao criar template.')
  }
}

  if (checkingAuth) {
    return <p style={{ padding: 24 }}>A verificar sessão…</p>
  }

  if (!isAdmin) {
    return (
      <div className="dashboard-wrap">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Admin • Templates</h1>
            <p className="dashboard-subtitle">Acesso restrito.</p>
          </div>

          <Link className="btn-secondary" href="/dashboard">
            ← Voltar
          </Link>
        </div>

        <div className="admin-templates-guard">
          <div className="admin-templates-guard-card">
            <h2>Sem permissões</h2>
            <p>
              Estás logado como <b>{userEmail || '—'}</b>.
              Este painel só está disponível para <b>{ADMIN_EMAIL}</b>.
            </p>
            <p style={{ opacity: 0.8, marginTop: 10 }}>
              Dica: confirma que estás mesmo com a conta admin e faz refresh.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-wrap">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Admin • Templates</h1>
          <p className="dashboard-subtitle">
            Gerir templates (editar meta, ativar/desativar, apagar, abrir no editor).
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link className="btn-secondary" href="/dashboard">
            ← Voltar
          </Link>

          <button className="btn-secondary" onClick={loadTemplates} disabled={loading}>
            {loading ? 'A atualizar…' : 'Recarregar'}
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}


  <div className="admin-templates-toolbar">
  <button 
    className="btn-primary" 
    onClick={() => setShowNewModal(true)}
    disabled={loading}
    style={{ marginRight: 'auto' }}
  >
    + Novo Template
  </button>

  <div className="admin-templates-search">
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Pesquisar por nome, categoria, descrição…"
    />
  </div>


        <div className="admin-templates-filters">
          <select value={filterActive} onChange={(e) => setFilterActive(e.target.value as any)}>
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>

        <div className="admin-templates-count">
          {filtered.length} / {templates.length}
        </div>
      </div>

      {loading ? (
        <p style={{ padding: 24 }}>A carregar templates…</p>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <p className="empty-title">Sem templates</p>
          <p className="empty-desc">
            Cria um template no editor e usa "Guardar como template", ou insere um starter via SQL.
          </p>
        </div>
      ) : (
        <div className="admin-templates-grid">
          {filtered.map((t) => {
            const isEditing = editId === t.id
            const draft = isEditing ? editDraft : null

const createNewTemplate = async () => {
  if (!newModalDraft.name.trim()) {
    setError('Nome é obrigatório.')
    return
  }

  setCreatingNew(true)
  setError(null)

  try {
    const { data: authData, error: authErr } = await supabase.auth.getUser()
    if (authErr || !authData?.user?.id) throw new Error('Sem sessão.')
    const userId = authData.user.id

    // 1) Criar card draft
    const { data: newCard, error: cardErr } = await supabase
      .from('cards')
      .insert({
        user_id: userId,
        name: `[NOVO] ${newModalDraft.name.trim()}`,
        slug: `new-template-${Date.now()}`,
        theme: { background: '#ffffff' },
      })
      .select('id')
      .single()

    if (cardErr) throw new Error(cardErr.message)
    const cardId = newCard.id

    // 2) Criar blocos base
    const baseBlocks = getBaseTemplateBlocks()
    const blocksToInsert = baseBlocks.map((b: any) => ({
      card_id: cardId,
      type: b.type,
      order: b.order,
      title: b.title,
      enabled: b.enabled,
      settings: b.settings,
      style: b.style,
    }))

    const { error: blocksErr } = await supabase.from('card_blocks').insert(blocksToInsert)
    if (blocksErr) throw new Error(blocksErr.message)

    // 3) Fechar modal e abrir editor
    setShowNewModal(false)
    setNewModalDraft({ name: '', category: 'geral', price: 0 })
    setCreatingNew(false)

    router.push(`/dashboard/cards/${cardId}/theme`)
  } catch (e) {
    setCreatingNew(false)
    setError(e instanceof Error ? e.message : 'Erro ao criar template.')
  }
}


            return (
              <div key={t.id} className="admin-template-card">
                <div className="admin-template-top">
                  <div className="admin-template-title">
                    <div className="admin-template-name">
                      {isEditing ? (
                        <input
                          value={draft?.name || ''}
                          onChange={(e) =>
                            setEditDraft((p) => (p ? { ...p, name: e.target.value } : p))
                          }
                          placeholder="Nome"
                        />
                      ) : (
                        <span>{t.name}</span>
                      )}
                    </div>

                    <div className="admin-template-meta">
                      <span className={t.is_active ? 'pill pill-active' : 'pill pill-inactive'}>
                        {t.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                      <span className="pill pill-price">{money(t.price)}</span>
                      <span className="pill pill-cat">{t.category || '—'}</span>
                    </div>
                  </div>

                  <div className="admin-template-actions">
                    <button
                      className="btn-ghost"
                      onClick={() => toggleActive(t)}
                      disabled={togglingId === t.id || deletingId === t.id || savingId === t.id}
                      title="Ativar/Desativar"
                    >
                      {togglingId === t.id ? '…' : t.is_active ? 'Desativar' : 'Ativar'}
                    </button>
                    
<button
  className="btn-secondary"
  onClick={() => editTemplate(t.id)}
  disabled={openingId === t.id || deletingId === t.id || savingId === t.id}
  title="Editar template no editor (atualiza o template original)"
>
  {openingId === t.id ? 'A abrir…' : '✏️ Editar'}
</button>


                    <button
                      className="btn-primary"
                      onClick={() => openInEditor(t)}
                      disabled={openingId === t.id || deletingId === t.id || savingId === t.id}
                      title="Criar variação a partir deste template e abrir no editor"
                    >
                      {openingId === t.id ? 'A abrir…' : 'Abrir no editor'}
                    </button>
                  </div>
                </div>

                <div className="admin-template-body">
                  <div className="admin-template-field">
                    <label>Descrição</label>
                    {isEditing ? (
                      <textarea
                        value={draft?.description || ''}
                        onChange={(e) =>
                          setEditDraft((p) => (p ? { ...p, description: e.target.value } : p))
                        }
                        placeholder="Descrição (opcional)"
                      />
                    ) : (
                      <p className="admin-template-text">{t.description || '—'}</p>
                    )}
                  </div>

                  <div className="admin-template-row">
                    <div className="admin-template-field">
                      <label>Categoria</label>
                      {isEditing ? (
                        <input
                          value={draft?.category || ''}
                          onChange={(e) =>
                            setEditDraft((p) => (p ? { ...p, category: e.target.value } : p))
                          }
                          placeholder="geral"
                        />
                      ) : (
                        <p className="admin-template-text">{t.category || '—'}</p>
                      )}
                    </div>

                    <div className="admin-template-field">
                      <label>Preço (€)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={draft?.price ?? 0}
                          onChange={(e) =>
                            setEditDraft((p) =>
                              p ? { ...p, price: parseFloat(e.target.value) || 0 } : p
                            )
                          }
                        />
                      ) : (
                        <p className="admin-template-text">{money(t.price)}</p>
                      )}
                    </div>
                  </div>

                  <div className="admin-template-field">
                    <label>Imagem (URL)</label>
                    {isEditing ? (
                      <input
                        value={draft?.image_url || ''}
                        onChange={(e) =>
                          setEditDraft((p) => (p ? { ...p, image_url: e.target.value } : p))
                        }
                        placeholder="https://… (opcional)"
                      />
                    ) : (
                      <p className="admin-template-text">{t.image_url || '—'}</p>
                    )}
                  </div>

                  <div className="admin-template-small">
                    <span>
                      Blocos no preview:{' '}
                      <b>{Array.isArray(t.preview_json) ? t.preview_json.length : 0}</b>
                    </span>
                    <span className="dot">•</span>
                    <span>ID: {t.id}</span>
                  </div>
                </div>

                <div className="admin-template-footer">
                  {isEditing ? (
                    <>
                      <button
                        className="btn-secondary"
                        onClick={cancelEdit}
                        disabled={savingId === t.id}
                      >
                        Cancelar
                      </button>
                      <button
                        className="btn-primary"
                        onClick={saveEdit}
                        disabled={savingId === t.id}
                      >
                        {savingId === t.id ? 'A guardar…' : 'Guardar'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn-secondary" onClick={() => startEdit(t)}>
                        Editar Detalhes
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => deleteTemplate(t)}
                        disabled={deletingId === t.id}
                      >
                        {deletingId === t.id ? 'A apagar…' : 'Apagar'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {showNewModal && (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  }}>
    <div style={{
      background: 'rgba(15,15,26,0.95)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 24,
      padding: 32,
      maxWidth: 420,
      width: '90%',
    }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.95)', marginBottom: 20 }}>
        Novo Template
      </h2>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', display: 'block', marginBottom: 6 }}>
          Nome *
        </label>
        <input
          type="text"
          value={newModalDraft.name}
          onChange={(e) => setNewModalDraft((p) => ({ ...p, name: e.target.value }))}
          placeholder="Ex: Real Estate Premium"
          style={{
            width: '100%',
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12,
            color: 'rgba(255,255,255,0.95)',
            fontSize: 13,
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
  <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', display: 'block', marginBottom: 6 }}>
    Categoria
  </label>
  <select
    value={newModalDraft.category}
    onChange={(e) => setNewModalDraft((p) => ({ ...p, category: e.target.value }))}
    style={{
      width: '100%',
      padding: '10px 12px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 12,
      color: 'rgba(255,255,255,0.95)',
      fontSize: 13,
      boxSizing: 'border-box',
    }}
  >
    {TEMPLATE_CATEGORIES.map((cat) => (
      <option key={cat} value={cat}>
        {CATEGORY_LABELS[cat] || cat}
      </option>
    ))}
  </select>
</div>


      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', display: 'block', marginBottom: 6 }}>
          Preço (€)
        </label>
        <input
          type="number"
          min={0}
          step={0.5}
          value={newModalDraft.price}
          onChange={(e) => setNewModalDraft((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12,
            color: 'rgba(255,255,255,0.95)',
            fontSize: 13,
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          className="btn-secondary"
          onClick={() => setShowNewModal(false)}
          disabled={creatingNew}
          style={{ flex: 1 }}
        >
          Cancelar
        </button>
        <button
          className="btn-primary"
          onClick={createNewTemplate}
          disabled={creatingNew}
          style={{ flex: 1 }}
        >
          {creatingNew ? 'A criar…' : 'Criar e abrir'}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  )
}
