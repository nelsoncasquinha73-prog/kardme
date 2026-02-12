'use client'

import React, { useMemo, useRef, useState } from 'react'
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

function uid(prefix = 'deco') { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}` }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }

export default function DecorationBlockEditor({ cardId, settings, onChangeSettings, activeDecoId, onSelectDeco }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>('list')
  const [uploading, setUploading] = useState(false)

  const decorations = useMemo<DecorationItem[]>(() => settings?.decorations ?? [], [settings?.decorations])
  const active = decorations.find((d) => d.id === activeDecoId) ?? null

  const updateAll = (next: DecorationItem[]) => onChangeSettings({ ...settings, decorations: next })
  const patchDecoration = (id: string, patch: Partial<DecorationItem>) => updateAll(decorations.map((d) => (d.id === id ? { ...d, ...patch } : d)))

  const addDecoration = () => {
    const id = uid()
    const next: DecorationItem = { id, src: '', alt: '', x: 50, y: 35, width: 180, height: 180, rotation: 0, opacity: 0.6, zIndex: decorations.reduce((max, d) => Math.max(max, d.zIndex ?? 0), 0) + 1, enabled: true }
    updateAll([...decorations, next])
    onSelectDeco(id)
  }

  const duplicateDecoration = (id: string) => {
    const base = decorations.find((d) => d.id === id)
    if (!base) return
    const copy: DecorationItem = { ...base, id: uid(), x: clamp(base.x + 2, 0, 100), y: clamp(base.y + 2, 0, 100), zIndex: decorations.reduce((max, d) => Math.max(max, d.zIndex ?? 0), 0) + 1 }
    updateAll([...decorations, copy])
    onSelectDeco(copy.id)
  }

  const removeDecoration = (id: string) => {
    const next = decorations.filter((d) => d.id !== id)
    updateAll(next)
    if (activeDecoId === id) onSelectDeco(next[0]?.id ?? null)
  }

  const bringForward = (id: string) => { const cur = decorations.find((d) => d.id === id); if (cur) patchDecoration(id, { zIndex: (cur.zIndex ?? 0) + 1 }) }
  const sendBackward = (id: string) => { const cur = decorations.find((d) => d.id === id); if (cur) patchDecoration(id, { zIndex: (cur.zIndex ?? 0) - 1 }) }

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
    if (!file.type.startsWith('image/')) { alert('Escolhe uma imagem (png/jpg/webp/svg).'); return }
    setUploading(true)
    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase()
      const path = `${cardId || 'no-card'}/${targetId}.${ext}`
      const { error } = await supabase.storage.from('decorations').upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' })
      if (error) throw error
      const { data } = supabase.storage.from('decorations').getPublicUrl(path)
      patchDecoration(targetId, { src: data?.publicUrl, enabled: true })
    } catch (err: any) { alert(err?.message || 'Erro no upload.') }
    finally { setUploading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />

      {/* ========== LISTA ========== */}
      <CollapsibleSection title="🎨 Decorações" subtitle={`${decorations.length} item(s)`} isOpen={activeSection === 'list'} onToggle={() => setActiveSection(activeSection === 'list' ? null : 'list')}>
        <Row label="">
          <Button onClick={addDecoration}>+ Adicionar</Button>
        </Row>
        {decorations.length === 0 && <div style={{ fontSize: 12, opacity: 0.6 }}>Ainda não tens decorações.</div>}
        {decorations.map((d, idx) => (
          <div key={d.id} onClick={() => onSelectDeco(d.id)} style={{ padding: '10px 12px', borderRadius: 12, border: d.id === activeDecoId ? '2px solid #3b82f6' : '1px solid rgba(0,0,0,0.1)', background: d.id === activeDecoId ? 'rgba(59,130,246,0.05)' : '#fff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>#{idx + 1} {d.src ? '✅' : '⚠️'}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <MiniButton onClick={(e) => { e.stopPropagation(); duplicateDecoration(d.id) }}>📋</MiniButton>
              <MiniButton onClick={(e) => { e.stopPropagation(); removeDecoration(d.id) }}>🗑️</MiniButton>
            </div>
          </div>
        ))}
      </CollapsibleSection>

      {/* ========== EDITAR ATIVA ========== */}
      {active && (
        <CollapsibleSection title={`✏️ Decoração #${decorations.findIndex(d => d.id === active.id) + 1}`} subtitle="Imagem, posição, tamanho" isOpen={activeSection === 'edit'} onToggle={() => setActiveSection(activeSection === 'edit' ? null : 'edit')}>
          <Row label="Ativa"><Toggle active={active.enabled !== false} onClick={() => patchDecoration(active.id, { enabled: !active.enabled })} /></Row>
          <Row label="Imagem">
            <Button onClick={() => pickFileFor(active.id)}>{uploading ? '⏳...' : 'Upload'}</Button>
          </Row>
          {active.src && <div style={{ fontSize: 10, color: '#22c55e' }}>✅ Imagem definida</div>}
          <Row label="URL">
            <input value={active.src || ''} onChange={(e) => patchDecoration(active.id, { src: e.target.value })} placeholder="https://..." style={inputStyle} />
          </Row>
          <Row label="Alt">
            <input value={active.alt || ''} onChange={(e) => patchDecoration(active.id, { alt: e.target.value })} placeholder="Descrição" style={inputStyle} />
          </Row>
          <Row label="X (%)"><input type="range" min={0} max={100} value={active.x} onChange={(e) => patchDecoration(active.id, { x: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{active.x}%</span></Row>
          <Row label="Y (%)"><input type="range" min={0} max={100} value={active.y} onChange={(e) => patchDecoration(active.id, { y: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{active.y}%</span></Row>
          <Row label="Largura"><input type="range" min={20} max={500} value={active.width} onChange={(e) => patchDecoration(active.id, { width: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{active.width}px</span></Row>
          <Row label="Altura"><input type="range" min={20} max={500} value={active.height} onChange={(e) => patchDecoration(active.id, { height: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{active.height}px</span></Row>
          <Row label="Rotação"><input type="range" min={-180} max={180} value={active.rotation} onChange={(e) => patchDecoration(active.id, { rotation: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{active.rotation}°</span></Row>
          <Row label="Opacidade"><input type="range" min={0} max={100} value={Math.round((active.opacity ?? 1) * 100)} onChange={(e) => patchDecoration(active.id, { opacity: Number(e.target.value) / 100 })} style={{ flex: 1 }} /><span style={rightNum}>{Math.round((active.opacity ?? 1) * 100)}%</span></Row>
          <Row label="Z-index"><input type="range" min={-10} max={50} value={active.zIndex ?? 0} onChange={(e) => patchDecoration(active.id, { zIndex: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{active.zIndex ?? 0}</span></Row>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <MiniButton onClick={() => bringForward(active.id)}>⬆️ Frente</MiniButton>
            <MiniButton onClick={() => sendBackward(active.id)}>⬇️ Trás</MiniButton>
          </div>
          <div style={{ fontSize: 10, opacity: 0.5, marginTop: 8 }}>Dica: PNG com transparência + opacidade ~20-60% fica premium.</div>
        </CollapsibleSection>
      )}
    </div>
  )
}

const rightNum: React.CSSProperties = { fontSize: 12, opacity: 0.7, minWidth: 45, textAlign: 'right' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 13 }

function CollapsibleSection({ title, subtitle, isOpen, onToggle, children }: { title: string; subtitle?: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{subtitle}</div>}
        </div>
        <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</div>
      </button>
      {isOpen && <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, minWidth: 70 }}>{label}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>{children}</div>
    </div>
  )
}

function Button({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.10)', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>{children}</button>
}

function MiniButton({ children, onClick }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void }) {
  return <button onClick={onClick} style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.10)', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 11 }}>{children}</button>
}

function Toggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: 44, height: 24, borderRadius: 999, background: active ? '#3b82f6' : '#e5e7eb', position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
      <span style={{ position: 'absolute', top: 2, left: active ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
    </button>
  )
}
