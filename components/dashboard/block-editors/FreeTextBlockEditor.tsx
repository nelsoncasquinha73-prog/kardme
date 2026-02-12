'use client'

import React, { useState } from 'react'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import ColorPickerPro from '@/components/editor/ColorPickerPro'
import FontPicker from '@/components/editor/FontPicker'

type FreeTextSettings = { title?: string; text: string }
type FreeTextStyle = {
  offsetY?: number
  titleColor?: string
  titleFontFamily?: string
  titleBold?: boolean
  titleFontSize?: number
  titleAlign?: 'left' | 'center' | 'right'
  textColor?: string
  fontFamily?: string
  bold?: boolean
  fontSize?: number
  lineHeight?: number
  align?: 'left' | 'center' | 'right'
  compact?: boolean
  container?: { bgColor?: string; radius?: number; padding?: number; shadow?: boolean; borderWidth?: number; borderColor?: string }
}
type Props = { settings: FreeTextSettings; style?: FreeTextStyle; onChangeSettings: (s: FreeTextSettings) => void; onChangeStyle: (s: FreeTextStyle) => void }

export default function FreeTextBlockEditor({ settings, style, onChangeSettings, onChangeStyle }: Props) {
  const { openPicker } = useColorPicker()
  const s: FreeTextSettings = settings || { text: '' }
  const st: FreeTextStyle = style || {}
  const c = st.container || {}
  const [activeSection, setActiveSection] = useState<string | null>('content')

  const pickEyedropper = (apply: (hex: string) => void) => openPicker({ onPick: apply })
  const setSettings = (patch: Partial<FreeTextSettings>) => onChangeSettings({ ...s, ...patch })
  const setStyle = (patch: Partial<FreeTextStyle>) => onChangeStyle({ ...st, ...patch })
  const setContainer = (patch: Partial<NonNullable<FreeTextStyle['container']>>) => setStyle({ container: { ...c, ...patch } })

  const bgEnabled = (c.bgColor ?? 'transparent') !== 'transparent'
  const borderEnabled = (c.borderWidth ?? 0) > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ========== CONTEÚDO ========== */}
      <CollapsibleSection title="📝 Conteúdo" subtitle="Título e texto" isOpen={activeSection === 'content'} onToggle={() => setActiveSection(activeSection === 'content' ? null : 'content')}>
        <Row label="Título">
          <input value={s.title ?? ''} onChange={(e) => setSettings({ title: e.target.value })} placeholder="Ex.: Privacidade" style={inputStyle} />
        </Row>
        <textarea value={s.text ?? ''} onChange={(e) => setSettings({ text: e.target.value })} rows={5} placeholder="Escreve aqui..." style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', fontSize: 13, resize: 'vertical', outline: 'none' }} />
        <Row label="Compacto"><Toggle active={st.compact === true} onClick={() => setStyle({ compact: !st.compact })} /></Row>
      </CollapsibleSection>

      {/* ========== TÍTULO ========== */}
      <CollapsibleSection title="🏷️ Título" subtitle="Cor, tamanho, fonte" isOpen={activeSection === 'title'} onToggle={() => setActiveSection(activeSection === 'title' ? null : 'title')}>
        <Row label="Cor"><ColorPickerPro value={st.titleColor ?? '#111827'} onChange={(hex) => setStyle({ titleColor: hex })} onEyedropper={() => pickEyedropper((hex) => setStyle({ titleColor: hex }))} /></Row>
        <Row label="Tamanho"><input type="range" min={10} max={40} value={st.titleFontSize ?? 15} onChange={(e) => setStyle({ titleFontSize: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{st.titleFontSize ?? 15}px</span></Row>
        <Row label="Alinhamento">
          <div style={{ display: 'flex', gap: 6 }}>
            {(['left', 'center', 'right'] as const).map((a) => (
              <MiniButton key={a} active={(st.titleAlign ?? 'left') === a} onClick={() => setStyle({ titleAlign: a })}>{a === 'left' ? '◀' : a === 'center' ? '●' : '▶'}</MiniButton>
            ))}
          </div>
        </Row>
        <Row label="Negrito"><Toggle active={st.titleBold !== false} onClick={() => setStyle({ titleBold: !(st.titleBold !== false) })} /></Row>
        <Row label="Fonte"><FontPicker value={st.titleFontFamily ?? ""} onChange={(v) => setStyle({ titleFontFamily: v || undefined })} /></Row>
      </CollapsibleSection>

      {/* ========== TEXTO ========== */}
      <CollapsibleSection title="🔤 Texto" subtitle="Cor, tamanho, fonte" isOpen={activeSection === 'text'} onToggle={() => setActiveSection(activeSection === 'text' ? null : 'text')}>
        <Row label="Cor"><ColorPickerPro value={st.textColor ?? '#111827'} onChange={(hex) => setStyle({ textColor: hex })} onEyedropper={() => pickEyedropper((hex) => setStyle({ textColor: hex }))} /></Row>
        <Row label="Tamanho"><input type="range" min={10} max={26} value={st.fontSize ?? 14} onChange={(e) => setStyle({ fontSize: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{st.fontSize ?? 14}px</span></Row>
        <Row label="Altura linha"><input type="range" min={1.1} max={2.0} step={0.05} value={st.lineHeight ?? 1.5} onChange={(e) => setStyle({ lineHeight: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{(st.lineHeight ?? 1.5).toFixed(2)}</span></Row>
        <Row label="Alinhamento">
          <div style={{ display: 'flex', gap: 6 }}>
            {(['left', 'center', 'right'] as const).map((a) => (
              <MiniButton key={a} active={(st.align ?? 'left') === a} onClick={() => setStyle({ align: a })}>{a === 'left' ? '◀' : a === 'center' ? '●' : '▶'}</MiniButton>
            ))}
          </div>
        </Row>
        <Row label="Negrito"><Toggle active={st.bold === true} onClick={() => setStyle({ bold: !st.bold })} /></Row>
        <Row label="Fonte"><FontPicker value={st.fontFamily ?? ""} onChange={(v) => setStyle({ fontFamily: v || undefined })} /></Row>
      </CollapsibleSection>

      {/* ========== CONTAINER ========== */}
      <CollapsibleSection title="📦 Container" subtitle="Fundo, borda, sombra" isOpen={activeSection === 'container'} onToggle={() => setActiveSection(activeSection === 'container' ? null : 'container')}>
        <Row label="Fundo"><Toggle active={bgEnabled} onClick={() => setContainer({ bgColor: bgEnabled ? 'transparent' : '#ffffff' })} /></Row>
        {bgEnabled && <Row label="Cor fundo"><ColorPickerPro value={c.bgColor ?? '#ffffff'} onChange={(hex) => setContainer({ bgColor: hex })} onEyedropper={() => pickEyedropper((hex) => setContainer({ bgColor: hex }))} /></Row>}
        <Row label="Borda"><Toggle active={borderEnabled} onClick={() => setContainer({ borderWidth: borderEnabled ? 0 : 1 })} /></Row>
        {borderEnabled && (<>
          <Row label="Espessura"><input type="range" min={1} max={6} value={c.borderWidth ?? 1} onChange={(e) => setContainer({ borderWidth: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{c.borderWidth ?? 1}px</span></Row>
          <Row label="Cor borda"><ColorPickerPro value={c.borderColor ?? '#e5e7eb'} onChange={(hex) => setContainer({ borderColor: hex })} onEyedropper={() => pickEyedropper((hex) => setContainer({ borderColor: hex }))} /></Row>
        </>)}
        <Row label="Sombra"><Toggle active={c.shadow === true} onClick={() => setContainer({ shadow: !c.shadow })} /></Row>
        <Row label="Raio"><input type="range" min={0} max={32} value={c.radius ?? 14} onChange={(e) => setContainer({ radius: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{c.radius ?? 14}px</span></Row>
        <Row label="Padding"><input type="range" min={0} max={28} value={c.padding ?? 14} onChange={(e) => setContainer({ padding: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{c.padding ?? 14}px</span></Row>
      </CollapsibleSection>

      {/* ========== POSIÇÃO ========== */}
      <CollapsibleSection title="📍 Posição" subtitle="Offset vertical" isOpen={activeSection === 'position'} onToggle={() => setActiveSection(activeSection === 'position' ? null : 'position')}>
        <Row label="Offset Y"><input type="range" min={-80} max={80} step={4} value={st.offsetY ?? 0} onChange={(e) => setStyle({ offsetY: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{st.offsetY ?? 0}px</span></Row>
        <Row label=""><Button onClick={() => setStyle({ offsetY: 0 })}>Reset</Button></Row>
      </CollapsibleSection>

    </div>
  )
}

const rightNum: React.CSSProperties = { fontSize: 12, opacity: 0.7, minWidth: 45, textAlign: 'right' }
const selectStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', fontWeight: 600, fontSize: 12, minWidth: 110 }
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
      <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, minWidth: 80 }}>{label}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>{children}</div>
    </div>
  )
}

function Button({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.10)', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>{children}</button>
}

function MiniButton({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return <button onClick={onClick} style={{ padding: '6px 14px', borderRadius: 10, border: active ? '2px solid #3b82f6' : '1px solid rgba(0,0,0,0.10)', background: active ? 'rgba(59,130,246,0.1)' : '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 11, color: active ? '#3b82f6' : '#333', minWidth: 50, whiteSpace: 'nowrap' }}>{children}</button>
}

function Toggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: 44, height: 24, borderRadius: 999, background: active ? '#3b82f6' : '#e5e7eb', position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
      <span style={{ position: 'absolute', top: 2, left: active ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
    </button>
  )
}
