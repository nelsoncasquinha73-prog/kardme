'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type TemplateCard = {
  id: string
  slug: string | null
  title?: string | null
}


export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<TemplateCard[]>([])
  const [templateId, setTemplateId] = useState<string>('')
  const [slug, setSlug] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (!templateId) return setError('Escolhe um template.')
    if (!slug) return setError('Escreve um slug (ex: cliente-joao).')

    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData?.user) throw new Error('Sessão inválida. Faz login novamente.')

      const res = await fetch('/api/cards/create-from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, slug, userId: authData.user.id }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Erro ao criar cartão')

      const newCardId = json.card.id as string
      router.push(`/dashboard/cards/${newCardId}/theme`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ fontSize: 18, fontWeight: 900 }}>Templates</h1>
      <p style={{ opacity: 0.7, marginTop: 6 }}>
        Escolhe um template e cria um cartão novo para um cliente.
      </p>

      <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
        <label style={{ fontSize: 13, fontWeight: 800 }}>Template</label>
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          style={{ height: 40, borderRadius: 10, border: '1px solid rgba(0,0,0,0.15)', padding: '0 10px' }}
        >
          <option value="">— Escolher —</option>
          {templates.map((t) => (
  <option key={t.id} value={t.id}>
    {t.title ? `${t.title} (${t.slug ?? t.id.slice(0, 8)})` : `${t.slug ?? t.id.slice(0, 8)}`}
  </option>
))}

        </select>

        <label style={{ fontSize: 13, fontWeight: 800, marginTop: 8 }}>Slug do novo cartão</label>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="ex: nelson-teste, cliente-joao, remax-ana"
          style={{ height: 40, borderRadius: 10, border: '1px solid rgba(0,0,0,0.15)', padding: '0 10px' }}
        />

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
          {loading ? 'A criar…' : 'Criar cartão a partir do template'}
        </button>

        {error && <div style={{ color: '#b91c1c', fontWeight: 700 }}>{error}</div>}
      </div>
    </div>
  )
}
