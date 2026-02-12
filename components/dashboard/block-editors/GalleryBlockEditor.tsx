'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import ColorPickerPro from '@/components/editor/ColorPickerPro'
import { FONT_OPTIONS } from '@/lib/fontes'
import { useLanguage } from '@/components/language/LanguageProvider'

type GalleryItem = {
  uid: string
  url: string
  caption?: string
  enabled?: boolean
}

type GallerySettings = {
  heading?: string
  items: GalleryItem[]
  layout?: {
    containerMode?: 'full' | 'moldura' | 'autoadapter'
    gapPx?: number
    sidePaddingPx?: number
    itemWidthPx?: number
    itemHeightPx?: number
    objectFit?: 'cover' | 'contain'
    autoplay?: boolean
    autoplayIntervalMs?: number
    showDots?: boolean
    showArrows?: boolean
    arrowsDesktopOnly?: boolean
  }
}

type GalleryStyle = {
  offsetY?: number
  headingFontSize?: number
  headingFontFamily?: string
  headingFontWeight?: number
  headingColor?: string
  headingBold?: boolean
  headingAlign?: 'left' | 'center' | 'right'
  container?: {
    enabled?: boolean
    bgColor?: string
    radius?: number
    padding?: number
    shadow?: boolean
    borderWidth?: number
    borderColor?: string
  }
  carouselArrowsBg?: string
  carouselArrowsIconColor?: string
  carouselDotsColor?: string
  carouselDotsActiveColor?: string
}

type Props = {
  settings: GallerySettings
  style?: GalleryStyle
  onChangeSettings: (s: GallerySettings) => void
  onChangeStyle: (s: GalleryStyle) => void
  onBlurFlushSave?: () => void
}

function generateUid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export default function GalleryBlockEditor({ settings, style, onChangeSettings, onChangeStyle, onBlurFlushSave }: Props) {
  const { openPicker } = useColorPicker()
  const { t } = useLanguage()
  const [uploading, setUploading] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>('images')

  const s = settings || ({ items: [] } as any)
  const st = style || {}
  const layout = s.layout || {}
  const container = st.container || {}

  const pickEyedropper = (apply: (hex: string) => void) => openPicker({ mode: 'eyedropper', onPick: apply })

  const setStyle = (patch: Partial<GalleryStyle>) => { onChangeStyle({ ...st, ...patch }); onBlurFlushSave?.() }
  const setLayout = (patch: Partial<GallerySettings['layout']>) => { onChangeSettings({ ...s, layout: { ...(layout || {}), ...patch } }); onBlurFlushSave?.() }
  const setContainer = (patch: Partial<GalleryStyle['container']>) => { onChangeStyle({ ...st, container: { ...(container || {}), ...patch } }); onBlurFlushSave?.() }

  const updateItem = (uid: string, patch: Partial<GalleryItem>) => {
    const prev = Array.isArray(s.items) ? s.items : []
    const next = prev.map((it) => (it.uid === uid ? { ...it, ...patch } : it))
    onChangeSettings({ ...s, items: next })
  }

  const removeItem = (uid: string) => {
    const prev = Array.isArray(s.items) ? s.items : []
    onChangeSettings({ ...s, items: prev.filter((it) => it.uid !== uid) })
    onBlurFlushSave?.()
  }

  async function uploadFileSafe(file: File): Promise<string | null> {
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const fileName = `${generateUid()}.${ext}`
      const filePath = `gallery/${fileName}`
      const { error } = await supabase.storage.from('card-assets').upload(filePath, file, { cacheControl: '3600', upsert: false })
      if (error) { console.error('Supabase upload error:', error); return null }
      const { data } = supabase.storage.from('card-assets').getPublicUrl(filePath)
      return data?.publicUrl ?? null
    } catch (e) { console.error('Upload threw:', e); return null }
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length === 0) return
    setUploading(true)
    try {
      let nextItems = Array.isArray(s.items) ? [...s.items] : []
      for (const file of files) {
        const url = await uploadFileSafe(file)
        if (!url) { alert('Erro ao enviar uma das imagens.'); continue }
        nextItems = [...nextItems, { uid: generateUid(), url, enabled: true }]
      }
      onChangeSettings({ ...s, items: nextItems })
      onBlurFlushSave?.()
    } finally { setUploading(false); e.currentTarget.value = '' }
  }

  const bgEnabled = (container.bgColor ?? 'transparent') !== 'transparent'
  const borderEnabled = (container.borderWidth ?? 0) > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ========== IMAGENS ========== */}
      <CollapsibleSection title="🖼️ Imagens" subtitle="Upload e gestão" isOpen={activeSection === 'images'} onToggle={() => setActiveSection(activeSection === 'images' ? null : 'images')}>
        <Row label="Upload">
          <input type="file" accept="image/*" multiple onChange={onFileChange} disabled={uploading} style={{ fontSize: 12 }} />
        </Row>
        {uploading && <div style={{ fontSize: 12, opacity: 0.7 }}>A enviar imagens…</div>}

        {(Array.isArray(s.items) ? s.items : []).map((it) => (
          <div key={it.uid} style={{ padding: 12, background: it.enabled !== false ? 'rgba(59,130,246,0.05)' : 'rgba(0,0,0,0.02)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, border: it.enabled !== false ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <img src={it.url} alt={it.caption || 'Imagem'} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8 }} loading="lazy" />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Toggle active={it.enabled !== false} onClick={() => { updateItem(it.uid, { enabled: !(it.enabled !== false) }); onBlurFlushSave?.() }} />
                <button onClick={() => removeItem(it.uid)} style={{ color: '#e53e3e', border: 'none', background: 'none', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>×</button>
              </div>
            </div>
            <Row label="Legenda">
              <input type="text" value={it.caption ?? ''} onChange={(e) => updateItem(it.uid, { caption: e.target.value })} onBlur={() => onBlurFlushSave?.()} placeholder="Legenda" style={inputStyle} />
            </Row>
          </div>
        ))}
      </CollapsibleSection>

      {/* ========== TÍTULO ========== */}
      <CollapsibleSection title="📝 Título" subtitle="Texto, cor, fonte" isOpen={activeSection === 'title'} onToggle={() => setActiveSection(activeSection === 'title' ? null : 'title')}>
        <Row label="Texto">
          <input type="text" value={s.heading ?? 'Galeria'} onChange={(e) => onChangeSettings({ ...s, heading: e.target.value })} onBlur={() => onBlurFlushSave?.()} placeholder="Galeria" style={inputStyle} />
        </Row>
        <Row label="Alinhamento">
          <div style={{ display: 'flex', gap: 6 }}>
            {(['left', 'center', 'right'] as const).map((a) => (
              <MiniButton key={a} active={(st.headingAlign ?? 'left') === a} onClick={() => setStyle({ headingAlign: a })}>
                {a === 'left' ? '◀' : a === 'center' ? '●' : '▶'}
              </MiniButton>
            ))}
          </div>
        </Row>
        <Row label="Cor">
          <ColorPickerPro value={st.headingColor ?? '#111827'} onChange={(hex) => setStyle({ headingColor: hex })} onEyedropper={() => pickEyedropper((hex) => setStyle({ headingColor: hex }))} />
        </Row>
        <Row label="Negrito">
          <Toggle active={st.headingBold ?? true} onClick={() => setStyle({ headingBold: !(st.headingBold ?? true) })} />
        </Row>
        <Row label="Fonte">
          <select value={st.headingFontFamily ?? ''} onChange={(e) => setStyle({ headingFontFamily: e.target.value || '' })} style={selectStyle}>
            <option value="">Padrão</option>
            {FONT_OPTIONS.map((o) => (<option key={o.label} value={o.value}>{o.label}</option>))}
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
        <Row label="Tamanho">
          <input type="range" min={10} max={32} value={st.headingFontSize ?? 13} onChange={(e) => setStyle({ headingFontSize: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.headingFontSize ?? 13}px</span>
        </Row>
      </CollapsibleSection>

      {/* ========== LAYOUT ========== */}
      <CollapsibleSection title="🎛 Layout" subtitle="Modo, tamanhos, espaçamento" isOpen={activeSection === 'layout'} onToggle={() => setActiveSection(activeSection === 'layout' ? null : 'layout')}>
        <Row label="Modo">
          <div style={{ display: 'flex', gap: 6 }}>
            <MiniButton active={(layout.containerMode ?? 'full') === 'full'} onClick={() => setLayout({ containerMode: 'full' })}>Full</MiniButton>
            <MiniButton active={layout.containerMode === 'moldura'} onClick={() => setLayout({ containerMode: 'moldura' })}>Moldura</MiniButton>
            <MiniButton active={layout.containerMode === 'autoadapter'} onClick={() => setLayout({ containerMode: 'autoadapter' })}>Auto</MiniButton>
          </div>
        </Row>
        <Row label="Gap">
          <input type="range" min={0} max={64} value={layout.gapPx ?? 16} onChange={(e) => setLayout({ gapPx: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{layout.gapPx ?? 16}px</span>
        </Row>
        <Row label="Padding lateral">
          <input type="range" min={0} max={64} value={layout.sidePaddingPx ?? 16} onChange={(e) => setLayout({ sidePaddingPx: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{layout.sidePaddingPx ?? 16}px</span>
        </Row>
        <Row label="Largura item">
          <input type="range" min={40} max={400} step={10} value={layout.itemWidthPx ?? 180} onChange={(e) => setLayout({ itemWidthPx: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{layout.itemWidthPx ?? 180}px</span>
        </Row>
        <Row label="Altura item">
          <input type="range" min={40} max={400} step={10} value={layout.itemHeightPx ?? 120} onChange={(e) => setLayout({ itemHeightPx: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{layout.itemHeightPx ?? 120}px</span>
        </Row>
        <Row label="Object fit">
          <div style={{ display: 'flex', gap: 6 }}>
            <MiniButton active={(layout.objectFit ?? 'cover') === 'cover'} onClick={() => setLayout({ objectFit: 'cover' })}>Cover</MiniButton>
            <MiniButton active={layout.objectFit === 'contain'} onClick={() => setLayout({ objectFit: 'contain' })}>Contain</MiniButton>
          </div>
        </Row>
      </CollapsibleSection>

      {/* ========== CARROSSEL ========== */}
      <CollapsibleSection title="🎠 Carrossel" subtitle="Autoplay, setas, pontos" isOpen={activeSection === 'carousel'} onToggle={() => setActiveSection(activeSection === 'carousel' ? null : 'carousel')}>
        <Row label="Autoplay">
          <Toggle active={layout.autoplay !== false} onClick={() => setLayout({ autoplay: !(layout.autoplay !== false) })} />
        </Row>
        {layout.autoplay !== false && (
          <Row label="Intervalo">
            <input type="range" min={1000} max={10000} step={500} value={layout.autoplayIntervalMs ?? 3500} onChange={(e) => setLayout({ autoplayIntervalMs: Number(e.target.value) })} style={{ flex: 1 }} />
            <span style={rightNum}>{layout.autoplayIntervalMs ?? 3500}ms</span>
          </Row>
        )}
        <Row label="Mostrar setas">
          <Toggle active={layout.showArrows === true} onClick={() => setLayout({ showArrows: !(layout.showArrows === true) })} />
        </Row>
        {layout.showArrows && (
          <Row label="Só desktop">
            <Toggle active={layout.arrowsDesktopOnly !== false} onClick={() => setLayout({ arrowsDesktopOnly: !(layout.arrowsDesktopOnly !== false) })} />
          </Row>
        )}
        <Row label="Mostrar pontos">
          <Toggle active={layout.showDots !== false} onClick={() => setLayout({ showDots: !(layout.showDots !== false) })} />
        </Row>
      </CollapsibleSection>

      {/* ========== CORES CARROSSEL ========== */}
      <CollapsibleSection title="🎨 Cores carrossel" subtitle="Setas, pontos" isOpen={activeSection === 'carouselColors'} onToggle={() => setActiveSection(activeSection === 'carouselColors' ? null : 'carouselColors')}>
        <Row label="Fundo setas">
          <ColorPickerPro value={st.carouselArrowsBg ?? 'rgba(255,255,255,0.9)'} onChange={(hex) => setStyle({ carouselArrowsBg: hex })} onEyedropper={() => pickEyedropper((hex) => setStyle({ carouselArrowsBg: hex }))} />
        </Row>
        <Row label="Ícone setas">
          <ColorPickerPro value={st.carouselArrowsIconColor ?? '#111827'} onChange={(hex) => setStyle({ carouselArrowsIconColor: hex })} onEyedropper={() => pickEyedropper((hex) => setStyle({ carouselArrowsIconColor: hex }))} />
        </Row>
        <Row label="Pontos inativos">
          <ColorPickerPro value={st.carouselDotsColor ?? 'rgba(0,0,0,0.25)'} onChange={(hex) => setStyle({ carouselDotsColor: hex })} onEyedropper={() => pickEyedropper((hex) => setStyle({ carouselDotsColor: hex }))} />
        </Row>
        <Row label="Pontos ativos">
          <ColorPickerPro value={st.carouselDotsActiveColor ?? 'rgba(0,0,0,0.65)'} onChange={(hex) => setStyle({ carouselDotsActiveColor: hex })} onEyedropper={() => pickEyedropper((hex) => setStyle({ carouselDotsActiveColor: hex }))} />
        </Row>
      </CollapsibleSection>

      {/* ========== CONTAINER ========== */}
      <CollapsibleSection title="📦 Container" subtitle="Fundo, borda, padding" isOpen={activeSection === 'container'} onToggle={() => setActiveSection(activeSection === 'container' ? null : 'container')}>
        <Row label="Fundo">
          <Toggle active={bgEnabled} onClick={() => setContainer({ enabled: true, bgColor: bgEnabled ? 'transparent' : '#ffffff' })} />
        </Row>
        {bgEnabled && (
          <Row label="Cor">
            <ColorPickerPro value={container.bgColor ?? '#ffffff'} onChange={(hex) => setContainer({ bgColor: hex })} onEyedropper={() => pickEyedropper((hex) => setContainer({ bgColor: hex }))} />
          </Row>
        )}
        <Row label="Sombra">
          <Toggle active={container.shadow ?? false} onClick={() => setContainer({ shadow: !container.shadow })} />
        </Row>
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
              <ColorPickerPro value={container.borderColor ?? 'rgba(0,0,0,0.08)'} onChange={(hex) => setContainer({ borderColor: hex })} onEyedropper={() => pickEyedropper((hex) => setContainer({ borderColor: hex }))} />
            </Row>
          </>
        )}
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
  return (
    <button onClick={onClick} style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.10)', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
      {children}
    </button>
  )
}

function MiniButton({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} style={{ padding: '6px 14px', borderRadius: 10, border: active ? '2px solid #3b82f6' : '1px solid rgba(0,0,0,0.10)', background: active ? 'rgba(59,130,246,0.1)' : '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 11, color: active ? '#3b82f6' : '#333', minWidth: 50, whiteSpace: 'nowrap' }}>
      {children}
    </button>
  )
}

function Toggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: 44, height: 24, borderRadius: 999, background: active ? '#3b82f6' : '#e5e7eb', position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
      <span style={{ position: 'absolute', top: 2, left: active ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
    </button>
  )
}
