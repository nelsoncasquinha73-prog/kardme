'use client'
import { useLanguage } from '@/components/language/LanguageProvider'
import { useEffect, useRef, useState } from 'react'
import { FaWhatsapp } from 'react-icons/fa'

import { supabase } from '@/lib/supabaseClient'
import { useGmailIntegration } from '@/lib/hooks/useGmailIntegration'
import { logLeadActivity } from '@/lib/crm/logLeadActivity'
import { createLeadTask, markTaskDone, fetchTasksForDay, fetchTasksForLead, type LeadTask } from '@/lib/crm/tasks'
import { fetchEmailTemplates, createEmailTemplate, DEFAULT_EMAIL_TEMPLATES, type EmailTemplate } from '@/lib/crm/emailTemplates'
import { filesToAttachments, type AttachmentPayload } from '@/lib/crm/attachmentHelpers'

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
}

const STEPS = ['Novo', 'Contactado', 'Qualificado', 'Fechado', 'Perdido']

export default function CrmProPage() {
  const { t } = useLanguage()
  const [userId, setUserId] = useState('')
  const gmail = useGmailIntegration(userId)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
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
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [tasksToday, setTasksToday] = useState<LeadTask[]>([])
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



  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'zone'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const [showImportModal, setShowImportModal] = useState(false)
  const [importCSVText, setImportCSVText] = useState('')
  const [importPreview, setImportPreview] = useState<string[][]>([])
  const [importing, setImporting] = useState(false)

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
        id,
        name,
        email,
        phone,
        zone,
        message,
        marketing_opt_in,
        consent_given,
        step,
        notes,
        created_at,
        contacted,
        card_id,
        cards!inner (
          user_id,
          name,
          slug
        )
      `)
      .eq('cards.user_id', user.id)

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
  }

  useEffect(() => {
    loadLeads()
  }, [filterMarketing, filterStep, selectedCardId, sortBy, sortOrder])


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
  
  const handleImportPreview = () => {
    const text = importCSVText.trim()
    if (!text) {
      setImportPreview([])
      return
    }
    const lines = text.split('\n').slice(0, 11) // header + 10 linhas
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
      setImportFileName('')
      await loadLeads()
    } catch (e: any) {
      alert('Erro ao importar: ' + (e?.message || String(e)))
    } finally {
      setImporting(false)
    }
  }


  return () => document.removeEventListener('mousedown', handleClickOutsideCardDropdown)
  }, [showCardDropdown])


  useEffect(() => {
    if (!userId) return
    gmail.checkConnection()
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
    })
    if (!error) {
      await logLeadActivity({ leadId: selectedLeadForTask.id, userId, type: 'task_created', title: `Tarefa agendada: ${taskTitle}`, meta: { dueAt: dueAtISO } })
      setShowTaskModal(false)
      setTaskTitle('')
      setTaskDesc('')
      setTaskDueDate('')
      setTaskDueTime('09:00')
      await loadTasksForToday()
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

  const filteredLeads = leads.filter(l =>
    searchTerm === '' ||
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.zone && l.zone.toLowerCase().includes(searchTerm.toLowerCase()))
  )


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
      setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)))
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

    for (const leadId of Array.from(selectedLeadIds)) {
      const lead = leads.find(l => l.id === leadId)
      if (!lead) continue

      const personalizedSubject = bulkSubject.replace('{nome}', lead.name)
      const personalizedBody = bulkBody.replace('{nome}', lead.name).replace('{email}', lead.email)

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
      const personalizedBody = bulkBody.replace('{nome}', lead.name)

      try {
        await createLeadTask({
          leadId: lead.id,
          userId,
          title: personalizedSubject,
          description: personalizedBody,
          dueAtISO,
          actionType: 'email',
        })
        created++
        await logLeadActivity({ leadId: lead.id, userId, type: 'task_created', title: `Tarefa de email agendada: ${personalizedSubject}` })
      } catch (err) {
        console.error('Erro ao criar tarefa para', lead.email, err)
      }
    }

    alert(`Tarefas criadas: ${created}`)
    setShowBulkEmailModal(false)
    setBulkSubject('')
    setBulkBody('')
    setSelectedLeadIds(new Set())
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
    } else if (actionType === 'message' || actionType === 'follow_up') {
      setSelectedLead(lead || null)
      setNoteText(lead?.notes || '')
    } else if (actionType === 'meeting') {
      setSelectedLeadForTask(lead || null)
      setShowTaskModal(true)
    }
  }

  return (
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
            <span style={{ marginLeft: 10, fontSize: 12, opacity: 0.7 }}>▼</span>
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
          ⚙️ Mensagem
        </button>
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
                        {t.action_type === 'message' && '📝 Mensagem'}
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
          <button onClick={() => gmail.connectGmail()} style={{ padding: '10px 16px', borderRadius: 10, background: '#78350f', color: '#ffffff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>Ligar Gmail</button>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Pesquisar por nome, email ou zona…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.12)',
            fontSize: 13,
            flex: 1,
            minWidth: 200,
          }}
        />

        <select
          value={filterStep || ''}
          onChange={(e) => setFilterStep(e.target.value || null)}
          style={{
            padding: '0 12px',
            height: 44,
            lineHeight: '44px',
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.12)',
            fontSize: 13,
            background: '#fff',
            color: '#111827',
            fontWeight: 700,
            minWidth: 240,
            cursor: 'pointer',
          }}
        >
          <option value="">Todos (Step)</option>
          {STEPS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={filterMarketing === null ? '' : filterMarketing ? 'true' : 'false'}
          onChange={(e) => {
            if (e.target.value === '') setFilterMarketing(null)
            else setFilterMarketing(e.target.value === 'true')
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
            fontWeight: 700,
            minWidth: 240,
            cursor: 'pointer',
          }}
        >
          <option value="">Todos (Marketing)</option>
          <option value="true">Opt-in Marketing</option>
          <option value="false">Sem opt-in</option>
        </select>
      </div>

      {filteredLeads.length === 0 && (
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
            minWidth: 240,
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
            padding: '10px 16px',
            borderRadius: 10,
            background: selectedCardId === 'all' ? '#e5e7eb' : '#111827',
            color: selectedCardId === 'all' ? '#6b7280' : '#ffffff',
            border: 'none',
            fontWeight: 900,
            cursor: selectedCardId === 'all' ? 'not-allowed' : 'pointer',
            fontSize: 13,
          }}
          title={selectedCardId === 'all' ? 'Seleciona um cartão para exportar' : 'Exportar CSV'}
        >
          ⬇️ Exportar CSV
        </button>

        <button
          onClick={() => setShowImportModal(true)}
          disabled={selectedCardId === 'all'}
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            background: selectedCardId === 'all' ? '#e5e7eb' : '#10b981',
            color: selectedCardId === 'all' ? '#6b7280' : '#ffffff',
            border: 'none',
            fontWeight: 900,
            cursor: selectedCardId === 'all' ? 'not-allowed' : 'pointer',
            fontSize: 13,
          }}
          title={selectedCardId === 'all' ? 'Seleciona um cartão para importar' : 'Importar CSV'}
        >
          ⬆️ Importar CSV
        </button>

        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Dedupe: <strong>(cartão + email)</strong>
        </div>
      </div>

            {selectedLeadIds.size > 0 && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
          <button onClick={() => setShowBulkEmailModal(true)} style={{ padding: '10px 16px', borderRadius: 10, background: '#8b5cf6', color: '#ffffff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>📣 Email em massa ({selectedLeadIds.size})</button>
          <button onClick={() => setSelectedLeadIds(new Set())} style={{ padding: '10px 16px', borderRadius: 10, background: '#e5e7eb', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 13, color: '#111827' }}>Limpar seleção</button>
        </div>
      )}

      {filteredLeads.length > 0 && (
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
                <th style={th}>✓</th>
                <th style={{ ...th, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>Sel.</div>
                  <input
                    type="checkbox"
                    checked={selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0}
                    onChange={toggleAllLeads}
                    title="Selecionar todas"
                  />
                </th>
                <th style={th}>Nome</th>
                <th style={th}>Email</th>
                <th style={th}>Cartão</th>
                <th style={th}>Zona</th>
                <th style={th}>Step</th>
                <th style={th}>Marketing</th>
                <th style={th}>Data</th>
                <th style={th}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => {
                const colors = stepColor(lead.step)
                return (
                  <tr key={lead.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <td style={td}>
                      <input
                        type="checkbox"
                        checked={lead.contacted}
                        onChange={() => toggleContacted(lead.id, lead.contacted)}
                      />
                    </td>
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
                            setSelectedLeadForEmail(lead)
                            setShowEmailModal(true)
                            setSelectedTemplate(null)
                            setSelectedAttachments([])
                          }}
                          disabled={!gmail.isConnected}
                          title={gmail.isConnected ? 'Enviar email agora' : 'Liga o Gmail para enviar emails'}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: 'none',
                            background: gmail.isConnected ? '#10b981' : '#d1d5db',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: 12,
                            cursor: gmail.isConnected ? 'pointer' : 'not-allowed',
                          }}
                        >
                          📧
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
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#25d366',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: 12,
                            cursor: 'pointer',
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
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#f3f4f6',
                            color: '#111827',
                            fontWeight: 800,
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLead(lead)
                            setNoteText(lead.notes || '')
                          }}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'var(--color-primary)',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Notas
                      </button>
                        <button
                          onClick={() => deleteLead(lead.id)}
                          disabled={deletingId === lead.id}
                          title="Apagar lead"
                          style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >
                          🗑️
                        </button>
                        <button
                          onClick={() => { setSelectedLeadForTask(lead); setShowTaskModal(true) }}
                          title="Agendar tarefa"
                          style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#dbeafe', color: '#0c4a6e', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        >
                          📅
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

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
            <h2 style={{ marginBottom: 16 }}>{selectedLead.name}</h2>
            <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 16 }}>
              {selectedLead.email} • {selectedLead.zone || 'Sem zona'}
            </p>

            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13 }}>
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

            <label style={{ display: 'block', marginBottom: 8, fontWeight: 900, fontSize: 13, color: '#111827' }}>Mensagem</label>
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

            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 900, fontSize: 13, color: '#111827' }}>Template</label>
                <select
                  value={selectedTemplate?.id || ''}
                  onChange={(e) => {
                    const t = emailTemplates.find(x => x.id === e.target.value) || null
                    if (t) applyTemplateToEmail(t, selectedLeadForEmail)
                  }}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.18)', fontSize: 13, boxSizing: 'border-box', background: '#fff', color: '#111827' }}
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
                  style={{ padding: '10px 12px', borderRadius: 10, background: '#8b5cf6', color: '#ffffff', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}
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
              <button onClick={async () => { if (!emailSubject || !emailBody) { alert('Preenche assunto e mensagem'); return }; setEmailLoading(true); try { await gmail.sendEmail(selectedLeadForEmail.id, selectedLeadForEmail.email, emailSubject, emailBody, selectedTemplate?.id, selectedAttachments); alert('Email enviado com sucesso!'); setShowEmailModal(false); setEmailSubject(''); setEmailBody(''); setSelectedLeadForEmail(null); setSelectedTemplate(null); setSelectedAttachments([]) } catch (err: any) { alert('Erro: ' + err.message) } finally { setEmailLoading(false) } }} disabled={emailLoading} style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: 'var(--color-primary)', color: '#ffffff', border: 'none', fontWeight: 800, cursor: emailLoading ? 'not-allowed' : 'pointer', fontSize: 13, opacity: emailLoading ? 0.6 : 1 }}>{emailLoading ? 'A enviar…' : 'Enviar Email'}</button>
              <button onClick={() => { setShowEmailModal(false); setEmailSubject(''); setEmailBody(''); setSelectedLeadForEmail(null) }} style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: '#f3f4f6', border: '1px solid rgba(0,0,0,0.08)', fontWeight: 800, cursor: 'pointer', fontSize: 13, color: '#111827' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {showTaskModal && selectedLeadForTask && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1002 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 500, width: '90%' }}>
            <h2 style={{ marginBottom: 16 }}>Agendar Tarefa</h2>
            <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 20 }}>Para: <strong>{selectedLeadForTask.name}</strong></p>
            
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13 }}>Título da Tarefa</label>
            <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Ex: Contactar, Follow-up, Enviar proposta..." style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, marginBottom: 16, boxSizing: 'border-box' }} />
            
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13 }}>Descrição (opcional)</label>
            <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="Notas sobre a tarefa..." style={{ width: '100%', minHeight: 80, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, fontFamily: 'inherit', marginBottom: 16, boxSizing: 'border-box' }} />
            
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13 }}>Data</label>
                <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13 }}>Hora</label>
                <input type="time" value={taskDueTime} onChange={(e) => setTaskDueTime(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, boxSizing: 'border-box' }} />
                <select value={taskActionType} onChange={(e) => setTaskActionType(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, boxSizing: 'border-box' }}>
                  <option value="follow_up">✅ Follow-up</option>
                  <option value="email">📧 Email</option>
                  <option value="whatsapp">💬 WhatsApp</option>
                  <option value="call">📞 Ligar</option>
                  <option value="sms">✉️ SMS</option>
                  <option value="message">📝 Mensagem</option>
                  <option value="meeting">📅 Reunião</option>
                </select>
              </div>
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
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.18)', fontSize: 13, boxSizing: 'border-box', background: '#fff', color: '#111827' }}
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
              <strong>Preview (primeiras 2):</strong>
              <div style={{ marginTop: 8, fontSize: 11, opacity: 0.8 }}>
                {filteredLeads.slice(0, 2).map(l => (
                  <div key={l.id} style={{ marginBottom: 8, padding: 8, background: '#fff', borderRadius: 6 }}>
                    <div><strong>{bulkSubject.replace('{nome}', l.name)}</strong></div>
                    <div style={{ whiteSpace: 'pre-wrap', marginTop: 4, fontSize: 11 }}>{bulkBody.replace('{nome}', l.name).replace('{email}', l.email).slice(0, 80)}...</div>
                  </div>
                ))}
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
              <button onClick={() => { setShowBulkEmailModal(false); setBulkSubject(''); setBulkBody(''); setBulkScheduleDate(''); setBulkScheduleTime('09:00') }} style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: '#f3f4f6', border: '1px solid rgba(0,0,0,0.08)', fontWeight: 800, cursor: 'pointer', fontSize: 13, color: '#111827' }}>Cancelar</button>
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
                              {t.action_type === 'message' && '📝 Mensagem'}
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
