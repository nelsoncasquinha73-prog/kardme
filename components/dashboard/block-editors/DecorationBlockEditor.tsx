'use client'

import React, { useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { DecorationItem, DecorationSettings } from '@/components/blocks/DecorationBlock'

type Props = {
  cardId?: string
  settings: DecorationSettings
  style?: any
  onChangeSettings: (s: DecorationSettings) => void
  onChangeStyle?: (s: any) => void
  activeDecoId: string | null
  onSelectDeco: (id: string | null) => void
}

function uid(prefix = 'deco') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export default function DecorationBlockEditor({
  cardId,
  settings,
  onChangeSettings,
  onChangeStyle,
  activeDecoId,
  onSelectDeco,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const decorations = useMemo<DecorationItem[]>(() => settings?.decorations ?? [], [settings?.decorations])
  const active = decorations.find((d) => d.id === activeDecoId) ?? null

  const updateAll = (next: DecorationItem[]) => onChangeSettings({ ...settings, decorations: next })

  const patchDecoration = (id: string, patch: Partial<DecorationItem>) => {
    updateAll(decorations.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  }

  const addDecoration = () => {
    const id = uid()
    const next: DecorationItem = {
      id,
      src: '',
      alt: '',
      x: 50,
      y: 35,
      width: 180,
      height: 180,
      rotation: 0,
      opacity: 0.6,
      zIndex: decorations.reduce((max, d) => Math.max(max, d.zIndex ?? 0), 0) + 1,
      enabled: true,
    }
    updateAll([...decorations, next])
    onSelectDeco(id)
  }

  const duplicateDecoration = (id: string) => {
    const base = decorations.find((d) => d.id === id)
    if (!base) return
    const copy: DecorationItem = {
      ...base,
      id: uid(),
      x: clamp(base.x + 2, 0, 100),
      y: clamp(base.y + 2, 0, 100),
      zIndex: decorations.reduce((max, d) => Math.max(max, d.zIndex ?? 0), 0) + 1,
    }
    updateAll([...decorations, copy])
    onSelectDeco(copy.id)
  }

  const removeDecoration = (id: string) => {
    const next = decorations.filter((d) => d.id !== id)
    updateAll(next)
    if (activeDecoId === id) onSelectDeco(next[0]?.id ?? null)
  }

  const bringForward = (id: string) => {
    const cur = decorations.find((d) => d.id === id)
    if (!cur) return
    patchDecoration(id, { zIndex: Number(cur.zIndex ?? 0) + 1 })
  }

  const sendBackward = (id: string) => {
    const cur = decorations.find((d) => d.id === id)
    if (!cur) return
    patchDecoration(id, { zIndex: Number(cur.zIndex ?? 0) - 1 })
  }

  const pickFileFor = (id: string) => {
    if (!fileInputRef.current) return
    fileInputRef.current.dataset.targetId = id
    fileInputRef.current.value = ''
    fileInputRef.current.click()
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const targetId = e.target.dataset.targetId
    if (!file || !targetId) return

    try {
      if (!file.type.startsWith('image/')) {
        alert('Escolhe um ficheiro de imagem (png/jpg/webp/svg).')
        return
      }

      const bucket = 'decorations'
      const ext = (file.name.split('.').pop() || 'png').toLowerCase()
      const path = `${cardId || 'no-card'}/${targetId}.${ext}`

      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: '3600',
      })
      if (upErr) throw upErr

      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      const publicUrl = data?.publicUrl
      if (!publicUrl) throw new Error('Não foi possível obter o URL público da imagem.')

      patchDecoration(targetId, { src: publicUrl, enabled: true })
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Erro no upload da imagem.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />

      <div style={section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <strong style={title}>Decorações</strong>
          <button type="button" onClick={addDecoration} style={btnPrimary}>
            + Adicionar
          </button>
        </div>
        <div style={{ fontSize: 12, opacity: 0.7, lineHeight: 1.35 }}>
          Seleciona uma decoração na lista para editar.
        </div>
      </div>

      {decorations.length === 0 && (
        <div style={{ fontSize: 13, opacity: 0.7 }}>Ainda não tens decorações.</div>
      )}

      {decorations.map((d, idx) => (
        <div
          key={d.id}
          onClick={() => onSelectDeco(d.id)}
          style={{
            ...card,
            borderColor: d.id === activeDecoId ? 'var(--color-primary)' : 'rgba(0,0,0,0.08)',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <strong style={{ fontSize: 13 }}>Decoração #{idx + 1}</strong>

            <button type="button" onClick={() => removeDecoration(d.id)} style={btnDanger}>
              Remover
            </button>
          </div>

          <label style={label}>
            <span style={labelText}>Ativa</span>
            <input
              type="checkbox"
              checked={d.enabled !== false}
              onChange={(e) => patchDecoration(d.id, { enabled: e.target.checked })}
            />
          </label>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button type="button" onClick={() => pickFileFor(d.id)} style={btnSecondary}>
              Upload imagem
            </button>

            <div style={{ fontSize: 12, opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {d.src ? '✅ imagem definida' : '⚠️ sem imagem (faz upload ou cola URL)'}
            </div>
          </div>

          <label style={label}>
            <span style={labelText}>URL (opcional)</span>
            <input
              value={d.src || ''}
              onChange={(e) => patchDecoration(d.id, { src: e.target.value })}
              placeholder="https://..."
              style={input}
            />
          </label>

          <label style={label}>
            <span style={labelText}>Alt (acessibilidade)</span>
            <input
              value={d.alt || ''}
              onChange={(e) => patchDecoration(d.id, { alt: e.target.value })}
              placeholder="ex: tesoura, doodle, logo"
              style={input}
            />
          </label>

          <div style={grid2}>
            <label style={label}>
              <span style={labelText}>X (%)</span>
              <input
                type="number"
                value={d.x}
                min={0}
                max={100}
                onChange={(e) => patchDecoration(d.id, { x: clamp(Number(e.target.value), 0, 100) })}
                style={input}
              />
            </label>

            <label style={label}>
              <span style={labelText}>Y (%)</span>
              <input
                type="number"
                value={d.y}
                min={0}
                max={100}
                onChange={(e) => patchDecoration(d.id, { y: clamp(Number(e.target.value), 0, 100) })}
                style={input}
              />
            </label>
          </div>

          <div style={grid2}>
            <label style={label}>
              <span style={labelText}>Largura (px)</span>
              <input
                type="number"
                value={d.width}
                min={1}
                max={2000}
                onChange={(e) => patchDecoration(d.id, { width: Number(e.target.value) })}
                style={input}
              />
            </label>

            <label style={label}>
              <span style={labelText}>Altura (px)</span>
              <input
                type="number"
                value={d.height}
                min={1}
                max={2000}
                onChange={(e) => patchDecoration(d.id, { height: Number(e.target.value) })}
                style={input}
              />
            </label>
          </div>

          <div style={grid2}>
            <label style={label}>
              <span style={labelText}>Rotação (°)</span>
              <input
                type="number"
                value={d.rotation}
                min={-360}
                max={360}
                onChange={(e) => patchDecoration(d.id, { rotation: Number(e.target.value) })}
                style={input}
              />
            </label>

            <label style={label}>
              <span style={labelText}>Opacidade (0–1)</span>
              <input
                type="number"
                step={0.05}
                value={d.opacity}
                min={0}
                max={1}
                onChange={(e) => patchDecoration(d.id, { opacity: clamp(Number(e.target.value), 0, 1) })}
                style={input}
              />
            </label>
          </div>

          <label style={label}>
            <span style={labelText}>Z-index</span>
            <input
              type="number"
              value={d.zIndex}
              onChange={(e) => patchDecoration(d.id, { zIndex: Number(e.target.value) })}
              style={input}
            />
          </label>

          <div style={{ fontSize: 12, opacity: 0.65, lineHeight: 1.35 }}>
            Dica: usa PNG com transparência + opacidade ~0.2–0.6 para ficar “premium”.
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={() => duplicateDecoration(d.id)} style={btnSecondary}>
              Duplicar
            </button>
            <button type="button" onClick={() => bringForward(d.id)} style={btnSecondary}>
              Trazer à frente
            </button>
            <button type="button" onClick={() => sendBackward(d.id)} style={btnSecondary}>
              Enviar para trás
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

const section: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 14,
  border: '1px solid rgba(0,0,0,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const title: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
}

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 14,
  border: '1px solid rgba(0,0,0,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  cursor: 'pointer',
}

const grid2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
}

const label: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const labelText: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  opacity: 0.75,
}

const input: React.CSSProperties = {
  width: '100%',
  height: 38,
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.12)',
  padding: '0 10px',
  fontSize: 13,
  outline: 'none',
}

const btnPrimary: React.CSSProperties = {
  height: 40,
  borderRadius: 12,
  border: 'none',
  background: 'var(--color-primary)',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
  padding: '0 12px',
  width: 'fit-content',
}

const btnSecondary: React.CSSProperties = {
  height: 36,
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
  padding: '0 12px',
}

const btnDanger: React.CSSProperties = {
  height: 34,
  borderRadius: 12,
  border: '1px solid rgba(229,62,62,0.35)',
  background: '#fff',
  color: '#e53e3e',
  fontWeight: 900,
  cursor: 'pointer',
  padding: '0 10px',
}
