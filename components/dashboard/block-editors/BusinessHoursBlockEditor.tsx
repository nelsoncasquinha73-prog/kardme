'use client'

import React, { useState } from 'react'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import ColorPickerPro from '@/components/editor/ColorPickerPro'
import { FONT_OPTIONS } from '@/lib/fontes'

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
type TimeRange = { from: string; to: string; label?: string }
type HoursDay = { enabled: boolean; ranges: TimeRange[] }

type BusinessHoursSettings = {
  heading?: string
  format?: 'seg-dom' | 'seg-sex' | 'custom'
  days?: Partial<Record<DayKey, HoursDay>>
}

type BusinessHoursStyle = {
  offsetY?: number
  container?: { bgColor?: string; radius?: number; padding?: number; shadow?: boolean; borderWidth?: number; borderColor?: string }
  headingColor?: string
  headingBold?: boolean
  headingFontFamily?: string
  headingFontWeight?: number
  headingFontSize?: number
  headingAlign?: 'left' | 'center' | 'right'
  textColor?: string
  textFontFamily?: string
  textFontWeight?: number
  textFontSize?: number
  rowGapPx?: number
  dayLabelWidthPx?: number
  timeFormat?: '24h' | '12h'
}

type Props = {
  settings: BusinessHoursSettings
  style?: BusinessHoursStyle
  onChangeSettings: (s: BusinessHoursSettings) => void
  onChangeStyle: (s: BusinessHoursStyle) => void
}

const DAYS: Array<{ key: DayKey; label: string }> = [
  { key: 'mon', label: 'SEG' },
  { key: 'tue', label: 'TER' },
  { key: 'wed', label: 'QUA' },
  { key: 'thu', label: 'QUI' },
  { key: 'fri', label: 'SEX' },
  { key: 'sat', label: 'SÁB' },
  { key: 'sun', label: 'DOM' },
]

const TIMES = (() => {
  const out: string[] = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return out
})()

function normalizeDay(d?: HoursDay): HoursDay {
  return { enabled: d?.enabled ?? false, ranges: Array.isArray(d?.ranges) && d!.ranges.length > 0 ? d!.ranges : [{ from: '09:00', to: '18:00' }] }
}

export default function BusinessHoursBlockEditor({ settings, style, onChangeSettings, onChangeStyle }: Props) {
  const { openPicker } = useColorPicker()
  const s = settings || {}
  const st = style || {}
  const container = st.container || {}
  const days = s.days || {}

  const [activeSection, setActiveSection] = useState<string | null>('title')

  const pickEyedropper = (apply: (hex: string) => void) => openPicker({ onPick: apply })

  const setSettings = (patch: Partial<BusinessHoursSettings>) => onChangeSettings({ ...s, ...patch })
  const setStyle = (patch: Partial<BusinessHoursStyle>) => onChangeStyle({ ...st, ...patch })
  const setContainer = (patch: Partial<NonNullable<BusinessHoursStyle['container']>>) => setStyle({ container: { ...container, ...patch } })

  const setDay = (k: DayKey, patch: Partial<HoursDay>) => {
    const cur = normalizeDay(days[k])
    setSettings({ days: { ...days, [k]: { ...cur, ...patch } } })
  }

  const setRange = (k: DayKey, idx: number, patch: Partial<TimeRange>) => {
    const cur = normalizeDay(days[k])
    const nextRanges = cur.ranges.map((r, i) => (i === idx ? { ...r, ...patch } : r))
    setDay(k, { ranges: nextRanges })
  }

  const bgEnabled = (container.bgColor ?? 'transparent') !== 'transparent'
  const borderEnabled = (container.borderWidth ?? 0) > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ========== TÍTULO ========== */}
      <CollapsibleSection title="📝 Título" subtitle="Texto, cor, fonte" isOpen={activeSection === 'title'} onToggle={() => setActiveSection(activeSection === 'title' ? null : 'title')}>
        <Row label="Texto">
          <input value={s.heading ?? 'Horário'} onChange={(e) => setSettings({ heading: e.target.value })} style={inputStyle} placeholder="Horário" />
        </Row>
        <Row label="Cor">
          <ColorPickerPro value={st.headingColor ?? '#111827'} onChange={(hex) => setStyle({ headingColor: hex })} onEyedropper={() => pickEyedropper((hex) => setStyle({ headingColor: hex }))} />
        </Row>
        <Row label="Tamanho">
          <input type="range" min={10} max={32} value={st.headingFontSize ?? 13} onChange={(e) => setStyle({ headingFontSize: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.headingFontSize ?? 13}px</span>
        </Row>
        <Row label="Alinhamento">
          <div style={{ display: 'flex', gap: 6 }}>
            {(['left', 'center', 'right'] as const).map((a) => (
              <MiniButton key={a} active={(st.headingAlign ?? 'left') === a} onClick={() => setStyle({ headingAlign: a })}>{a === 'left' ? '◀' : a === 'center' ? '●' : '▶'}</MiniButton>
            ))}
          </div>
        </Row>
        <Row label="Negrito">
          <Toggle active={st.headingBold !== false} onClick={() => setStyle({ headingBold: !(st.headingBold !== false) })} />
        </Row>
        <Row label="Fonte">
          <select value={st.headingFontFamily ?? ''} onChange={(e) => setStyle({ headingFontFamily: e.target.value || undefined })} style={selectStyle}>
            <option value="">Padrão</option>
            {FONT_OPTIONS.map((o) => <option key={o.label} value={o.value}>{o.label}</option>)}
          </select>
        </Row>
        <Row label="Peso">
          <select value={String(st.headingFontWeight ?? 900)} onChange={(e) => setStyle({ headingFontWeight: Number(e.target.value) })} style={selectStyle}>
            <option value="400">Normal</option>
            <option value="600">Semi</option>
            <option value="700">Bold</option>
            <option value="800">Extra</option>
            <option value="900">Black</option>
          </select>
        </Row>
      </CollapsibleSection>

      {/* ========== DIAS E HORÁRIOS ========== */}
      <CollapsibleSection title="📅 Dias e horários" subtitle="Configurar cada dia" isOpen={activeSection === 'days'} onToggle={() => setActiveSection(activeSection === 'days' ? null : 'days')}>
        <Row label="Formato semana">
          <select value={s.format ?? 'seg-dom'} onChange={(e) => setSettings({ format: e.target.value as any })} style={selectStyle}>
            <option value="seg-dom">Seg a Dom</option>
            <option value="seg-sex">Seg a Sex</option>
            <option value="custom">Custom</option>
          </select>
        </Row>
        <Row label="Formato hora">
          <select value={st.timeFormat ?? '24h'} onChange={(e) => setStyle({ timeFormat: e.target.value as '24h' | '12h' })} style={selectStyle}>
            <option value="24h">24h</option>
            <option value="12h">12h (AM/PM)</option>
          </select>
        </Row>
        {DAYS.map(({ key, label }) => {
          const d = normalizeDay(days[key])
          return (
            <div key={key} style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 12 }}>{label}</strong>
                <Toggle active={d.enabled} onClick={() => setDay(key, { enabled: !d.enabled })} />
              </div>
              {!d.enabled ? (
                <span style={{ fontSize: 11, opacity: 0.5 }}>Fechado</span>
              ) : (
                <>
                  {d.ranges.slice(0, 2).map((r, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, opacity: 0.6 }}>De</span>
                      <select value={r.from} onChange={(e) => setRange(key, idx, { from: e.target.value })} style={{ ...selectStyle, minWidth: 70, fontSize: 11 }}>
                        {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <span style={{ fontSize: 11, opacity: 0.6 }}>Até</span>
                      <select value={r.to} onChange={(e) => setRange(key, idx, { to: e.target.value })} style={{ ...selectStyle, minWidth: 70, fontSize: 11 }}>
                        {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input type="text" placeholder="Nome" value={r.label ?? ''} onChange={(e) => setRange(key, idx, { label: e.target.value })} style={{ ...inputStyle, width: 80, fontSize: 11, padding: '6px 8px' }} />
                      {idx > 0 && <MiniButton onClick={() => setDay(key, { ranges: d.ranges.slice(0, 1) })}>✕</MiniButton>}
                    </div>
                  ))}
                  {d.ranges.length < 2 && (
                    <MiniButton onClick={() => setDay(key, { ranges: [...d.ranges, { from: '14:00', to: '18:00' }] })}>+ Intervalo</MiniButton>
                  )}
                </>
              )}
            </div>
          )
        })}
      </CollapsibleSection>

      {/* ========== TIPOGRAFIA ========== */}
      <CollapsibleSection title="🔤 Tipografia" subtitle="Texto das linhas" isOpen={activeSection === 'typo'} onToggle={() => setActiveSection(activeSection === 'typo' ? null : 'typo')}>
        <Row label="Cor texto">
          <ColorPickerPro value={st.textColor ?? '#111827'} onChange={(hex) => setStyle({ textColor: hex })} onEyedropper={() => pickEyedropper((hex) => setStyle({ textColor: hex }))} />
        </Row>
        <Row label="Tamanho">
          <input type="range" min={10} max={22} value={st.textFontSize ?? 13} onChange={(e) => setStyle({ textFontSize: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.textFontSize ?? 13}px</span>
        </Row>
        <Row label="Fonte">
          <select value={st.textFontFamily ?? ''} onChange={(e) => setStyle({ textFontFamily: e.target.value || undefined })} style={selectStyle}>
            <option value="">Padrão</option>
            {FONT_OPTIONS.map((o) => <option key={o.label} value={o.value}>{o.label}</option>)}
          </select>
        </Row>
        <Row label="Peso">
          <select value={String(st.textFontWeight ?? 700)} onChange={(e) => setStyle({ textFontWeight: Number(e.target.value) })} style={selectStyle}>
            <option value="400">Normal</option>
            <option value="600">Semi</option>
            <option value="700">Bold</option>
            <option value="800">Extra</option>
            <option value="900">Black</option>
          </select>
        </Row>
        <Row label="Gap linhas">
          <input type="range" min={4} max={18} value={st.rowGapPx ?? 8} onChange={(e) => setStyle({ rowGapPx: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.rowGapPx ?? 8}px</span>
        </Row>
        <Row label="Largura dia">
          <input type="range" min={40} max={90} value={st.dayLabelWidthPx ?? 52} onChange={(e) => setStyle({ dayLabelWidthPx: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.dayLabelWidthPx ?? 52}px</span>
        </Row>
      </CollapsibleSection>

      {/* ========== CONTAINER ========== */}
      <CollapsibleSection title="📦 Container" subtitle="Fundo, borda, sombra" isOpen={activeSection === 'container'} onToggle={() => setActiveSection(activeSection === 'container' ? null : 'container')}>
        <Row label="Fundo">
          <Toggle active={bgEnabled} onClick={() => setContainer({ bgColor: bgEnabled ? 'transparent' : '#ffffff' })} />
        </Row>
        {bgEnabled && (
          <Row label="Cor fundo">
            <ColorPickerPro value={container.bgColor ?? '#ffffff'} onChange={(hex) => setContainer({ bgColor: hex })} onEyedropper={() => pickEyedropper((hex) => setContainer({ bgColor: hex }))} />
          </Row>
        )}
        <Row label="Borda">
          <Toggle active={borderEnabled} onClick={() => setContainer({ borderWidth: borderEnabled ? 0 : 1 })} />
        </Row>
        {borderEnabled && (
          <>
            <Row label="Espessura">
              <input type="range" min={1} max={6} value={container.borderWidth ?? 1} onChange={(e) => setContainer({ borderWidth: Number(e.target.value) })} style={{ flex: 1 }} />
              <span style={rightNum}>{container.borderWidth ?? 1}px</span>
            </Row>
            <Row label="Cor borda">
              <ColorPickerPro value={container.borderColor ?? '#e5e7eb'} onChange={(hex) => setContainer({ borderColor: hex })} onEyedropper={() => pickEyedropper((hex) => setContainer({ borderColor: hex }))} />
            </Row>
          </>
        )}
        <Row label="Sombra">
          <Toggle active={container.shadow === true} onClick={() => setContainer({ shadow: !container.shadow })} />
        </Row>
        <Row label="Raio">
          <input type="range" min={0} max={32} value={container.radius ?? 14} onChange={(e) => setContainer({ radius: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{container.radius ?? 14}px</span>
        </Row>
        <Row label="Padding">
          <input type="range" min={0} max={28} value={container.padding ?? 16} onChange={(e) => setContainer({ padding: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{container.padding ?? 16}px</span>
        </Row>
      </CollapsibleSection>

      {/* ========== POSIÇÃO ========== */}
      <CollapsibleSection title="📍 Posição" subtitle="Offset vertical" isOpen={activeSection === 'position'} onToggle={() => setActiveSection(activeSection === 'position' ? null : 'position')}>
        <Row label="Offset Y">
          <input type="range" min={-80} max={80} step={4} value={st.offsetY ?? 0} onChange={(e) => setStyle({ offsetY: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.offsetY ?? 0}px</span>
        </Row>
        <Row label="">
          <Button onClick={() => setStyle({ offsetY: 0 })}>Reset</Button>
        </Row>
      </CollapsibleSection>

    </div>
  )
}

// ===== COMPONENTES AUXILIARES =====

const rightNum: React.CSSProperties = { fontSize: 12, opacity: 0.7, minWidth: 45, textAlign: 'right' }
const selectStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', fontWeight: 600, fontSize: 12, minWidth: 100 }
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
