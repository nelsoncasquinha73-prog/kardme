'use client'

import React, { useMemo } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent, useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Section, Row, Toggle, input, select, rightNum } from '@/components/editor/ui'
import ColorPickerPro from '@/components/editor/ColorPickerPro'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import RichTextEditor from '@/components/editor/RichTextEditor'
import FontPicker from '@/components/editor/FontPicker'

type ShapeType = 'circle' | 'pill' | 'roundedSquare'

type ActionType = 'none' | 'link' | 'phone' | 'whatsapp' | 'email' | 'modal'

type ShapeCanvasItem = {
  id: string
  shapeType?: ShapeType
  xPct?: number
  yPct?: number
  wPx?: number
  hPx?: number
  zIndex?: number
  bgColor?: string
  borderColor?: string
  borderWidth?: number
  shadow?: boolean
  textHtml?: string
  fontFamily?: string
  fontSizePx?: number
  actionType?: ActionType
  url?: string
  openInNewTab?: boolean
  phone?: string
  whatsappMessage?: string
  email?: string
  emailSubject?: string
  emailBody?: string
  modalId?: string
}

type ShapeCanvasSettings = {
  items: ShapeCanvasItem[]
  selectedId?: string | null
  snapEnabled?: boolean
  snapPx?: number
}

type ShapeCanvasStyle = {
  canvas?: {
    heightPx?: number
    bgColor?: string
    radius?: number
    padding?: number
    borderWidth?: number
    borderColor?: string
    shadow?: boolean
    showCanvas?: boolean
  }
}

type Props = {
  settings: ShapeCanvasSettings
  style?: ShapeCanvasStyle
  onChangeSettings: (s: ShapeCanvasSettings) => void
  onChangeStyle?: (s: ShapeCanvasStyle) => void
}

function uid(prefix = 'shape') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}


export default function ShapeCanvasBlockEditor({ settings, style, onChangeSettings, onChangeStyle }: Props) {
  const { openPicker } = useColorPicker()

  const s: ShapeCanvasSettings = settings || { items: [] }
  const st: ShapeCanvasStyle = style || {}
  const items = useMemo(() => (Array.isArray(s.items) ? s.items : []), [s.items])

  const selectedId = s.selectedId ?? null
  const selected = items.find((i) => i.id === selectedId) || null

  const snapEnabled = s.snapEnabled ?? true
  const snapPx = s.snapPx ?? 8

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }))

  const selectItem = (id: string | null) => updateSettings({ selectedId: id })

  const updateItem = (id: string, patch: Partial<ShapeCanvasItem>) => {
    updateSettings({ items: items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })
  }

  const addItem = () => {
    const next: ShapeCanvasItem = {
      id: uid(),
      shapeType: 'circle',
      xPct: 10,
      yPct: 12,
      wPx: 170,
      hPx: 170,
      zIndex: items.length + 1,
      bgColor: '#ffffff',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.10)',
      shadow: true,
      textHtml: '<p><strong>Promoção</strong><br/>-10%</p>',
      actionType: 'none',
      url: 'https://',
      openInNewTab: true,
    }
    updateSettings({ items: [...items, next], selectedId: next.id })
  }

  const duplicateSelected = () => {
    if (!selectedId) return
    const src = items.find((i) => i.id === selectedId)
    if (!src) return
    const next: ShapeCanvasItem = {
      ...src,
      id: uid(),
      xPct: (src.xPct ?? 10) + 3,
      yPct: (src.yPct ?? 10) + 3,
      zIndex: (src.zIndex ?? 1) + 1,
    }
    updateSettings({ items: [...items, next], selectedId: next.id })
  }

  const removeSelected = () => {
    if (!selectedId) return
    updateSettings({ items: items.filter((i) => i.id !== selectedId), selectedId: null })
  }

  const onDragEnd = (e: DragEndEvent) => {
    const id = String(e.active.id || '')
    if (!id) return
    const it = items.find((x) => x.id === id)
    if (!it) return

    const dx = e.delta?.x ?? 0
    const dy = e.delta?.y ?? 0

    const canvasEl = document.querySelector('[data-shape-canvas-root="1"]') as HTMLElement | null
    if (!canvasEl) return

    const rect = canvasEl.getBoundingClientRect()
    const w = rect.width || 1
    const h = rect.height || 1

    let nextXPct = (it.xPct ?? 0) + (dx / w) * 100
    let nextYPct = (it.yPct ?? 0) + (dy / h) * 100

    if (snapEnabled) {
      const stepXPct = (snapPx / w) * 100
      const stepYPct = (snapPx / h) * 100
      nextXPct = Math.round(nextXPct / stepXPct) * stepXPct
      nextYPct = Math.round(nextYPct / stepYPct) * stepYPct
    }

    nextXPct = Math.max(0, Math.min(100, nextXPct))
    nextYPct = Math.max(0, Math.min(100, nextYPct))

    updateItem(id, { xPct: nextXPct, yPct: nextYPct })
  }

  function ShapeNode({ item }: { item: ShapeCanvasItem }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id })
    const t = transform ? CSS.Translate.toString(transform) : undefined

    const shapeType = item.shapeType ?? 'circle'
    const wPx = item.wPx ?? 160
    const hPx = item.hPx ?? (shapeType === 'pill' ? 64 : 160)

    return (
      <div
        ref={setNodeRef}
        style={{
          position: 'absolute',
          left: `${item.xPct ?? 0}%`,
          top: `${item.yPct ?? 0}%`,
          transform: t,
          zIndex: (item.zIndex ?? 1) + (isDragging ? 9999 : 0),
          touchAction: 'none',
        }}
        {...attributes}
        {...listeners}
        onPointerDownCapture={(e) => {
          e.stopPropagation()
          selectItem(item.id)
        }}
      >
        <div
          style={{
            width: wPx,
            height: hPx,
            background: item.bgColor ?? '#ffffff',
            border: `${item.borderWidth ?? 1}px solid ${item.borderColor ?? 'rgba(0,0,0,0.10)'}`,
            borderRadius: shapeType === 'roundedSquare' ? 18 : 999,
            boxShadow: (item.shadow ?? true) ? '0 10px 24px rgba(0,0,0,0.12)' : undefined,
            display: 'grid',
            placeItems: 'center',
            padding: 12,
            cursor: 'grab',
            userSelect: 'none',
            outline: selectedId === item.id ? '2px solid var(--color-primary)' : 'none',
            outlineOffset: 2,
          }}
        >
          <div
            style={{
              width: '100%',
              fontSize: 13,
              lineHeight: 1.2,
              textAlign: 'center',
              color: '#111827',
              overflow: 'hidden',
            }}
            dangerouslySetInnerHTML={{ __html: item.textHtml || '' }}
          />
        </div>
      </div>
    )
  }

  const updateSettings = (patch: Partial<ShapeCanvasSettings>) => onChangeSettings({ ...s, ...patch })
  const updateStyle = (patch: Partial<ShapeCanvasStyle>) => {
    if (!onChangeStyle) return
    onChangeStyle({ ...st, ...patch })
  }

  const canvas = st.canvas || {}
  const updateCanvas = (patch: Partial<NonNullable<ShapeCanvasStyle['canvas']>>) =>
    updateStyle({ canvas: { ...(st.canvas || {}), ...patch } })

  const pickEyedropper = (apply: (hex: string) => void) =>
    openPicker({
      mode: 'eyedropper',
      onPick: apply,
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title="Canvas">
        <Row label="Mostrar fundo do canvas">
          <Toggle active={canvas.showCanvas === true} onClick={() => updateCanvas({ showCanvas: !(canvas.showCanvas === true) })} />
        </Row>

        <Row label="Altura (px)">
          <input
            type="range"
            min={220}
            max={820}
            step={10}
            value={canvas.heightPx ?? 360}
            onChange={(e) => updateCanvas({ heightPx: Number(e.target.value) })}
          />
          <span style={rightNum}>{canvas.heightPx ?? 360}px</span>
        </Row>

        <Row label="Cor de fundo">
          <ColorPickerPro
            value={canvas.bgColor ?? '#f3f4f6'}
            onChange={(val) => updateCanvas({ bgColor: val })}
            onEyedropper={() => pickEyedropper((hex) => updateCanvas({ bgColor: hex }))}
            supportsGradient={true}
          />
        </Row>

        <Row label="Raio (px)">
          <input
            type="range"
            min={0}
            max={32}
            step={1}
            value={canvas.radius ?? 18}
            onChange={(e) => updateCanvas({ radius: Number(e.target.value) })}
          />
          <span style={rightNum}>{canvas.radius ?? 18}px</span>
        </Row>

        <Row label="Padding (px)">
          <input
            type="range"
            min={0}
            max={32}
            step={1}
            value={canvas.padding ?? 14}
            onChange={(e) => updateCanvas({ padding: Number(e.target.value) })}
          />
          <span style={rightNum}>{canvas.padding ?? 14}px</span>
        </Row>

        <Row label="Sombra">
          <Toggle active={canvas.shadow ?? false} onClick={() => updateCanvas({ shadow: !(canvas.shadow ?? false) })} />
        </Row>
      </Section>

      
      <Section title="Shapes">
        <Row label="Snap (grid)">
          <Toggle active={snapEnabled} onClick={() => updateSettings({ snapEnabled: !snapEnabled })} />
        </Row>

        {snapEnabled ? (
          <Row label="Snap px">
            <input type="range" min={4} max={24} step={1} value={snapPx} onChange={(e) => updateSettings({ snapPx: Number(e.target.value) })} />
            <span style={rightNum}>{snapPx}px</span>
          </Row>
        ) : null}

        <div
          data-shape-canvas-root="1"
          style={{
            width: '100%',
            height: canvas.heightPx ?? 360,
            background: canvas.bgColor ?? '#f3f4f6',
            borderRadius: 18,
            border: '1px solid rgba(0,0,0,0.08)',
            position: 'relative',
            overflow: 'hidden',
          }}
          onPointerDownCapture={() => selectItem(null)}
        >
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            {items.map((it) => (
              <ShapeNode key={it.id} item={it} />
            ))}
          </DndContext>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <button
            type="button"
            onClick={addItem}
            style={{
              height: 36,
              padding: '0 12px',
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.12)',
              background: '#fff',
              cursor: 'pointer',
              fontWeight: 900,
              fontSize: 12,
            }}
          >
            + Adicionar
          </button>

          <button
            type="button"
            onClick={duplicateSelected}
            disabled={!selectedId}
            style={{
              height: 36,
              padding: '0 12px',
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.12)',
              background: selectedId ? '#fff' : 'rgba(255,255,255,0.6)',
              cursor: selectedId ? 'pointer' : 'not-allowed',
              fontWeight: 900,
              fontSize: 12,
              opacity: selectedId ? 1 : 0.6,
            }}
          >
            Duplicar
          </button>

          <button
            type="button"
            onClick={removeSelected}
            disabled={!selectedId}
            style={{
              height: 36,
              padding: '0 12px',
              borderRadius: 10,
              border: '1px solid rgba(229, 62, 62, 0.25)',
              background: selectedId ? 'rgba(229, 62, 62, 0.08)' : 'rgba(229, 62, 62, 0.04)',
              cursor: selectedId ? 'pointer' : 'not-allowed',
              fontWeight: 900,
              fontSize: 12,
              color: '#e53e3e',
              opacity: selectedId ? 1 : 0.6,
            }}
          >
            Apagar
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <strong style={{ fontSize: 12, opacity: 0.75 }}>Item selecionado</strong>
          {!selected ? (
            <div style={{ opacity: 0.7, fontSize: 12, marginTop: 6 }}>Seleciona uma shape no preview para editar.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
              <Row label="Tipo">
                <select value={(selected.shapeType ?? 'circle') as any} onChange={(e) => updateItem(selected.id, { shapeType: e.target.value as any })} style={select}>
                  <option value="circle">Círculo</option>
                  <option value="pill">Pill</option>
                  <option value="roundedSquare">Quadrado arredondado</option>
                </select>
              </Row>

              <Row label="Largura (px)">
                <input type="range" min={80} max={320} step={5} value={selected.wPx ?? 170} onChange={(e) => updateItem(selected.id, { wPx: Number(e.target.value) })} />
                <span style={rightNum}>{selected.wPx ?? 170}px</span>
              </Row>

              <Row label="Altura (px)">
                <input type="range" min={50} max={320} step={5} value={selected.hPx ?? 170} onChange={(e) => updateItem(selected.id, { hPx: Number(e.target.value) })} />
                <span style={rightNum}>{selected.hPx ?? 170}px</span>
              </Row>

              <Row label="Cor">
                <ColorPickerPro
                  value={selected.bgColor ?? '#ffffff'}
                  onChange={(val) => updateItem(selected.id, { bgColor: val })}
                  onEyedropper={() => pickEyedropper((hex) => updateItem(selected.id, { bgColor: hex }))}
                  supportsGradient={true}
                />
              </Row>

              <Row label="Sombra">
                <Toggle active={selected.shadow ?? true} onClick={() => updateItem(selected.id, { shadow: !(selected.shadow ?? true) })} />
              </Row>

              <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.75 }}>Texto</div>
              <RichTextEditor value={selected.textHtml ?? ''} onChange={(html) => updateItem(selected.id, { textHtml: html })} placeholder="Escreve o texto..." minHeight={120} />

              <div style={{ marginTop: 10 }}>
                <Row label="Fonte">
                  <FontPicker
                    value={selected.fontFamily || ''}
                    onChange={(v) => updateItem(selected.id, { fontFamily: v || undefined })}
                  />
                </Row>

                <Row label="Tamanho do texto">
                  <input
                    type="range"
                    min={10}
                    max={34}
                    value={selected.fontSizePx ?? 16}
                    onChange={(e) => updateItem(selected.id, { fontSizePx: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                    {selected.fontSizePx ?? 16}px
                  </div>
                </Row>
              </div>

            </div>
          )}
        </div>
      </Section>

    </div>
  )
}
