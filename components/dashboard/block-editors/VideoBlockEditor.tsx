'use client'

import React, { useState, useMemo } from 'react'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import ColorPickerPro from '@/components/editor/ColorPickerPro'
import { uploadCardVideo } from '@/lib/uploadCardVideo'

type VideoSettings = { url: string; title?: string; thumbnailUrl?: string }
type VideoStyle = {
  offsetY?: number
  aspectRatio?: '16:9' | '9:16' | '4:3' | '1:1'
  borderRadius?: number
  shadow?: boolean
  container?: { enabled?: boolean; bgColor?: string; radius?: number; padding?: number; shadow?: boolean; borderWidth?: number; borderColor?: string; widthMode?: 'full' | 'custom'; customWidthPx?: number }
  titleColor?: string
  titleFontSize?: number
  titleAlign?: 'left' | 'center' | 'right'
  showTitle?: boolean
}
type Props = { cardId: string; settings: VideoSettings; style?: VideoStyle; onChangeSettings: (s: VideoSettings) => void; onChangeStyle: (s: VideoStyle) => void }

function parseVideoUrl(url: string): { type: string; videoId?: string; thumbnailUrl?: string } {
  if (!url) return { type: 'unknown' }
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return { type: 'youtube', videoId: ytMatch[1], thumbnailUrl: `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg` }
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return { type: 'vimeo', videoId: vimeoMatch[1] }
  if (url.match(/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i)) return { type: 'direct' }
  return { type: 'unknown' }
}

export default function VideoBlockEditor({ cardId, settings, style, onChangeSettings, onChangeStyle }: Props) {
  const { openPicker } = useColorPicker()
  const s: VideoStyle = style || {}
  const c = s.container || {}
  const [activeSection, setActiveSection] = useState<string | null>('video')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const videoInfo = useMemo(() => parseVideoUrl(settings?.url || ''), [settings?.url])
  const pickEyedropper = (apply: (hex: string) => void) => openPicker({ onPick: apply })
  const setStyle = (patch: Partial<VideoStyle>) => onChangeStyle({ ...s, ...patch })
  const setSettings = (patch: Partial<VideoSettings>) => onChangeSettings({ ...settings, ...patch })
  const setContainer = (patch: Partial<NonNullable<VideoStyle['container']>>) => setStyle({ container: { ...c, ...patch } })
  const bgEnabled = (c.bgColor ?? 'transparent') !== 'transparent'
  const borderEnabled = (c.borderWidth ?? 0) > 0
  const widthCustom = c.widthMode === 'custom'

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const { publicUrl } = await uploadCardVideo({ cardId, file })
      setSettings({ url: publicUrl })
    } catch (err: any) {
      setUploadError(err.message || 'Erro ao enviar vídeo')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <CollapsibleSection title="🎬 Vídeo" subtitle="Upload ou URL" isOpen={activeSection === 'video'} onToggle={() => setActiveSection(activeSection === 'video' ? null : 'video')}>
        <Row label="Upload">
          <input type="file" accept=".mp4,.webm,.mov,.m4v,.ogg,video/*" onChange={handleFileUpload} disabled={uploading} style={{ fontSize: 11, maxWidth: 180 }} />
        </Row>
        {uploading && <div style={{ fontSize: 11, color: '#3b82f6' }}>⏳ A enviar vídeo...</div>}
        {uploadError && <div style={{ fontSize: 11, color: '#ef4444' }}>❌ {uploadError}</div>}
        <div style={{ fontSize: 10, opacity: 0.5 }}>Máx: 50MB • mp4, webm, mov, m4v, ogg</div>
        <Row label="Ou URL">
          <input value={settings.url || ''} onChange={(e) => setSettings({ url: e.target.value })} placeholder="https://youtube.com/watch?v=..." style={inputStyle} />
        </Row>
        {videoInfo.type !== 'unknown' && settings.url && <div style={{ fontSize: 11, color: '#22c55e' }}>✓ {videoInfo.type === 'youtube' ? 'YouTube' : videoInfo.type === 'vimeo' ? 'Vimeo' : 'Vídeo direto'} detetado</div>}
        {settings.url && videoInfo.type === 'unknown' && <div style={{ fontSize: 11, color: '#ef4444' }}>⚠ URL não reconhecido</div>}
        <Row label="Título"><input value={settings.title || ''} onChange={(e) => setSettings({ title: e.target.value })} placeholder="Título do vídeo" style={inputStyle} /></Row>
        <Row label="Thumbnail"><input value={settings.thumbnailUrl || ''} onChange={(e) => setSettings({ thumbnailUrl: e.target.value })} placeholder="URL da imagem de capa" style={inputStyle} /></Row>
        {videoInfo.thumbnailUrl && !settings.thumbnailUrl && <div style={{ fontSize: 10, opacity: 0.5 }}>Thumbnail automática do YouTube será usada</div>}
      </CollapsibleSection>

      <CollapsibleSection title="🎨 Aparência" subtitle="Proporção, cantos, sombra" isOpen={activeSection === 'appearance'} onToggle={() => setActiveSection(activeSection === 'appearance' ? null : 'appearance')}>
        <Row label="Proporção">
          <select value={s.aspectRatio ?? '16:9'} onChange={(e) => setStyle({ aspectRatio: e.target.value as any })} style={selectStyle}>
            <option value="16:9">16:9 Paisagem</option><option value="9:16">9:16 Vertical</option><option value="4:3">4:3 Clássico</option><option value="1:1">1:1 Quadrado</option>
          </select>
        </Row>
        <Row label="Cantos"><input type="range" min={0} max={32} value={s.borderRadius ?? 12} onChange={(e) => setStyle({ borderRadius: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{s.borderRadius ?? 12}px</span></Row>
        <Row label="Sombra"><Toggle active={s.shadow !== false} onClick={() => setStyle({ shadow: s.shadow === false })} /></Row>
      </CollapsibleSection>

      {settings.title && (
        <CollapsibleSection title="📝 Título" subtitle="Cor, tamanho, alinhamento" isOpen={activeSection === 'title'} onToggle={() => setActiveSection(activeSection === 'title' ? null : 'title')}>
          <Row label="Mostrar"><Toggle active={s.showTitle !== false} onClick={() => setStyle({ showTitle: s.showTitle === false })} /></Row>
          {s.showTitle !== false && (<>
            <Row label="Cor"><ColorPickerPro value={s.titleColor ?? '#111827'} onChange={(hex) => setStyle({ titleColor: hex })} onEyedropper={() => pickEyedropper((hex) => setStyle({ titleColor: hex }))} /></Row>
            <Row label="Tamanho"><input type="range" min={12} max={24} value={s.titleFontSize ?? 14} onChange={(e) => setStyle({ titleFontSize: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{s.titleFontSize ?? 14}px</span></Row>
            <Row label="Alinhamento"><div style={{ display: 'flex', gap: 6 }}>{(['left', 'center', 'right'] as const).map((a) => (<MiniButton key={a} active={(s.titleAlign ?? 'left') === a} onClick={() => setStyle({ titleAlign: a })}>{a === 'left' ? '◀' : a === 'center' ? '●' : '▶'}</MiniButton>))}</div></Row>
          </>)}
        </CollapsibleSection>
      )}

      <CollapsibleSection title="📦 Container" subtitle="Fundo, borda, sombra" isOpen={activeSection === 'container'} onToggle={() => setActiveSection(activeSection === 'container' ? null : 'container')}>
        <Row label="Fundo"><Toggle active={bgEnabled} onClick={() => setContainer({ bgColor: bgEnabled ? 'transparent' : '#ffffff' })} /></Row>
        {bgEnabled && <Row label="Cor fundo"><ColorPickerPro value={c.bgColor ?? '#ffffff'} onChange={(hex) => setContainer({ bgColor: hex })} onEyedropper={() => pickEyedropper((hex) => setContainer({ bgColor: hex }))} /></Row>}
        <Row label="Borda"><Toggle active={borderEnabled} onClick={() => setContainer({ borderWidth: borderEnabled ? 0 : 1 })} /></Row>
        {borderEnabled && (<>
          <Row label="Espessura"><input type="range" min={1} max={6} value={c.borderWidth ?? 1} onChange={(e) => setContainer({ borderWidth: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{c.borderWidth ?? 1}px</span></Row>
          <Row label="Cor borda"><ColorPickerPro value={c.borderColor ?? '#e5e7eb'} onChange={(hex) => setContainer({ borderColor: hex })} onEyedropper={() => pickEyedropper((hex) => setContainer({ borderColor: hex }))} /></Row>
        </>)}
        <Row label="Sombra"><Toggle active={c.shadow === true} onClick={() => setContainer({ shadow: !c.shadow })} /></Row>
        <Row label="Raio"><input type="range" min={0} max={32} value={c.radius ?? 0} onChange={(e) => setContainer({ radius: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{c.radius ?? 0}px</span></Row>
        <Row label="Padding"><input type="range" min={0} max={28} value={c.padding ?? 0} onChange={(e) => setContainer({ padding: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{c.padding ?? 0}px</span></Row>
        <Row label="Largura custom"><Toggle active={widthCustom} onClick={() => setContainer({ widthMode: widthCustom ? 'full' : 'custom', customWidthPx: widthCustom ? undefined : 320 })} /></Row>
        {widthCustom && <Row label="Largura"><input type="range" min={200} max={400} step={10} value={c.customWidthPx ?? 320} onChange={(e) => setContainer({ customWidthPx: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{c.customWidthPx ?? 320}px</span></Row>}
      </CollapsibleSection>

      <CollapsibleSection title="📍 Posição" subtitle="Offset vertical" isOpen={activeSection === 'position'} onToggle={() => setActiveSection(activeSection === 'position' ? null : 'position')}>
        <Row label="Offset Y"><input type="range" min={-80} max={80} step={4} value={s.offsetY ?? 0} onChange={(e) => setStyle({ offsetY: Number(e.target.value) })} style={{ flex: 1 }} /><span style={rightNum}>{s.offsetY ?? 0}px</span></Row>
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
