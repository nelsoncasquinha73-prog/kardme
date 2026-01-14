'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type TemplateCard = {
  id: string
  slug: string | null
  title?: string | null
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<TemplateCard[]>([])
  const [mode, setMode] = useState<'template' | 'blank'>('template')
  const [templateId, setTemplateId] = useState<string>('')
  const [slug, setSlug] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizedSlug = useMemo(() => slugify(slug), [slug])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/templates')
        const json = await res.json()
        if (json.success) setTemplates(json.templates ?? [])
        else setTemplates([])
      } catch {
        setTemplates([])
      }
    })()
  }, [])

  async function handleCreate() {
    setError(null)

    if (!normalizedSlug) return setError('Escreve um slug válido (ex: cliente-joao).')
    if (mode === 'template' && !templateId) return setError('Escolhe um template.')

    setLoading(true)
    try {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
      const accessToken = sessionData?.session?.access_token
      if (sessionErr || !accessToken) throw new Error('Sessão inválida. Faz login novamente.')

      const endpoint =
        mode === 'template' ? '/api/cards/create-from-template' : '/api/cards/create-empty'

      const payload =
        mode === 'template' ? { templateId, slug: normalizedSlug } : { slug: normalizedSlug }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Erro ao criar cartão')

      const newCardId = json.card.id as string
      router.push(`/dashboard/cards/${newCardId}/theme`)
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar cartão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ fontSize: 18, fontWeight: 900 }}>Criar cartão</h1>
      <p style={{ opacity: 0.8, marginTop: 6 }}>
        Escolhe um template ou cria do zero. Define o link (slug) e segue direto para o editor.
      </p>

      <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
        <label style={{ fontSize: 13, fontWeight: 800 }}>Modo</label>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => setMode('template')}
            style={{
              height: 38,
              borderRadius: 10,
              padding: '0 12px',
              border: '1px solid rgba(255,255,255,0.18)',
              background: mode === 'template' ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: 'inherit',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Escolher template
          </button>
          <button
            type="button"
            onClick={() => setMode('blank')}
            style={{
              height: 38,
              borderRadius: 10,
              padding: '0 12px',
              border: '1px solid rgba(255,255,255,0.18)',
              background: mode === 'blank' ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: 'inherit',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Criar do zero
          </button>
        </div>

        {mode === 'template' && (
          <>
            <label style={{ fontSize: 13, fontWeight: 800, marginTop: 8 }}>Template</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              style={{
                height: 40,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.18)',
                padding: '0 10px',
                background: 'rgba(0,0,0,0.18)',
                color: 'inherit',
              }}
            >
              <option value="">— Escolher —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title ? `${t.title} (${t.slug ?? t.id.slice(0, 8)})` : `${t.slug ?? t.id.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </>
        )}

        <label style={{ fontSize: 13, fontWeight: 800, marginTop: 8 }}>Slug (link do cartão)</label>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="ex: nelson-teste, cliente-joao, remax-ana"
          style={{
            height: 40,
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.18)',
            padding: '0 10px',
            background: 'rgba(0,0,0,0.18)',
            color: 'inherit',
          }}
        />

        {slug && normalizedSlug !== slug && (
          <div style={{ opacity: 0.8, fontSize: 12 }}>
            Vai ficar: <strong>{normalizedSlug}</strong>
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={loading}
          style={{
            marginTop: 10,
            height: 44,
            borderRadius: 12,
            border: 'none',
            background: '#111827',
            color: '#fff',
            fontWeight: 900,
            cursor: 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'A criar…' : 'Criar cartão'}
        </button>

        {error && <div style={{ color: '#ffb4b4', fontWeight: 800 }}>{error}</div>}
      </div>
    </div>
  )
}
