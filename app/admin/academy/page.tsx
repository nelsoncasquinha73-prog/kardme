'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Tutorial = {
  id: string
  title: string
  description: string | null
  category: string
  youtube_url: string
  sort_order: number
  is_published: boolean
}
type Draft = Omit<Tutorial, 'id'>
const empty: Draft = { title: '', description: '', category: 'Primeiros Passos', youtube_url: '', sort_order: 0, is_published: false }
const field: React.CSSProperties = { width: '100%', padding: '11px 12px', border: '1px solid #334155', borderRadius: 9, background: '#0f172a', color: 'white', boxSizing: 'border-box' }
const button: React.CSSProperties = { padding: '10px 16px', borderRadius: 9, border: 0, cursor: 'pointer', background: '#06b6d4', color: '#082f49', fontWeight: 700 }

export default function AcademyAdminPage() {
  const [items, setItems] = useState<Tutorial[]>([])
  const [draft, setDraft] = useState<Draft>({ ...empty })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const api = useCallback(async (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', payload?: object, id?: string) => {
    const { data, error: authError } = await supabase.auth.getSession()
    if (authError || !data.session?.access_token) throw new Error('Sessão expirada. Inicia sessão novamente.')
    const url = '/api/admin/academy' + (id ? '?id=' + encodeURIComponent(id) : '')
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${data.session.access_token}`, ...(payload ? { 'Content-Type': 'application/json' } : {}) },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
      cache: 'no-store',
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.error || `Erro HTTP ${res.status}`)
    return json
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await api('GET')
      setItems(result.tutorials || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tutoriais')
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => { void load() }, [load])

  const edit = (item: Tutorial) => {
    setEditingId(item.id)
    setDraft({ title: item.title, description: item.description || '', category: item.category, youtube_url: item.youtube_url, sort_order: item.sort_order, is_published: item.is_published })
    setError(''); setNotice('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const reset = () => { setEditingId(null); setDraft({ ...empty }); setError('') }

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBusy(true); setError(''); setNotice('')
    try {
      await api(editingId ? 'PATCH' : 'POST', editingId ? { id: editingId, ...draft } : draft)
      setNotice(editingId ? 'Tutorial atualizado.' : 'Tutorial criado.')
      reset()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar')
    } finally { setBusy(false) }
  }

  const remove = async (item: Tutorial) => {
    if (!window.confirm(`Eliminar definitivamente o tutorial "${item.title}"?`)) return
    setBusy(true); setError(''); setNotice('')
    try {
      await api('DELETE', undefined, item.id)
      if (editingId === item.id) reset()
      setNotice('Tutorial eliminado.')
      await load()
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro ao eliminar') }
    finally { setBusy(false) }
  }

  const toggle = async (item: Tutorial) => {
    setBusy(true); setError(''); setNotice('')
    try {
      await api('PATCH', { id: item.id, title: item.title, description: item.description || '', category: item.category, youtube_url: item.youtube_url, sort_order: item.sort_order, is_published: !item.is_published })
      setNotice(item.is_published ? 'Tutorial ocultado.' : 'Tutorial publicado.')
      await load()
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro ao alterar publicação') }
    finally { setBusy(false) }
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 28, color: '#f8fafc' }}>
      <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8 }}>Gerir Kardme Academy</h1>
      <p style={{ color: '#cbd5e1', marginBottom: 22 }}>Adiciona, edita e publica os tutoriais apresentados na <Link href="/dashboard/biblioteca" style={{ color: '#67e8f9' }}>Biblioteca</Link>.</p>
      {error && <p role="alert" style={{ color: '#fecaca', padding: 12, background: '#7f1d1d', borderRadius: 8 }}>{error}</p>}
      {notice && <p role="status" style={{ color: '#a7f3d0' }}>{notice}</p>}
      <form onSubmit={save} style={{ background: '#111e38', padding: 24, borderRadius: 16, display: 'grid', gap: 15, marginBottom: 30 }}>
        <h2 style={{ fontSize: 21, fontWeight: 700 }}>{editingId ? 'Editar tutorial' : 'Novo tutorial'}</h2>
        <label>Título<input required maxLength={180} style={field} value={draft.title} onChange={e => setDraft(v => ({ ...v, title: e.target.value }))} /></label>
        <label>Descrição<textarea maxLength={2000} rows={3} style={field} value={draft.description || ''} onChange={e => setDraft(v => ({ ...v, description: e.target.value }))} /></label>
        <label>Categoria<input required maxLength={100} style={field} value={draft.category} onChange={e => setDraft(v => ({ ...v, category: e.target.value }))} /></label>
        <label>URL do YouTube<input required type="url" placeholder="https://youtu.be/tPN5Ja4l_TM" style={field} value={draft.youtube_url} onChange={e => setDraft(v => ({ ...v, youtube_url: e.target.value }))} /></label>
        <label>Ordem de apresentação<input type="number" min={0} max={100000} step={1} style={field} value={draft.sort_order} onChange={e => setDraft(v => ({ ...v, sort_order: Number(e.target.value) }))} /></label>
        <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}><input type="checkbox" checked={draft.is_published} onChange={e => setDraft(v => ({ ...v, is_published: e.target.checked }))} /> Publicar na Biblioteca</label>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="submit" disabled={busy} style={{ ...button, opacity: busy ? 0.5 : 1 }}>{busy ? 'A guardar...' : editingId ? 'Guardar alterações' : 'Criar tutorial'}</button>
          {editingId && <button type="button" onClick={reset} disabled={busy} style={{ ...button, background: '#334155', color: 'white' }}>Cancelar edição</button>}
        </div>
      </form>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 15 }}>Tutoriais ({items.length})</h2>
      {loading ? <p>A carregar...</p> : items.length === 0 ? <p>Ainda não há tutoriais.</p> : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map(item => <article key={item.id} style={{ background: '#111e38', border: '1px solid #334155', borderRadius: 12, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px' }}><strong>{item.title}</strong><p style={{ color: '#94a3b8', marginTop: 7 }}>{item.category} · Ordem {item.sort_order} · {item.is_published ? 'Publicado' : 'Oculto'}</p><a href={item.youtube_url} target="_blank" rel="noopener noreferrer" style={{ color: '#67e8f9' }}>Ver no YouTube</a></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" disabled={busy} onClick={() => edit(item)} style={button}>Editar</button>
                <button type="button" disabled={busy} onClick={() => void toggle(item)} style={{ ...button, background: '#334155', color: 'white' }}>{item.is_published ? 'Ocultar' : 'Publicar'}</button>
                <button type="button" disabled={busy} onClick={() => void remove(item)} style={{ ...button, background: '#7f1d1d', color: 'white' }}>Eliminar</button>
              </div>
            </div>
          </article>)}
        </div>
      )}
    </main>
  )
}
