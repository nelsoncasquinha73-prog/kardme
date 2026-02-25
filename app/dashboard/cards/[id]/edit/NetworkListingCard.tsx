'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type CategoryRow = {
  id: number
  name: string
  slug: string
  is_active: boolean
  sort_order: number
}

type SubcategoryRow = {
  id: number
  category_id: number
  name: string
  slug: string
  sort_order: number
}

type ListingRow = {
  card_id: string
  is_enabled: boolean
  started_at: string | null
  free_until: string | null
  paid_until: string | null
  subcategory_ids: number[]
}

function formatDatePT(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('pt-PT', { year: 'numeric', month: '2-digit', day: '2-digit' })
  } catch {
    return iso
  }
}

export default function NetworkListingCard({ cardId }: { cardId: string }) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [listing, setListing] = useState<ListingRow | null>(null)
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [subcategories, setSubcategories] = useState<SubcategoryRow[]>([])
  const [selectedSubcats, setSelectedSubcats] = useState<number[]>([])
  const [query, setQuery] = useState('')

  const now = Date.now()
  const isInTrial = listing?.free_until ? new Date(listing.free_until).getTime() >= now : false
  const isPaidActive = listing?.paid_until ? new Date(listing.paid_until).getTime() >= now : false
  const isActive = !!listing?.is_enabled && (isInTrial || isPaidActive)

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const filteredSubcats = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return subcategories
    return subcategories.filter((s) => {
      const cat = catById.get(s.category_id)
      const hay = `${s.name} ${cat?.name || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [query, subcategories, catById])

  async function load() {
    setLoading(true)
    try {
      const [{ data: listingRow, error: listingErr }, { data: cats }, { data: subs }] = await Promise.all([
        supabase
          .from('card_network_listings')
          .select('card_id, is_enabled, started_at, free_until, paid_until, subcategory_ids')
          .eq('card_id', cardId)
          .maybeSingle(),
        supabase.from('categories').select('id, name, slug, is_active, sort_order').order('sort_order', { ascending: true }),
        supabase.from('subcategories').select('id, category_id, name, slug, sort_order').order('sort_order', { ascending: true }),
      ])

      if (listingErr) console.error('[network] listing load error', listingErr)

      setListing((listingRow as any) || null)
      setCategories((cats as any) || [])
      setSubcategories((subs as any) || [])

      const initial = (listingRow as any)?.subcategory_ids || []
      setSelectedSubcats(Array.isArray(initial) ? initial : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId])

  async function enableNetwork() {
    if (!cardId) return
    if (!selectedSubcats || selectedSubcats.length === 0) {
      alert('Escolhe pelo menos 1 subcategoria para aparecer no Network.')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.rpc('enable_card_network', {
        p_card_id: cardId,
        p_subcategory_ids: selectedSubcats,
        p_tags: [],
        p_country: null,
        p_city: null,
      })

      if (error) {
        console.error('[network] enable rpc error', error)
        alert('Erro ao publicar no Network. Vê a consola.')
        return
      }

      await load()
      alert('Publicado no Kardme Network (12 meses grátis).')
    } finally {
      setSaving(false)
    }
  }

  function toggleSubcat(id: number) {
    setSelectedSubcats((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: 18, border: '1px solid rgba(96, 165, 250, 0.2)', padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, color: '#60a5fa', fontWeight: 900, fontSize: 16 }}>Kardme Network</h3>
          <p style={{ margin: '6px 0 0 0', color: 'rgba(96, 165, 250, 0.75)', fontSize: 13 }}>
            Aparece no diretório por área de negócio. 12 meses grátis por cartão.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {loading ? (
            <span style={{ color: 'rgba(96, 165, 250, 0.7)', fontSize: 13 }}>A carregar…</span>
          ) : (
            <span
              style={{
                fontSize: 12,
                padding: '6px 10px',
                borderRadius: 999,
                border: '1px solid rgba(96, 165, 250, 0.25)',
                color: isActive ? '#22c55e' : 'rgba(96, 165, 250, 0.7)',
                background: isActive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(96, 165, 250, 0.06)',
                fontWeight: 800,
              }}
            >
              {isActive ? 'Ativo' : 'Inativo'}
            </span>
          )}
        </div>
      </div>

      <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
        {listing?.free_until && isInTrial && (
          <div style={{ color: 'rgba(224, 231, 255, 0.9)', fontSize: 13 }}>
            Grátis até: <b>{formatDatePT(listing.free_until)}</b>
          </div>
        )}

        {!isInTrial && listing?.free_until && !isPaidActive && listing?.is_enabled && (
          <div style={{ color: '#f59e0b', fontSize: 13 }}>
            Trial expirado. (Depois ligamos a renovação por 1€/mês.)
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar subcategorias…"
            style={{
              flex: '1 1 260px',
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid rgba(96, 165, 250, 0.2)',
              background: 'rgba(2, 6, 23, 0.35)',
              color: '#e0e7ff',
              outline: 'none',
              fontSize: 13,
            }}
          />

          <button
            onClick={enableNetwork}
            disabled={saving}
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid rgba(96, 165, 250, 0.25)',
              background: saving ? 'rgba(96, 165, 250, 0.08)' : 'rgba(96, 165, 250, 0.16)',
              color: '#60a5fa',
              fontWeight: 900,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 13,
              whiteSpace: 'nowrap',
            }}
          >
            {saving ? 'A publicar…' : 'Publicar no Network'}
          </button>
        </div>

        <div style={{ maxHeight: 260, overflow: 'auto', borderRadius: 12, border: '1px solid rgba(96, 165, 250, 0.12)' }}>
          {filteredSubcats.length === 0 ? (
            <div style={{ padding: 12, color: 'rgba(96, 165, 250, 0.7)', fontSize: 13 }}>Sem resultados.</div>
          ) : (
            filteredSubcats.map((s) => {
              const cat = catById.get(s.category_id)
              const checked = selectedSubcats.includes(s.id)
              return (
                <label
                  key={s.id}
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(96, 165, 250, 0.08)',
                    background: checked ? 'rgba(96, 165, 250, 0.08)' : 'transparent',
                  }}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggleSubcat(s.id)} />
                  <div style={{ display: 'grid' }}>
                    <span style={{ color: '#e0e7ff', fontSize: 13, fontWeight: 800 }}>{s.name}</span>
                    <span style={{ color: 'rgba(96, 165, 250, 0.7)', fontSize: 12 }}>{cat?.name || '—'}</span>
                  </div>
                </label>
              )
            })
          )}
        </div>

        <div style={{ color: 'rgba(96, 165, 250, 0.65)', fontSize: 12 }}>
          Selecionadas: <b>{selectedSubcats.length}</b>
        </div>
      </div>
    </div>
  )
}
