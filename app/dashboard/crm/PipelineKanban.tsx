'use client'

import { CSS } from '@dnd-kit/utilities'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useMemo, useState, useRef, useEffect } from 'react'
import { FiEye, FiMail } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'

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
  audience_ids: string[]
}

type LeadType = {
  id: string
  name: string
  color?: string | null
}

type PipelineKanbanProps = {
  leads: Lead[]
  leadTypes: LeadType[]
  filterLeadType: string | null
  setFilterLeadType: (value: string | null) => void
  updateStep: (id: string, newStep: string) => Promise<void>
  onViewLead?: (lead: Lead) => void
  onEmailLead?: (lead: Lead) => void
  onWhatsAppLead?: (lead: Lead) => void
}

const STEPS = ['Novo', 'Contactado', 'Qualificado', 'Fechado', 'Perdido']

function stepColor(step: string) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    Novo: { bg: 'rgba(59,130,246,0.12)', text: '#93c5fd', border: 'rgba(59,130,246,0.35)' },
    Contactado: { bg: 'rgba(245,158,11,0.12)', text: '#fcd34d', border: 'rgba(245,158,11,0.35)' },
    Qualificado: { bg: 'rgba(139,92,246,0.12)', text: '#c4b5fd', border: 'rgba(139,92,246,0.35)' },
    Fechado: { bg: 'rgba(16,185,129,0.12)', text: '#86efac', border: 'rgba(16,185,129,0.35)' },
    Perdido: { bg: 'rgba(239,68,68,0.12)', text: '#fca5a5', border: 'rgba(239,68,68,0.35)' },
  }

  return colors[step] || {
    bg: 'rgba(255,255,255,0.08)',
    text: '#ffffff',
    border: 'rgba(255,255,255,0.12)',
  }
}

function KanbanColumn({
  step,
  leads,
  leadTypes,
  onViewLead,
  onEmailLead,
  onWhatsAppLead,
}: {
  step: string
  leads: Lead[]
  leadTypes: LeadType[]
  onViewLead?: (lead: Lead) => void
  onEmailLead?: (lead: Lead) => void
  onWhatsAppLead?: (lead: Lead) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: step })
  const colors = stepColor(step)

  return (
    <div
      ref={setNodeRef}
      style={{
        minWidth: 280,
        width: 280,
        background: isOver ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${colors.border}`,
        borderRadius: 18,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 500,
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 999,
            background: colors.bg,
            color: colors.text,
            fontWeight: 800,
            fontSize: 13,
            border: `1px solid ${colors.border}`,
          }}
        >
          <span>{step}</span>
        </div>

        <div
          style={{
            minWidth: 28,
            height: 28,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 800,
            padding: '0 10px',
          }}
        >
          {leads.length}
        </div>
      </div>

      <SortableContext items={leads.map((lead) => lead.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {leads.map((lead) => (
            <SortableLeadCard key={lead.id} lead={lead} leadTypes={leadTypes} onViewLead={onViewLead} onEmailLead={onEmailLead} onWhatsAppLead={onWhatsAppLead} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

function SortableLeadCard({
  lead,
  leadTypes,
  onViewLead,
  onEmailLead,
  onWhatsAppLead,
}: {
  lead: Lead
  leadTypes: LeadType[]
  onViewLead?: (lead: Lead) => void
  onEmailLead?: (lead: Lead) => void
  onWhatsAppLead?: (lead: Lead) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} leadTypes={leadTypes} dragging={isDragging} onViewLead={onViewLead} onEmailLead={onEmailLead} onWhatsAppLead={onWhatsAppLead} />
    </div>
  )
}

function LeadCard({
  lead,
  leadTypes,
  dragging = false,
  onViewLead,
  onEmailLead,
  onWhatsAppLead,
}: {
  lead: Lead
  leadTypes: LeadType[]
  dragging?: boolean
  onViewLead?: (lead: Lead) => void
  onEmailLead?: (lead: Lead) => void
  onWhatsAppLead?: (lead: Lead) => void
}) {
  const leadType = leadTypes.find((t) => t.id === lead.lead_type_id)

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(30,41,59,0.98) 0%, rgba(15,23,42,0.96) 100%)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 14,
        padding: 14,
        boxShadow: dragging ? '0 25px 50px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.2)',
        cursor: 'grab',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: 16, lineHeight: 1.2 }}>
          {lead.name || 'Sem nome'}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 1.3 }}>
          {lead.email || 'Sem email'}
        </div>
        {lead.phone && (
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>
            {lead.phone}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {lead.zone && (
          <span style={{ padding: '5px 9px', borderRadius: 6, background: 'rgba(59,130,246,0.15)', color: '#93c5fd', fontSize: 10, fontWeight: 700, border: '1px solid rgba(59,130,246,0.25)' }}>
            {lead.zone}
          </span>
        )}

        {lead.country && (
          <span style={{ padding: '5px 9px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', color: '#86efac', fontSize: 10, fontWeight: 700, border: '1px solid rgba(16,185,129,0.25)' }}>
            {lead.country}
          </span>
        )}

        {leadType && (
          <span style={{ padding: '5px 9px', borderRadius: 6, background: `${leadType.color || '#8b5cf6'}18`, color: leadType.color || '#c4b5fd', fontSize: 10, fontWeight: 700, border: `1px solid ${leadType.color || '#8b5cf6'}28` }}>
            {leadType.name}
          </span>
        )}

        <span style={{ padding: '5px 9px', borderRadius: 6, background: lead.marketing_opt_in ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: lead.marketing_opt_in ? '#86efac' : '#fca5a5', fontSize: 10, fontWeight: 700, border: lead.marketing_opt_in ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(239,68,68,0.25)' }}>
          {lead.marketing_opt_in ? 'Sim' : 'Não'}
        </span>
      </div>

      {lead.message && (
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, lineHeight: 1.5, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
          {lead.message.length > 120 ? `${lead.message.slice(0, 120)}...` : lead.message}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, marginTop: 4, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 600 }}>
          {new Date(lead.created_at).toLocaleDateString('pt-PT')}
        </span>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onViewLead?.(lead)}
            title="Ver lead"
            style={{
              width: 34,
              height: 34,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(59,130,246,0.16)',
              border: '1px solid rgba(59,130,246,0.28)',
              borderRadius: 10,
              color: '#93c5fd',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            }}
          >
            <FiEye size={16} />
          </button>

          <button
            onClick={() => onEmailLead?.(lead)}
            title="Enviar email"
            style={{
              width: 34,
              height: 34,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(245,158,11,0.16)',
              border: '1px solid rgba(245,158,11,0.28)',
              borderRadius: 10,
              color: '#fcd34d',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            }}
          >
            <FiMail size={16} />
          </button>

          <button
            onClick={() => onWhatsAppLead?.(lead)}
            title="Abrir WhatsApp"
            style={{
              width: 34,
              height: 34,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(16,185,129,0.16)',
              border: '1px solid rgba(16,185,129,0.28)',
              borderRadius: 10,
              color: '#86efac',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            }}
          >
            <FaWhatsapp size={17} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PipelineKanban({
  leads,
  leadTypes,
  filterLeadType,
  setFilterLeadType,
  updateStep,
  onViewLead,
  onEmailLead,
  onWhatsAppLead,
}: PipelineKanbanProps) {
  const [activeLead, setActiveLead] = useState<Lead | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current
      const scrollWidth = container.scrollWidth
      const clientWidth = container.clientWidth
      const scrollLeft = (scrollWidth - clientWidth) / 2
      
      container.scrollLeft = scrollLeft
    }
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const filteredLeads = useMemo(() => {
    if (!filterLeadType) return leads
    return leads.filter((lead) => lead.lead_type_id === filterLeadType)
  }, [leads, filterLeadType])

  const leadsByStep = useMemo(() => {
    return STEPS.reduce((acc, step) => {
      acc[step] = filteredLeads.filter((lead) => lead.step === step)
      return acc
    }, {} as Record<string, Lead[]>)
  }, [filteredLeads])

  const handleDragStart = (event: DragStartEvent) => {
    const lead = filteredLeads.find((item) => item.id === String(event.active.id)) || null
    setActiveLead(lead)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveLead(null)

    if (!over) return

    const activeLead = filteredLeads.find((item) => item.id === String(active.id))
    if (!activeLead) return

    let targetStep: string | null = null

    if (STEPS.includes(String(over.id))) {
      targetStep = String(over.id)
    } else {
      const overLead = filteredLeads.find((item) => item.id === String(over.id))
      if (overLead) targetStep = overLead.step
    }

    if (!targetStep || targetStep === activeLead.step) return

    await updateStep(activeLead.id, targetStep)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div>
          <h3 style={{ margin: 0, color: '#fff', fontSize: 22, fontWeight: 900 }}>
            Pipeline Kanban
          </h3>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
            Arrasta os leads entre colunas para atualizar o step.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            value={filterLeadType || ''}
            onChange={(e) => setFilterLeadType(e.target.value || null)}
            style={{
              padding: '0 14px',
              height: 42,
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)',
              fontSize: 13,
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontWeight: 700,
              minWidth: 180,
              cursor: 'pointer',
            }}
          >
            <option value="">Todos os tipos</option>
            {leadTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div
          ref={containerRef}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(280px, 1fr))',
            gap: 10,
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            paddingBottom: 8,
          }}
        >
          {STEPS.map((step) => (
            <KanbanColumn
              key={step}
              step={step}
              leads={leadsByStep[step] || []}
              leadTypes={leadTypes}
              onViewLead={onViewLead}
              onEmailLead={onEmailLead}
              onWhatsAppLead={onWhatsAppLead}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} leadTypes={leadTypes} dragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
