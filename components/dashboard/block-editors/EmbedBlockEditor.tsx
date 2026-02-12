'use client'

import React, { useState } from 'react'

type EmbedSettings = { embedCode?: string; embedUrl?: string; width?: string; height?: string }
type Props = { settings: EmbedSettings; style?: any; onChangeSettings: (s: EmbedSettings) => void; onChangeStyle: (s: any) => void }

export default function EmbedBlockEditor({ settings, onChangeSettings }: Props) {
  const s = settings || {}
  const [activeSection, setActiveSection] = useState<string | null>('embed')

  const setSettings = (patch: Partial<EmbedSettings>) => onChangeSettings({ ...s, ...patch })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ========== EMBED ========== */}
      <CollapsibleSection title="🔗 Embed" subtitle="Código HTML ou URL" isOpen={activeSection === 'embed'} onToggle={() => setActiveSection(activeSection === 'embed' ? null : 'embed')}>
        <Row label="Código HTML">
          <textarea value={s.embedCode || ''} onChange={(e) => setSettings({ embedCode: e.target.value })} rows={5} placeholder="Cole o código HTML aqui..." style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', fontSize: 12, fontFamily: 'monospace', resize: 'vertical', outline: 'none' }} />
        </Row>
        <Row label="URL iframe">
          <input value={s.embedUrl || ''} onChange={(e) => setSettings({ embedUrl: e.target.value })} placeholder="https://..." style={inputStyle} />
        </Row>
      </CollapsibleSection>

      {/* ========== TAMANHO ========== */}
      <CollapsibleSection title="📐 Tamanho" subtitle="Largura e altura" isOpen={activeSection === 'size'} onToggle={() => setActiveSection(activeSection === 'size' ? null : 'size')}>
        <Row label="Largura">
          <input value={s.width || '100%'} onChange={(e) => setSettings({ width: e.target.value })} placeholder="100%, 600px" style={inputStyle} />
        </Row>
        <Row label="Altura">
          <input value={s.height || '300px'} onChange={(e) => setSettings({ height: e.target.value })} placeholder="300px, 100vh" style={inputStyle} />
        </Row>
      </CollapsibleSection>

    </div>
  )
}

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>{label}</span>
      {children}
    </div>
  )
}
