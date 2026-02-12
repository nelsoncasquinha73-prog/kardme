'use client'

import React, { useState } from 'react'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import ColorPickerPro from '@/components/editor/ColorPickerPro'
import FontPicker from '@/components/editor/FontPicker'
import RichTextEditor from '@/components/editor/RichTextEditor'

type BioSettings = { text: string }
type BioStyle = {
  offsetY?: number
  textColor?: string
  fontFamily?: string
  bold?: boolean
  fontSize?: number
  lineHeight?: number
  align?: 'left' | 'center' | 'right'
  container?: { enabled?: boolean; bgColor?: string; radius?: number; padding?: number; shadow?: boolean; borderWidth?: number; borderColor?: string; widthMode?: 'full' | 'custom'; customWidthPx?: number }
}
type Props = { settings: BioSettings; style?: BioStyle; onChangeSettings: (s: BioSettings) => void; onChangeStyle: (s: BioStyle) => void }

export default function BioBlockEditor({ settings, style, onChangeSettings, onChangeStyle }: Props) {
  const { openPicker } = useColorPicker()
  const s: BioStyle = style || {}
  const c = s.container || {}
  const [activeSection, setActiveSection] = useState<string | null>('text')

  const pickEyedropper = (apply: (hex: string) => void) => openPicker({ mode: 'eyedropper', onPick: apply })
  const setStyle = (patch: Partial<BioStyle>) => onChangeStyle({ ...s, ...patch })
  const setContainer = (patch: Partial<NonNullable<BioStyle['container']>>) => setStyle({ container: { ...c, ...patch } })

  const bgEnabled = (c.bgColor ?? 'transparent') !== 'transparent'
  const borderEnabled = (c.borderWidth ?? 0) > 0
  const widthCustom = c.widthMode === 'custom'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ========== TEXTO ========== */}
      <CollapsibleSection title="📝 Texto" subtitle="Bio com formatação" isOpen={activeSection === 'text'} onToggle={() => setActiveSection(activeSection === 'text' ? null : 'text')}>
        <RichTextEditor value={settings.text || ''} onChange={(html) => onChangeSettings({ text: html })} placeholder="Escreve a tua bio..." minHeight={120} />
        <Row label="Fonte base"><FontPicker value={s.fontFamily ?? ""} onChange={(v) => setStyle({ fontFamily: v || undefined })} /></Row>
        <Row label="Tamanho base">
          <input type="range" min={12} max={22} value={s.fontSize ?? 15} onChange={(e) => setStyle({ fontSize: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{s.fontSize ?? 15}px</span>
        </Row>
        <Row label="Altura linha">
          <input type="range" min={1.1} max={2.2} step={0.05} value={s.lineHeight ?? 1.6} onChange={(e) => setStyle({ lineHeight: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{(s.lineHeight ?? 1.6).toFixed(2)}</span>
        </Row>
      </CollapsibleSection>

      {/* ========== CONTAINER ========== */}
      <CollapsibleSection title="📦 Container" subtitle="Fundo, borda, sombra" isOpen={activeSection === 'container'} onToggle={() => setActiveSection(activeSection === 'container' ? null : 'container')}>
        <Row label="Fundo"><Toggle active={bgEnabled} onClick={() => setContainer({ bgColor: bgEnabled ? 'transparent' : '#ffffff' })} /></Row>
        {bgEnabled && <Row label="Cor fundo"><ColorPickerPro value={c.bgColor ?? '#ffffff'} onChange={(hex) => setContainer({ bgColor: hex })} onEyedropper={() => pickEyedropper((hex) => setContainer({ bgColor: hex }))} supportsGradient={true} /></Row>}
        <Row label="Borda"><Toggle active={borderEnabled} onClick={() => setContainer({ borderWidth: borderEnabled ? 0 : 1 })} /></Row>
        {borderEnabled && (<>
          <Row label="Espessura"><input type="range" min={1} max={6} value={c.borderWidth ?? 1} onChange={(e) => setContainer({ borderWidth: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{c.borderWidth ?? 1}px</span></Row>
          <Row label="Cor borda"><ColorPickerPro value={c.borderColor ?? '#e5e7eb'} onChange={(hex) => setContainer({ borderColor: hex })} onEyedropper={() => pickEyedropper((hex) => setContainer({ borderColor: hex }))} supportsGradient={false} /></Row>
        </>)}
        <Row label="Sombra"><Toggle active={c.shadow === true} onClick={() => setContainer({ shadow: !c.shadow })} /></Row>
        <Row label="Raio"><input type="range" min={0} max={32} value={c.radius ?? 18} onChange={(e) => setContainer({ radius: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{c.radius ?? 18}px</span></Row>
        <Row label="Padding"><input type="range" min={0} max={28} value={c.padding ?? 16} onChange={(e) => setContainer({ padding: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{c.padding ?? 16}px</span></Row>
        <Row label="Largura custom"><Toggle active={widthCustom} onClick={() => setContainer({ widthMode: widthCustom ? 'full' : 'custom', customWidthPx: widthCustom ? undefined : 320 })} /></Row>
        {widthCustom && <Row label="Largura"><input type="range" min={200} max={400} step={10} value={c.customWidthPx ?? 320} onChange={(e) => setContainer({ customWidthPx: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{c.customWidthPx ?? 320}px</span></Row>}
      </CollapsibleSection>

      {/* ========== POSIÇÃO ========== */}
      <CollapsibleSection title="📍 Posição" subtitle="Offset vertical" isOpen={activeSection === 'position'} onToggle={() => setActiveSection(activeSection === 'position' ? null : 'position')}>
        <Row label="Offset Y"><input type="range" min={-80} max={80} step={4} value={s.offsetY ?? 0} onChange={(e) => setStyle({ offsetY: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{s.offsetY ?? 0}px</span></Row>
        <Row label=""><Button onClick={() => setStyle({ offsetY: 0 })}>Reset</Button></Row>
      </CollapsibleSection>

    </div>
  )
}

const rightNum: React.CSSProperties = { fontSize: 12, opacity: 0.7, minWidth: 45, textAlign: 'right' }

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

function Toggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: 44, height: 24, borderRadius: 999, background: active ? '#3b82f6' : '#e5e7eb', position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
      <span style={{ position: 'absolute', top: 2, left: active ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
    </button>
  )
}
