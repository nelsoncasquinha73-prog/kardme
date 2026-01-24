'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import '@/styles/dashboard.css'

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

type PriceFilter = 'all' | 'free' | 'premium'

function eur(n: number | null | undefined) {
  const v = typeof n === 'number' ? n : 0
  return `€${v.toFixed(2)}`
}

function isFree(t: Template) {
  const p = typeof t.price === 'number' ? t.price : 0
  return p <= 0
}

export default function CatalogPage() {
  const router = useRouter()

  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all')

  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null)

  const loadTemplates = async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('is_active', true)
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
    loadTemplates()
  }, [])

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const t of templates) {
      const c = (t.category || '').trim()
      if (c) set.add(c)
    }
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [templates])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return templates.filter((t) => {
      const name = (t.name || '').toLowerCase()
      const desc = (t.description || '').toLowerCase()
      const cat = (t.category || '').toLowerCase()

      const matchesQuery = !q || name.includes(q) || desc.includes(q) || cat.includes(q)
      const matchesCategory = category === 'all' ? true : (t.category || '') === category

      const free = isFree(t)
      const matchesPrice =
        priceFilter === 'all' ? true : priceFilter === 'free' ? free : !free

      return matchesQuery && matchesCategory && matchesPrice
    })
  }, [templates, query, category, priceFilter])

  const createCardFromTemplate = async (t: Template) => {
    setCreatingTemplateId(t.id)
    setError(null)

    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser()
      if (authErr || !authData?.user?.id) {
        setError('Sem sessão. Faz login novamente.')
        setCreatingTemplateId(null)
        return
      }

      const userId = authData.user.id

      const { data: newCard, error: cardErr } = await supabase
        .from('cards')
        .insert({
          user_id: userId,
          name: t.name,
          slug: `card-${Date.now()}`,
          template_id: t.id,
        })
        .select('id')
        .single()

      if (cardErr) {
        setError(cardErr.message)
        setCreatingTemplateId(null)
        return
      }

      const cardId = newCard.id

      const blocks = Array.isArray(t.preview_json) ? t.preview_json : []
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

        const { error: blocksErr } = await supabase.from('card_blocks').insert(blocksToInsert)
        if (blocksErr) {
          setError(`Erro ao criar blocos: ${blocksErr.message}`)
          setCreatingTemplateId(null)
          return
        }
      }

      router.push(`/dashboard/cards/${cardId}/theme`)
    } catch {
      setError('Erro ao criar cartão.')
      setCreatingTemplateId(null)
    }
  }

  return (
    <div className="dashboard-wrap">
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 520,
            height: 520,
            left: -120,
            top: -140,
            background:
              'radial-gradient(circle at 30% 30%, rgba(168,85,247,0.35), rgba(168,85,247,0) 60%)',
            filter: 'blur(8px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 620,
            height: 620,
            right: -160,
            bottom: -220,
            background:
              'radial-gradient(circle at 30% 30%, rgba(59,130,246,0.28), rgba(59,130,246,0) 60%)',
            filter: 'blur(10px)',
          }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Catálogo de templates</h1>
            <p className="dashboard-subtitle">
              Explora templates ativos (grátis e premium). Premium: compra (em breve).
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

        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12,
              padding: '12px 16px',
              color: 'rgba(252,165,165,0.95)',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            marginTop: 18,
            display: 'grid',
            gridTemplateColumns: '1fr 220px 180px auto',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar por nome, categoria, descrição…"
            style={{
              width: '100%',
              height: 42,
              padding: '0 12px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.92)',
              fontSize: 13,
            }}
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              height: 42,
              padding: '0 12px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.92)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'Todas as categorias' : c}
              </option>
            ))}
          </select>

          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
            style={{
              height: 42,
              padding: '0 12px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.92)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <option value="all">Todos</option>
            <option value="free">Grátis</option>
            <option value="premium">Premium</option>
          </select>

          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', padding: '0 12px' }}>
            {filtered.length} / {templates.length}
          </div>
        </div>

        {loading ? (
          <p style={{ padding: 24 }}>A carregar templates…</p>
        ) : filtered.length === 0 ? (
          <div className="empty" style={{ marginTop: 48, textAlign: 'center', padding: 32 }}>
            <p
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: 'rgba(255,255,255,0.85)',
                marginBottom: 8,
              }}
            >
              Sem templates
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
              Não há templates ativos a mostrar. (Confirma <b>is_active</b> no admin.)
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
              marginTop: 20,
            }}
          >
            {filtered.map((t) => {
              const free = isFree(t)
              const priceLabel = free ? 'Grátis' : eur(t.price)

              return (
                <div
                  key={t.id}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 18,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <div
                    style={{
                      borderRadius: 14,
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.10)',
                      background:
                      (t as any)?.theme_json?.colors?.background ||
                      (t as any)?.theme_json?.colors?.surface ||
                      'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(59,130,246,0.12))',

                      height: 160,
                      position: 'relative',
                    }}
                  >
                    {t.image_url ? (
                      <img
                        src={t.image_url}
                        alt={t.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          padding: 14,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          height: '100%',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: 'rgba(255,255,255,0.65)',
                            letterSpacing: 0.5,
                            textAlign: 'center',
                          }}
                        >
                          ✨ Template
                        </div>

                        <div
                          style={{
                            marginTop: 10,
                            display: 'flex',
                            gap: 8,
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              padding: '4px 10px',
                              borderRadius: 999,
                              background: 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255,255,255,0.12)',
                              color: 'rgba(255,255,255,0.75)',
                            }}
                          >
                            {t.category || 'geral'}
                          </span>

                          <span
                            style={{
                              fontSize: 11,
                              padding: '4px 10px',
                              borderRadius: 999,
                              background: free
                                ? 'rgba(34,197,94,0.18)'
                                : 'rgba(168,85,247,0.18)',
                              border: free
                                ? '1px solid rgba(34,197,94,0.25)'
                                : '1px solid rgba(168,85,247,0.25)',
                              color: free
                                ? 'rgba(134,239,172,0.95)'
                                : 'rgba(217,70,239,0.95)',
                            }}
                          >
                            {priceLabel}
                          </span>

                          <span
                            style={{
                              fontSize: 11,
                              padding: '4px 10px',
                              borderRadius: 999,
                              background: 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255,255,255,0.12)',
                              color: 'rgba(255,255,255,0.65)',
                            }}
                          >
                            Blocos: {Array.isArray(t.preview_json) ? t.preview_json.length : 0}
                          </span>
                        </div>
                      </div>
                    )}

                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 100%)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 10,
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 900,
                            color: 'rgba(255,255,255,0.95)',
                            lineHeight: 1.2,
                          }}
                        >
                          {t.name}
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                          {t.category || '—'}
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: free ? 'rgba(134,239,172,0.95)' : 'rgba(217,70,239,0.95)',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.10)',
                          padding: '6px 10px',
                          borderRadius: 999,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {priceLabel}
                      </div>
                    </div>

                    {t.description ? (
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)' }}>
                        {t.description}
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                        Sem descrição.
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                    {free ? (
                      <button
                        onClick={() => createCardFromTemplate(t)}
                        disabled={creatingTemplateId === t.id}
                        style={{
                          flex: 1,
                          height: 44,
                          borderRadius: 14,
                          border: 'none',
                          background: 'var(--color-primary)',
                          color: '#fff',
                          fontWeight: 900,
                          fontSize: 13,
                          cursor: creatingTemplateId === t.id ? 'not-allowed' : 'pointer',
                          opacity: creatingTemplateId === t.id ? 0.7 : 1,
                        }}
                      >
                        {creatingTemplateId === t.id ? 'A criar…' : 'Usar template'}
                      </button>
                    ) : (
                      <button
                        disabled
                        style={{
                          flex: 1,
                          height: 44,
                          borderRadius: 14,
                          border: '1px solid rgba(168,85,247,0.25)',
                          background: 'rgba(168,85,247,0.12)',
                          color: 'rgba(217,70,239,0.95)',
                          fontWeight: 900,
                          fontSize: 13,
                          cursor: 'not-allowed',
                          opacity: 0.85,
                        }}
                        title="Disponível em breve"
                      >
                        Premium
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}