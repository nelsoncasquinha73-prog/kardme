'use client'
import { useLanguage } from '@/components/language/LanguageProvider'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import '@/styles/dashboard.css'

import TemplateMiniPreview from "@/components/catalog/TemplateMiniPreview"

type Template = {
  id: string
  name: string
  description: string | null
  category: string | null
  category_id: number | null
  subcategory_id: number | null
  pricing_tier: 'free' | 'paid' | 'premium' | null
  price: number | null
  image_url: string | null
  preview_json: any[] | null
  theme_json: any | null
  is_active: boolean | null
  created_at?: string | null
}

type PriceFilter = 'all' | 'free' | 'premium'

function eur(n: number | null | undefined) {
  const v = typeof n === 'number' ? n : 0
  return `€${v.toFixed(2)}`
}



function isFree(t: Template) {
  return t.pricing_tier === 'free' || t.pricing_tier === 'paid'
}

function themeToCssBackground(theme: any): string | null {
  if (!theme) return null
  if (typeof theme.background === 'string' && theme.background.trim()) {
    return theme.background
  }
  const colorsBg = theme?.colors?.background
  if (typeof colorsBg === 'string' && colorsBg.trim()) {
    return colorsBg
  }
  const base = theme?.background?.base
  if (base?.kind === 'gradient' && Array.isArray(base.stops) && base.stops.length >= 2) {
    const angle = typeof base.angle === 'number' ? base.angle : 135
    const stops = base.stops
      .filter((s: any) => typeof s?.color === 'string')
      .map((s: any) => {
        const pos = typeof s.pos === 'number' ? `${s.pos}%` : ''
        return `${s.color}${pos ? ` ${pos}` : ''}`
      })
      .join(', ')
    if (stops) {
      return `linear-gradient(${angle}deg, ${stops})`
    }
  }
  return null
}

export default function CatalogPage() {
  const { t } = useLanguage()

  const getPriceDisplayT = (tier: string | null, price: number | null) => {
    if (tier === 'free') return t('dashboard.pricing_free')
    if (tier === 'paid') return t('dashboard.pricing_included')
    if (tier === 'premium') return eur(price)
    return eur(price)
  }

  const priceLabelForT = (template: Template) => {
    if (template.pricing_tier === 'free') return t('dashboard.pricing_free')
    if (template.pricing_tier === 'paid') return t('dashboard.pricing_included')
    if (template.pricing_tier === 'premium') return eur(template.price)
    return isFree(template) ? t('dashboard.pricing_free') : eur(template.price)
  }

  const router = useRouter()
  const searchParams = useSearchParams()

  const [templates, setTemplates] = useState<Template[]>([])
  const [ownedTemplates, setOwnedTemplates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all')

  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null)

  // Checkout modal
  const [checkoutTemplate, setCheckoutTemplate] = useState<Template | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponStatus, setCouponStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const [couponDiscount, setCouponDiscount] = useState<{ type: string; value: number } | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (searchParams.get('success') === '1') {
      setSuccessMessage('Template comprado com sucesso! Já podes usá-lo.')
      loadData()
    }
  }, [searchParams])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    const { data: authData } = await supabase.auth.getUser()
    const uid = authData?.user?.id || null
    setUserId(uid)

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

    if (uid) {
      const { data: owned } = await supabase
        .from('user_templates')
        .select('template_id')
        .eq('user_id', uid)

      if (owned) {
        setOwnedTemplates(new Set(owned.map((o: any) => o.template_id)))
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
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
      const matchesPrice =
        priceFilter === 'all'
          ? true
          : priceFilter === 'free'
          ? t.pricing_tier === 'free' || t.pricing_tier === 'paid'
          : t.pricing_tier === 'premium'
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

      const uid = authData.user.id

      const { data: newCard, error: cardErr } = await supabase
        .from('cards')
        .insert({
          user_id: uid,
          name: t.name,
          slug: `card-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          template_id: t.id,
          theme: t.theme_json,
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

  const checkCoupon = async () => {
    if (!couponCode.trim() || !checkoutTemplate) return

    setCouponStatus('checking')
    setCouponDiscount(null)

    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase().trim())
        .eq('is_active', true)
        .single()

      if (error || !coupon) {
        setCouponStatus('invalid')
        return
      }

      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        setCouponStatus('invalid')
        return
      }

      if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
        setCouponStatus('invalid')
        return
      }

      if (coupon.template_id && coupon.template_id !== checkoutTemplate.id) {
        setCouponStatus('invalid')
        return
      }

      setCouponStatus('valid')
      setCouponDiscount({ type: coupon.discount_type, value: coupon.discount_value })
    } catch {
      setCouponStatus('invalid')
    }
  }

  const getFinalPrice = () => {
    if (!checkoutTemplate) return 0
    const original = checkoutTemplate.price || 0
    if (!couponDiscount) return original

    if (couponDiscount.type === 'free') return 0
    if (couponDiscount.type === 'percentage') return original * (1 - couponDiscount.value / 100)
    if (couponDiscount.type === 'fixed') return Math.max(0, original - couponDiscount.value)
    return original
  }

  const handleCheckout = async () => {
    if (!checkoutTemplate || !userId) return

    setCheckoutLoading(true)

    try {
      const res = await fetch('/api/stripe/checkout-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: checkoutTemplate.id,
          userId,
          couponCode: couponStatus === 'valid' ? couponCode.toUpperCase().trim() : null,
        }),
      })

      const data = await res.json()

      if (data.free) {
        setCheckoutTemplate(null)
        setSuccessMessage('Template desbloqueado! Já podes usá-lo.')
        loadData()
      } else if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Erro no checkout')
      }
    } catch {
      setError('Erro ao processar pagamento')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const openCheckout = (t: Template) => {
    setCheckoutTemplate(t)
    setCouponCode('')
    setCouponStatus('idle')
    setCouponDiscount(null)
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
              Explora templates ativos. Usa cupões para descontos!
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link className="btn-secondary" href="/dashboard">
              ← Voltar
            </Link>
            <button className="btn-secondary" onClick={loadData} disabled={loading}>
              {loading ? 'A atualizar…' : 'Recarregar'}
            </button>
          </div>
        </div>

        {successMessage && (
          <div
            style={{
              background: 'rgba(34,197,94,0.15)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 16,
              color: '#22c55e',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>✅ {successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 16,
              color: '#ef4444',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Pesquisar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: 180,
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: 14,
            }}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: 14,
            }}
          >
            {categories.map((c) => (
              <option key={c} value={c} style={{ background: '#1a1a2e' }}>
                {c === 'all' ? 'Todas categorias' : c}
              </option>
            ))}
          </select>
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: 14,
            }}
          >
            <option value="all" style={{ background: '#1a1a2e' }}>Todos preços</option>
            <option value="free" style={{ background: '#1a1a2e' }}>Grátis</option>
            <option value="premium" style={{ background: '#1a1a2e' }}>Premium</option>
          </select>
        </div>

        {loading ? (
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>A carregar templates...</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Nenhum template encontrado.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 20 }}>
            {filtered.map((template) => {
              const free = isFree(template)
              const owned = ownedTemplates.has(template.id)
              const priceLabel = priceLabelForT(template)

              return (
                <div
                  key={template.id}
                  style={{
                    background: 'rgba(30,30,50,0.7)',
                    borderRadius: 20,
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ position: 'relative', height: 623, background: '#111' }}>
                    <div style={{ transform: "translateY(65px)" }}>
                      <TemplateMiniPreview template={template} height={504} />
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        background: free ? 'rgba(34,197,94,0.2)' : owned ? 'rgba(59,130,246,0.2)' : 'rgba(168,85,247,0.2)',
                        color: free ? '#22c55e' : owned ? '#3b82f6' : '#a855f7',
                      }}
                    >
                      {owned ? '✓ Comprado' : priceLabel}
                    </div>
                  </div>

                  <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: 8 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>{template.name}</h3>
                      {template.category && (
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{template.category}</span>
                      )}
                    </div>

                    {template.description ? (
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.70)', marginBottom: 12 }}>
                        {template.description}
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>
                        Sem descrição.
                      </div>
                    )}

                    <div style={{ marginTop: 'auto' }}>
                      {free || owned ? (
                        <button
                          onClick={() => createCardFromTemplate(template)}
                          disabled={creatingTemplateId === template.id}
                          style={{
                            width: '100%',
                            height: 44,
                            borderRadius: 14,
                            border: 'none',
                            background: 'var(--color-primary)',
                            color: '#fff',
                            fontWeight: 900,
                            fontSize: 13,
                            cursor: creatingTemplateId === template.id ? 'not-allowed' : 'pointer',
                            opacity: creatingTemplateId === template.id ? 0.7 : 1,
                          }}
                        >
                          {creatingTemplateId === template.id ? 'A criar…' : 'Usar template'}
                        </button>
                      ) : (
                        <button
                          onClick={() => openCheckout(template)}
                          style={{
                            width: '100%',
                            height: 44,
                            borderRadius: 14,
                            border: 'none',
                            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                            color: '#fff',
                            fontWeight: 900,
                            fontSize: 13,
                            cursor: 'pointer',
                          }}
                        >
                          Comprar {eur(template.price)}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Checkout */}
      {checkoutTemplate && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setCheckoutTemplate(null)}
        >
          <div
            style={{
              background: '#1a1a2e',
              borderRadius: 24,
              padding: 32,
              width: '100%',
              maxWidth: 420,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
              Comprar Template
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
              {checkoutTemplate.name}
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
                Tens um cupão?
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase())
                    setCouponStatus('idle')
                    setCouponDiscount(null)
                  }}
                  placeholder="Código do cupão"
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    fontSize: 14,
                  }}
                />
                <button
                  onClick={checkCoupon}
                  disabled={!couponCode.trim() || couponStatus === 'checking'}
                  style={{
                    padding: '12px 20px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: couponCode.trim() ? 'pointer' : 'not-allowed',
                    opacity: couponCode.trim() ? 1 : 0.5,
                  }}
                >
                  {couponStatus === 'checking' ? '...' : 'Aplicar'}
                </button>
              </div>
              {couponStatus === 'valid' && (
                <p style={{ color: '#22c55e', fontSize: 13, marginTop: 8 }}>
                  ✓ Cupão válido! {couponDiscount?.type === 'free' ? 'Template grátis!' : couponDiscount?.type === 'percentage' ? `${couponDiscount.value}% desconto` : `€${couponDiscount?.value} desconto`}
                </p>
              )}
              {couponStatus === 'invalid' && (
                <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>
                  ✕ Cupão inválido ou expirado
                </p>
              )}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Preço original</span>
                <span style={{ color: '#fff' }}>{eur(checkoutTemplate.price)}</span>
              </div>
              {couponStatus === 'valid' && couponDiscount && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#22c55e' }}>Desconto</span>
                  <span style={{ color: '#22c55e' }}>-{eur((checkoutTemplate.price || 0) - getFinalPrice())}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, marginTop: 8 }}>
                <span style={{ color: '#fff', fontWeight: 700 }}>Total</span>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 20 }}>{eur(getFinalPrice())}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setCheckoutTemplate(null)}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'transparent',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {t('dashboard.cancel')}
              </button>
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  borderRadius: 14,
                  border: 'none',
                  background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                  color: '#fff',
                  fontWeight: 900,
                  cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                  opacity: checkoutLoading ? 0.7 : 1,
                }}
              >
                {checkoutLoading ? 'A processar...' : getFinalPrice() <= 0 ? 'Obter Grátis' : `Pagar ${eur(getFinalPrice())}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
