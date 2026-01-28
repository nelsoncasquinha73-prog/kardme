'use client'

import '@/styles/dashboard.css'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Link from 'next/link'
import DeleteCardModal from '@/components/DeleteCardModal'

const ADMIN_EMAILS = ['admin@kardme.com', 'nelson@kardme.com']

const MOTIVATIONAL_QUOTES = [
  { quote: "Cada template que crias é uma porta que se abre para alguém realizar o seu sonho.", emoji: "🚀" },
  { quote: "O Kardme não é só um produto. É a tua visão a ganhar vida.", emoji: "✨" },
  { quote: "Hoje é mais um dia para construir algo extraordinário.", emoji: "🔥" },
  { quote: "Os grandes projetos começam com pequenos passos consistentes. Continua.", emoji: "👣" },
  { quote: "Cada cliente que ajudas é uma história de sucesso que começa.", emoji: "📖" },
  { quote: "O teu bebé está a crescer. Cuida dele com amor.", emoji: "💜" },
  { quote: "Não estás só a criar cartões. Estás a criar conexões.", emoji: "🤝" },
  { quote: "A persistência transforma sonhos em realidade. Estás no caminho certo.", emoji: "🎯" },
  { quote: "Cada linha de código é um tijolo no império que estás a construir.", emoji: "🏗️" },
  { quote: "O sucesso não é um destino, é a jornada. Aproveita cada momento.", emoji: "🌟" },
  { quote: "Hoje o Kardme está melhor do que ontem. Amanhã estará ainda melhor.", emoji: "📈" },
  { quote: "A tua dedicação vai inspirar outros a seguir os seus sonhos.", emoji: "💫" },
  { quote: "Grandes coisas nunca vêm de zonas de conforto. Continua a arriscar.", emoji: "🦁" },
  { quote: "O mundo precisa do que estás a criar. Não desistas.", emoji: "🌍" },
  { quote: "Cada desafio superado torna-te mais forte. Tu consegues.", emoji: "💪" },
  { quote: "O Kardme é único porque TU és único.", emoji: "⭐" },
  { quote: "Acredita no processo. Os resultados vão aparecer.", emoji: "🌱" },
  { quote: "Estás a construir algo que vai mudar vidas. Isso é poderoso.", emoji: "⚡" },
  { quote: "O melhor momento para começar foi ontem. O segundo melhor é agora.", emoji: "⏰" },
  { quote: "Sê paciente contigo mesmo. Roma não foi construída num dia.", emoji: "🏛️" },
]

type Card = {
  id: string
  name: string
  job: string | null
  company: string | null
  slug: string
  user_id: string | null
}

export default function DashboardPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [cardToDelete, setCardToDelete] = useState<Card | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState('')
  const [quote, setQuote] = useState({ quote: '', emoji: '' })

  useEffect(() => {
    // Pick random quote on mount
    const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]
    setQuote(randomQuote)
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    const { data: authData, error: authErr } = await supabase.auth.getUser()
    if (authErr) {
      setError(authErr.message)
      setLoading(false)
      return
    }

    const userId = authData?.user?.id
    const userEmail = authData?.user?.email

    if (!userId) {
      setError('Sem sessão. Faz login novamente.')
      setLoading(false)
      return
    }

    const adminUser = userEmail && ADMIN_EMAILS.includes(userEmail)
    setIsAdmin(!!adminUser)

    // Get first name from email
    if (userEmail) {
      const name = userEmail.split('@')[0]
      setUserName(name.charAt(0).toUpperCase() + name.slice(1))
    }

    if (adminUser) {
      setLoading(false)
      return
    }

    // Regular user - load their cards
    const { data, error: cardsErr } = await supabase
      .from('cards')
      .select('id,name,job,company,slug,user_id')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .or('is_template_draft.is.null,is_template_draft.eq.false')
      .order('created_at', { ascending: true })

    if (cardsErr) {
      setError(cardsErr.message)
      setCards([])
    } else {
      setCards((data || []) as Card[])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const hasCards = cards.length > 0

  const subtitle = useMemo(() => {
    if (loading) return 'A carregar…'
    if (error) return 'Não foi possível carregar os teus cartões.'
    if (!hasCards) return 'Cria o teu primeiro cartão e partilha num só link.'
    return `${cards.length} cartão(ões) na tua conta`
  }, [loading, error, hasCards, cards.length])

  const openDeleteModal = (card: Card) => {
    setCardToDelete(card)
    setModalOpen(true)
  }

  const closeDeleteModal = () => {
    setModalOpen(false)
    setCardToDelete(null)
  }

  const confirmDelete = async () => {
    if (!cardToDelete) return

    setDeletingId(cardToDelete.id)
    setError(null)

    const { error: delErr } = await supabase
      .from('cards')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', cardToDelete.id)

    if (delErr) {
      setError(delErr.message)
      setDeletingId(null)
      return
    }

    setCards((prev) => prev.filter((c) => c.id !== cardToDelete.id))
    setDeletingId(null)
    closeDeleteModal()
  }

  if (loading) return <p style={{ padding: 24 }}>A carregar…</p>

  // Admin Dashboard - Motivational
  if (isAdmin) {
    const hour = new Date().getHours()
    let greeting = 'Olá'
    if (hour < 12) greeting = 'Bom dia'
    else if (hour < 19) greeting = 'Boa tarde'
    else greeting = 'Boa noite'

    return (
      <div className="dashboard-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <div style={{ textAlign: 'center', maxWidth: 600, padding: '40px 20px' }}>
          {/* Greeting */}
          <p style={{ fontSize: 18, color: '#9ca3af', marginBottom: 8 }}>
            {greeting}, <span style={{ color: '#8b5cf6', fontWeight: 600 }}>{userName}</span> 👋
          </p>
          
          {/* Big Emoji */}
          <div style={{ fontSize: 64, marginBottom: 24 }}>
            {quote.emoji}
          </div>
          
          {/* Quote */}
          <p style={{ 
            fontSize: 28, 
            fontWeight: 600, 
            color: '#d1d5db', 
            lineHeight: 1.4,
            marginBottom: 32 
          }}>
            "{quote.quote}"
          </p>
          
          {/* Subtle branding */}
          <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 40 }}>
            — O teu Kardme 💜
          </p>

          {/* Quick action */}
          <Link 
            href="/admin/templates" 
            style={{ 
              display: 'inline-block',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              color: '#fff',
              padding: '14px 32px',
              borderRadius: 12,
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: 15,
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)'
            }}
          >
            Começar a criar ✨
          </Link>
        </div>
      </div>
    )
  }

  // Regular User Dashboard
  return (
    <div className="dashboard-wrap">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Os meus cartões</h1>
          <p className="dashboard-subtitle">{subtitle}</p>
        </div>

        <div className="dashboard-actions">
          <Link className="btn-secondary" href="/dashboard/catalog">
            Ver catálogo
          </Link>
          <Link className="btn-primary" href="/dashboard/cards/new">
            + Criar cartão
          </Link>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {!error && !hasCards && (
        <div className="empty">
          <p className="empty-title">Cria o teu primeiro cartão em 60 segundos</p>
          <p className="empty-desc">
            Escolhe um template premium, adiciona os teus dados e partilha o link. Mais tarde podes ativar NFC, analytics
            e leads.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn-primary" href="/dashboard/cards/new">
              Criar cartão grátis
            </Link>
            <Link className="btn-secondary" href="/dashboard/catalog">
              Ver catálogo
            </Link>
          </div>
        </div>
      )}

      {hasCards && (
        <div className="cards-grid">
          {cards.map((card) => (
            <div key={card.id} className="card-tile-premium">
              <div className="card-tile-top">
                <div className="card-tile-titleWrap">
                  <p className="card-name">{card.name}</p>
                  <p className="card-meta">
                    {(card.job || '—')}
                    {card.company ? ` · ${card.company}` : ''}
                  </p>
                </div>

                <div className="card-tile-actions">
                  <Link className="card-btn card-btn-primary" href={`/dashboard/cards/${card.id}/theme`}>
                    Editar
                  </Link>
                  <Link className="card-btn card-btn-ghost" href={`/${card.slug}`} target="_blank">
                    Ver
                  </Link>

                  <button
                    type="button"
                    className="card-btn card-btn-danger"
                    onClick={() => openDeleteModal(card)}
                    disabled={deletingId === card.id}
                    title="Eliminar cartão"
                  >
                    {deletingId === card.id ? 'A eliminar…' : 'Eliminar'}
                  </button>
                </div>
              </div>

              <div className="card-link">kardme.com/{card.slug}</div>
            </div>
          ))}
        </div>
      )}

      <DeleteCardModal
        isOpen={modalOpen}
        cardName={cardToDelete?.name || ''}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
        isDeleting={deletingId !== null}
      />
    </div>
  )
}
