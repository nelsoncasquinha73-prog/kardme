'use client'

import { useCallback, useEffect, useState } from 'react'
import { cardOrderAdminFetch } from '@/lib/cardOrderAdminFetch'

type Team = {
  id: string
  name: string
  slug: string
  default_language: string
  active: boolean
  created_at: string
}

const languages = [
  { value: 'pt-PT', label: 'Português (Portugal)' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en', label: 'English' },
  { value: 'it', label: 'Italiano' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'ar', label: 'العربية' },
]

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [language, setLanguage] = useState('pt-PT')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadTeams = useCallback(async () => {
    try {
      const res = await cardOrderAdminFetch('/api/admin/teams')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar equipas')
      setTeams(json.teams || [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTeams()
  }, [loadTeams])

  function changeName(value: string) {
    setName(value)
    setSlug(
      value.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    )
  }

  async function createTeam(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (saving) return

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const res = await cardOrderAdminFetch('/api/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          default_language: language,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao criar equipa')

      setName('')
      setSlug('')
      setMessage(`Equipa "${json.team.name}" criada com sucesso.`)
      await loadTeams()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 48,
    boxSizing: 'border-box',
    padding: '12px 14px',
    lineHeight: '22px',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    fontSize: 14,
    color: '#0f172a',
    background: '#ffffff',
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        Gestão de Equipas
      </h1>
      <p style={{ color: '#64748b', marginBottom: 28 }}>
        Cria equipas e partilha os formulários de inscrição.
      </p>

      <section style={{
        padding: 24,
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        marginBottom: 30,
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>
          Criar nova equipa
        </h2>

        <form onSubmit={createTeam} style={{ display: 'grid', gap: 16 }}>
          <label>
            Nome da equipa
            <input
              required
              maxLength={120}
              style={inputStyle}
              value={name}
              onChange={e => changeName(e.target.value)}
              placeholder="Ex.: LifeWave Portugal"
            />
          </label>

          <label>
            Identificador do link
            <input
              required
              maxLength={80}
              style={inputStyle}
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder="lifewave-portugal"
            />
          </label>

          <label>
            Idioma predefinido
            <select
              style={inputStyle}
              value={language}
              onChange={e => setLanguage(e.target.value)}
            >
              {languages.map(item => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '13px 20px',
              background: '#2563eb',
              color: 'white',
              border: 0,
              borderRadius: 9,
              fontWeight: 700,
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'A criar...' : '+ Criar equipa'}
          </button>
        </form>
      </section>

      {error && <p role="alert" style={{ color: '#dc2626' }}>{error}</p>}
      {message && <p role="status" style={{ color: '#059669' }}>{message}</p>}

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
        Equipas existentes
      </h2>

      {loading ? (
        <p>A carregar equipas...</p>
      ) : teams.length === 0 ? (
        <p>Ainda não existem equipas.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {teams.map(team => (
            <article key={team.id} style={{
              padding: 18,
              border: '1px solid #e2e8f0',
              borderRadius: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <strong>{team.name}</strong>
                  <p style={{ margin: '6px 0', color: '#64748b' }}>
                    Idioma: {languages.find(l => l.value === team.default_language)?.label || team.default_language}
                    {' · '}
                    {team.active ? 'Ativa' : 'Inativa'}
                  </p>
                  <code>/teams/{team.slug}</code>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <a
                    href={`/admin/teams/${team.id}`}
                    style={{
                      padding: '9px 12px',
                      borderRadius: 8,
                      background: '#2563eb',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Ver pedidos
                  </a>
                  <a
                    href={`/teams/${team.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir formulário
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          `${window.location.origin}/teams/${team.slug}`
                        )
                        setMessage('Link copiado!')
                      } catch {
                        setError('Não foi possível copiar o link.')
                      }
                    }}
                    style={{
                      padding: '9px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      cursor: 'pointer',
                    }}
                  >
                    Copiar link
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
