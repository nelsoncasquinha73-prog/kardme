'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import {
  getScheduledTasks,
  getTasksStats,
  cancelScheduledTask,
  rescheduleTask,
  duplicateTask,
  type ScheduledTask,
} from '@/lib/crm/scheduledTasks'

type Tab = 'pending' | 'sent' | 'failed'

export function ScheduledTasksView() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<ScheduledTask[]>([])
  const [stats, setStats] = useState({ pending: 0, sent: 0, failed: 0 })
  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('09:00')

  useEffect(() => {
    if (!user?.id) return
    loadTasks()
    loadStats()
  }, [user?.id, activeTab])

  async function loadTasks() {
    if (!user?.id) return
    setLoading(true)
    try {
      const data = await getScheduledTasks(user.id, {
        send_status: activeTab === 'pending' ? 'pending' : activeTab === 'sent' ? 'sent' : 'failed',
      })
      setTasks(data || [])
    } catch (err) {
      console.error('Erro ao carregar tarefas:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    if (!user?.id) return
    try {
      const data = await getTasksStats(user.id)
      setStats(data)
    } catch (err) {
      console.error('Erro ao carregar stats:', err)
    }
  }

  async function handleRefresh() {
    await loadTasks()
    await loadStats()
  }

  async function handleCancel(taskId: string) {
    if (!user?.id) return
    if (!confirm('Tem a certeza que quer cancelar esta tarefa?')) return

    try {
      await cancelScheduledTask(taskId, user.id)
      await loadTasks()
      setShowViewModal(false)
      alert('✓ Tarefa cancelada com sucesso')
    } catch (err) {
      console.error('Erro ao cancelar:', err)
      alert('Erro ao cancelar tarefa')
    }
  }

  async function handleReschedule() {
    if (!user?.id || !selectedTask) return
    if (!rescheduleDate) {
      alert('Seleciona uma data')
      return
    }

    try {
      const newDueAt = new Date(`${rescheduleDate}T${rescheduleTime}:00`).toISOString()
      await rescheduleTask(selectedTask.id, user.id, newDueAt)
      await loadTasks()
      setShowRescheduleModal(false)
      setShowViewModal(false)
      alert('✓ Tarefa reagendada com sucesso')
    } catch (err) {
      console.error('Erro ao reagendar:', err)
      alert('Erro ao reagendar tarefa')
    }
  }

  async function handleDuplicate() {
    if (!user?.id || !selectedTask) return
    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const newDueAt = tomorrow.toISOString()

      await duplicateTask(selectedTask.id, user.id, newDueAt)
      await loadTasks()
      setShowViewModal(false)
      alert('✓ Tarefa duplicada para amanhã')
    } catch (err) {
      console.error('Erro ao duplicar:', err)
      alert('Erro ao duplicar tarefa')
    }
  }

  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email_recipient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lead?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      pending: { bg: '#fef3c7', text: '#92400e', icon: '⏱️' },
      sent: { bg: '#dcfce7', text: '#166534', icon: '✓' },
      failed: { bg: '#fee2e2', text: '#991b1b', icon: '⚠️' },
    }
    const style = colors[status] || colors.pending

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 8px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 700,
          backgroundColor: style.bg,
          color: style.text,
        }}
      >
        {style.icon} {status === 'pending' ? 'Pendente' : status === 'sent' ? 'Enviado' : 'Falhado'}
      </span>
    )
  }

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: 16 }}>
      {/* Header com título e refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#111827' }}>Tarefas Agendadas</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#6b7280' }}>Gerir emails agendados para envio automático</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            background: '#fff',
            color: '#6b7280',
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
          title="Atualizar lista"
        >
          {loading ? '⏳' : '🔄'} Atualizar
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <div style={{ padding: 16, background: '#fef3c7', borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: '#92400e', fontWeight: 700 }}>Pendentes</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#92400e', marginTop: 8 }}>
            {stats.pending}
          </div>
        </div>
        <div style={{ padding: 16, background: '#dcfce7', borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: '#166534', fontWeight: 700 }}>Enviados</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#166534', marginTop: 8 }}>
            {stats.sent}
          </div>
        </div>
        <div style={{ padding: 16, background: '#fee2e2', borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: '#991b1b', fontWeight: 700 }}>Falhados</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#991b1b', marginTop: 8 }}>
            {stats.failed}
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, opacity: 0.4 }}>🔍</span>
          <input
            type="text"
            placeholder="Pesquisar por assunto, email ou lead..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              fontSize: 13,
              boxSizing: 'border-box',
              background: '#f9fafb',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
        {(['pending', 'sent', 'failed'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 900 : 500,
              color: activeTab === tab ? '#111827' : '#6b7280',
              borderBottom: activeTab === tab ? '3px solid #3b82f6' : 'none',
              fontSize: 14,
            }}
          >
            {tab === 'pending'
              ? `A Enviar (${stats.pending})`
              : tab === 'sent'
                ? `Enviados (${stats.sent})`
                : `Falhados (${stats.failed})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Carregando tarefas...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Nenhuma tarefa encontrada
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: 700, fontSize: 13, color: '#6b7280' }}>
                  Assunto
                </th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: 700, fontSize: 13, color: '#6b7280' }}>
                  Lead
                </th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: 700, fontSize: 13, color: '#6b7280' }}>
                  Email
                </th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: 700, fontSize: 13, color: '#6b7280' }}>
                  Agendado para
                </th>
                <th style={{ textAlign: 'left', padding: '12px', fontWeight: 700, fontSize: 13, color: '#6b7280' }}>
                  Estado
                </th>
                <th style={{ textAlign: 'center', padding: '12px', fontWeight: 700, fontSize: 13, color: '#6b7280' }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', fontSize: 13, color: '#111827' }}>
                    <div style={{ fontWeight: 600 }}>{task.title}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                      {task.email_template_id ? '📋 Template' : '✏️ Personalizado'}
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: 13, color: '#111827' }}>
                    {task.lead?.name || '—'}
                  </td>
                  <td style={{ padding: '12px', fontSize: 13, color: '#111827' }}>
                    {task.email_recipient || '—'}
                  </td>
                  <td style={{ padding: '12px', fontSize: 13, color: '#111827' }}>
                    {new Date(task.due_at).toLocaleDateString('pt-PT')} às{' '}
                    {new Date(task.due_at).toLocaleTimeString('pt-PT', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td style={{ padding: '12px' }}>{getStatusBadge(task.send_status)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        setSelectedTask(task)
                        setShowViewModal(true)
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid #e5e7eb',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#3b82f6',
                      }}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showViewModal && selectedTask && (
        <div
          style={{
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
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              maxWidth: 600,
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <h2 style={{ marginBottom: 16, fontSize: 18, fontWeight: 900, color: '#111827' }}>
              📧 Detalhes da Tarefa
            </h2>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>
                Assunto
              </div>
              <div style={{ fontSize: 14, color: '#111827', fontWeight: 600 }}>
                {selectedTask.title}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>
                Lead
              </div>
              <div style={{ fontSize: 14, color: '#111827' }}>
                {selectedTask.lead?.name} ({selectedTask.email_recipient})
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>
                Agendado para
              </div>
              <div style={{ fontSize: 14, color: '#111827' }}>
                {new Date(selectedTask.due_at).toLocaleDateString('pt-PT')} às{' '}
                {new Date(selectedTask.due_at).toLocaleTimeString('pt-PT', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>
                Estado
              </div>
              {getStatusBadge(selectedTask.send_status)}
            </div>

            {selectedTask.send_error && (
              <div style={{ marginBottom: 16, padding: 12, background: '#fee2e2', borderRadius: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>
                  ⚠️ Erro
                </div>
                <div style={{ fontSize: 13, color: '#991b1b' }}>
                  {selectedTask.send_error}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 4 }}>
                Corpo do Email
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: '#111827',
                  padding: 12,
                  background: '#f9fafb',
                  borderRadius: 8,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {selectedTask.email_body}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              {selectedTask.send_status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      setShowRescheduleModal(true)
                      setRescheduleDate(selectedTask.due_at.split('T')[0])
                      setRescheduleTime(selectedTask.due_at.split('T')[1].substring(0, 5))
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: 10,
                      border: '1px solid #e5e7eb',
                      background: '#fff',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 13,
                      color: '#3b82f6',
                    }}
                  >
                    📅 Reagendar
                  </button>
                  <button
                    onClick={() => handleCancel(selectedTask.id)}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: 10,
                      border: '1px solid #fee2e2',
                      background: '#fee2e2',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: 13,
                      color: '#991b1b',
                    }}
                  >
                    ✕ Cancelar
                  </button>
                </>
              )}
              {selectedTask.send_status === 'sent' && (
                <button
                  onClick={() => handleDuplicate()}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#3b82f6',
                  }}
                >
                  📋 Duplicar
                </button>
              )}
              <button
                onClick={() => setShowViewModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: '#f3f4f6',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 13,
                  color: '#111827',
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {showRescheduleModal && selectedTask && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              maxWidth: 400,
              width: '90%',
            }}
          >
            <h2 style={{ marginBottom: 20, fontSize: 16, fontWeight: 900, color: '#111827' }}>
              📅 Reagendar Tarefa
            </h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13, color: '#111827' }}>
                Data
              </label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #e5e7eb',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, fontSize: 13, color: '#111827' }}>
                Hora
              </label>
              <input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #e5e7eb',
                  fontSize: 13,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleReschedule}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                Guardar
              </button>
              <button
                onClick={() => setShowRescheduleModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: '#f3f4f6',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 13,
                  color: '#111827',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
