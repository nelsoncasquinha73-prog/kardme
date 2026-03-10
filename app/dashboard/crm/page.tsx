'use client'
import { useLanguage } from '@/components/language/LanguageProvider'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useGmailIntegration } from '@/lib/hooks/useGmailIntegration'
import { logLeadActivity } from '@/lib/crm/logLeadActivity'
import { createLeadTask, markTaskDone, fetchTasksForDay, type LeadTask } from '@/lib/crm/tasks'

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
  const [leadActivities, setLeadActivities] = useState<any[]>([])

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
          user_id
        )
      `)
      .eq('cards.user_id', user.id)

    if (filterMarketing !== null) {
      query = query.eq('marketing_opt_in', filterMarketing)
    }

    if (filterStep !== null) {
      query = query.eq('step', filterStep)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

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
  }, [filterMarketing, filterStep])

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

  useEffect(() => {
    if (!userId) return
    loadTasksForToday()
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


  const normalizePhone = (phone: string | null | undefined) => {
    if (!phone) return null
    if (phone.startsWith('+')) return phone
    return null
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
      window.open('https://wa.me/' + phone.replace(/\D/g, ''), '_blank')
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
      <h1 style={{ marginBottom: 24 }}>CRM Pro</h1>

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
                    <button onClick={() => handleTaskAction(t, lead)} style={{ padding: '6px 12px', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 900, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>Fazer</button>
                    <button onClick={async () => { await markTaskDone({ taskId: t.id }); await logLeadActivity({ leadId: t.lead_id, userId, type: 'task_done', title: `Tarefa concluída: ${t.title}` }); await loadTasksForToday() }} style={{ padding: '6px 12px', borderRadius: 8, background: '#10b981', color: '#fff', border: 'none', fontWeight: 900, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>✓ Feita</button>
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
          <button onClick={() => gmail.connectGmail()} style={{ padding: '10px 16px', borderRadius: 10, background: '#78350f', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>Ligar Gmail</button>
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
                <th style={th}>Nome</th>
                <th style={th}>Email</th>
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
                    <td style={td}>
                      <strong>{lead.name}</strong>
                      {lead.phone && <div style={{ fontSize: 11, opacity: 0.6 }}>{lead.phone}</div>}
                    </td>
                    <td style={td}>{lead.email}</td>
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
                          }}
                          disabled={!gmail.isConnected}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: 'none',
                            background: gmail.isConnected ? '#10b981' : '#d1d5db',
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: 12,
                            cursor: gmail.isConnected ? 'pointer' : 'not-allowed',
                          }}
                          title={gmail.isConnected ? 'Enviar email' : 'Liga Gmail primeiro'}
                        >
                          ✉️
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
                          color: '#fff',
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
                  color: '#fff',
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

      {showEmailModal && selectedLeadForEmail && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 650, width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: 8 }}>Enviar Email</h2>
            <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 20 }}>Para: <strong>{selectedLeadForEmail.email}</strong></p>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13 }}>Assunto</label>
            <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Ex: Follow-up - Proposta" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, marginBottom: 16, boxSizing: 'border-box' }} />
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13 }}>Mensagem</label>
            <textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Escreve a tua mensagem aqui…" style={{ width: '100%', minHeight: 200, padding: '12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, fontFamily: 'inherit', marginBottom: 16, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={async () => { if (!emailSubject || !emailBody) { alert('Preenche assunto e mensagem'); return }; setEmailLoading(true); try { await gmail.sendEmail(selectedLeadForEmail.id, selectedLeadForEmail.email, emailSubject, emailBody); alert('Email enviado com sucesso!'); setShowEmailModal(false); setEmailSubject(''); setEmailBody(''); setSelectedLeadForEmail(null) } catch (err: any) { alert('Erro: ' + err.message) } finally { setEmailLoading(false) } }} disabled={emailLoading} style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 800, cursor: emailLoading ? 'not-allowed' : 'pointer', fontSize: 13, opacity: emailLoading ? 0.6 : 1 }}>{emailLoading ? 'A enviar…' : 'Enviar Email'}</button>
              <button onClick={() => { setShowEmailModal(false); setEmailSubject(''); setEmailBody(''); setSelectedLeadForEmail(null) }} style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: '#f3f4f6', border: '1px solid rgba(0,0,0,0.08)', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
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
              <button onClick={createTaskForLead} style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>Agendar Tarefa</button>
              <button onClick={() => { setShowTaskModal(false); setTaskTitle(''); setTaskDesc(''); setTaskDueDate(''); setTaskDueTime('09:00') }} style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: '#f3f4f6', border: '1px solid rgba(0,0,0,0.08)', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
            </div>
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
