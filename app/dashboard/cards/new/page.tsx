'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function NewCardPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [job, setJob] = useState('')
  const [company, setCompany] = useState('')
  const [slug, setSlug] = useState('')

  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateSlug = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')

  const checkSlug = async (value: string) => {
    setChecking(true)
    setAvailable(null)

    const { data } = await supabase
      .from('cards')
      .select('id')
      .eq('slug', value)
      .maybeSingle()

    setAvailable(!data)
    setChecking(false)
  }

  const handleNameChange = (value: string) => {
    setName(value)

    if (!slug) {
      const autoSlug = generateSlug(value)
      setSlug(autoSlug)
      if (autoSlug.length >= 3) {
        checkSlug(autoSlug)
      }
    }
  }

  const handleSlugChange = (value: string) => {
    const clean = generateSlug(value)
    setSlug(clean)

    if (clean.length >= 3) {
      checkSlug(clean)
    } else {
      setAvailable(null)
    }
  }

  const createCard = async () => {
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Sessão inválida')
      return
    }

    if (!available) {
      setError('Este URL já está a ser usado')
      return
    }

    const { data, error } = await supabase
      .from('cards')
      .insert({
        user_id: user.id,
        name,
        job,
        company,
        slug,
      })
      .select()
      .single()

    if (error || !data) {
      setError('Erro ao criar cartão')
      return
    }

    // redireciona para o cartão público
    router.push(`/${data.slug}`)
  }

  return (
    <main style={{ maxWidth: 500, padding: 40 }}>
      <h1>Criar novo cartão</h1>

      <label>Nome</label>
      <input
        value={name}
        onChange={e => handleNameChange(e.target.value)}
        placeholder="Nome do cartão"
      />

      <label>Cargo</label>
      <input
        value={job}
        onChange={e => setJob(e.target.value)}
        placeholder="ex: Empresário"
      />

      <label>Empresa</label>
      <input
        value={company}
        onChange={e => setCompany(e.target.value)}
        placeholder="ex: Kardme"
      />

      <label>URL do cartão</label>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span>kardme.com/</span>
        <input
          value={slug}
          onChange={e => handleSlugChange(e.target.value)}
        />
      </div>

      {checking && <p>A verificar disponibilidade…</p>}
      {available === true && <p style={{ color: 'green' }}>Disponível ✓</p>}
      {available === false && <p style={{ color: 'red' }}>Indisponível ✕</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button
        onClick={createCard}
        disabled={!name || !slug || !available}
      >
        Criar cartão
      </button>
    </main>
  )
}
