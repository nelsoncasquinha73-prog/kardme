'use client'

import '@/styles/dashboard.css'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Link from 'next/link'
import DeleteCardModal from '@/components/DeleteCardModal'
import RenameCardModal, { CardNameWithEdit } from './RenameCardModal'

import { useLanguage } from '@/components/language/LanguageProvider'
const ADMIN_EMAILS = ['admin@kardme.com', 'nelson@kardme.com']

const MOTIVATIONAL_QUOTES = [
  // Kardme
  { quote: "Cada template que crias é uma porta que se abre para alguém realizar o seu sonho.", emoji: "🚀", author: "Kardme" },
  { quote: "O Kardme não é só um produto. É a tua visão a ganhar vida.", emoji: "✨", author: "Kardme" },
  { quote: "Hoje é mais um dia para construir algo extraordinário.", emoji: "🔥", author: "Kardme" },
  { quote: "Os grandes projetos começam com pequenos passos consistentes. Continua.", emoji: "👣", author: "Kardme" },
  { quote: "Cada cliente que ajudas é uma história de sucesso que começa.", emoji: "📖", author: "Kardme" },
  { quote: "O teu bebé está a crescer. Cuida dele com amor.", emoji: "💜", author: "Kardme" },
  { quote: "Não estás só a criar cartões. Estás a criar conexões.", emoji: "🤝", author: "Kardme" },
  { quote: "A persistência transforma sonhos em realidade. Estás no caminho certo.", emoji: "🎯", author: "Kardme" },
  { quote: "Cada linha de código é um tijolo no império que estás a construir.", emoji: "🏗️", author: "Kardme" },
  { quote: "O sucesso não é um destino, é a jornada. Aproveita cada momento.", emoji: "🌟", author: "Kardme" },
  { quote: "Hoje o Kardme está melhor do que ontem. Amanhã estará ainda melhor.", emoji: "📈", author: "Kardme" },
  { quote: "A tua dedicação vai inspirar outros a seguir os seus sonhos.", emoji: "💫", author: "Kardme" },
  { quote: "Grandes coisas nunca vêm de zonas de conforto. Continua a arriscar.", emoji: "🦁", author: "Kardme" },
  { quote: "O mundo precisa do que estás a criar. Não desistas.", emoji: "🌍", author: "Kardme" },
  { quote: "Cada desafio superado torna-te mais forte. Tu consegues.", emoji: "💪", author: "Kardme" },
  { quote: "O Kardme é único porque TU és único.", emoji: "⭐", author: "Kardme" },
  { quote: "Acredita no processo. Os resultados vão aparecer.", emoji: "🌱", author: "Kardme" },
  { quote: "Estás a construir algo que vai mudar vidas. Isso é poderoso.", emoji: "⚡", author: "Kardme" },
  { quote: "O melhor momento para começar foi ontem. O segundo melhor é agora.", emoji: "⏰", author: "Kardme" },
  { quote: "Sê paciente contigo mesmo. Roma não foi construída num dia.", emoji: "🏛️", author: "Kardme" },
  // Grant Cardone
  { quote: "O sucesso é o teu dever, obrigação e responsabilidade.", emoji: "🔥", author: "Grant Cardone" },
  { quote: "Ação massiva é a cura para todos os problemas.", emoji: "💥", author: "Grant Cardone" },
  { quote: "Nunca reduzas um objetivo. Aumenta as ações.", emoji: "🎯", author: "Grant Cardone" },
  { quote: "O medo é um indicador. O medo diz-te o que tens de fazer.", emoji: "🦁", author: "Grant Cardone" },
  { quote: "Pessoas medianas procuram equilíbrio. Pessoas extraordinárias procuram domínio.", emoji: "👑", author: "Grant Cardone" },
  { quote: "Não vais a lado nenhum a jogar pelo seguro.", emoji: "🚀", author: "Grant Cardone" },
  { quote: "Multiplica por 10 os teus objetivos e multiplica por 10 as tuas ações.", emoji: "📈", author: "Grant Cardone" },
  { quote: "O dinheiro e o sucesso não vão ter contigo. Tens de ir buscá-los.", emoji: "💰", author: "Grant Cardone" },
  { quote: "Compromete-te primeiro, descobre o resto depois.", emoji: "⚡", author: "Grant Cardone" },
  { quote: "Obscuridade é um problema maior do que dinheiro.", emoji: "📢", author: "Grant Cardone" },
  { quote: "Se não estás a ser criticado, não estás a fazer o suficiente.", emoji: "🔥", author: "Grant Cardone" },
  { quote: "Trata cada dia como se a tua vida dependesse disso. Porque depende.", emoji: "⏰", author: "Grant Cardone" },
  // Tony Robbins
  { quote: "O caminho para o sucesso é tomar ação massiva e determinada.", emoji: "🚀", author: "Tony Robbins" },
  { quote: "É nas tuas decisões, não nas tuas condições, que o teu destino é moldado.", emoji: "🎯", author: "Tony Robbins" },
  { quote: "A qualidade da tua vida é a qualidade das tuas emoções.", emoji: "💜", author: "Tony Robbins" },
  { quote: "Onde o foco vai, a energia flui.", emoji: "⚡", author: "Tony Robbins" },
  { quote: "O único limite para o teu impacto é a tua imaginação e compromisso.", emoji: "🌟", author: "Tony Robbins" },
  { quote: "Pessoas de sucesso fazem perguntas melhores.", emoji: "🧠", author: "Tony Robbins" },
  { quote: "Se fazes o que sempre fizeste, terás o que sempre tiveste.", emoji: "🔄", author: "Tony Robbins" },
  { quote: "Não é o que fazemos de vez em quando que molda as nossas vidas, mas o que fazemos consistentemente.", emoji: "📈", author: "Tony Robbins" },
  { quote: "O progresso é igual à felicidade.", emoji: "😊", author: "Tony Robbins" },
  { quote: "Identifica os teus problemas, mas dá o teu poder e energia às soluções.", emoji: "💡", author: "Tony Robbins" },
  { quote: "A mudança acontece quando a dor de ficar igual é maior do que a dor de mudar.", emoji: "🦋", author: "Tony Robbins" },
  { quote: "Quanto mais gratidão tens, mais coisas tens para agradecer.", emoji: "🙏", author: "Tony Robbins" },
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
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [renamingCard, setRenamingCard] = useState<any>(null)
  const [newName, setNewName] = useState('')
  const [cardToDelete, setCardToDelete] = useState<Card | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState('')
  const [quote, setQuote] = useState({ quote: '', emoji: '', author: '' })
  const { t } = useLanguage()

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
    if (loading) return t('dashboard.loading')
    if (error) return t('dashboard.error_loading_cards')
    if (!hasCards) return t('dashboard.first_card_message')
    return `${cards.length} ${t('dashboard.cards_count')}`
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

  const handleRename = async () => {
    if (!renamingCard || !newName.trim()) return
    try {
      const { error } = await supabase
        .from('cards')
        .update({ name: newName.trim() })
        .eq('id', renamingCard.id)
      if (error) throw error
      setCards(cards.map(c => c.id === renamingCard.id ? { ...c, name: newName.trim() } : c))
      setRenameModalOpen(false)
      setRenamingCard(null)
      setNewName('')
    } catch (e: any) {
      alert('Erro ao renomear: ' + e.message)
    }
  }

  if (loading) return <p style={{ padding: 24 }}>{t('dashboard.loading')}</p>

  // Admin Dashboard - Motivational
  if (isAdmin) {
    const hour = new Date().getHours()
    let greeting = 'Olá'
    if (hour < 12) greeting = 'Bom dia'
    else if (hour < 19) greeting = 'Boa tarde'
    else greeting = 'Boa noite'

  
  {/* Rename Modal */}
  <RenameCardModal
    isOpen={renameModalOpen}
    card={renamingCard}
    newName={newName}
    onNameChange={setNewName}
    onSave={handleRename}
    onClose={() => {
      setRenameModalOpen(false)
      setRenamingCard(null)
      setNewName('')
    }}
  />

    return (
      <div className="dashboard-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 200px)' }}>
        <div style={{ textAlign: 'center', maxWidth: 800, padding: '40px 20px' }}>
          {/* Greeting */}
          <p style={{ fontSize: 27, color: '#9ca3af', marginBottom: 8 }}>
            {greeting}, <span style={{ color: '#8b5cf6', fontWeight: 600 }}>{userName}</span> 👋
          </p>
          
          {/* Big Emoji */}
          <div style={{ fontSize: 96, marginBottom: 36 }}>
            {quote.emoji}
          </div>
          
          {/* Quote */}
          <p style={{ 
            fontSize: 42, 
            fontWeight: 600, 
            color: '#d1d5db', 
            lineHeight: 1.4,
            marginBottom: 32 
          }}>
            "{quote.quote}"
          </p>
          
          {/* Subtle branding */}
          <p style={{ fontSize: 21, color: '#9ca3af', marginBottom: 50 }}>
            — {quote.author}
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
            {t('dashboard.start_creating')} ✨
          </Link>
        </div>
      </div>
    )
  }

  // Regular User Dashboard

  {/* Rename Modal */}
  <RenameCardModal
    isOpen={renameModalOpen}
    card={renamingCard}
    newName={newName}
    onNameChange={setNewName}
    onSave={handleRename}
    onClose={() => {
      setRenameModalOpen(false)
      setRenamingCard(null)
      setNewName('')
    }}
  />

    return (
    <div className="dashboard-wrap">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">{t('dashboard.my_cards')}</h1>
          <p className="dashboard-subtitle">{subtitle}</p>
        </div>

        <div className="dashboard-actions">
          <Link className="btn-secondary" href="/dashboard/catalog">
            {t('dashboard.view')} catálogo
          </Link>
          <Link className="btn-primary" href="/dashboard/cards/new">
            + {t('dashboard.create_card')}
          </Link>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {!error && !hasCards && (
        <div className="empty">
          <p className="empty-title">{t('dashboard.create_first_card')}</p>
          <p className="empty-desc">
            {t('dashboard.empty_desc')}
            e leads.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link className="btn-primary" href="/dashboard/cards/new">
              {t('dashboard.create_card_free')}
            </Link>
            <Link className="btn-secondary" href="/dashboard/catalog">
              {t('dashboard.view')} catálogo
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
                  <CardNameWithEdit
                    name={card.name}
                    onEdit={() => {
                      setRenamingCard(card)
                      setNewName(card.name || '')
                      setRenameModalOpen(true)
                    }}
                  />
                  <p className="card-meta">
                    {(card.job || '—')}
                    {card.company ? ` · ${card.company}` : ''}
                  </p>
                </div>

                <div className="card-tile-actions">
                  <Link className="card-btn card-btn-primary" href={`/dashboard/cards/${card.id}/theme`}>
                    {t('dashboard.edit')}
                  </Link>
                  <Link
                    className="card-btn card-btn-ghost"
                    href={`/dashboard/cards/${card.id}/network`}
                    title="Configurar Kardme Network"
                  >
                    🌐 Network
                  </Link>

                  <Link className="card-btn card-btn-ghost" href={`/${card.slug}`} target="_blank">
                    {t('dashboard.view')}
                  </Link>

                  <button
                    type="button"
                    className="card-btn card-btn-danger"
                    onClick={() => openDeleteModal(card)}
                    disabled={deletingId === card.id}
                    title="Eliminar cartão"
                  >
                    {deletingId === card.id ? t('dashboard.deleting') : t('dashboard.delete')}
                  </button>
                </div>
              </div>

              <div className="card-link">kardme.com/{card.slug}</div>
            </div>
          ))}
        </div>
      )}

      <RenameCardModal isOpen={renameModalOpen} card={renamingCard} newName={newName} onNameChange={setNewName} onSave={handleRename} onClose={() => { setRenameModalOpen(false); setRenamingCard(null); setNewName(''); }} />

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
