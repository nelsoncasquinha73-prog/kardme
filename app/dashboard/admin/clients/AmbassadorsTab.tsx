'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { FiLoader, FiCheck, FiX } from 'react-icons/fi'

interface Ambassador {
  id: string
  slug: string
  subscription_status: string
  is_active: boolean
  activated_at: string | null
  current_period_end: string | null
  activated_by: string
  admin_grant_reason: string | null
}

interface AmbassadorsTabProps {
  userId: string
}

export default function AmbassadorsTab({ userId }: AmbassadorsTabProps) {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([])
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState<string | null>(null)

  useEffect(() => {
    loadAmbassadors()
  }, [userId])

  const loadAmbassadors = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ambassadors')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAmbassadors(data || [])
    } catch (err) {
      console.error('Error loading ambassadors:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async (ambassadorId: string, months: number) => {
    setActivating(ambassadorId)
    try {
      const res = await fetch('/api/admin/ambassadors/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ambassadorId,
          durationMonths: months,
          reason: `Admin grant - ${months} month(s)`,
        }),
      })

      if (!res.ok) throw new Error('Failed to activate')
      const updated = await res.json()
      setAmbassadors((prev) => prev.map((a) => (a.id === ambassadorId ? updated : a)))
    } catch (err) {
      console.error('Error activating ambassador:', err)
      alert('Erro ao ativar embaixador')
    } finally {
      setActivating(null)
    }
  }

  const handleDeactivate = async (ambassadorId: string) => {
    if (!confirm('Tem a certeza que quer desativar este embaixador?')) return

    setActivating(ambassadorId)
    try {
      const res = await fetch('/api/admin/ambassadors/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ambassadorId }),
      })

      if (!res.ok) throw new Error('Failed to deactivate')
      const updated = await res.json()
      setAmbassadors((prev) => prev.map((a) => (a.id === ambassadorId ? updated : a)))
    } catch (err) {
      console.error('Error deactivating ambassador:', err)
      alert('Erro ao desativar embaixador')
    } finally {
      setActivating(null)
    }
  }

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>Carregando...</div>
  }

  if (ambassadors.length === 0) {
    return <div style={{ padding: 24, color: '#94a3b8' }}>Nenhum embaixador criado</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {ambassadors.map((amb) => {
        const isActive = amb.subscription_status === 'active' && amb.is_active
        const expiresAt = amb.current_period_end ? new Date(amb.current_period_end) : null
        const isExpired = expiresAt && expiresAt < new Date()

        return (
          <div
            key={amb.id}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '0 0 4px 0' }}>
                  {amb.slug}
                </p>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                  {isActive ? (
                    <>
                      <FiCheck size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Ativo
                      {expiresAt && !isExpired && ` até ${expiresAt.toLocaleDateString('pt-PT')}`}
                      {isExpired && ' (expirado)'}
                    </>
                  ) : (
                    <>
                      <FiX size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Inativo
                    </>
                  )}
                </p>
                {amb.admin_grant_reason && (
                  <p style={{ fontSize: 11, color: '#cbd5e1', margin: '4px 0 0 0' }}>
                    Motivo: {amb.admin_grant_reason}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {!isActive || isExpired ? (
                  <>
                    <button
                      onClick={() => handleActivate(amb.id, 1)}
                      disabled={activating === amb.id}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        cursor: activating === amb.id ? 'not-allowed' : 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                        opacity: activating === amb.id ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {activating === amb.id ? <FiLoader size={12} /> : '+1m'}
                    </button>
                    <button
                      onClick={() => handleActivate(amb.id, 6)}
                      disabled={activating === amb.id}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        cursor: activating === amb.id ? 'not-allowed' : 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                        opacity: activating === amb.id ? 0.6 : 1,
                      }}
                    >
                      +6m
                    </button>
                    <button
                      onClick={() => handleActivate(amb.id, 12)}
                      disabled={activating === amb.id}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        cursor: activating === amb.id ? 'not-allowed' : 'pointer',
                        fontSize: 11,
                        fontWeight: 600,
                        opacity: activating === amb.id ? 0.6 : 1,
                      }}
                    >
                      +12m
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleDeactivate(amb.id)}
                    disabled={activating === amb.id}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      cursor: activating === amb.id ? 'not-allowed' : 'pointer',
                      fontSize: 11,
                      fontWeight: 600,
                      opacity: activating === amb.id ? 0.6 : 1,
                    }}
                  >
                    Desativar
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
