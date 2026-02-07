'use client'

import React from 'react'
import { CSS } from '@dnd-kit/utilities'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { BlockIcon } from '@/components/editor/BlockIcon'
import { getBlockName } from './blockNameHelper'

export type BlockItem = {
  id: string
  type: string
  title?: string
  enabled: boolean
  order: number
  settings?: any
  style?: any
}

export default function BlocksRailSortable({
  t,
  blocks,
  selectedId,
  onSelect,
  onToggle,
  onReorder,
  onDelete,
}: {
  t: (key: string) => string
  blocks: BlockItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
  onReorder: (next: BlockItem[]) => void
  onDelete?: (id: string) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 12 },
    })
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => {
        const { active, over } = event
        if (!over) return
        if (active.id === over.id) return

        const oldIndex = blocks.findIndex((b) => b.id === active.id)
        const newIndex = blocks.findIndex((b) => b.id === over.id)
        if (oldIndex < 0 || newIndex < 0) return

        const moved = arrayMove(blocks, oldIndex, newIndex)
        const normalized = moved.map((b, idx) => ({ ...b, order: idx }))
        onReorder(normalized)
      }}
    >
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {blocks.map((b) => (
            <SortableRow
              t={t}
              key={b.id}
              block={b}
              active={b.id === selectedId}
              onSelect={() => onSelect(b.id)}
              onToggle={(enabled) => onToggle(b.id, enabled)}
              onDelete={onDelete ? () => onDelete(b.id) : undefined}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function SortableRow({
  t,
  block,
  active,
  onSelect,
  onToggle,
  onDelete,
}: {
  t: (key: string) => string
  block: BlockItem
  active: boolean
  onSelect: () => void
  onToggle: (enabled: boolean) => void
  onDelete?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 2,
          top: 6,
          bottom: 6,
          width: 3,
          borderRadius: 999,
          background: active ? '#111827' : 'transparent',
        }}
      />
      <div
        style={{
          width: '100%',
          padding: 6,
          borderRadius: 12,
          background: active ? 'rgba(17,24,39,0.06)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(e) => e.preventDefault()}
            style={{
              width: 22,
              height: 22,
              borderRadius: 8,
              border: 'none',
              display: 'grid',
              placeItems: 'center',
              cursor: 'grab',
              flex: '0 0 auto',
              background: active ? 'rgba(17,24,39,0.10)' : 'rgba(17,24,39,0.06)',
              color: 'rgba(17,24,39,0.75)',
              userSelect: 'none',
              fontSize: 14,
              fontWeight: 800,
              lineHeight: '22px',
              padding: 0,
            }}
            title="Arrastar para reordenar"
          >
            ⇅
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onSelect()
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              textAlign: 'left',
              background: active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)',
              border: '1px solid rgba(0,0,0,0.08)',
              padding: '4px 6px',
              borderRadius: 10,
              cursor: 'pointer',
              minWidth: 0,
              width: 'fit-content',
              maxWidth: '100%',
            }}
            title="Selecionar"
          >
            <div style={{ flex: '0 0 auto' }}>
              <BlockIcon type={block.type} size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 13,
                  color: '#111827',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {block.title || getBlockName(block.type, t) || block.type}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(17,24,39,0.55)' }}>{block.type}</div>
            </div>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggle(!block.enabled)
            }}
            style={{
              width: 36,
              height: 20,
              borderRadius: 999,
              border: '1px solid rgba(0,0,0,0.10)',
              background: block.enabled ? '#7C3AED' : 'rgba(0,0,0,0.10)',
              position: 'relative',
              cursor: 'pointer',
              flex: '0 0 auto',
            }}
            title={block.enabled ? 'Visível' : 'Oculto'}
            aria-pressed={block.enabled}
          >
            <span
              aria-hidden
              style={{
                position: 'absolute',
                top: 2,
                left: block.enabled ? 18 : 2,
                width: 16,
                height: 16,
                borderRadius: 999,
                background: '#fff',
                boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
                transition: 'left 120ms ease',
              }}
            />
          </button>
          
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (onDelete && confirm("Remover este bloco?")) onDelete()
              }}
              style={{
                width: 22,
                height: 22,
                borderRadius: 8,
                border: "none",
                background: "rgba(239,68,68,0.1)",
                color: "#ef4444",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 800,
                display: "grid",
                placeItems: "center",
              }}
              title="Remover bloco"
            >
              ✕
            </button>
          
        </div>
      </div>
    </div>
  )
}
