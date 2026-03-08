'use client'
import { useLanguage } from '@/components/language/LanguageProvider'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

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
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filterMarketing, setFilterMarketing] = useState<boolean | null>(null)
  const [filterStep, setFilterStep] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [noteText, setNoteText] = useState('')

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

  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ marginBottom: 24 }}>CRM Pro</h1>

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
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.12)',
            fontSize: 13,
            background: '#fff',
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
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.12)',
            fontSize: 13,
            background: '#fff',
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filteredLeads.map(lead => {
            const colors = stepColor(lead.step)
            return (
              <div
                key={lead.id}
                style={{
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 14,
                  padding: 16,
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>{lead.name}</h3>
                    {lead.phone && <p style={{ margin: '4px 0 0 0', fontSize: 12, opacity: 0.6 }}>{lead.phone}</p>}
                  </div>
                  <input
                    type="checkbox"
                    checked={lead.contacted}
                    onChange={() => toggleContacted(lead.id, lead.contacted)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>

                <p style={{ margin: '0 0 12px 0', fontSize: 12, opacity: 0.7 }}>{lead.email}</p>

                {lead.zone && (
                  <div style={{ display: 'inline-block', padding: '4px 8px', background: 'rgba(0,0,0,0.04)', borderRadius: 6, fontSize: 11, marginBottom: 12 }}>
                    📍 {lead.zone}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
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

                  <span style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    background: lead.marketing_opt_in ? '#d1fae5' : '#fee2e2',
                    color: lead.marketing_opt_in ? '#065f46' : '#7f1d1d',
                  }}>
                    {lead.marketing_opt_in ? '📧 Sim' : '📧 Não'}
                  </span>
                </div>

                <p style={{ margin: '0 0 12px 0', fontSize: 11, opacity: 0.5 }}>
                  {new Date(lead.created_at).toLocaleDateString()}
                </p>

                <button
                  onClick={() => {
                    setSelectedLead(lead)
                    setNoteText(lead.notes || '')
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Notas
                </button>
              </div>
            )
          })}
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
    </main>
  )
}
