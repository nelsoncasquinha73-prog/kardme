'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import '@/styles/dashboard.css'
import Link from 'next/link'
import { useLanguage } from '@/components/language/LanguageProvider'

type Template = {
  id: string
  name: string
  description: string | null
  category: string
  price: number
  image_url: string | null
  preview_json: any[]
  theme_json: any | null
  is_active: boolean
}


type UserTemplate = {
  template_id: string
}

export default function NewCardPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [allTemplates, setAllTemplates] = useState<Template[]>([])
  const [userTemplateIds, setUserTemplateIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creatingCardId, setCreatingCardId] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    setError(null)

    // Get user
    const { data: authData, error: authErr } = await supabase.auth.getUser()
    if (authErr || !authData?.user?.id) {
      setError(t('dashboard.no_session'))
      setLoading(false)
      return
    }

    const userId = authData.user.id

    // Load public templates (is_active = true)
    const { data: templates, error: templatesErr } = await supabase
      .from('templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (templatesErr) {
      setError(templatesErr.message)
      setLoading(false)
      return
    }

    // Load user's purchased templates
    const { data: userTemplates, error: userTemplatesErr } = await supabase
      .from('user_templates')
      .select('template_id')
      .eq('user_id', userId)

    if (userTemplatesErr) {
      console.error(t('dashboard.error_loading_templates'), userTemplatesErr)
    }

    setAllTemplates((templates || []) as Template[])
    setUserTemplateIds(userTemplates?.map((ut) => ut.template_id) || [])
    setLoading(false)
  }

  const createCardFromTemplate = async (template: Template) => {
    setCreatingCardId(template.id)
    setError(null)

    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData?.user?.id

      if (!userId) {
        setError(t('dashboard.no_session_short'))
        setCreatingCardId(null)
        return
      }

      // 1) Create new card
      const { data: newCard, error: cardErr } = await supabase
  .from('cards')
  .insert({
    user_id: userId,
    name: 'Novo cartão',
    template_id: template.id,
    theme: template.theme_json,
  })

        .select('id')
        .single()

      if (cardErr) {
        setError(cardErr.message)
        setCreatingCardId(null)
        return
      }

      const cardId = newCard.id

      // 2) Insert blocks from template.preview_json
      if (template.preview_json && Array.isArray(template.preview_json)) {
        const blocksToInsert = template.preview_json.map((block, index) => ({
          card_id: cardId,
          type: block.type,
          order: block.order !== undefined ? block.order : index,
          settings: block.settings || {},
          style: block.style || {},
          title: block.title || null,
          enabled: block.enabled !== undefined ? block.enabled : true,
        }))

        const { error: blocksErr } = await supabase
          .from('card_blocks')
          .insert(blocksToInsert)

        if (blocksErr) {
          setError(`Erro ao criar blocos: ${blocksErr.message}`)
          setCreatingCardId(null)
          return
        }
      }

      // 3) Redirect to editor
      router.push(`/dashboard/cards/${cardId}/theme`)
    } catch (err) {
      setError(t('dashboard.error_create_card'))
      setCreatingCardId(null)
    }
  }

  const freeTemplates = allTemplates.filter((t) => t.price === 0 || t.price === null)
  const paidTemplates = allTemplates.filter((t) => (t.price || 0) > 0)
  const userHasTemplate = (templateId: string) => userTemplateIds.includes(templateId)

  if (loading) return <p style={{ padding: 24 }}>A carregar templates…</p>

  return (
    <div className="dashboard-wrap">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Criar novo cartão</h1>
          <p className="dashboard-subtitle">Escolhe um template e começa a personalizar</p>
        </div>

        <Link className="btn-secondary" href="/dashboard">
          ← Voltar
        </Link>
      </div>

      {error && <div className="error">{error}</div>}

      {/* FREE TEMPLATES */}
      {freeTemplates.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'rgba(255,255,255,0.92)' }}>
            Templates grátis
          </h2>
          <div className="cards-grid">
            {freeTemplates.map((template) => (
              <div key={template.id} className="card-tile-premium">
                <div style={{ marginBottom: 12 }}>
                  <p className="card-name">{template.name}</p>
                  <p className="card-meta">{template.category}</p>
                  {template.description && (
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
                      {template.description}
                    </p>
                  )}
                </div>

                <button
                  className="card-btn card-btn-primary"
                  onClick={() => createCardFromTemplate(template)}
                  disabled={creatingCardId === template.id}
                  style={{ width: '100%' }}
                >
                  {creatingCardId === template.id ? 'A criar…' : 'Usar template'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAID TEMPLATES (user's purchased) */}
      {paidTemplates.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'rgba(255,255,255,0.92)' }}>
            Templates premium
          </h2>
          <div className="cards-grid">
            {paidTemplates.map((template) => {
              const hasAccess = userHasTemplate(template.id)
              return (
                <div key={template.id} className="card-tile-premium">
                  <div style={{ marginBottom: 12 }}>
                    <p className="card-name">{template.name}</p>
                    <p className="card-meta">
                      {template.category} • €{template.price}
                    </p>
                    {template.description && (
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
                        {template.description}
                      </p>
                    )}
                  </div>

                  {hasAccess ? (
                    <button
                      className="card-btn card-btn-primary"
                      onClick={() => createCardFromTemplate(template)}
                      disabled={creatingCardId === template.id}
                      style={{ width: '100%' }}
                    >
                      {creatingCardId === template.id ? 'A criar…' : 'Usar template'}
                    </button>
                  ) : (
                    <button
                      className="card-btn card-btn-ghost"
                      disabled
                      style={{ width: '100%', opacity: 0.6 }}
                    >
                      Comprar (em breve)
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {allTemplates.length === 0 && (
        <div className="empty">
          <p className="empty-title">Sem templates disponíveis</p>
          <p className="empty-desc">Os templates aparecerão aqui quando forem criados.</p>
        </div>
      )}
    </div>
  )
}
