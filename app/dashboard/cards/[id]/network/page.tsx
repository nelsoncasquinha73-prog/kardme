'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type CategoryRow = {
  id: number
  name: string
  slug: string
}

type SubcategoryRow = {
  id: number
  category_id: number
  name: string
  slug: string
}

type ListingRow = {
  card_id: string
  is_enabled: boolean
  category_id: number | null
  subcategory_ids: number[]
  tags: string[]
  country: string | null
  region: string | null
  city: string | null
  short_description: string | null
  allow_contact: boolean
  allow_networking: boolean
  visibility: 'public' | 'members'
}

export default function NetworkPage() {
  const params = useParams()
  const router = useRouter()

  const cardId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [cardName, setCardName] = useState('')

  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [subcategories, setSubcategories] = useState<SubcategoryRow[]>([])

  const [enabled, setEnabled] = useState(false)
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [selectedSubcats, setSelectedSubcats] = useState<number[]>([])
  const [country, setCountry] = useState('Portugal')
  const [region, setRegion] = useState('')
  const [city, setCity] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [allowContact, setAllowContact] = useState(true)
  const [allowNetworking, setAllowNetworking] = useState(true)
  const [visibility, setVisibility] = useState<'public' | 'members'>('public')

  const visibleSubcategories = useMemo(() => {
    if (!categoryId) return []
    return subcategories.filter((s) => s.category_id === categoryId)
  }, [categoryId, subcategories])

  useEffect(() => {
    if (!cardId) return

    const load = async () => {
      setLoading(true)

      try {
        const [
          { data: sessionData },
          { data: card, error: cardError },
          { data: cats, error: catsError },
          { data: subs, error: subsError },
          { data: listing, error: listingError },
        ] = await Promise.all([
          supabase.auth.getSession(),

          supabase
            .from('cards')
            .select('id,name,user_id')
            .eq('id', cardId)
            .maybeSingle(),

          supabase
            .from('categories')
            .select('id,name,slug')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),

          supabase
            .from('subcategories')
            .select('id,category_id,name,slug')
            .gte('id', 1000)
            .order('sort_order', { ascending: true }),

          supabase
            .from('card_network_listings')
            .select(`
              card_id,
              is_enabled,
              category_id,
              subcategory_ids,
              tags,
              country,
              region,
              city,
              short_description,
              allow_contact,
              allow_networking,
              visibility
            `)
            .eq('card_id', cardId)
            .maybeSingle(),
        ])

        const session = sessionData?.session

        if (!session) {
          router.push('/login')
          return
        }

        if (cardError) throw cardError
        if (catsError) throw catsError
        if (subsError) throw subsError

        if (!card || card.user_id !== session.user.id) {
          alert('Não tens autorização para configurar este cartão.')
          router.push('/dashboard/my-cards')
          return
        }

        if (listingError) {
          console.error('Erro ao carregar Network:', listingError)
        }

        setCardName(card.name || 'Cartão')

        setCategories((cats ?? []) as CategoryRow[])
        setSubcategories((subs ?? []) as SubcategoryRow[])

        if (listing) {
          const row = listing as ListingRow

          setEnabled(row.is_enabled ?? false)
          setCategoryId(row.category_id ?? null)
          setSelectedSubcats(
            Array.isArray(row.subcategory_ids)
              ? row.subcategory_ids
              : []
          )
          setCountry(row.country || 'Portugal')
          setRegion(row.region || '')
          setCity(row.city || '')
          setShortDescription(row.short_description || '')
          setTagsInput(
            Array.isArray(row.tags)
              ? row.tags.join(', ')
              : ''
          )
          setAllowContact(row.allow_contact ?? true)
          setAllowNetworking(row.allow_networking ?? true)
          setVisibility(
            row.visibility === 'members'
              ? 'members'
              : 'public'
          )
        }
      } catch (e: any) {
        alert(
          'Erro ao carregar configuração do Kardme Network: ' +
            (e?.message || 'Desconhecido')
        )
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [cardId, router])

  const toggleSubcategory = (id: number) => {
    setSelectedSubcats((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    )
  }

  const save = async () => {
    try {
      setSaving(true)

      if (enabled && !categoryId) {
        alert('Escolhe uma área de negócio.')
        return
      }

      const tags = tagsInput
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 10)

      const { error } = await supabase.rpc(
        'save_card_network_listing',
        {
          p_card_id: cardId,
          p_is_enabled: enabled,
          p_category_id: categoryId,
          p_subcategory_ids: selectedSubcats,
          p_tags: tags,
          p_country: country || null,
          p_region: region || null,
          p_city: city || null,
          p_short_description:
            shortDescription || null,
          p_allow_contact: allowContact,
          p_allow_networking: allowNetworking,
          p_visibility: visibility,
        }
      )

      if (error) throw error

      alert(
        enabled
          ? 'Cartão publicado no Kardme Network!'
          : 'Configuração guardada. O cartão está fora do Kardme Network.'
      )

      router.push('/dashboard/my-cards')
    } catch (e: any) {
      console.error(e)
      alert(
        'Erro ao guardar Kardme Network: ' +
          (e?.message || 'Desconhecido')
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24, color: '#fff' }}>
        A carregar Kardme Network…
      </div>
    )
  }

  return (
    <div
      style={{
        maxWidth: 980,
        margin: '0 auto',
        display: 'grid',
        gap: 18,
      }}
    >
      <div>
        <button
          onClick={() => router.push('/dashboard/my-cards')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: 0,
            marginBottom: 12,
          }}
        >
          ← Voltar aos meus cartões
        </button>

        <h1
          style={{
            margin: 0,
            color: '#fff',
            fontSize: 28,
          }}
        >
          🌐 Faça parte do Kardme Network
        </h1>

        <p
          style={{
            margin: '10px 0 0',
            color: 'rgba(255,255,255,0.68)',
            lineHeight: 1.6,
            maxWidth: 760,
          }}
        >
          Aumente a sua visibilidade, seja encontrado por potenciais
          clientes e conecte-se com outros profissionais.
          Quanto mais utilizar e partilhar o seu Kardme, maior poderá
          ser a sua visibilidade no Kardme Network.
        </p>
      </div>

      <div
        style={{
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                color: '#fff',
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              {cardName}
            </div>

            <div
              style={{
                color: 'rgba(255,255,255,0.55)',
                marginTop: 4,
                fontSize: 13,
              }}
            >
              Configure este cartão individualmente.
            </div>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) =>
                setEnabled(e.target.checked)
              }
              style={{ width: 18, height: 18 }}
            />

            Publicar este cartão no Kardme Network
          </label>
        </div>
      </div>

      <div
        style={{
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: 20,
          display: 'grid',
          gap: 18,
          opacity: enabled ? 1 : 0.55,
        }}
      >
        <Field label="Área de negócio">
          <select
            value={categoryId ?? ''}
            disabled={!enabled}
            onChange={(e) => {
              const next = e.target.value
                ? Number(e.target.value)
                : null

              setCategoryId(next)
              setSelectedSubcats([])
            }}
            style={inputStyle}
          >
            <option value="">
              Escolher área de negócio
            </option>

            {categories.map((cat) => (
              <option
                key={cat.id}
                value={cat.id}
              >
                {cat.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Especialidades">
          {!categoryId ? (
            <div style={emptyStyle}>
              Escolha primeiro uma área de negócio.
            </div>
          ) : visibleSubcategories.length === 0 ? (
            <div style={emptyStyle}>
              Ainda não existem especialidades definidas
              para esta área.
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              {visibleSubcategories.map((sub) => {
                const active =
                  selectedSubcats.includes(sub.id)

                return (
                  <button
                    key={sub.id}
                    type="button"
                    disabled={!enabled}
                    onClick={() =>
                      toggleSubcategory(sub.id)
                    }
                    style={{
                      padding: '8px 11px',
                      borderRadius: 999,
                      border: active
                        ? '1px solid #38bdf8'
                        : '1px solid rgba(255,255,255,0.12)',
                      background: active
                        ? 'rgba(56,189,248,0.14)'
                        : 'rgba(255,255,255,0.04)',
                      color: active
                        ? '#7dd3fc'
                        : 'rgba(255,255,255,0.72)',
                      cursor: enabled
                        ? 'pointer'
                        : 'not-allowed',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {sub.name}
                  </button>
                )
              })}
            </div>
          )}
        </Field>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(200px,1fr))',
            gap: 14,
          }}
        >
          <Field label="País">
            <input
              value={country}
              disabled={!enabled}
              onChange={(e) =>
                setCountry(e.target.value)
              }
              placeholder="Portugal"
              style={inputStyle}
            />
          </Field>

          <Field label="Região / Distrito">
            <input
              value={region}
              disabled={!enabled}
              onChange={(e) =>
                setRegion(e.target.value)
              }
              placeholder="Lisboa"
              style={inputStyle}
            />
          </Field>

          <Field label="Localidade">
            <input
              value={city}
              disabled={!enabled}
              onChange={(e) =>
                setCity(e.target.value)
              }
              placeholder="Cascais"
              style={inputStyle}
            />
          </Field>
        </div>

        <Field label="Descrição curta">
          <textarea
            value={shortDescription}
            disabled={!enabled}
            onChange={(e) =>
              setShortDescription(
                e.target.value.slice(0, 180)
              )
            }
            placeholder="Ex.: Especialista em imóveis residenciais e investimento na região de Cascais."
            rows={4}
            style={{
              ...inputStyle,
              resize: 'vertical',
            }}
          />

          <div
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.45)',
              marginTop: 6,
            }}
          >
            {shortDescription.length}/180 caracteres
          </div>
        </Field>

        <Field label="Serviços / palavras-chave">
          <input
            value={tagsInput}
            disabled={!enabled}
            onChange={(e) =>
              setTagsInput(e.target.value)
            }
            placeholder="Ex.: luxo, investimento, arrendamento, tattoo, fine line"
            style={inputStyle}
          />

          <div
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.45)',
              marginTop: 6,
            }}
          >
            Separe por vírgulas. Máximo de 10.
          </div>
        </Field>

        <Field label="Visibilidade">
          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <label style={radioStyle}>
              <input
                type="radio"
                name="visibility"
                value="public"
                disabled={!enabled}
                checked={visibility === 'public'}
                onChange={() =>
                  setVisibility('public')
                }
              />

              Público
            </label>

            <label style={radioStyle}>
              <input
                type="radio"
                name="visibility"
                value="members"
                disabled={!enabled}
                checked={visibility === 'members'}
                onChange={() =>
                  setVisibility('members')
                }
              />

              Apenas membros Kardme
            </label>
          </div>
        </Field>

        <div
          style={{
            display: 'grid',
            gap: 10,
          }}
        >
          <label style={checkboxStyle}>
            <input
              type="checkbox"
              checked={allowContact}
              disabled={!enabled}
              onChange={(e) =>
                setAllowContact(e.target.checked)
              }
            />

            Permitir contacto através do Kardme Network
          </label>

          <label style={checkboxStyle}>
            <input
              type="checkbox"
              checked={allowNetworking}
              disabled={!enabled}
              onChange={(e) =>
                setAllowNetworking(e.target.checked)
              }
            />

            Disponível para networking com outros membros
          </label>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() =>
            router.push('/dashboard/my-cards')
          }
          style={{
            padding: '11px 16px',
            borderRadius: 10,
            border:
              '1px solid rgba(255,255,255,0.14)',
            background:
              'rgba(255,255,255,0.04)',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Cancelar
        </button>

        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: '11px 18px',
            borderRadius: 10,
            border: 'none',
            background: '#0ea5e9',
            color: '#fff',
            fontWeight: 800,
            cursor: saving
              ? 'not-allowed'
              : 'pointer',
            opacity: saving ? 0.65 : 1,
          }}
        >
          {saving
            ? 'A guardar…'
            : enabled
            ? '🌐 Guardar e publicar'
            : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          marginBottom: 8,
          color: '#fff',
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        {label}
      </label>

      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  minHeight: 48,
  padding: '12px 14px',
  lineHeight: '20px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.12)',
  background: '#0b1220',
  color: '#fff',
  outline: 'none',
  fontSize: 14,
}

const emptyStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 10,
  border: '1px dashed rgba(255,255,255,0.12)',
  color: 'rgba(255,255,255,0.5)',
  fontSize: 13,
}

const checkboxStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  color: 'rgba(255,255,255,0.8)',
  fontSize: 14,
  cursor: 'pointer',
}

const radioStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  color: 'rgba(255,255,255,0.8)',
  fontSize: 14,
  cursor: 'pointer',
}
