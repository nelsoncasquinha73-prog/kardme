'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type NetworkCard = {
  card_id: string
  slug: string
  display_name: string
  profession: string | null
  company: string | null
  avatar_url: string | null
  category_id: number | null
  category_name: string | null
  subcategory_ids: number[]
  specialty_names: string[]
  tags: string[]
  country: string | null
  region: string | null
  city: string | null
  short_description: string | null
  allow_contact: boolean
  allow_networking: boolean
  views_30d: number
  clicks_30d: number
  leads_30d: number
  network_score: number
  network_created_at: string
}

type SortMode = 'active' | 'recent' | 'az'

export default function KardmeNetworkPage() {
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<NetworkCard[]>([])

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')
  const [specialty, setSpecialty] = useState('Todos')
  const [country, setCountry] = useState('Todos')
  const [region, setRegion] = useState('Todos')
  const [city, setCity] = useState('Todos')
  const [sort, setSort] = useState<SortMode>('active')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)

        const { data, error } = await supabase.rpc(
          'get_public_kardme_network'
        )

        if (error) throw error

        setCards((data ?? []) as NetworkCard[])
      } catch (e) {
        console.error('Kardme Network:', e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const normalizeText = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        cards
          .map((c) => c.category_name)
          .filter(Boolean) as string[]
      )
    ).sort((a, b) => a.localeCompare(b, 'pt'))
  }, [cards])

  const specialties = useMemo(() => {
    return Array.from(
      new Set(
        cards
          .filter(
            (c) =>
              category === 'Todos' ||
              c.category_name === category
          )
          .flatMap((c) => c.specialty_names ?? [])
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, 'pt'))
  }, [cards, category])

  const countries = useMemo(() => {
    return Array.from(
      new Set(
        cards
          .map((c) => c.country)
          .filter(Boolean) as string[]
      )
    ).sort((a, b) => a.localeCompare(b, 'pt'))
  }, [cards])

  const regions = useMemo(() => {
    return Array.from(
      new Set(
        cards
          .filter(
            (c) =>
              country === 'Todos' ||
              c.country === country
          )
          .map((c) => c.region)
          .filter(Boolean) as string[]
      )
    ).sort((a, b) => a.localeCompare(b, 'pt'))
  }, [cards, country])

  const cities = useMemo(() => {
    return Array.from(
      new Set(
        cards
          .filter(
            (c) =>
              (country === 'Todos' ||
                c.country === country) &&
              (region === 'Todos' ||
                c.region === region)
          )
          .map((c) => c.city)
          .filter(Boolean) as string[]
      )
    ).sort((a, b) => a.localeCompare(b, 'pt'))
  }, [cards, country, region])

  const filtered = useMemo(() => {
    const q = normalizeText(search)

    let result = cards.filter((card) => {
      const matchesCategory =
        category === 'Todos' ||
        card.category_name === category

      const matchesSpecialty =
        specialty === 'Todos' ||
        (card.specialty_names ?? []).includes(specialty)

      const matchesCountry =
        country === 'Todos' ||
        card.country === country

      const matchesRegion =
        region === 'Todos' ||
        card.region === region

      const matchesCity =
        city === 'Todos' ||
        card.city === city

      const haystack = [
        card.display_name,
        card.profession,
        card.company,
        card.category_name,
        card.country,
        card.region,
        card.city,
        card.short_description,
        ...(card.specialty_names ?? []),
        ...(card.tags ?? []),
      ]
        .filter(Boolean)
        .join(' ')

      const normalizedHaystack = normalizeText(haystack)

      const matchesSearch =
        !q || normalizedHaystack.includes(q)

      return (
        matchesCategory &&
        matchesSpecialty &&
        matchesCountry &&
        matchesRegion &&
        matchesCity &&
        matchesSearch
      )
    })

    result = [...result]

    if (sort === 'active') {
      result.sort(
        (a, b) =>
          Number(b.network_score || 0) -
          Number(a.network_score || 0)
      )
    }

    if (sort === 'recent') {
      result.sort(
        (a, b) =>
          new Date(b.network_created_at).getTime() -
          new Date(a.network_created_at).getTime()
      )
    }

    if (sort === 'az') {
      result.sort((a, b) =>
        a.display_name.localeCompare(
          b.display_name,
          'pt'
        )
      )
    }

    return result
  }, [
    cards,
    search,
    category,
    specialty,
    country,
    region,
    city,
    sort,
  ])

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg,#050b18 0%,#071426 55%,#050b18 100%)',
        color: '#fff',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '56px 22px 80px',
        }}
      >
        <header
          style={{
            textAlign: 'center',
            maxWidth: 820,
            margin: '0 auto',
          }}
        >
          <div
            style={{
              color: '#38bdf8',
              fontWeight: 900,
              letterSpacing: 2,
              fontSize: 13,
            }}
          >
            KARDME NETWORK
          </div>

          <h1
            style={{
              fontSize: 'clamp(36px,6vw,68px)',
              lineHeight: 1.02,
              margin: '14px 0',
              fontWeight: 900,
            }}
          >
            Descubra. Conecte-se.
            <br />
            Faça negócios.
          </h1>

          <p
            style={{
              color: 'rgba(255,255,255,.65)',
              fontSize: 18,
              lineHeight: 1.6,
              margin: '0 auto',
              maxWidth: 680,
            }}
          >
            Encontre profissionais, empresas e serviços
            dentro do Kardme Network.
          </p>
        </header>

        <div
          style={{
            marginTop: 38,
            background: 'rgba(15,23,42,.72)',
            border:
              '1px solid rgba(255,255,255,.08)',
            borderRadius: 20,
            padding: 18,
            backdropFilter: 'blur(16px)',
          }}
        >
          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="🔎 Pesquisar nome, empresa, profissão ou serviço..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              minHeight: 54,
              borderRadius: 14,
              border:
                '1px solid rgba(255,255,255,.12)',
              background: '#07101f',
              color: '#fff',
              padding: '0 18px',
              fontSize: 16,
              outline: 'none',
            }}
          />

          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingTop: 16,
              paddingBottom: 4,
            }}
          >
            {['Todos', ...categories].map(
              (item) => (
                <button
                  key={item}
                  onClick={() => {
                    setCategory(item)
                    setSpecialty('Todos')
                  }}
                  style={{
                    flex: '0 0 auto',
                    borderRadius: 999,
                    padding: '9px 14px',
                    border:
                      category === item
                        ? '1px solid #38bdf8'
                        : '1px solid rgba(255,255,255,.1)',
                    background:
                      category === item
                        ? 'rgba(56,189,248,.14)'
                        : 'rgba(255,255,255,.03)',
                    color:
                      category === item
                        ? '#7dd3fc'
                        : 'rgba(255,255,255,.72)',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {item}
                </button>
              )
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit,minmax(170px,1fr))',
              gap: 10,
              marginTop: 16,
            }}
          >
            <FilterSelect
              value={specialty}
              onChange={setSpecialty}
              options={specialties}
              label="Especialidade"
            />

            <FilterSelect
              value={specialty}
              onChange={setSpecialty}
              options={specialties}
              label="Especialidade"
            />

            <FilterSelect
              value={country}
              onChange={(v) => {
                setCountry(v)
                setRegion('Todos')
                setCity('Todos')
              }}
              options={countries}
              label="País"
            />

            <FilterSelect
              value={region}
              onChange={(v) => {
                setRegion(v)
                setCity('Todos')
              }}
              options={regions}
              label="Região"
            />

            <FilterSelect
              value={city}
              onChange={setCity}
              options={cities}
              label="Localidade"
            />

            <select
              value={sort}
              onChange={(e) =>
                setSort(
                  e.target.value as SortMode
                )
              }
              style={selectStyle}
            >
              <option value="active">
                🔥 Mais ativos
              </option>
              <option value="recent">
                🆕 Mais recentes
              </option>
              <option value="az">
                A–Z
              </option>
            </select>
          </div>
        </div>

        <div
          style={{
            marginTop: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              color: 'rgba(255,255,255,.6)',
            }}
          >
            <strong style={{ color: '#fff' }}>
              {filtered.length}
            </strong>{' '}
            profissionais encontrados
          </div>

          {sort === 'active' && (
            <div
              style={{
                color: '#7dd3fc',
                fontSize: 13,
              }}
            >
              🔥 Quanto mais utiliza o seu Kardme,
              maior pode ser a sua visibilidade.
            </div>
          )}
        </div>

        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: 70,
              color: 'rgba(255,255,255,.55)',
            }}
          >
            A carregar Kardme Network…
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 70,
              color: 'rgba(255,255,255,.55)',
            }}
          >
            Ainda não encontrámos resultados com
            estes filtros.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill,minmax(250px,1fr))',
              gap: 18,
              marginTop: 22,
            }}
          >
            {filtered.map((card, index) => (
              <Link
                key={card.card_id}
                href={`/${card.slug}`}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <article
                  style={{
                    height: '100%',
                    borderRadius: 20,
                    overflow: 'hidden',
                    background:
                      'linear-gradient(145deg,#111c31,#0b1220)',
                    border:
                      '1px solid rgba(255,255,255,.09)',
                    transition:
                      'transform .18s ease,border-color .18s ease',
                  }}
                >
                  <div
                    style={{
                      minHeight: 120,
                      background:
                        'radial-gradient(circle at 20% 20%,rgba(14,165,233,.34),transparent 42%),radial-gradient(circle at 90% 40%,rgba(99,102,241,.28),transparent 40%),#08101e',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'flex-end',
                      paddingTop: 24,
                    }}
                  >
                    {card.avatar_url ? (
                      <img
                        src={card.avatar_url}
                        alt={card.display_name}
                        style={{
                          width: 92,
                          height: 92,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border:
                            '4px solid #0b1220',
                          transform:
                            'translateY(28px)',
                          background: '#111827',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 92,
                          height: 92,
                          borderRadius: '50%',
                          border:
                            '4px solid #0b1220',
                          background: '#172033',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 34,
                          fontWeight: 900,
                          transform:
                            'translateY(28px)',
                        }}
                      >
                        {card.display_name
                          ?.charAt(0)
                          ?.toUpperCase() || 'K'}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      padding:
                        '42px 20px 20px',
                      textAlign: 'center',
                    }}
                  >
                    {sort === 'active' &&
                      index < 3 && (
                        <div
                          style={{
                            display:
                              'inline-block',
                            marginBottom: 8,
                            padding:
                              '4px 9px',
                            borderRadius: 999,
                            background:
                              'rgba(245,158,11,.13)',
                            color: '#fbbf24',
                            fontSize: 11,
                            fontWeight: 900,
                          }}
                        >
                          {index === 0
                            ? '🥇 Mais ativo'
                            : index === 1
                            ? '🥈 2.º mais ativo'
                            : '🥉 3.º mais ativo'}
                        </div>
                      )}

                    <h2
                      style={{
                        margin: 0,
                        fontSize: 19,
                        color: '#fff',
                      }}
                    >
                      {card.display_name}
                    </h2>

                    {card.profession && (
                      <div
                        style={{
                          marginTop: 6,
                          color: '#7dd3fc',
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {card.profession}
                      </div>
                    )}

                    {card.company && (
                      <div
                        style={{
                          marginTop: 4,
                          color:
                            'rgba(255,255,255,.55)',
                          fontSize: 13,
                        }}
                      >
                        {card.company}
                      </div>
                    )}

                    <div
                      style={{
                        marginTop: 12,
                        color:
                          'rgba(255,255,255,.52)',
                        fontSize: 13,
                      }}
                    >
                      {[
                        card.city,
                        card.region,
                        card.country,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>

                    {card.short_description && (
                      <p
                        style={{
                          color:
                            'rgba(255,255,255,.62)',
                          fontSize: 13,
                          lineHeight: 1.5,
                          margin:
                            '14px 0 0',
                        }}
                      >
                        {card.short_description}
                      </p>
                    )}

                    <div
                      style={{
                        marginTop: 18,
                        color: '#38bdf8',
                        fontWeight: 800,
                        fontSize: 13,
                      }}
                    >
                      Ver Kardme →
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
  label: string
}) {
  return (
    <select
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
      style={selectStyle}
    >
      <option value="Todos">
        {label}: Todos
      </option>

      {options.map((option) => (
        <option
          key={option}
          value={option}
        >
          {option}
        </option>
      ))}
    </select>
  )
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 48,
  padding: '0 12px',
  borderRadius: 11,
  border:
    '1px solid rgba(255,255,255,.11)',
  background: '#07101f',
  color: '#fff',
  outline: 'none',
  fontSize: 14,
}
