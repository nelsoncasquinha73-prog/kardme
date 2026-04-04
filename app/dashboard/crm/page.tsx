'use client'

import { useToast } from '@/lib/toast-context'
import { useLanguage } from '@/components/language/LanguageProvider'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaWhatsapp } from 'react-icons/fa'
import {
  FiSettings,
  FiMail,
  FiEye,
  FiFileText,
  FiTrash2,
  FiCalendar,
  FiDownload,
  FiUpload,
  FiChevronDown,
} from 'react-icons/fi'

import { supabase } from '@/lib/supabaseClient'
import { useGmailIntegration } from '@/lib/hooks/useGmailIntegration'
import { useChatGPT } from '@/lib/hooks/useChatGPT'
import { createScheduledTask } from '@/lib/crm/scheduledTasks'
import { logLeadActivity } from '@/lib/crm/logLeadActivity'
import { createLeadTask, markTaskDone, fetchTasksForDay, fetchTasksForLead, fetchTasksForMonth, type LeadTask } from '@/lib/crm/tasks'
import { fetchEmailTemplates, createEmailTemplate, DEFAULT_EMAIL_TEMPLATES, type EmailTemplate } from '@/lib/crm/emailTemplates'
import { filesToAttachments, type AttachmentPayload } from '@/lib/crm/attachmentHelpers'
import CalendarGrid from '@/components/crm/CalendarGrid'
import LeadTypesModal from '@/components/crm/LeadTypesModal'
import { fetchLeadTypes, createLeadType, fetchLeadSources, createLeadSource, deleteLeadSource, updateLeadTypeOnLead, updateLeadSource, LEAD_SOURCES_DEFAULT, type LeadType, type LeadSource } from '@/lib/crm/leadTypes'
import { fetchCountries, createCountry, deleteCountry, updateLeadCountry, type Country } from '@/lib/crm/countries'
import LeadMagnetsView from './LeadMagnetsView'
import AmbassadorsView from './AmbassadorsView'
import { ScheduledTasksView } from './ScheduledTasksView'
import EmailMarketingView from './EmailMarketingView'
import PipelineKanban from './PipelineKanban'
import { processEmailTemplate } from '@/lib/processEmailTemplate'

type Lead = {
  id: string
  name: string
  email: string
  phone: string
  zone: string | null
  message: string
  marketing_opt_in: boolean
  consent_given: boolean
  step: string
  notes: string | null
  created_at: string
  contacted: boolean
  card_id: string
  lead_type_id: string | null
  lead_source: string | null
  country: string | null
}

const STEPS = ['Novo', 'Contactado', 'Qualificado', 'Fechado', 'Perdido']

function NewLeadSourceForm({ userId, onCreated }: { userId: string, onCreated: (s: any) => void }) {
  const [label, setLabel] = useState('')
  const [emoji, setEmoji] = useState('📌')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    if (!label.trim()) return
    setLoading(true)
    try {
      const created = await createLeadSource(userId, label.trim(), emoji.trim() || '📌')
      onCreated(created)
      setLabel('')
      setEmoji('📌')
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input value={emoji} onChange={e => setEmoji(e.target.value)} style={{ width: 48, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px', color: '#fff', fontSize: 18, textAlign: 'center' }} />
      <input value={label} onChange={e => setLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && handle()} placeholder="Ex: Parceiro, Evento..." style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14 }} />
      <button onClick={handle} disabled={loading || !label.trim()} style={{ background: '#00b894', border: 'none', borderRadius: 10, padding: '10px 16px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
        + Criar
      </button>
    </div>
  )
}

export default function CrmProPage() {
  const router = useRouter()
  const [showWelcomeInfoModal, setShowWelcomeInfoModal] = useState(false)
  const [showTemplatesInfoModal, setShowTemplatesInfoModal] = useState(false)
  const [showTiposInfoModal, setShowTiposInfoModal] = useState(false)
  const [showOrigemInfoModal, setShowOrigemInfoModal] = useState(false)
  const [showGmailInfoModal, setShowGmailInfoModal] = useState(false)
  const [showOptinInfoModal, setShowOptinInfoModal] = useState(false)
  const { addToast } = useToast()
  const { t } = useLanguage()
  const [userId, setUserId] = useState('')
  const gmail = useGmailIntegration(userId)
  const chatgpt = useChatGPT()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [crmProActive, setCRMProActive] = useState<boolean | null>(null)
  const [crmProChecking, setCRMProChecking] = useState(false)
  const [buyingCRMPro, setBuyingCRMPro] = useState<'monthly' | 'annual' | null>(null)

  const [filterMarketing, setFilterMarketing] = useState<boolean | null>(null)
  const [filterStep, setFilterStep] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [noteText, setNoteText] = useState('')
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showLeadTasksModal, setShowLeadTasksModal] = useState(false)
  const [selectedLeadForTasks, setSelectedLeadForTasks] = useState<Lead | null>(null)
  const [leadTasks, setLeadTasks] = useState<LeadTask[]>([])
  const [leadTasksLoading, setLeadTasksLoading] = useState(false)




  const [selectedLeadForEmail, setSelectedLeadForEmail] = useState<Lead | null>(null)
  const [selectedLeadForEmailMarketing, setSelectedLeadForEmailMarketing] = useState<string | null>(null)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [tasksToday, setTasksToday] = useState<LeadTask[]>([])
  const [calendarTasks, setCalendarTasks] = useState<LeadTask[]>([])
  const [calendarYearMonth, setCalendarYearMonth] = useState<string>(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` })
  const [selectedCalendarTask, setSelectedCalendarTask] = useState<LeadTask | null>(null)
  const [pendingCalendarAction, setPendingCalendarAction] = useState<{ task: LeadTask; lead: Lead | undefined } | null>(null)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedLeadForTask, setSelectedLeadForTask] = useState<Lead | null>(null)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskDueTime, setTaskDueTime] = useState('09:00')
  const [taskActionType, setTaskActionType] = useState('follow_up')
  const [leadActivities, setLeadActivities] = useState<any[]>([])
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
  const [saveTemplateName, setSaveTemplateName] = useState('')
  const [saveTemplateCategory, setSaveTemplateCategory] = useState('Geral')
  const [selectedAttachments, setSelectedAttachments] = useState<AttachmentPayload[]>([])
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [showViewLeadModal, setShowViewLeadModal] = useState(false)
  const [selectedLeadForView, setSelectedLeadForView] = useState<Lead | null>(null)
  const [viewLeadActivities, setViewLeadActivities] = useState<any[]>([])
  const [cardsList, setCardsList] = useState<any[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string>('all')
  const [showWelcomeSettingsModal, setShowWelcomeSettingsModal] = useState(false)
  const [showCardDropdown, setShowCardDropdown] = useState(false)
  const cardDropdownRef = useRef<HTMLDivElement | null>(null)
  const [welcomeSubject, setWelcomeSubject] = useState('Bem-vindo à {cardTitle}! 🎉')
  const [welcomeBody, setWelcomeBody] = useState(`Olá {nome},

Obrigado por se registar e visitar o nosso cartão digital!

Estamos entusiasmados por te ter connosco.

Melhores cumprimentos,
{cardTitle}`)


  const [selectedLeadForWhatsApp, setSelectedLeadForWhatsApp] = useState<Lead | null>(null)
  const [whatsAppMessage, setWhatsAppMessage] = useState('Olá {nome}, tudo bem?')


  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set())
  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false)
  const [bulkSubject, setBulkSubject] = useState('')
  const [bulkBody, setBulkBody] = useState('')
  const [bulkSending, setBulkSending] = useState(false)
  const [bulkScheduleDate, setBulkScheduleDate] = useState('')
  const [bulkScheduleTime, setBulkScheduleTime] = useState('09:00')
  const [bulkStep, setBulkStep] = useState('')
  const [leadTypes, setLeadTypes] = useState<LeadType[]>([])
  const [leadSources, setLeadSources] = useState<LeadSource[]>([])
  const [showLeadTypesModal, setShowLeadTypesModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showLeadSourcesModal, setShowLeadSourcesModal] = useState(false)
  const [filterLeadType, setFilterLeadType] = useState<string | null>(null)
  const [filterLeadSource, setFilterLeadSource] = useState<string | null>(null)
  const [filterCountry, setFilterCountry] = useState<string | null>(null)
  const [countries, setCountries] = useState<Country[]>([])
  const [showCountriesModal, setShowCountriesModal] = useState(false)
  const [newCountryName, setNewCountryName] = useState('')



  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'zone'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const [showImportModal, setShowImportModal] = useState(false)
  const [importFileName, setImportFileName] = useState('')
  const importFileInputRef = useRef<HTMLInputElement | null>(null)
  const [importCSVText, setImportCSVText] = useState('')
  const [importPreview, setImportPreview] = useState<string[][]>([])
  const [activeView, setActiveView] = useState<'table' | 'calendar' | 'magnets' | 'ambassadors' | 'scheduled' | 'kanban' | 'email-marketing'>('table')
  const [importing, setImporting] = useState(false)

  const handleCreateCountry = async () => {
    if (!newCountryName.trim()) return
    try {
      const { data: authData } = await supabase.auth.getUser()
      const uid = authData?.user?.id
      if (!uid) throw new Error('Utilizador não autenticado')
      
      const created = await createCountry(uid, newCountryName.trim())
      setCountries(prev => [...prev, created])
      setNewCountryName('')
      addToast('País criado com sucesso', 'success')
    } catch (e: any) {
      console.error('Erro ao criar país:', e?.message || e)
      addToast(e?.message || 'Erro ao criar país', 'error')
    }
  }


  const checkCRMPro = async (uid?: string) => {
    try {
      const id = uid || userId
      if (!id) return
      setCRMProChecking(true)
      const { data, error } = await supabase
        .from('user_addons')
        .select('crm_pro_active, crm_pro_expires_at')
        .eq('user_id', id)
        .maybeSingle()

      if (error) throw error
      const isActive = (data as any)?.crm_pro_active === true
      const expiresAt = (data as any)?.crm_pro_expires_at
      const notExpired = !expiresAt || new Date(expiresAt) > new Date()
      setCRMProActive(isActive && notExpired)
    } catch (e) {
      setCRMProActive(false)
    } finally {
      setCRMProChecking(false)
    }
  }

  const startCRMProCheckout = async (cycle: 'monthly' | 'annual') => {
    try {
      setBuyingCRMPro(cycle)
      const { data: authData } = await supabase.auth.getUser()
      const uid = authData?.user?.id
      console.log('CRM Pro checkout - uid:', uid, 'authData:', authData)
      if (!uid) return alert('Sem sessão. Faz login novamente.')

      const res = await fetch('/api/stripe/checkout-crm-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, billingCycle: cycle }),
      })
      const data = await res.json()
      if (!res.ok) return alert(data?.error || 'Erro ao iniciar checkout.')
      if (data?.url) window.location.href = data.url
      else alert('Checkout sem URL.')
    } catch (e: any) {
      alert('Erro ao iniciar checkout: ' + (e?.message || String(e)))
    } finally {
      setBuyingCRMPro(null)
    }
  }


  const loadLeads = async () => {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLeads([])
      setLoading(false)
      return
    }

    if (user.id !== userId) {
      setUserId(user.id)
      gmail.checkConnection()
    }

    let query = supabase
      .from('leads')
      .select(`
        id, name, email, phone, zone, message, marketing_opt_in, consent_given,
        step, notes, created_at, contacted, card_id, user_id, lead_type_id, lead_source, lead_magnet_id, country,
        cards ( user_id, name, slug )
      `)
      .eq('user_id', user.id)

    if (selectedCardId !== 'all') {
      query = query.eq('card_id', selectedCardId)
    }

    if (filterMarketing !== null) {
      query = query.eq('marketing_opt_in', filterMarketing)
    }

    if (filterStep !== null) {
      query = query.eq('step', filterStep)
    }

    const { data, error } = await query.order(sortBy, { ascending: sortOrder === 'asc' })

    if (error) {
      console.error('Erro a carregar leads:', error)
      setLeads([])
    } else {
      setLeads(data || [])
    }

    setLoading(false)

    // Carregar países do utilizador
    try {
      const countryList = await fetchCountries(user.id)
      setCountries(countryList)
      console.log('Países carregados:', countryList)
    } catch (e) {
      console.error('Erro a carregar países:', e)
    }
  }

  useEffect(() => {
    loadLeads()
  }, [filterMarketing, filterStep, selectedCardId, sortBy, sortOrder, filterCountry])

  // Fetch lead types and sources globally by userId
  useEffect(() => {
    if (!userId) return
    const loadTypes = async () => {
      try {
        const types = await fetchLeadTypes(userId)
        if (types.length === 0) {
          const defaults = [
            { name: 'Cliente', color: '#0984e3' },
            { name: 'Comprador', color: '#00b894' },
            { name: 'Vendedor', color: '#e17055' },
          ]
          const created = []
          for (const d of defaults) {
            const t = await createLeadType(userId, d.name, d.color)
            created.push(t)
          }
          setLeadTypes(created)
        } else {
          setLeadTypes(types)
        }
      } catch (e) {
        console.error(e)
      }
    }
    const loadSources = async () => {
      try {
        const sources = await fetchLeadSources(userId)
        setLeadSources(sources)
      } catch (e) {
        console.error(e)
      }
    }
    loadTypes()
    loadSources()
  }, [userId])


  useEffect(() => {
    const handleClickOutsideCardDropdown = (e: MouseEvent) => {
      if (!showCardDropdown) return
      const el = cardDropdownRef.current
      if (!el) return
      if (!el.contains(e.target as Node)) {
        setShowCardDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutsideCardDropdown)
  
  // CRM Pro Landing (quando addon não está ativo)
  const crmProLanding = (
    <main style={{ padding: 24 }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <h1 style={{ fontSize: 40, fontWeight: 950, margin: '10px 0 10px 0' }}>CRM Pro</h1>
        <p style={{ fontSize: 16, opacity: 0.8, marginTop: 0 }}>
          Um CRM simples e poderoso para gerir leads dos teus cartões. Importa/exporta em CSV, envia emails em massa (200/dia), WhatsApp rápido, e muito mais.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginTop: 18 }}>
          {[
            { title: '📥 Importar e exportar leads', desc: 'Importa contactos em CSV e exporta os teus leads de forma simples e rápida.' },
            { title: '📣 Email em massa', desc: 'Envia campanhas e follow-ups para várias leads com poucos cliques.' },
            { title: '💬 WhatsApp direto do dashboard', desc: 'Fala com os teus contactos por WhatsApp diretamente no dashboard e acelera o seguimento.' },
            { title: '✅ Tarefas e alertas', desc: 'Organiza os próximos passos e evita perder oportunidades de negócio.' },
            { title: '📊 Histórico de atividade', desc: 'Consulta o registo de interações e acompanha cada lead com mais contexto.' },
          ].map((b) => (
            <div key={b.title} style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid rgba(0,0,0,0.08)' }}>
              <div style={{ fontWeight: 950, fontSize: 14, marginBottom: 6, color: '#111827' }}>{b.title}</div>
              <div style={{ fontSize: 13, opacity: 0.75, color: '#111827' }}>{b.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, padding: 18, background: 'rgba(0,0,0,0.02)', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 950, fontSize: 14, marginBottom: 12, color: '#111827' }}>Como funciona</div>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#111827', lineHeight: 1.8 }}>
            <li>Ativa o CRM Pro no plano mensal ou anual</li>
            <li>Liga a tua conta Gmail de forma segura</li>
            <li>Recebe leads automaticamente ou importa os teus contactos em CSV</li>
            <li>Faz follow-up por email, WhatsApp e tarefas num só lugar</li>
            <li>Acompanha o histórico de cada lead e não percas oportunidades</li>
          </ol>
        </div>

        <div style={{ marginTop: 18, background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.10))', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 18, padding: 18 }}>
          <div style={{ fontWeight: 950, fontSize: 16, marginBottom: 6, color: '#ffffff' }}>Ativa o CRM Pro</div>
          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 14, color: 'rgba(255,255,255,0.88)' }}>
            Escolhe o plano mensal ou anual e começa a gerir leads, follow-ups e contactos num só lugar.
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => startCRMProCheckout('monthly')}
              disabled={buyingCRMPro !== null}
              style={{ padding: '12px 14px', borderRadius: 12, background: '#111827', color: '#fff', border: 'none', fontWeight: 950, cursor: buyingCRMPro ? 'not-allowed' : 'pointer' }}
            >
              {buyingCRMPro === 'monthly' ? 'A abrir...' : '💳 Mensal — €5,99'}
            </button>

            <button
              onClick={() => startCRMProCheckout('annual')}
              disabled={buyingCRMPro !== null}
              style={{ padding: '12px 14px', borderRadius: 12, background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 950, cursor: buyingCRMPro ? 'not-allowed' : 'pointer' }}
            >
              {buyingCRMPro === 'annual' ? 'A abrir...' : '💳 Anual — €59'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.65, lineHeight: 1.6 }}>
          <strong>Segurança:</strong> O envio de emails é feito via a tua conta Gmail (Google OAuth). A Kardme não tem acesso à tua password e podes revogar a autorização quando quiseres. O CRM Pro fica disponível imediatamente após confirmação do pagamento.
        </div>
      </div>
    </main>
  )


  return () => document.removeEventListener('mousedown', handleClickOutsideCardDropdown)
  }, [showCardDropdown])



  // Landing interna do CRM Pro (quando não está ativo)
  if (false && crmProActive === false) {
    return (
      <main style={{ padding: 24 }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <h1 style={{ fontSize: 40, fontWeight: 950, margin: '10px 0 10px 0' }}>CRM Pro</h1>
          <p style={{ fontSize: 16, opacity: 0.8, marginTop: 0 }}>
            Centraliza leads, follow-ups, emails, WhatsApp e histórico num único dashboard pensado para vender mais.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginTop: 18 }}>
            {[
            { title: '📥 Importar e exportar leads', desc: 'Importa contactos em CSV e exporta os teus leads de forma simples e rápida.' },
            { title: '📣 Email em massa', desc: 'Envia campanhas e follow-ups para várias leads com poucos cliques.' },
            { title: '💬 WhatsApp direto do dashboard', desc: 'Fala com os teus contactos por WhatsApp diretamente no dashboard e acelera o seguimento.' },
            { title: '✅ Tarefas e alertas', desc: 'Organiza os próximos passos e evita perder oportunidades de negócio.' },
            { title: '📊 Histórico de atividade', desc: 'Consulta o registo de interações e acompanha cada lead com mais contexto.' },
          ].map((b) => (
              <div key={b.title} style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid rgba(0,0,0,0.08)' }}>
                <div style={{ fontWeight: 950, fontSize: 14, marginBottom: 6, color: '#111827' }}>{b.title}</div>
                <div style={{ fontSize: 13, opacity: 0.75, color: '#111827' }}>{b.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18, background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.10))', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 18, padding: 18 }}>
            <div style={{ fontWeight: 950, fontSize: 16, marginBottom: 6, color: '#ffffff' }}>Ativa o CRM Pro</div>
            <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 14, color: 'rgba(255,255,255,0.88)' }}>
              Escolhe o plano mensal ou anual e começa a gerir leads, follow-ups e contactos num só lugar.
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => startCRMProCheckout('monthly')}
                disabled={buyingCRMPro !== null}
                style={{ padding: '12px 14px', borderRadius: 12, background: '#111827', color: '#fff', border: 'none', fontWeight: 950, cursor: buyingCRMPro ? 'not-allowed' : 'pointer' }}
              >
                {buyingCRMPro === 'monthly' ? 'A abrir...' : '💳 Mensal — €5,99'}
              </button>

              <button
                onClick={() => startCRMProCheckout('annual')}
                disabled={buyingCRMPro !== null}
                style={{ padding: '12px 14px', borderRadius: 12, background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 950, cursor: buyingCRMPro ? 'not-allowed' : 'pointer' }}
              >
                {buyingCRMPro === 'annual' ? 'A abrir...' : '💳 Anual — €59'}
              </button>
            </div>
          </div>

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.65 }}>
            O acesso ao CRM Pro é ativado imediatamente após a confirmação do pagamento.
          </div>
        </div>
      </main>
    )
  }


  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      // recheck addon after payment
      checkCRMPro()
      // opcional: limpar query param
      params.delete('success')
      const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '')
      window.history.replaceState({}, '', newUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  useEffect(() => {
    if (!userId) return
    gmail.checkConnection()
    checkCRMPro()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  useEffect(() => {
    if (!tasksToday || tasksToday.length === 0) return

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {})
      }
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const now = Date.now()
      tasksToday.forEach(t => {
        const due = new Date(t.due_at).getTime()
        const diffMin = Math.round((due - now) / 60000)
        const isOverdue = diffMin < 0
        const isSoon = diffMin >= 0 && diffMin <= 60

        if (isOverdue || isSoon) {
          new Notification(isOverdue ? 'Tarefa atrasada' : 'Tarefa a chegar', {
            body: `${t.title} (${isOverdue ? 'atrasada' : 'em ' + diffMin + ' min'})`,
          })
        }
      })
    }
  }, [tasksToday])


  const handleExportCSV = async () => {
    try {
      if (!userId) return alert('Sem userId')
      if (selectedCardId === 'all') return alert('Seleciona um cartão para exportar.')
      const url = `/api/crm/leads/export?userId=${encodeURIComponent(userId)}&cardId=${encodeURIComponent(selectedCardId)}&sortBy=${encodeURIComponent(sortBy)}&sortOrder=${encodeURIComponent(sortOrder)}`
      const res = await fetch(url)
      if (!res.ok) {
        const txt = await res.text()
        return alert('Erro ao exportar: ' + txt)
      }
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `leads_${selectedCardId}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (e: any) {
      alert('Erro ao exportar: ' + (e?.message || String(e)))
    }
  }

  const handleImportPreview = () => {
    const text = importCSVText.trim()
    if (!text) {
      setImportPreview([])
      return
    }
    const lines = text.split('\n').slice(0, 11)
    const preview = lines.map(l => l.split(',').map(c => c.trim()))
    setImportPreview(preview)
  }

  const handleImportCSV = async () => {
    try {
      if (!userId) return alert('Sem userId')
      if (selectedCardId === 'all') return alert('Seleciona um cartão para importar.')
      if (!importCSVText.trim()) return alert('Cola o CSV primeiro.')

      setImporting(true)
      const res = await fetch('/api/crm/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          cardId: selectedCardId,
          csvText: importCSVText,
        }),
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        return alert('Erro ao importar: ' + (json?.error || 'erro'))
      }

      alert(json?.message || 'Import concluído')
      setShowImportModal(false)
      setImportCSVText('')
      setImportPreview([])
      await loadLeads()
    } catch (e: any) {
      alert('Erro ao importar: ' + (e?.message || String(e)))
    } finally {
      setImporting(false)
    }
  }


    useEffect(() => {
    if (!userId) return
    loadTasksForToday()
    loadEmailTemplates()

    // carregar cards do utilizador (para filtro + settings)
    const loadCards = async () => {
      if (!userId) return
      const { data } = await supabase
        .from('cards')
        .select('id, title, name, slug, crm_pro_welcome_subject, crm_pro_welcome_body')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      setCardsList(data || [])
      console.log('CRM Pro cardsList:', data)
    }
    loadCards()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const updateStep = async (id: string, newStep: string) => {
    await supabase
      .from('leads')
      .update({ step: newStep })
      .eq('id', id)

    setLeads(prev =>
      prev.map(l =>
        l.id === id ? { ...l, step: newStep } : l
      )
    )
  }

  const applyBulkStep = async (newStep: string) => {
    if (!newStep || selectedLeadIds.size === 0) return

    const ids = Array.from(selectedLeadIds)
    const count = ids.length

    const { error } = await supabase
      .from('leads')
      .update({ step: newStep })
      .in('id', ids)

    if (error) {
      addToast('Erro ao atualizar step em massa', 'error')
      return
    }

    setLeads(prev =>
      prev.map(l =>
        selectedLeadIds.has(l.id) ? { ...l, step: newStep } : l
      )
    )

    addToast(`Step atualizado em ${count} ${count === 1 ? 'lead' : 'leads'}`, 'success')
    setBulkStep('')
    setSelectedLeadIds(new Set())
  }

  const updateNotes = async (id: string, notes: string) => {
    await supabase
      .from('leads')
      .update({ notes: notes || null })
      .eq('id', id)

    setLeads(prev =>
      prev.map(l =>
        l.id === id ? { ...l, notes: notes || null } : l
      )
    )

    if (selectedLead?.id === id) {
      setSelectedLead({ ...selectedLead, notes: notes || null })
    }
  }

  const toggleContacted = async (id: string, current: boolean) => {
    await supabase
      .from('leads')
      .update({ contacted: !current })
      .eq('id', id)

    setLeads(prev =>
      prev.map(l =>
        l.id === id ? { ...l, contacted: !current } : l
      )
    )
  }
  const loadTasksForLead = async (leadId: string) => {
    if (!userId) return
    setLeadTasksLoading(true)
    const { data, error } = await fetchTasksForLead({ userId, leadId })
    if (!error) setLeadTasks((data as any) || [])
    setLeadTasksLoading(false)
  }

  useEffect(() => {
    if (pendingCalendarAction && !selectedCalendarTask) {
      const { task, lead } = pendingCalendarAction
      setPendingCalendarAction(null)
      handleTaskAction(task, lead)
    }
  }, [selectedCalendarTask, pendingCalendarAction])

  useEffect(() => {
    if (!userId) return
    fetchTasksForMonth({ userId, yearMonth: calendarYearMonth }).then(({ data }) => {
      setCalendarTasks(data || [])
    })
  }, [userId, calendarYearMonth])

  const loadTasksForToday = async () => {
    if (!userId) return
    setLoadingTasks(true)
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await fetchTasksForDay({ userId, dayISO: today })
    if (error) {
      console.error('Erro a carregar tarefas:', error)
      setTasksToday([])
    } else {
      setTasksToday(data || [])
    }
    setLoadingTasks(false)
  }


  const createTaskForLead = async () => {
    if (!selectedLeadForTask || !taskTitle || !taskDueDate || !taskDueTime) {
      alert('Preenche título, data e hora')
      return
    }
    const dueAtISO = new Date(`${taskDueDate}T${taskDueTime}:00`).toISOString()
    const { error } = await createLeadTask({
      leadId: selectedLeadForTask.id,
      userId,
      title: taskTitle,
      description: taskDesc || undefined,
      dueAtISO,
      actionType: taskActionType || 'follow_up',
    })
    if (error) {
      alert('Erro ao guardar tarefa: ' + error.message)
      return
    }
    await logLeadActivity({ leadId: selectedLeadForTask.id, userId, type: 'task_created', title: `Tarefa agendada: ${taskTitle}`, meta: { dueAt: dueAtISO } })
    setShowTaskModal(false)
    setTaskTitle('')
    setTaskDesc('')
    setTaskDueDate('')
    setTaskDueTime('09:00')
    await loadTasksForToday()
    // Recarregar calendário para o mês da tarefa criada
    const taskMonth = taskDueDate.slice(0, 7)
    const start = new Date(taskMonth + '-01T00:00:00')
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999)
    const { data: freshTasks } = await fetchTasksForMonth({ userId, yearMonth: taskMonth })
    if (taskMonth === calendarYearMonth) {
      setCalendarTasks(freshTasks || [])
    }
  }

  const deleteLead = async (id: string) => {
    if (!confirm("Tens a certeza que queres apagar esta lead?")) return
    setDeletingId(id)
    const { error } = await supabase.from("leads").delete().eq("id", id)
    if (error) { alert("Erro ao apagar."); setDeletingId(null); return }
    setLeads(p => p.filter(l => l.id !== id))
    setDeletingId(null)
  }

  const filteredLeads = leads.filter(l => {
    const matchesSearch = searchTerm === '' ||
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.zone && l.zone.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterLeadType === null || l.lead_type_id === filterLeadType
    const matchesSource = filterLeadSource === null || (l.lead_source || 'cartão') === filterLeadSource
    const matchesCountry = filterCountry === null || l.country === filterCountry
    return matchesSearch && matchesType && matchesSource && matchesCountry
  })


  const loadLeadActivities = async (leadId: string) => {
    const { data, error } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
    if (!error) setViewLeadActivities(data || [])
  }

  const loadEmailTemplates = async () => {
    if (!userId) return
    const { data, error } = await fetchEmailTemplates({ userId })
    if (!error) {
      const mine = (data as any) as EmailTemplate[]
      setEmailTemplates([...DEFAULT_EMAIL_TEMPLATES, ...(mine || [])])
    }
  }

  const applyTemplateToEmail = (t: EmailTemplate, lead: Lead) => {
    setSelectedTemplate(t)
    setEmailSubject(t.subject.replace('{nome}', lead.name).replace('{email}', lead.email))
    setEmailBody(t.body.replace('{nome}', lead.name).replace('{email}', lead.email))
  }

  const applyTemplateToBulk = (t: EmailTemplate) => {
    setSelectedTemplate(t)
    setBulkSubject(t.subject)
    setBulkBody(t.body)
  }


  const stepColor = (step: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      'Novo': { bg: '#dbeafe', text: '#0c4a6e' },
      'Contactado': { bg: '#fef3c7', text: '#78350f' },
      'Qualificado': { bg: '#d1fae5', text: '#065f46' },
      'Fechado': { bg: '#c7d2fe', text: '#312e81' },
      'Perdido': { bg: '#fee2e2', text: '#7f1d1d' },
    }
    return colors[step] || { bg: '#f3f4f6', text: '#374151' }
  }

  if (loading) {
    return <p style={{ padding: 32 }}>A carregar leads…</p>
  }

  const leadById = new Map(leads.map(l => [l.id, l]))


    const normalizePhone = (phone?: string) => {
    if (!phone) return null
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length < 9) return null
    
    // PT: 9 dígitos começando por 2 ou 9 → +351
    if (cleaned.length === 9 && (cleaned.startsWith('2') || cleaned.startsWith('9'))) {
      return '+351' + cleaned
    }
    // PT: já com 351
    if (cleaned.startsWith('351') && cleaned.length === 12) {
      return '+' + cleaned
    }
    // BR: 11 dígitos começando por 55
    if (cleaned.startsWith('55') && cleaned.length === 13) {
      return '+' + cleaned
    }
    // BR: 11 dígitos sem 55
    if (!cleaned.startsWith('55') && cleaned.length === 11 && cleaned.startsWith('1')) {
      return '+55' + cleaned
    }
    // Genérico: se tiver 10+ dígitos e não tiver +, assume +351
    if (cleaned.length >= 10 && !cleaned.startsWith('351') && !cleaned.startsWith('55')) {
      return '+351' + cleaned
    }
    // Se já tiver + no início (improvável, mas seguro)
    if (phone.startsWith('+')) return phone
    
    return null
  }


  const toggleLeadSelection = (leadId: string) => {
    const newSet = new Set(selectedLeadIds)
    if (newSet.has(leadId)) {
      newSet.delete(leadId)
    } else {
      newSet.add(leadId)
    }
    setSelectedLeadIds(newSet)
  }

  const toggleAllLeads = () => {
    if (selectedLeadIds.size === filteredLeads.length) {
      setSelectedLeadIds(new Set())
    } else {
      const allVisibleIds = new Set(filteredLeads.map(l => l.id))
      setSelectedLeadIds(allVisibleIds)
      console.log('toggleAllLeads - selecionadas:', allVisibleIds.size, 'IDs:', Array.from(allVisibleIds))
    }
  }

  const sendBulkEmails = async () => {
    if (!bulkSubject || !bulkBody) {
      alert('Preenche assunto e mensagem')
      return
    }
    if (selectedLeadIds.size === 0) {
      alert('Seleciona pelo menos uma lead')
      return
    }

    setBulkSending(true)
    let sent = 0
    let failed = 0

    // Limite diário (CRM Pro): 200 emails/dia por utilizador
    try {
      const usageRes = await fetch('/api/crm/email/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, countToSend: selectedLeadIds.size }),
      })
      const usageJson = await usageRes.json().catch(() => null)
      if (!usageRes.ok) {
        alert(usageJson?.error || 'Limite diário atingido.')
        setBulkSending(false)
        return
      }
    } catch (e: any) {
      alert('Erro ao validar limite diário: ' + (e?.message || String(e)))
      setBulkSending(false)
      return
    }

    for (const leadId of Array.from(selectedLeadIds)) {
      const lead = leads.find(l => l.id === leadId)
      if (!lead) continue

      const personalizedSubject = bulkSubject.replace('{nome}', lead.name)
      const personalizedBody = processEmailTemplate(bulkBody, { nome: lead.name, email: lead.email })

      try {
        await gmail.sendEmail(lead.id, lead.email, personalizedSubject, personalizedBody, selectedTemplate?.id, selectedAttachments)
        sent++
        await logLeadActivity({ leadId: lead.id, userId, type: 'email_sent', title: `Email em massa enviado: ${personalizedSubject}` })
      } catch (err) {
        failed++
        console.error('Erro ao enviar para', lead.email, err)
      }

      await new Promise(r => setTimeout(r, 500))
    }

    alert(`Enviados: ${sent}, Falhados: ${failed}`)
    setShowBulkEmailModal(false)
    setBulkSubject('')
    setBulkBody('')
    setSelectedLeadIds(new Set())
    setSelectedAttachments([])
    setBulkSending(false)
  }

  const createBulkTasks = async () => {
    if (!bulkSubject || !bulkBody) {
      alert('Preenche assunto e mensagem')
      return
    }
    if (selectedLeadIds.size === 0) {
      alert('Seleciona pelo menos uma lead')
      return
    }

    const scheduleDate = bulkScheduleDate || new Date().toISOString().split('T')[0]
    const dueAtISO = new Date(`${scheduleDate}T${bulkScheduleTime}:00`).toISOString()

    setBulkSending(true)
    let created = 0

    for (const leadId of Array.from(selectedLeadIds)) {
      const lead = leads.find(l => l.id === leadId)
      if (!lead) continue

      const personalizedSubject = bulkSubject.replace('{nome}', lead.name)
      const personalizedBody = processEmailTemplate(bulkBody, { nome: lead.name, email: lead.email })

      try {
        // Criar tarefa agendada em scheduled_tasks
        await createScheduledTask(userId, {
          title: personalizedSubject,
          email_subject: personalizedSubject,
          email_body: personalizedBody,
          email_recipient: lead.email,
          email_template_id: (selectedTemplate?.id && !selectedTemplate.id.startsWith('default-')) ? selectedTemplate.id : null,
          lead_id: lead.id,
          due_at: dueAtISO,
          attachments: selectedAttachments || [],
        })

        created++
        await logLeadActivity({ leadId: lead.id, userId, type: 'task_created', title: `Email agendado para ${dueAtISO.split('T')[0]} às ${bulkScheduleTime}` })
      } catch (err: any) {
        console.error('Erro ao agendar email para', lead.email, err)
      }
    }

    if (created > 0) {
      alert(`✅ ${created} email${created > 1 ? 's' : ''} agendado${created > 1 ? 's' : ''} com sucesso!`)
    } else {
      alert('❌ Nenhum email foi agendado. Tenta novamente.')
    }
    setShowBulkEmailModal(false)
    setBulkSubject('')
    setBulkBody('')
    setSelectedLeadIds(new Set())
    setSelectedAttachments([])
    setBulkSending(false)
  }


  const handleTaskAction = (task: LeadTask, lead: Lead | undefined) => {
    const actionType = task.action_type || 'follow_up'
    
    if (actionType === 'email') {
      setSelectedLeadForEmail(lead || null)
      setShowEmailModal(true)
    } else if (actionType === 'whatsapp') {
      const phone = normalizePhone(lead?.phone)
      if (!phone) {
        alert('Esta lead não tem número de WhatsApp válido (falta +XX)')
        return
      }
      const msg = (typeof (task as any)?.description === 'string' && (task as any).description.trim().length > 0)
        ? (task as any).description.trim()
        : `Olá ${lead?.name || ''}, tudo bem?`
      const encoded = encodeURIComponent(msg)
      window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encoded}`, '_blank')
    } else if (actionType === 'call') {
      const phone = normalizePhone(lead?.phone)
      if (!phone) {
        alert('Esta lead não tem número de telefone válido (falta +XX)')
        return
      }
      window.location.href = 'tel:' + phone
    } else if (actionType === 'sms') {
      const phone = normalizePhone(lead?.phone)
      if (!phone) {
        alert('Esta lead não tem número de SMS válido (falta +XX)')
        return
      }
      window.location.href = 'sms:' + phone
    } else if (actionType === 'follow_up') {
      setSelectedLead(lead || null)
      setNoteText(lead?.notes || '')
    } else if (actionType === 'meeting') {
      setSelectedLeadForTask(lead || null)
      setShowTaskModal(true)
    }
  }


  // CRM Pro Landing (quando addon não está ativo)
  const crmProLanding = (
    <main style={{ padding: 24 }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <h1 style={{ fontSize: 40, fontWeight: 950, margin: '10px 0 10px 0' }}>CRM Pro</h1>
        <p style={{ fontSize: 16, opacity: 0.8, marginTop: 0 }}>
          Centraliza leads, follow-ups, emails, WhatsApp e histórico num único dashboard pensado para vender mais.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginTop: 18 }}>
          {[
            { title: '📥 Importar e exportar leads', desc: 'Importa contactos em CSV e exporta os teus leads de forma simples e rápida.' },
            { title: '📣 Email em massa', desc: 'Envia campanhas e follow-ups para várias leads com poucos cliques.' },
            { title: '💬 WhatsApp direto do dashboard', desc: 'Fala com os teus contactos por WhatsApp diretamente no dashboard e acelera o seguimento.' },
            { title: '✅ Tarefas e alertas', desc: 'Organiza os próximos passos e evita perder oportunidades de negócio.' },
            { title: '📊 Histórico de atividade', desc: 'Consulta o registo de interações e acompanha cada lead com mais contexto.' },
          ].map((b) => (
            <div key={b.title} style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid rgba(0,0,0,0.08)' }}>
              <div style={{ fontWeight: 950, fontSize: 14, marginBottom: 6, color: '#111827' }}>{b.title}</div>
              <div style={{ fontSize: 13, opacity: 0.75, color: '#111827' }}>{b.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 18, background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.10))', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 18, padding: 18 }}>
          <div style={{ fontWeight: 950, fontSize: 16, marginBottom: 6, color: '#ffffff' }}>Ativa o CRM Pro</div>
          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 14, color: 'rgba(255,255,255,0.88)' }}>
            Escolhe o plano mensal ou anual e começa a gerir leads, follow-ups e contactos num só lugar.
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => startCRMProCheckout('monthly')}
              disabled={buyingCRMPro !== null}
              style={{ padding: '12px 14px', borderRadius: 12, background: '#111827', color: '#fff', border: 'none', fontWeight: 950, cursor: buyingCRMPro ? 'not-allowed' : 'pointer' }}
            >
              {buyingCRMPro === 'monthly' ? 'A abrir...' : '💳 Mensal — €5,99'}
            </button>

            <button
              onClick={() => startCRMProCheckout('annual')}
              disabled={buyingCRMPro !== null}
              style={{ padding: '12px 14px', borderRadius: 12, background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 950, cursor: buyingCRMPro ? 'not-allowed' : 'pointer' }}
            >
              {buyingCRMPro === 'annual' ? 'A abrir...' : '💳 Anual — €59'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.65 }}>
          O acesso ao CRM Pro é ativado imediatamente após a confirmação do pagamento.
        </div>
      </div>
    </main>
  )


    return crmProActive === false ? crmProLanding : (
    <main style={{ padding: 32 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, flex: 1 }}>CRM Pro</h1>

        <div ref={cardDropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowCardDropdown(!showCardDropdown)}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.18)',
              fontSize: 13,
              background: '#fff',
              color: '#111827',
              fontWeight: 800,
              cursor: 'pointer',
              minWidth: 200,
              maxWidth: 320,
              height: 40,
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedCardId === 'all'
                ? '— Todos os cartões —'
                : cardsList.find((c: any) => c.id === selectedCardId)?.name || cardsList.find((c: any) => c.id === selectedCardId)?.title || 'Seleciona um cartão'}
            </span>
            <span style={{ marginLeft: 10, fontSize: 12, opacity: 0.7, display: 'inline-flex', alignItems: 'center' }}><FiChevronDown size={14} /></span>
          </button>

          {showCardDropdown && (
            <div
              className="crmpro-card-dropdown"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: 6,
                background: '#f3f4f6',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 12,
                zIndex: 1000,
                maxHeight: 320,
                overflowY: 'auto',
                boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
              }}
            >
              <button
                onClick={() => {
                  setSelectedCardId('all')
                  setShowCardDropdown(false)
                }}
                style={{
                  width: '100%',
                  padding: '12px 12px',
                  background: selectedCardId === 'all' ? 'rgba(255,255,255,0.12)' : '#0b1220',
                  color: '#ffffff',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: selectedCardId === 'all' ? 900 : 700,
                }}
              >
                — Todos os cartões —
              </button>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.10)' }} />

              {cardsList.map((card: any) => (
                <button
                  key={card.id}
                  onClick={() => {
                    setSelectedCardId(card.id)
                    setShowCardDropdown(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 12px',
                    background: selectedCardId === card.id ? 'rgba(255,255,255,0.12)' : '#0b1220',
                    color: '#ffffff',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: selectedCardId === card.id ? 900 : 700,
                  }}
                >
                  {(card as any).name || card.title || (card as any).slug || 'Cartão'}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            onClick={() => setShowWelcomeInfoModal(true)}
            style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', background: '#8b5cf6', color: '#ffffff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
          >
            ?
          </button>

          <button
          onClick={() => {
            if (selectedCardId === 'all') {
              alert('Seleciona um cartão para configurar a mensagem de boas-vindas')
              return
            }
            const card = cardsList.find((c: any) => c.id === selectedCardId)
            if (card) {
              setWelcomeSubject(card.crm_pro_welcome_subject || 'Bem-vindo à {cardTitle}! 🎉')
              setWelcomeBody(card.crm_pro_welcome_body || 'Olá {nome},\n\nObrigado por se registar e visitar o nosso cartão digital!\n\nEstamos entusiasmados por te ter connosco.\n\nMelhores cumprimentos,\n{cardTitle}')
              setShowWelcomeSettingsModal(true)
            }
          }}
          disabled={selectedCardId === 'all'}
          title="Configurar mensagem de boas-vindas"
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: selectedCardId === 'all' ? '#d1d5db' : '#8b5cf6',
            color: '#ffffff',
            border: 'none',
            fontWeight: 900,
            cursor: selectedCardId === 'all' ? 'not-allowed' : 'pointer',
            fontSize: 13,
            minHeight: 40,
            lineHeight: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            whiteSpace: 'nowrap',
          }}
        >
          ⚙️ Configurar Boas-vindas
        </button>
        </div>

        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            onClick={() => setShowTemplatesInfoModal(true)}
            style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', background: '#6366f1', color: '#ffffff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
          >
            ?
          </button>

          <button
          onClick={() => router.push("/dashboard/crm/email-templates")}
          title="Gerir templates de email"
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: "#6366f1",
            color: "#ffffff",
            border: "none",
            fontWeight: 900,
            cursor: "pointer",
            fontSize: 13,
            minHeight: 40,
            lineHeight: "20px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            whiteSpace: "nowrap",
            marginLeft: 8,
          }}
        >
          📋 Templates
        </button>
        </div>
      </div>

      {tasksToday.length > 0 && (
        <div style={{ background: '#fef3c7', border: '2px solid #fcd34d', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong style={{ color: '#78350f', fontSize: 14 }}>📋 {tasksToday.length} tarefa(s) para hoje</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasksToday.map(t => {
              const isPast = new Date(t.due_at) < new Date()
              const lead = leadById.get(t.lead_id)
              return (
                <div key={t.id} style={{ background: '#fff', padding: 12, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${isPast ? '#dc2626' : '#f59e0b'}`, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <div style={{ cursor: lead ? 'pointer' : 'default', flex: 1 }} onClick={() => { if (lead) { setSelectedLead(lead); setNoteText(lead.notes || '') } }} title={lead ? 'Abrir lead' : 'Lead não encontrada'}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{t.title}</div>
                      <span style={{ fontSize: 11, fontWeight: 800, background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                        {t.action_type === 'email' && '📧 Email'}
                        {t.action_type === 'whatsapp' && '💬 WhatsApp'}
                        {t.action_type === 'call' && '📞 Ligar'}
                        {t.action_type === 'sms' && '✉️ SMS'}
                        {t.action_type === 'meeting' && '📅 Reunião'}
                        {(!t.action_type || t.action_type === 'follow_up') && '✅ Follow-up'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>{lead ? <><strong>{lead.name}</strong> · {lead.email}</> : <>Lead: {t.lead_id}</> }</div>
                    <div style={{ fontSize: 12, color: isPast ? '#991b1b' : '#92400e', marginTop: 4 }}>{new Date(t.due_at).toLocaleString('pt-PT')}</div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => handleTaskAction(t, lead)} style={{ padding: '6px 12px', borderRadius: 8, background: '#3b82f6', color: '#ffffff', border: 'none', fontWeight: 900, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>Fazer</button>
                    <button onClick={async () => { await markTaskDone({ taskId: t.id }); await logLeadActivity({ leadId: t.lead_id, userId, type: 'task_done', title: `Tarefa concluída: ${t.title}` }); await loadTasksForToday() }} style={{ padding: '6px 12px', borderRadius: 8, background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 900, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>✓ Feita</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!gmail.isConnected && !gmail.loading && (
        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div><strong style={{ color: '#78350f' }}>Gmail não ligado</strong><p style={{ fontSize: 13, color: '#92400e', margin: '4px 0 0 0' }}>Liga o teu Gmail para enviar emails direto do CRM.</p></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button
                onClick={() => setShowGmailInfoModal(true)}
                style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', background: '#f59e0b', color: '#ffffff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
              >
                ?
              </button>
              <button onClick={() => gmail.connectGmail()} style={{ padding: '10px 16px', borderRadius: 10, background: '#78350f', color: '#ffffff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>Ligar Gmail</button>
            </div>
          </div>
        </div>
      )}

      {gmail.isConnected && !gmail.loading && (
        <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div><strong style={{ color: '#065f46' }}>✓ Gmail ligado</strong><p style={{ fontSize: 13, color: '#047857', margin: '4px 0 0 0' }}>Podes enviar emails direto do CRM ou voltar a configurar a conta.</p></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button
                onClick={() => setShowGmailInfoModal(true)}
                style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: '50%', background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
              >
                ?
              </button>
              <button onClick={() => gmail.connectGmail()} style={{ padding: '10px 16px', borderRadius: 10, background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>Alterar Gmail</button>
            </div>
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setActiveView('table')}
          style={{
            padding: '8px 18px',
            borderRadius: 10,
            border: 'none',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            background: activeView === 'table' ? '#3b82f6' : '#e5e7eb',
            color: activeView === 'table' ? '#ffffff' : '#374151',
            transition: 'all 0.15s',
          }}
        >
          📋 Lista de Contactos
        </button>
        <button
          onClick={() => setActiveView('calendar')}
          style={{
            padding: '8px 18px',
            borderRadius: 10,
            border: 'none',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            background: activeView === 'calendar' ? '#3b82f6' : '#e5e7eb',
            color: activeView === 'calendar' ? '#ffffff' : '#374151',
            transition: 'all 0.15s',
          }}
        >
          🗓️ Calendário de Tarefas
        </button>
        <button
          onClick={() => setActiveView('magnets')}
          style={{
            padding: '8px 18px',
            borderRadius: 10,
            border: 'none',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            background: activeView === 'magnets' ? '#10b981' : '#e5e7eb',
            color: activeView === 'magnets' ? '#ffffff' : '#374151',
            transition: 'all 0.15s',
          }}
        >
          🧲 Lead Magnets
        </button>
        <button
          onClick={() => setActiveView('ambassadors')}
          style={{
            padding: '8px 18px',
            borderRadius: 10,
            border: 'none',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            background: activeView === 'ambassadors' ? '#3b82f6' : '#e5e7eb',
            color: activeView === 'ambassadors' ? '#ffffff' : '#374151',
            transition: 'all 0.15s',
          }}
        >
          🤝 Embaixadores
        </button>
        <button
          onClick={() => setActiveView('scheduled')}
          style={{
            padding: '8px 18px',
            borderRadius: 10,
            border: 'none',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            background: activeView === 'scheduled' ? '#8b5cf6' : '#e5e7eb',
            color: activeView === 'scheduled' ? '#ffffff' : '#374151',
            transition: 'all 0.15s',
          }}
        >
          📧 Tarefas Agendadas
        </button>
        <button
          onClick={() => setActiveView('email-marketing')}
          style={{
            padding: '8px 18px',
            borderRadius: 10,
            border: 'none',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            background: activeView === 'email-marketing' ? '#06b6d4' : '#e5e7eb',
            color: activeView === 'email-marketing' ? '#ffffff' : '#374151',
            transition: 'all 0.15s',
          }}
        >
          📧 Email Marketing
        </button>
        <button
          onClick={() => setActiveView('kanban')}
          style={{
            padding: '8px 18px',
            borderRadius: 10,
            border: 'none',
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            background: activeView === 'kanban' ? '#f59e0b' : '#e5e7eb',
            color: activeView === 'kanban' ? '#ffffff' : '#374151',
            transition: 'all 0.15s',
          }}
        >
          🎯 Pipeline Kanban
        </button>
      </div>

      {activeView === 'calendar' && (
        <div style={{ marginBottom: 24 }}>
          <CalendarGrid
            leads={filteredLeads}
            tasks={calendarTasks}
            onLeadClick={(leadId) => {
              const lead = leads.find(l => l.id === leadId)
              if (lead) {
                setSelectedLead(lead)
                setNoteText(lead.notes || '')
              }
            }}
            onTaskClick={(taskId) => {
              const task = calendarTasks.find(t => t.id === taskId)
              if (task) setSelectedCalendarTask(task)
            }}
            onMonthChange={(year, month) => {
              setCalendarYearMonth(`${year}-${String(month+1).padStart(2,'0')}`)
            }}
          />
        </div>
      )}

      {activeView !== 'magnets' && (<>
      {/* Barra de pesquisa + filtros */}
      <div style={{ marginBottom: 16 }}>

        {/* Linha 1: pesquisa + botão filtros + chips ativos */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, opacity: 0.4 }}>🔍</span>
            <input
              type="text"
              placeholder="Pesquisar por nome, email ou zona…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0 14px 0 40px',
                height: 44,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.15)',
                fontSize: 13,
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            onClick={() => setShowFilters(f => !f)}
            style={{
              height: 44,
              padding: '0 18px',
              borderRadius: 12,
              border: `1px solid ${showFilters ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.15)'}`,
              background: showFilters ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.08)',
              color: showFilters ? '#a5b4fc' : 'rgba(255,255,255,0.7)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            🎛️ Filtros
            {(filterStep || filterMarketing !== null || filterLeadType || filterLeadSource || filterCountry) && (
              <span style={{ background: '#6366f1', color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 900 }}>
                {[filterStep, filterMarketing !== null ? '1' : null, filterLeadType, filterLeadSource, filterCountry].filter(Boolean).length}
              </span>
            )}
            <span style={{ fontSize: 10, opacity: 0.6 }}>{showFilters ? '▲' : '▼'}</span>
          </button>

          <button onClick={() => setShowLeadTypesModal(true)} style={{ height: 44, padding: '0 14px', borderRadius: 12, border: '1px solid rgba(108,92,231,0.4)', background: 'rgba(108,92,231,0.15)', color: '#a5b4fc', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            🏷️ Tipos
          </button>
          <button onClick={() => setShowLeadSourcesModal(true)} style={{ height: 44, padding: '0 14px', borderRadius: 12, border: '1px solid rgba(0,184,148,0.4)', background: 'rgba(0,184,148,0.12)', color: '#00b894', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            ⚙️ Origens
          </button>
          <button onClick={() => setShowCountriesModal(true)} style={{ height: 44, padding: '0 14px', borderRadius: 12, border: '1px solid rgba(34,197,94,0.4)', background: 'rgba(34,197,94,0.12)', color: '#86efac', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            🌍 Países
          </button>
        </div>

        {/* Chips de filtros ativos */}
        {(filterStep || filterMarketing !== null || filterLeadType || filterLeadSource || filterCountry) && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {filterStep && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                Ação: {filterStep}
                <button onClick={() => setFilterStep(null)} style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>
              </span>
            )}
            {filterMarketing !== null && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)', color: '#fbbf24', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                {filterMarketing ? 'Com autorização' : 'Sem autorização'}
                <button onClick={() => setFilterMarketing(null)} style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>
              </span>
            )}
            {filterLeadType && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(108,92,231,0.2)', border: '1px solid rgba(108,92,231,0.4)', color: '#c4b5fd', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                Tipo: {leadTypes.find(t => t.id === filterLeadType)?.name || filterLeadType}
                <button onClick={() => setFilterLeadType(null)} style={{ background: 'none', border: 'none', color: '#c4b5fd', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>
              </span>
            )}
            {filterLeadSource && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,184,148,0.2)', border: '1px solid rgba(0,184,148,0.4)', color: '#00b894', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                Origem: {[...LEAD_SOURCES_DEFAULT, ...leadSources.map(s => ({ value: s.value, label: `${s.emoji} ${s.label}` }))].find(s => s.value === filterLeadSource)?.label || filterLeadSource}
                <button onClick={() => setFilterLeadSource(null)} style={{ background: 'none', border: 'none', color: '#00b894', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>
              </span>
            )}
            {filterCountry && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', color: '#86efac', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
                País: {filterCountry}
                <button onClick={() => setFilterCountry(null)} style={{ background: 'none', border: 'none', color: '#86efac', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>
              </span>
            )}
            <button
              onClick={() => { setFilterStep(null); setFilterMarketing(null); setFilterLeadType(null); setFilterLeadSource(null); setFilterCountry(null); }}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', borderRadius: 20, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
            >
              Limpar tudo
            </button>
          </div>
        )}

        {/* Painel de filtros colapsável */}
        {showFilters && (
          <div style={{ marginTop: 12, padding: 16, borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Ação do Contacto</label>
              <select
                value={filterStep || ''}
                onChange={(e) => setFilterStep(e.target.value || null)}
                style={{ padding: '0 12px', height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', fontSize: 13, background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 600, minWidth: 160, cursor: 'pointer' }}
              >
                <option value="">Todas</option>
                {STEPS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Autorização Marketing
                <button onClick={() => setShowOptinInfoModal(true)} style={{ marginLeft: 6, width: 16, height: 16, borderRadius: '50%', background: '#f59e0b', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 10, verticalAlign: 'middle' }}>?</button>
              </label>
              <select
                value={filterMarketing === null ? '' : filterMarketing ? 'true' : 'false'}
                onChange={(e) => {
                  if (e.target.value === '') setFilterMarketing(null)
                  else setFilterMarketing(e.target.value === 'true')
                }}
                style={{ padding: '0 12px', height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', fontSize: 13, background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 600, minWidth: 190, cursor: 'pointer' }}
              >
                <option value="">Todas</option>
                <option value="true">Com autorização</option>
                <option value="false">Sem autorização</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Tipo do Contacto
                <button onClick={() => setShowTiposInfoModal(true)} style={{ marginLeft: 6, width: 16, height: 16, borderRadius: '50%', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 10, verticalAlign: 'middle' }}>?</button>
              </label>
              <select
                value={filterLeadType || ''}
                onChange={(e) => setFilterLeadType(e.target.value || null)}
                style={{ padding: '0 12px', height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', fontSize: 13, background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 600, minWidth: 160, cursor: 'pointer' }}
              >
                <option value="">Todos</option>
                {leadTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Origem do Contacto
                <button onClick={() => setShowOrigemInfoModal(true)} style={{ marginLeft: 6, width: 16, height: 16, borderRadius: '50%', background: '#6366f1', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 10, verticalAlign: 'middle' }}>?</button>
              </label>
              <select
                value={filterLeadSource || ''}
                onChange={(e) => setFilterLeadSource(e.target.value || null)}
                style={{ padding: '0 12px', height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', fontSize: 13, background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 600, minWidth: 180, cursor: 'pointer' }}
              >
                <option value="">Todas</option>
                {LEAD_SOURCES_DEFAULT.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
                {leadSources.map(s => (
                  <option key={s.id} value={s.value}>{s.emoji} {s.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>País</label>
              <select
                value={filterCountry || ''}
                onChange={(e) => setFilterCountry(e.target.value || null)}
                style={{ padding: '0 12px', height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', fontSize: 13, background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 600, minWidth: 140, cursor: 'pointer' }}
              >
                <option value="">Todos</option>
                {countries.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      </>)}


      {activeView === 'kanban' && (
        <PipelineKanban
          leads={leads}
          leadTypes={leadTypes}
          filterLeadType={filterLeadType}
          setFilterLeadType={setFilterLeadType}
          updateStep={updateStep}
          onViewLead={(lead) => {
            setSelectedLeadForView(lead)
            setShowViewLeadModal(true)
          }}
          onEmailLead={(lead) => {
            setSelectedLeadForEmail(lead)
            setShowEmailModal(true)
          }}
          onWhatsAppLead={(lead) => {
            const phone = normalizePhone(lead.phone)
            if (!phone) {
              alert('Esta lead não tem número de telefone')
              return
            }
            setSelectedLeadForWhatsApp({...lead, phone})
            setWhatsAppMessage(`Olá ${lead.name}, tudo bem?`)
            setShowWhatsAppModal(true)
          }}
        />
      )}
      {activeView === 'scheduled' && <ScheduledTasksView />}

      {activeView === 'email-marketing' && <EmailMarketingView userId={userId} preSelectedLeadId={selectedLeadForEmailMarketing || undefined} />}
      {activeView === 'ambassadors' && (
        <AmbassadorsView userId={userId} />
      )}

      {activeView === 'magnets' && (
        <LeadMagnetsView userId={userId} />
      )}

      {filteredLeads.length === 0 && activeView === 'table' && (
        <p style={{ opacity: 0.6 }}>
          {leads.length === 0 ? 'Ainda não tens leads.' : 'Nenhuma lead corresponde aos filtros.'}
        </p>
      )}


      <div style={{ marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={`${sortBy}:${sortOrder}`}
          onChange={(e) => {
            const [field, order] = e.target.value.split(':')
            setSortBy(field as any)
            setSortOrder(order as any)
          }}
          style={{
            padding: '0 12px',
            height: 44,
            lineHeight: '44px',
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.12)',
            fontSize: 13,
            background: '#fff',
            color: '#111827',
            fontWeight: 800,
            minWidth: 220,
            width: 220,
            maxWidth: 220,
            flex: '0 0 220px',
            cursor: 'pointer',
          }}
        >
          <option value="created_at:desc">Data (mais recentes)</option>
          <option value="created_at:asc">Data (mais antigas)</option>
          <option value="name:asc">Nome (A–Z)</option>
          <option value="name:desc">Nome (Z–A)</option>
          <option value="zone:asc">Localidade/Zona (A–Z)</option>
          <option value="zone:desc">Localidade/Zona (Z–A)</option>
        </select>

        <button
          onClick={handleExportCSV}
          disabled={selectedCardId === 'all'}
          style={{
            padding: '8px 12px',
            borderRadius: 10,
            background: selectedCardId === 'all' ? '#e5e7eb' : '#111827',
            color: selectedCardId === 'all' ? '#6b7280' : '#ffffff',
            border: 'none',
            fontWeight: 900,
            cursor: selectedCardId === 'all' ? 'not-allowed' : 'pointer',
            fontSize: 13,
            height: 38,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
          title={selectedCardId === 'all' ? 'Seleciona um cartão para exportar' : 'Exportar CSV'}
        >
          <FiDownload size={15} />
          <span>Exportar CSV</span>
        </button>

        <button
          onClick={() => setShowImportModal(true)}
          disabled={selectedCardId === 'all'}
          style={{
            padding: '8px 12px',
            borderRadius: 10,
            background: selectedCardId === 'all' ? '#e5e7eb' : '#10b981',
            color: selectedCardId === 'all' ? '#6b7280' : '#ffffff',
            border: 'none',
            fontWeight: 900,
            cursor: selectedCardId === 'all' ? 'not-allowed' : 'pointer',
            fontSize: 13,
            height: 38,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
          title={selectedCardId === 'all' ? 'Seleciona um cartão para importar' : 'Importar CSV'}
        >
          <FiUpload size={15} />
          <span>Importar CSV</span>
        </button>

        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Dedupe: <strong>(cartão + email)</strong>
        </div>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setShowBulkEmailModal(true)}
          disabled={selectedLeadIds.size === 0}
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            background: selectedLeadIds.size === 0 ? '#374151' : '#8b5cf6',
            color: '#ffffff',
            border: 'none',
            fontWeight: 800,
            cursor: selectedLeadIds.size === 0 ? 'not-allowed' : 'pointer',
            fontSize: 13,
            opacity: selectedLeadIds.size === 0 ? 0.55 : 1,
          }}
        >
          📣 Email em massa ({selectedLeadIds.size})
        </button>

        <select
          value={bulkStep}
          onChange={(e) => {
            const value = e.target.value
            setBulkStep(value)
            if (value) {
              applyBulkStep(value)
            }
          }}
          disabled={selectedLeadIds.size === 0}
          style={{
            padding: '0 12px',
            height: 42,
            lineHeight: '42px',
            borderRadius: 10,
            border: '1px solid rgba(0,0,0,0.12)',
            fontSize: 13,
            background: '#fff',
            color: '#111827',
            fontWeight: 700,
            minWidth: 180,
            cursor: selectedLeadIds.size === 0 ? 'not-allowed' : 'pointer',
            opacity: selectedLeadIds.size === 0 ? 0.6 : 1,
          }}
        >
          <option value="">{selectedLeadIds.size > 0 ? `Mudar step de ${selectedLeadIds.size} ${selectedLeadIds.size === 1 ? 'lead' : 'leads'}...` : 'Mudar step...'}</option>
          {STEPS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <button
          onClick={() => setSelectedLeadIds(new Set())}
          disabled={selectedLeadIds.size === 0}
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            background: '#e5e7eb',
            border: 'none',
            fontWeight: 800,
            cursor: selectedLeadIds.size === 0 ? 'not-allowed' : 'pointer',
            fontSize: 13,
            color: '#111827',
            opacity: selectedLeadIds.size === 0 ? 0.6 : 1,
          }}
        >
          Limpar seleção
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
          }}
        >
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.02)' }}>
              <th style={{ ...th, textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Sel.</div>
                <input
                    type="checkbox"
                    checked={selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0}
                    onChange={toggleAllLeads}
                    title="Selecionar todas"
                    disabled={filteredLeads.length === 0}
                />
              </th>
              <th style={th}>Nome</th>
              <th style={th}>Email</th>
              <th style={th}>Cartão</th>
              <th style={th}>Zona</th>
              <th style={th}>Tipo</th>
              <th style={th}>Origem</th>
              <th style={th}>País</th>
              <th style={th}>Step</th>
              <th style={th}>Marketing</th>
              <th style={th}>Data</th>
              <th style={th}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ padding: 24, textAlign: 'center', opacity: 0.7 }}>
                  Nenhuma lead encontrada.
                </td>
              </tr>
            ) : (
              filteredLeads.map(lead => {
                const colors = stepColor(lead.step)
                return (
                  <tr key={lead.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>

                    <td style={{ ...td, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.has(lead.id)}
                          onChange={() => toggleLeadSelection(lead.id)}
                        />
                    </td>
                    <td style={td}>
                      <strong>{lead.name}</strong>
                      {lead.phone && <div style={{ fontSize: 11, opacity: 0.6 }}>{lead.phone}</div>}
                    </td>
                    <td style={td}>{lead.email}</td>
                    <td style={td}>{(lead as any).cards?.name || (lead as any).cards?.slug || '—'}</td>
                    <td style={td}>{lead.zone || '—'}</td>
                    <td style={td}>
                      <select
                        value={lead.lead_type_id || ''}
                        onChange={async (e) => {
                          const val = e.target.value

                          const finalVal = val || null
                          await updateLeadTypeOnLead(lead.id, finalVal)
                          setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, lead_type_id: finalVal } : l))
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'rgba(108,92,231,0.15)',
                          color: leadTypes.find(t => t.id === lead.lead_type_id)?.color || 'rgba(255,255,255,0.5)',
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: 'pointer',
                          minWidth: 100,
                        }}
                      >
                        <option value="">— Tipo —</option>
                        {leadTypes.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}

                      </select>
                    </td>
                    <td style={td}>
                      <select
                        value={lead.lead_source || 'cartão'}
                        onChange={async (e) => {
                          const val = e.target.value
                          await updateLeadSource(lead.id, val)
                          setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, lead_source: val } : l))
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'rgba(0,184,148,0.15)',
                          color: '#00b894',
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: 'pointer',
                          minWidth: 110,
                        }}
                      >
                        {LEAD_SOURCES_DEFAULT.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </td>
                    <td style={td}>
                      <select
                        value={lead.country || ''}
                        onChange={async (e) => {
                          const val = e.target.value
                          if (val === '__new__') {
                            setNewCountryName('')
                            setShowCountriesModal(true)
                          } else {
                            const finalVal = val || null
                            await updateLeadCountry(lead.id, finalVal)
                            setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, country: finalVal } : l))
                          }
                        }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'rgba(34,197,94,0.15)',
                          color: '#86efac',
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: 'pointer',
                          minWidth: 120,
                        }}
                      >
                        <option value="">— País —</option>
                        {countries.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                        <option value="__new__">+ Novo país...</option>
                      </select>
                    </td>
                    <td style={td}>
                      <select
                        value={lead.step}
                        onChange={(e) => updateStep(lead.id, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: 'none',
                          background: colors.bg,
                          color: colors.text,
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        {STEPS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td style={td}>
                      <span style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        background: lead.marketing_opt_in ? '#d1fae5' : '#fee2e2',
                        color: lead.marketing_opt_in ? '#065f46' : '#7f1d1d',
                      }}>
                        {lead.marketing_opt_in ? '✓ Sim' : '✗ Não'}
                      </span>
                    </td>
                    <td style={td}>{new Date(lead.created_at).toLocaleDateString()}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => {
                            setSelectedLeadForEmailMarketing(lead.id)
                            setActiveView('email-marketing')
                          }}
                          disabled={!gmail.isConnected}
                          title={gmail.isConnected ? 'Enviar email agora' : 'Liga o Gmail para enviar emails'}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            border: 'none',
                            background: gmail.isConnected ? '#10b981' : '#d1d5db',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: 12,
                            cursor: gmail.isConnected ? 'pointer' : 'not-allowed',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <FiMail size={15} />
                        </button>
                        <button
                          onClick={() => {
                            const phone = normalizePhone(lead.phone)
                            if (!phone) {
                              alert('Esta lead não tem número de WhatsApp válido (falta +XX)')
                              return
                            }
                            setSelectedLeadForWhatsApp(lead)
                            setWhatsAppMessage(`Olá ${lead.name}, tudo bem?`)
                            setShowWhatsAppModal(true)
                          }}
                          title="Enviar WhatsApp"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            border: 'none',
                            background: '#25d366',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: 12,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <FaWhatsapp size={14} />
                        </button>
                        <button
                          onClick={async () => {
                            setSelectedLeadForView(lead)
                            setShowViewLeadModal(true)
                            await loadLeadActivities(lead.id)
                          }}
                          title="Ver detalhes"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            border: '1px solid #e5e7eb',
                            background: '#ffffff',
                            color: '#111827',
                            fontWeight: 800,
                            fontSize: 12,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <FiEye size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLead(lead)
                            setNoteText(lead.notes || '')
                          }}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          border: 'none',
                          background: 'var(--color-primary)',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FiFileText size={14} />
                      </button>
                        <button
                          onClick={() => deleteLead(lead.id)}
                          disabled={deletingId === lead.id}
                          title="Apagar lead"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            border: 'none',
                            background: '#fee2e2',
                            color: '#b91c1c',
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <FiTrash2 size={14} />
                        </button>
                        <button
                          onClick={() => { setSelectedLeadForTask(lead); setShowTaskModal(true) }}
                          title="Agendar tarefa"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            border: 'none',
                            background: '#dbeafe',
                            color: '#0c4a6e',
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <FiCalendar size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 20, fontSize: 12, opacity: 0.6 }}>
        Total: {filteredLeads.length} lead(s)
      </div>

      {/* Modal de Notas */}
      {selectedLead && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            maxWidth: 500,
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}>
            <h2 style={{ marginBottom: 16, color: '#111827' }}>{selectedLead.name}</h2>
            <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 16 }}>
              {selectedLead.email} • {selectedLead.zone || 'Sem zona'}
            </p>

            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13, color: '#111827' }}>
              Notas
            </label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Adiciona notas sobre esta lead…"
              style={{
                width: '100%',
                minHeight: 120,
                padding: 12,
                borderRadius: 12,
                border: '1px solid rgba(0,0,0,0.12)',
                fontSize: 13,
                fontFamily: 'inherit',
                marginBottom: 16,
                color: '#1f2937',
              }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  updateNotes(selectedLead.id, noteText)
                  setSelectedLead(null)
                }}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'var(--color-primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Guardar
              </button>
              <button
                onClick={() => setSelectedLead(null)}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid rgba(0,0,0,0.08)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tarefa Calendário */}
      {selectedCalendarTask && (() => {
        const task = selectedCalendarTask
        const lead = leads.find(l => l.id === task.lead_id)
        const ACTION_ICONS: Record<string, string> = { follow_up: '✅', email: '📧', whatsapp: '💬', call: '📞', sms: '✉️', meeting: '📅' }
        const ACTION_LABELS: Record<string, string> = { follow_up: 'Follow-up', email: 'Email', whatsapp: 'WhatsApp', call: 'Ligar', sms: 'SMS', meeting: 'Reunião' }
        const icon = ACTION_ICONS[task.action_type ?? 'follow_up'] ?? '✅'
        const label = ACTION_LABELS[task.action_type ?? 'follow_up'] ?? 'Follow-up'
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1010 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 440, width: '90%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>{icon}</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#111827' }}>{task.title}</h2>
                  <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{icon} {label} · {lead?.name ?? 'Lead'}</p>
                </div>
              </div>
              {task.description && (
                <p style={{ fontSize: 13, color: '#374151', background: '#f9fafb', borderRadius: 10, padding: 12, marginBottom: 16 }}>{task.description}</p>
              )}
              <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>
                📅 {new Date(task.due_at).toLocaleString('pt-PT')}
              </p>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <button
                  onClick={() => { setPendingCalendarAction({ task, lead }); setSelectedCalendarTask(null) }}
                  style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}
                >
                  {icon} Fazer agora
                </button>
                <button
                  onClick={async () => {
                    await markTaskDone({ taskId: task.id })
                    await logLeadActivity({ leadId: task.lead_id, userId, type: 'task_done', title: `Tarefa concluída: ${task.title}` })
                    setCalendarTasks(prev => prev.filter(t => t.id !== task.id))
                    await loadTasksForToday()
                    setSelectedCalendarTask(null)
                  }}
                  style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: '#10b981', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}
                >
                  ✓ Marcar feita
                </button>
              </div>
              <button
                onClick={() => setSelectedCalendarTask(null)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#f3f4f6', color: '#374151', border: '1px solid rgba(0,0,0,0.08)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
              >
                Fechar
              </button>
            </div>
          </div>
        )
      })()}

      {showSaveTemplateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1005 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 520, width: '90%', color: '#111827' }}>
            <h2 style={{ marginBottom: 16, fontSize: 18, fontWeight: 900 }}>Guardar Template</h2>

            <label style={{ display: 'block', marginBottom: 8, fontWeight: 900, fontSize: 13 }}>Nome</label>
            <input value={saveTemplateName} onChange={(e) => setSaveTemplateName(e.target.value)} placeholder="Ex: Obrigado Open House" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.18)', fontSize: 13, boxSizing: 'border-box', background: '#fff', color: '#111827', marginBottom: 12 }} />

            <label style={{ display: 'block', marginBottom: 8, fontWeight: 900, fontSize: 13 }}>Categoria</label>
            <input value={saveTemplateCategory} onChange={(e) => setSaveTemplateCategory(e.target.value)} placeholder="Ex: Imobiliário" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.18)', fontSize: 13, boxSizing: 'border-box', background: '#fff', color: '#111827', marginBottom: 16 }} />

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={async () => {
                  if (!userId) return alert('Sem userId')
                  if (!saveTemplateName) return alert('Escolhe um nome')
                  if (!emailSubject || !emailBody) return alert('Preenche assunto e mensagem')
                  await createEmailTemplate({ userId, name: saveTemplateName, category: saveTemplateCategory || 'Geral', subject: emailSubject, body: emailBody })
                  await loadEmailTemplates()
                  setShowSaveTemplateModal(false)
                }}
                style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: '#8b5cf6', color: '#ffffff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 13 }}
              >
                Guardar
              </button>
              <button onClick={() => setShowSaveTemplateModal(false)} style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: '#f3f4f6', border: '1px solid rgba(0,0,0,0.08)', fontWeight: 900, cursor: 'pointer', fontSize: 13, color: '#111827' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showWhatsAppModal && selectedLeadForWhatsApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1006 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 620, width: '90%', maxHeight: '80vh', overflowY: 'auto', color: '#111827' }}>
            <h2 style={{ marginBottom: 8, fontSize: 18, fontWeight: 900 }}>Enviar WhatsApp</h2>
            <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 16 }}>Para: <strong>{selectedLeadForWhatsApp.name}</strong> ({selectedLeadForWhatsApp.phone || 'sem telefone'})</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12 }}>
              <label style={{ display: 'block', fontWeight: 900, fontSize: 13, color: '#111827' }}>Mensagem</label>
              <button
                onClick={async () => {
                  const generated = await chatgpt.generateMessage('whatsapp', selectedLeadForWhatsApp, 'Follow-up comercial no CRM')
                  if (generated) setWhatsAppMessage(generated)
                }}
                disabled={chatgpt.loading}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(139,92,246,0.25)',
                  background: 'rgba(139,92,246,0.08)',
                  color: '#7c3aed',
                  fontWeight: 900,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                {chatgpt.loading ? 'A gerar...' : '✨ Gerar com IA'}
              </button>
            </div>
            <textarea
              value={whatsAppMessage}
              onChange={(e) => setWhatsAppMessage(e.target.value)}
              placeholder="Escreve a mensagem…"
              style={{ width: '100%', minHeight: 140, padding: '12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.18)', fontSize: 13, fontFamily: 'inherit', marginBottom: 16, boxSizing: 'border-box', background: '#fff', color: '#111827' }}
            />

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  const phone = normalizePhone(selectedLeadForWhatsApp.phone)
                  if (!phone) {
                    alert('Esta lead não tem número de WhatsApp válido (falta +XX)')
                    return
                  }
                  const encoded = encodeURIComponent(whatsAppMessage || '')
                  window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encoded}`, '_blank')
                  setShowWhatsAppModal(false)
                }}
                style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: '#25d366', color: '#ffffff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 13 }}
              >
                Abrir WhatsApp
              </button>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: '#f3f4f6', border: '1px solid rgba(0,0,0,0.08)', fontWeight: 900, cursor: 'pointer', fontSize: 13, color: '#111827' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmailModal && selectedLeadForEmail && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 650, width: '90%', maxHeight: '80vh', overflowY: 'auto', color: '#111827' }}>
            <h2 style={{ marginBottom: 8 }}>Enviar Email</h2>
            <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 20 }}>Para: <strong>{selectedLeadForEmail.email}</strong></p>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <button
                onClick={async () => {
                  const generated = await chatgpt.generateMessage('email', selectedLeadForEmail, 'Follow-up comercial no CRM')
                  if (generated) {
                    if (!emailSubject) setEmailSubject(`Follow-up ${selectedLeadForEmail.name}`)
                    setEmailBody(generated)
                  }
                }}
                disabled={chatgpt.loading}
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(139,92,246,0.25)',
                  background: 'rgba(139,92,246,0.08)',
                  color: '#7c3aed',
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                {chatgpt.loading ? 'A gerar...' : '✨ Gerar com IA'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 900, fontSize: 13, color: '#111827' }}>Template</label>
                <select
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const t = emailTemplates.find(x => x.id === e.target.value) || null
                    if (t) applyTemplateToEmail(t, selectedLeadForEmail)
                  }}
                  style={{ width: '100%', padding: '14px 12px', minHeight: 48, borderRadius: 10, border: '1px solid rgba(0,0,0,0.18)', fontSize: 13, boxSizing: 'border-box', background: '#fff', color: '#111827' }}
                >
                  <option value="">— Escolher template —</option>
                  {emailTemplates.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.category}] {t.name}{t.id.startsWith('default-') ? ' (Kardme)' : ''}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>Variáveis: {'{nome}'}, {'{email}'}</div>
                {selectedTemplate && (
                  <div style={{ fontSize: 12, marginTop: 6, color: '#111827' }}>
                    <strong>Selecionado:</strong> [{selectedTemplate.category}] {selectedTemplate.name}{selectedTemplate.id.startsWith('default-') ? ' (Kardme)' : ''}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'end' }}>
                <button
                  onClick={() => {
                    setShowSaveTemplateModal(true)
                    setSaveTemplateName('')
                    setSaveTemplateCategory('Geral')
                  }}
                  style={{ padding: '14px 12px', borderRadius: 10, background: '#8b5cf6', color: '#ffffff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}
                >
                  Guardar como template
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 900, fontSize: 13, color: '#111827' }}>Anexos (máx 5 / 10MB)</label>
              <input
                id="email-attachments"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx"
                style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }}
                onChange={async (e) => {
                  const atts = await filesToAttachments(e.target.files)
                  if (atts.length > 0) setSelectedAttachments(atts)
                }}
              />
              <label
                htmlFor="email-attachments"
                style={{
                  display: 'inline-block',
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#111827',
                  color: '#ffffff',
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontSize: 13,
                  marginTop: 6,
                }}
              >
                + Adicionar ficheiros
              </label>
              {selectedAttachments.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#111827' }}>
                  <strong>Anexos:</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                    {selectedAttachments.map((a, idx) => (
                      <li key={idx}>{a.filename}</li>
                    ))}
                  </ul>
                  <button onClick={() => setSelectedAttachments([])} style={{ padding: '6px 10px', borderRadius: 8, background: '#e5e7eb', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 12, color: '#111827' }}>Remover anexos</button>
                </div>
              )}
            </div>

            <label style={{ display: 'block', marginBottom: 8, fontWeight: 800, fontSize: 13, color: '#111827' }}>Assunto</label>
            <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Ex: Follow-up - Proposta" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.18)', fontSize: 13, marginBottom: 16, boxSizing: 'border-box', background: '#fff', color: '#111827', minHeight: 44 }} />
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 800, fontSize: 13, color: '#111827' }}>Mensagem</label>
            <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Escreve a tua mensagem aqui…" style={{ width: '100%', minHeight: 200, padding: '12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.18)', fontSize: 13, fontFamily: 'inherit', marginBottom: 16, boxSizing: 'border-box', background: '#fff', color: '#111827' }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={async () => { if (!emailSubject || !emailBody) { alert('Preenche assunto e mensagem'); return }; setEmailLoading(true); try { const processedBody = processEmailTemplate(emailBody, { nome: selectedLeadForEmail.name, email: selectedLeadForEmail.email }); await gmail.sendEmail(selectedLeadForEmail.id, selectedLeadForEmail.email, emailSubject, processedBody, selectedTemplate?.id, selectedAttachments); alert('Email enviado com sucesso!'); setShowEmailModal(false); setEmailSubject(''); setEmailBody(''); setSelectedLeadForEmail(null); setSelectedTemplate(null); setSelectedAttachments([]) } catch (err: any) { alert('Erro: ' + err.message) } finally { setEmailLoading(false) } }} disabled={emailLoading} style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: 'var(--color-primary)', color: '#ffffff', border: 'none', fontWeight: 800, cursor: emailLoading ? 'not-allowed' : 'pointer', fontSize: 13, opacity: emailLoading ? 0.6 : 1 }}>{emailLoading ? 'A enviar…' : 'Enviar Email'}</button>
              <button onClick={() => { setShowEmailModal(false); setEmailSubject(''); setEmailBody(''); setSelectedLeadForEmail(null) }} style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: '#f3f4f6', border: '1px solid rgba(0,0,0,0.08)', fontWeight: 800, cursor: 'pointer', fontSize: 13, color: '#111827' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {showTaskModal && selectedLeadForTask && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1002 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 500, width: '90%' }}>
            <h2 style={{ marginBottom: 16, color: '#111827' }}>Agendar Tarefa</h2>
            <p style={{ fontSize: 13, color: '#4b5563', marginBottom: 20 }}>Para: <strong>{selectedLeadForTask.name}</strong></p>
            
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13, color: '#111827' }}>Título da Tarefa</label>
            <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Ex: Contactar, Follow-up, Enviar proposta..." style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, marginBottom: 16, boxSizing: 'border-box', color: '#111827' }} />
            
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13, color: '#111827' }}>Descrição (opcional)</label>
            <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="Notas sobre a tarefa..." style={{ width: '100%', minHeight: 80, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, fontFamily: 'inherit', marginBottom: 16, boxSizing: 'border-box', color: '#111827' }} />
            
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13, color: '#111827' }}>Data</label>
                <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, boxSizing: 'border-box', color: '#111827', background: '#fff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13, color: '#111827' }}>Hora</label>
                <input type="time" value={taskDueTime} onChange={(e) => setTaskDueTime(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, boxSizing: 'border-box', color: '#111827', background: '#fff' }} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13, color: '#111827' }}>Tipo de Ação</label>
              <select value={taskActionType} onChange={(e) => setTaskActionType(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, boxSizing: 'border-box', color: '#111827', background: '#fff' }}>
                <option value="follow_up">✅ Follow-up</option>
                <option value="email">📧 Email</option>
                <option value="whatsapp">💬 WhatsApp</option>
                <option value="call">📞 Ligar</option>
                <option value="sms">✉️ SMS</option>
                <option value="meeting">📅 Reunião</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={createTaskForLead} style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: 'var(--color-primary)', color: '#ffffff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>Agendar Tarefa</button>
              <button onClick={() => { setShowTaskModal(false); setTaskTitle(''); setTaskDesc(''); setTaskDueDate(''); setTaskDueTime('09:00') }} style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: '#f3f4f6', border: '1px solid rgba(0,0,0,0.08)', fontWeight: 800, cursor: 'pointer', fontSize: 13, color: '#111827' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showBulkEmailModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1004 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 700, width: '90%', maxHeight: '80vh', overflowY: 'auto', color: '#111827' }}>
            <h2 style={{ marginBottom: 16, color: '#111827', fontSize: 18, fontWeight: 900 }}>📣 Email em massa ({selectedLeadIds.size} leads)</h2>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 900, fontSize: 13, color: '#111827' }}>Template</label>
                <select
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const t = emailTemplates.find(x => x.id === e.target.value) || null
                    if (t) applyTemplateToBulk(t)
                  }}
                  style={{ width: '100%', padding: '14px 12px', minHeight: 48, borderRadius: 10, border: '1px solid rgba(0,0,0,0.18)', fontSize: 13, boxSizing: 'border-box', background: '#fff', color: '#111827' }}
                >
                  <option value="">— Escolher template —</option>
                  {emailTemplates.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.category}] {t.name}{t.id.startsWith('default-') ? ' (Kardme)' : ''}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>Variáveis: {'{nome}'}, {'{email}'}</div>
                {selectedTemplate && (
                  <div style={{ fontSize: 12, marginTop: 6, color: '#111827' }}>
                    <strong>Selecionado:</strong> [{selectedTemplate.category}] {selectedTemplate.name}{selectedTemplate.id.startsWith('default-') ? ' (Kardme)' : ''}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 900, fontSize: 13, color: '#111827' }}>Anexos (máx 5 / 10MB)</label>
              <input
                id="bulk-email-attachments"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx"
                style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }}
                onChange={async (e) => {
                  const atts = await filesToAttachments(e.target.files)
                  if (atts.length > 0) setSelectedAttachments(atts)
                }}
              />
              <label
                htmlFor="bulk-email-attachments"
                style={{
                  display: 'inline-block',
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#111827',
                  color: '#ffffff',
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                + Adicionar ficheiros
              </label>
              {selectedAttachments.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#111827' }}>
                  <strong>Anexos:</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                    {selectedAttachments.map((a, idx) => (
                      <li key={idx}>{a.filename}</li>
                    ))}
                  </ul>
                  <button onClick={() => setSelectedAttachments([])} style={{ padding: '6px 10px', borderRadius: 8, background: '#e5e7eb', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 12, color: '#111827' }}>Remover anexos</button>
                </div>
              )}
            </div>


            <label style={{ display: 'block', marginBottom: 8, fontWeight: 900, fontSize: 13, color: '#111827' }}>Assunto</label>
            <input type="text" value={bulkSubject} onChange={(e) => setBulkSubject(e.target.value)} placeholder="Ex: Obrigado pela presença! Use {nome} para personalizar" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.18)', fontSize: 13, marginBottom: 16, boxSizing: 'border-box', background: '#fff', color: '#111827' }} />

            <label style={{ display: 'block', marginBottom: 8, fontWeight: 900, fontSize: 13, color: '#111827' }}>Mensagem</label>
            <textarea value={bulkBody} onChange={(e) => setBulkBody(e.target.value)} placeholder="Use {nome} e {email} para personalizar." style={{ width: '100%', minHeight: 150, padding: '12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.18)', fontSize: 13, fontFamily: 'inherit', marginBottom: 16, boxSizing: 'border-box', background: '#fff', color: '#111827' }} />

            <div style={{ background: '#f0f9ff', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 12 }}>
              <strong>Preview (primeiras 2 selecionadas):</strong>
              <div style={{ marginTop: 8, fontSize: 11, opacity: 0.8 }}>
                {Array.from(selectedLeadIds).slice(0, 2).map(leadId => {
                  const l = leads.find(x => x.id === leadId)
                  return l ? (
                    <div key={l.id} style={{ marginBottom: 8, padding: 8, background: '#fff', borderRadius: 6 }}>
                      <div><strong>{bulkSubject.replace('{nome}', l.name)}</strong></div>
                      <div style={{ whiteSpace: 'pre-wrap', marginTop: 4, fontSize: 11 }}>{bulkBody.replace('{nome}', l.name).replace('{email}', l.email).slice(0, 80)}...</div>
                    </div>
                  ) : null
                })}
              </div>
            </div>

            <div style={{ marginBottom: 16, padding: 12, background: '#fef3c7', borderRadius: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginBottom: 10 }}>
                <input type="radio" name="bulkAction" value="now" defaultChecked style={{ cursor: 'pointer' }} />
                <span><strong>⚡ Enviar agora</strong> (imediatamente para todas)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input type="radio" name="bulkAction" value="schedule" style={{ cursor: 'pointer' }} />
                <span><strong>📅 Agendar</strong> (criar tarefas para)</span>
              </label>
              <div style={{ marginTop: 10, marginLeft: 28, display: 'flex', gap: 12 }}>
                <input type="date" value={bulkScheduleDate} onChange={(e) => setBulkScheduleDate(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontSize: 12 }} />
                <input type="time" value={bulkScheduleTime} onChange={(e) => setBulkScheduleTime(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', fontSize: 12 }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={sendBulkEmails} disabled={bulkSending} style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 800, cursor: bulkSending ? 'not-allowed' : 'pointer', fontSize: 13, opacity: bulkSending ? 0.6 : 1 }}>{bulkSending ? 'A enviar…' : '⚡ Enviar agora'}</button>
              <button onClick={createBulkTasks} disabled={bulkSending} style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: '#3b82f6', color: '#ffffff', border: 'none', fontWeight: 800, cursor: bulkSending ? 'not-allowed' : 'pointer', fontSize: 13, opacity: bulkSending ? 0.6 : 1 }}>{bulkSending ? 'A criar…' : '📅 Agendar'}</button>
              <button onClick={() => { setShowBulkEmailModal(false); setBulkSubject(''); setBulkBody(''); setBulkScheduleDate(''); setBulkScheduleTime('09:00'); setSelectedAttachments([]) }} style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: '#f3f4f6', border: '1px solid rgba(0,0,0,0.08)', fontWeight: 800, cursor: 'pointer', fontSize: 13, color: '#111827' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showLeadTasksModal && selectedLeadForTasks && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1003 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 700, width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ marginBottom: 4 }}>Tarefas de {selectedLeadForTasks.name}</h2>
                <p style={{ fontSize: 13, opacity: 0.6 }}>{selectedLeadForTasks.email}</p>
              </div>
              <button onClick={() => setShowLeadTasksModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>

            {leadTasksLoading && <p style={{ opacity: 0.6 }}>A carregar tarefas…</p>}

            {!leadTasksLoading && leadTasks.length === 0 && (
              <p style={{ opacity: 0.6, marginBottom: 20 }}>Nenhuma tarefa aberta. Cria uma nova!</p>
            )}

            {!leadTasksLoading && leadTasks.length > 0 && (
              <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {leadTasks.map(t => {
                  const isPast = new Date(t.due_at) < new Date()
                  return (
                    <div key={t.id} style={{ background: '#f9fafb', padding: 12, borderRadius: 10, borderLeft: `4px solid ${isPast ? '#dc2626' : '#f59e0b'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                            <strong style={{ fontSize: 13 }}>{t.title}</strong>
                            <span style={{ fontSize: 11, fontWeight: 800, background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: 999 }}>
                              {t.action_type === 'email' && '📧 Email'}
                              {t.action_type === 'whatsapp' && '💬 WhatsApp'}
                              {t.action_type === 'call' && '📞 Ligar'}
                              {t.action_type === 'sms' && '✉️ SMS'}
                                    {t.action_type === 'meeting' && '📅 Reunião'}
                              {(!t.action_type || t.action_type === 'follow_up') && '✅ Follow-up'}
                            </span>
                          </div>
                          {t.description && <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>{t.description}</p>}
                          <p style={{ fontSize: 12, color: isPast ? '#991b1b' : '#666', margin: '6px 0 0 0' }}>{new Date(t.due_at).toLocaleString('pt-PT')}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => handleTaskAction(t, selectedLeadForTasks)} style={{ padding: '6px 12px', borderRadius: 8, background: '#3b82f6', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Fazer</button>
                          <button onClick={async () => { await markTaskDone({ taskId: t.id }); await loadTasksForLead(selectedLeadForTasks.id) }} style={{ padding: '6px 12px', borderRadius: 8, background: '#10b981', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>✓</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <button onClick={() => { setSelectedLeadForTask(selectedLeadForTasks); setShowTaskModal(true); setShowLeadTasksModal(false) }} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, background: 'var(--color-primary)', color: '#ffffff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 13, marginBottom: 10 }}>+ Nova Tarefa</button>
            <button onClick={() => setShowLeadTasksModal(false)} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, background: '#f3f4f6', border: '1px solid rgba(0,0,0,0.08)', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>Fechar</button>
          </div>
        </div>
      )}

      {showViewLeadModal && selectedLeadForView && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1007 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 720, width: '90%', maxHeight: '85vh', overflowY: 'auto', color: '#111827' }}>
            <h2 style={{ marginBottom: 16, fontSize: 18, fontWeight: 900 }}>Detalhes da Lead</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, opacity: 0.7, marginBottom: 4 }}>ID</label>
                <p style={{ margin: 0, fontSize: 13, fontFamily: 'monospace', color: '#666' }}>{selectedLeadForView.id}</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, opacity: 0.7, marginBottom: 4 }}>Nome</label>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{selectedLeadForView.name}</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, opacity: 0.7, marginBottom: 4 }}>Email</label>
                <p style={{ margin: 0, fontSize: 13 }}>{selectedLeadForView.email}</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, opacity: 0.7, marginBottom: 4 }}>Telefone</label>
                <p style={{ margin: 0, fontSize: 13 }}>{selectedLeadForView.phone || '—'}</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, opacity: 0.7, marginBottom: 4 }}>Zona</label>
                <p style={{ margin: 0, fontSize: 13 }}>{selectedLeadForView.zone || '—'}</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, opacity: 0.7, marginBottom: 4 }}>Data</label>
                <p style={{ margin: 0, fontSize: 13 }}>{new Date(selectedLeadForView.created_at).toLocaleString('pt-PT')}</p>
              </div>
            </div>

            {selectedLeadForView.message && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, opacity: 0.7, marginBottom: 4 }}>Mensagem</label>
                <p style={{ margin: 0, fontSize: 13, padding: 12, background: '#f3f4f6', borderRadius: 8 }}>{selectedLeadForView.message}</p>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 900, opacity: 0.7, marginBottom: 4 }}>Notas</label>
              <p style={{ margin: 0, fontSize: 13, padding: 12, background: '#f3f4f6', borderRadius: 8 }}>{selectedLeadForView.notes || '—'}</p>
            </div>

            <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)' }} />

            <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>Histórico de Atividades</h3>
            {viewLeadActivities.length > 0 ? (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {viewLeadActivities.map((act: any, idx: number) => (
                  <div key={idx} style={{ padding: 12, marginBottom: 8, background: '#f9fafb', borderRadius: 8, borderLeft: '3px solid #8b5cf6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong style={{ fontSize: 12 }}>{act.title}</strong>
                      <span style={{ fontSize: 11, opacity: 0.7 }}>{new Date(act.created_at).toLocaleString('pt-PT')}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11, opacity: 0.8 }}>Tipo: {act.type}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, opacity: 0.7, textAlign: 'center', padding: 24 }}>Sem atividades registadas</p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                onClick={() => setShowViewLeadModal(false)}
                style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: '#f3f4f6', border: '1px solid rgba(0,0,0,0.08)', fontWeight: 900, cursor: 'pointer', fontSize: 13, color: '#111827' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {showWelcomeSettingsModal && selectedCardId !== 'all' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1008 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 620, width: '90%', maxHeight: '85vh', overflowY: 'auto', color: '#111827' }}>
            <h2 style={{ marginBottom: 16, fontSize: 18, fontWeight: 900 }}>Configurar Mensagem de Boas-vindas</h2>
            <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 16 }}>Cartão: <strong>{cardsList.find((c: any) => c.id === selectedCardId)?.title}</strong></p>

            <label style={{ display: 'block', marginBottom: 8, fontWeight: 900, fontSize: 13, color: '#111827' }}>Assunto</label>
            <input
              type="text"
              value={welcomeSubject}
              onChange={(e) => setWelcomeSubject(e.target.value)}
              placeholder="Ex: Bem-vindo à {cardTitle}! 🎉"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.18)', fontSize: 13, marginBottom: 16, boxSizing: 'border-box', background: '#fff', color: '#111827' }}
            />

            <label style={{ display: 'block', marginBottom: 8, fontWeight: 900, fontSize: 13, color: '#111827' }}>Mensagem</label>
            <textarea
              value={welcomeBody}
              onChange={(e) => setWelcomeBody(e.target.value)}
              placeholder="Escreve a mensagem de boas-vindas..."
              style={{ width: '100%', minHeight: 200, padding: '12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.18)', fontSize: 13, fontFamily: 'inherit', marginBottom: 12, boxSizing: 'border-box', background: '#fff', color: '#111827' }}
            />

            <div style={{ background: '#f3f4f6', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 12 }}>
              <strong style={{ color: '#111827' }}>Variáveis disponíveis:</strong>
              <ul style={{ margin: '6px 0', paddingLeft: 20, color: '#111827' }}>
                <li><code>{'{nome}'}</code> — nome da pessoa</li>
                <li><code>{'{email}'}</code> — email da pessoa</li>
                <li><code>{'{cardTitle}'}</code> — nome do teu cartão</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={async () => {
                  if (!selectedCardId || selectedCardId === 'all') return
                  try {
                    const { error } = await supabase
                      .from('cards')
                      .update({
                        crm_pro_welcome_subject: welcomeSubject,
                        crm_pro_welcome_body: welcomeBody,
                      })
                      .eq('id', selectedCardId)
                    if (error) throw error
                    alert('✓ Mensagem guardada com sucesso!')
                    setShowWelcomeSettingsModal(false)
                    // Recarregar cards para refletir mudanças
                    const { data } = await supabase
                      .from('cards')
                      .select('id, title, name, slug, crm_pro_welcome_subject, crm_pro_welcome_body')
                      .eq('user_id', userId)
                      .order('created_at', { ascending: false })
                    setCardsList(data || [])
                  } catch (err: any) {
                    alert('Erro ao guardar: ' + err?.message)
                  }
                }}
                style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: '#8b5cf6', color: '#ffffff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 13 }}
              >
                Guardar
              </button>
              <button
                onClick={() => setShowWelcomeSettingsModal(false)}
                style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: '#f3f4f6', border: '1px solid rgba(0,0,0,0.08)', fontWeight: 900, cursor: 'pointer', fontSize: 13, color: '#111827' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1010 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 760, width: '92%', maxHeight: '85vh', overflowY: 'auto', color: '#111827' }}>
            <h2 style={{ marginBottom: 10, fontSize: 18, fontWeight: 900 }}>⬆️ Importar Leads (CSV)</h2>
            <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 14 }}>
              Importação é feita para o cartão selecionado. Dedupe automático por <strong>(cartão + email)</strong>.
            </p>

            <div style={{ background: '#f3f4f6', padding: 12, borderRadius: 12, marginBottom: 14, fontSize: 12 }}>
              <strong>Dica:</strong> O CSV deve ter cabeçalho. Colunas reconhecidas automaticamente: <code>nome/name</code>, <code>email</code>, <code>telefone/phone</code>, <code>zona/zone</code>, <code>notas/notes</code>, <code>step</code>.
            </div>

            <label style={{ display: 'block', marginBottom: 8, fontWeight: 900, fontSize: 13 }}>Upload do CSV</label>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
              <button
                onClick={() => importFileInputRef.current?.click()}
                style={{ padding: '10px 14px', borderRadius: 10, background: '#111827', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 13 }}
              >
                📁 Escolher ficheiro
              </button>

              <div style={{ fontSize: 12, opacity: 0.75 }}>
                {importFileName ? <>Selecionado: <strong>{importFileName}</strong></> : 'Nenhum ficheiro selecionado'}
              </div>
            </div>

            <input
              ref={importFileInputRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setImportFileName(file.name)

                const reader = new FileReader()
                reader.onload = () => {
                  const text = String(reader.result || '')
                  setImportCSVText(text)
                  // gerar preview automaticamente
                  setTimeout(() => {
                    try { handleImportPreview() } catch {}
                  }, 0)
                }
                reader.readAsText(file)
              }}
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <button
                onClick={handleImportPreview}
                style={{ padding: '10px 14px', borderRadius: 10, background: '#111827', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 13 }}
              >
                👀 Preview
              </button>

              <button
                onClick={handleImportCSV}
                disabled={importing}
                style={{ padding: '10px 14px', borderRadius: 10, background: importing ? '#a7f3d0' : '#10b981', color: '#fff', border: 'none', fontWeight: 900, cursor: importing ? 'not-allowed' : 'pointer', fontSize: 13 }}
              >
                {importing ? 'A importar...' : 'Importar agora'}
              </button>

              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportCSVText('')
                  setImportPreview([])
                  setImportFileName('')
                }}
                style={{ padding: '10px 14px', borderRadius: 10, background: '#f3f4f6', color: '#111827', border: '1px solid rgba(0,0,0,0.08)', fontWeight: 900, cursor: 'pointer', fontSize: 13 }}
              >
                Cancelar
              </button>
            </div>

            {importPreview.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 8 }}>Preview (até 10 linhas)</div>
                <div style={{ overflowX: 'auto', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <tbody>
                      {importPreview.map((row, idx) => (
                        <tr key={idx} style={{ background: idx === 0 ? 'rgba(0,0,0,0.04)' : '#fff' }}>
                          {row.map((cell, j) => (
                            <td key={j} style={{ padding: '10px 10px', borderBottom: '1px solid rgba(0,0,0,0.06)', whiteSpace: 'nowrap' }}>
                              {cell || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}



      {showWelcomeInfoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 560, width: '90%' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: '0 0 16px 0' }}>O que é a Mensagem de Boas-vindas?</h2>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 12 }}>
              É uma mensagem automática enviada ao cliente depois de preencher o formulário do teu cartão digital. Serve para agradecer o contacto, confirmar a receção e criar uma primeira impressão mais profissional.
            </p>

            <div style={{ background: '#f3f4f6', padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 13 }}>
              <strong style={{ color: '#111827' }}>Como usar bem:</strong>
              <div style={{ marginTop: 8, color: '#666', lineHeight: 1.8 }}>
                • Agradece o contacto<br/>
                • Diz ao cliente o que acontece a seguir<br/>
                • Mantém a mensagem curta, clara e pessoal<br/>
                • Usa variáveis para personalizar automaticamente
              </div>
            </div>

            <div style={{ background: '#faf5ff', padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 13 }}>
              <strong style={{ color: '#6b21a8' }}>Variáveis disponíveis:</strong>
              <div style={{ marginTop: 8, fontFamily: 'monospace', color: '#6b7280', lineHeight: 1.8 }}>
                • {'{nome}'} - Nome do cliente<br/>
                • {'{email}'} - Email do cliente<br/>
                • {'{cardTitle}'} - Nome do teu cartão
              </div>
            </div>

            <div style={{ background: '#ecfdf5', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
              <strong style={{ color: '#065f46' }}>Exemplo:</strong>
              <div style={{ marginTop: 8, color: '#047857', lineHeight: 1.8 }}>
                Olá {'{nome}'}, obrigado pelo teu contacto. Recebemos o teu pedido através do cartão {'{cardTitle}'} e vamos responder-te o mais breve possível.
              </div>
            </div>

            <button onClick={() => setShowWelcomeInfoModal(false)} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, background: '#8b5cf6', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 13 }}>Entendi</button>
          </div>
        </div>
      )}

      {showTemplatesInfoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 560, width: '90%' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: '0 0 16px 0' }}>O que são Templates de Email?</h2>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 12 }}>
              Templates são modelos de email prontos a usar. Ajudam-te a responder mais rápido, manter consistência na comunicação e evitar escrever sempre a mesma mensagem do zero.
            </p>

            <div style={{ background: '#eef2ff', padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 13 }}>
              <strong style={{ color: '#4338ca' }}>Quando usar:</strong>
              <div style={{ marginTop: 8, color: '#4f46e5', lineHeight: 1.8 }}>
                • Follow-up após um contacto<br/>
                • Resposta a pedidos de informação<br/>
                • Campanhas comerciais<br/>
                • Mensagens de acompanhamento e reativação
              </div>
            </div>

            <div style={{ background: '#f3f4f6', padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 13 }}>
              <strong style={{ color: '#111827' }}>Benefícios:</strong>
              <div style={{ marginTop: 8, color: '#666', lineHeight: 1.8 }}>
                • Poupa tempo no dia a dia<br/>
                • Garante consistência nas mensagens<br/>
                • Facilita o trabalho da equipa<br/>
                • Reutilizável em múltiplas ações e campanhas
              </div>
            </div>

            <div style={{ background: '#ecfeff', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
              <strong style={{ color: '#155e75' }}>Dica:</strong>
              <div style={{ marginTop: 8, color: '#0f766e', lineHeight: 1.8 }}>
                Cria templates por objetivo, como "Primeiro contacto", "Follow-up", "Proposta enviada" ou "Reativação". Assim fica mais fácil escolher a mensagem certa no momento certo.
              </div>
            </div>

            <button onClick={() => setShowTemplatesInfoModal(false)} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 13 }}>Entendi</button>
          </div>
        </div>
      )}


      {showOptinInfoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 560, width: '90%' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: '0 0 16px 0' }}>O que é Autorização Marketing?</h2>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 12 }}>
              Autorização Marketing significa que o cliente deu autorização para receber comunicações comerciais, como emails, campanhas, novidades ou promoções.
            </p>

            <div style={{ background: '#fff7ed', padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 13 }}>
              <strong style={{ color: '#9a3412' }}>Como interpretar este filtro:</strong>
              <div style={{ marginTop: 8, color: '#c2410c', lineHeight: 1.8 }}>
                • <strong>Com autorização</strong> — Cliente autorizou receber comunicações<br/>
                • <strong>Sem autorização</strong> — Cliente não autorizou ou retirou consentimento<br/>
                • <strong>Todos</strong> — Mostra todos os contactos, com ou sem consentimento
              </div>
            </div>

            <div style={{ background: '#fefce8', padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 13 }}>
              <strong style={{ color: '#854d0e' }}>Boas práticas:</strong>
              <div style={{ marginTop: 8, color: '#a16207', lineHeight: 1.8 }}>
                • Usa campanhas apenas para contactos com opt-in<br/>
                • Respeita sempre a escolha do cliente<br/>
                • Mantém o registo de consentimento claro e atualizado
              </div>
            </div>

            <div style={{ background: '#ecfdf5', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
              <strong style={{ color: '#065f46' }}>Nota importante:</strong>
              <div style={{ marginTop: 8, color: '#047857', lineHeight: 1.8 }}>
                Este filtro ajuda-te a segmentar contactos de forma mais segura e profissional. É especialmente útil para campanhas de email marketing e follow-ups promocionais.
              </div>
            </div>

            <button onClick={() => setShowOptinInfoModal(false)} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, background: '#f59e0b', color: '#ffffff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 13 }}>Entendi</button>
          </div>
        </div>
      )}


      {showGmailInfoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 550, width: '90%' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: '0 0 16px 0' }}>Como funciona a ligação Gmail?</h2>
            
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 12 }}>
                A ligação Gmail permite-te enviar emails diretamente do CRM Pro usando uma conta Google. Isso pode ser um Gmail pessoal ou um email profissional ligado ao Google Workspace.
              </p>
              
              <div style={{ background: '#f3f4f6', padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 13 }}>
                <strong style={{ color: '#111827' }}>Como funciona:</strong>
                <div style={{ marginTop: 8, color: '#666', lineHeight: 1.8 }}>
                  1. Clica em "Ligar Gmail" ou "Alterar Gmail"<br/>
                  2. Autoriza a Kardme a aceder à tua conta Google<br/>
                  3. Pronto! Podes enviar emails direto do CRM<br/>
                  4. Se quiseres trocar de conta, basta voltar a configurar
                </div>
              </div>

              <div style={{ background: '#ede9fe', padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 13 }}>
                <strong style={{ color: '#5b21b6' }}>Que contas são compatíveis?</strong>
                <div style={{ marginTop: 8, color: '#6d28d9', lineHeight: 1.8 }}>
                  • <strong>Gmail pessoal</strong> — ex: joao@gmail.com<br/>
                  • <strong>Email profissional com Google Workspace</strong> — ex: joao@remax.pt<br/>
                  • <strong>Outras contas sem Google</strong> — ex: Outlook, Yahoo ou emails empresariais fora do Google não são compatíveis com esta ligação
                </div>
              </div>

              <div style={{ background: '#f0f9ff', padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 13 }}>
                <strong style={{ color: '#0369a1' }}>Links úteis:</strong>
                <div style={{ marginTop: 8, color: '#0c4a6e', lineHeight: 1.8 }}>
                  • <a href="https://workspace.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', textDecoration: 'underline', cursor: 'pointer' }}>Saber mais sobre Google Workspace</a><br/>
                  • <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', textDecoration: 'underline', cursor: 'pointer' }}>Gerir permissões da Kardme</a><br/>
                  • <a href="https://admin.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0284c7', textDecoration: 'underline', cursor: 'pointer' }}>Google Admin Console (para empresas)</a>
                </div>
              </div>

              <div style={{ background: '#ecfdf5', padding: 12, borderRadius: 10, marginBottom: 12, fontSize: 13 }}>
                <strong style={{ color: '#065f46' }}>Segurança:</strong>
                <div style={{ marginTop: 8, color: '#047857', lineHeight: 1.8 }}>
                  • A Kardme não tem acesso à tua password<br/>
                  • Usamos Google OAuth (protocolo seguro)<br/>
                  • Podes revogar a autorização quando quiseres
                </div>
              </div>

              <div style={{ background: '#fef3c7', padding: 12, borderRadius: 10, fontSize: 13 }}>
                <strong style={{ color: '#78350f' }}>Nota:</strong>
                <div style={{ marginTop: 8, color: '#92400e', lineHeight: 1.8 }}>
                  Os emails são enviados da tua conta Google, não da Kardme. O destinatário verá o teu email como remetente. Se usas um email profissional como `miguelmartins@remax.pt`, ele só funciona se estiver configurado no Google Workspace.
                </div>
              </div>
            </div>

            <button onClick={() => setShowGmailInfoModal(false)} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, background: '#f59e0b', color: '#ffffff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 13 }}>Entendi</button>
          </div>
        </div>
      )}

      {showLeadTypesModal && (
        <LeadTypesModal
          cardId={selectedCardId}
          userId={userId}
          types={leadTypes}
          onClose={() => setShowLeadTypesModal(false)}
          onUpdate={setLeadTypes}
        />
      )}

      {showLeadSourcesModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 500, width: '90%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#111827' }}>⚙️ Gerir Origens</h2>
              <button onClick={() => setShowLeadSourcesModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <NewLeadSourceForm userId={userId} onCreated={(s) => setLeadSources(prev => [...prev, s])} />
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
              {leadSources.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Nenhuma origem personalizada criada.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {leadSources.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f3f4f6', borderRadius: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{s.emoji} {s.label}</span>
                      <button
                        onClick={async () => {
                          try {
                            await deleteLeadSource(s.id)
                            setLeadSources(prev => prev.filter(x => x.id !== s.id))
                            addToast('Origem eliminada', 'success')
                          } catch (e) {
                            console.error(e)
                            addToast('Erro ao eliminar origem', 'error')
                          }
                        }}
                        style={{ background: '#ef4444', border: 'none', borderRadius: 6, padding: '4px 8px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCountriesModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 520, width: '95%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 70px rgba(0,0,0,0.35)', border: '1px solid rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#111827' }}>🌍 Gerir Países</h2>
              <button onClick={() => setShowCountriesModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#6b7280' }}>✕</button>
            </div>

            <div style={{ marginBottom: 24, display: 'flex', gap: 10 }}>
              <input
                type="text"
                value={newCountryName}
                onChange={(e) => setNewCountryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCountryName.trim()) {
                    handleCreateCountry()
                  }
                }}
                placeholder="Ex: Brasil, Espanha..."
                style={{ flex: 1, padding: '14px 16px', borderRadius: 10, border: '2px solid #d1d5db', fontSize: 16, fontFamily: 'inherit', fontWeight: 600, color: '#000', backgroundColor: '#fff' }}
              />
              <button
                onClick={handleCreateCountry}
                disabled={!newCountryName.trim()}
                style={{ background: '#22c55e', border: 'none', borderRadius: 10, padding: '14px 24px', color: '#fff', fontWeight: 900, cursor: newCountryName.trim() ? 'pointer' : 'not-allowed', fontSize: 16, opacity: newCountryName.trim() ? 1 : 0.5, whiteSpace: 'nowrap' }}
              >
                ✓ Criar
              </button>
            </div>

            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Países criados ({countries.length})</p>
              {countries.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#d1d5db', fontSize: 15, padding: '20px 0' }}>Nenhum país criado ainda.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {countries.map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#111827', opacity: 1, WebkitTextFillColor: '#111827', textShadow: 'none' }}>🌍 {c.name}</span>
                      <button
                        onClick={async () => {
                          try {
                            await deleteCountry(c.id)
                            setCountries(prev => prev.filter(x => x.id !== c.id))
                            addToast('País eliminado', 'success')
                          } catch (e: any) {
                            console.error('Erro ao eliminar país:', e?.message || e)
                            addToast(e?.message || 'Erro ao eliminar país', 'error')
                          }
                        }}
                        style={{ background: '#dc2626', border: 'none', borderRadius: 8, padding: '8px 12px', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showTiposInfoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowTiposInfoModal(false)}>
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', color: '#fff', fontSize: 17, fontWeight: 700 }}>🏷️ Gerir Tipos</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Cria e personaliza tipos de cliente (ex: Comprador, Vendedor, Investidor) com cores diferentes para organizar melhor as tuas leads.
            </p>
            <button onClick={() => setShowTiposInfoModal(false)} style={{ marginTop: 20, width: '100%', padding: '10px 0', borderRadius: 10, background: '#6366f1', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Entendido</button>
          </div>
        </div>
      )}

      {showOrigemInfoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowOrigemInfoModal(false)}>
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', color: '#fff', fontSize: 17, fontWeight: 700 }}>📍 Origem da Lead</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Filtra as leads pela origem. Origens de sistema: <strong style={{ color: '#fff' }}>Cartão</strong> (via NFC/QR), <strong style={{ color: '#fff' }}>Manual</strong> (adicionada por ti), <strong style={{ color: '#fff' }}>Importado</strong> (CSV) ou <strong style={{ color: '#fff' }}>Lead Form</strong> (formulário de lead). Podes criar origens personalizadas em <strong style={{ color: '#fff' }}>Gerir Origens</strong>.
            </p>
            <button onClick={() => setShowOrigemInfoModal(false)} style={{ marginTop: 20, width: '100%', padding: '10px 0', borderRadius: 10, background: '#6366f1', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Entendido</button>
          </div>
        </div>
      )}

    </main>
  )
}

const th = {
  textAlign: 'left' as const,
  padding: '12px 10px',
  fontWeight: 700,
  fontSize: 12,
}

const td = {
  padding: '12px 10px',
}
