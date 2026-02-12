'use client'

import React, { useState } from 'react'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import ColorPickerPro from '@/components/editor/ColorPickerPro'
import FontPicker from '@/components/editor/FontPicker'
import { useLanguage } from '@/components/language/LanguageProvider'

type SocialChannel = 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'website'
type SocialItem = { enabled?: boolean; label?: string; url?: string }
type ButtonGradient = { from?: string; to?: string; angle?: number }

type ButtonStyle = {
  sizePx?: number
  radius?: number
  bgColor?: string
  bgMode?: 'solid' | 'gradient'
  bgGradient?: ButtonGradient
  borderEnabled?: boolean
  borderWidth?: number
  borderColor?: string
  iconColor?: string
  shadow?: boolean
  textColor?: string
  fontFamily?: string
  fontWeight?: number
  labelFontSize?: number
  paddingY?: number
  paddingX?: number
  iconScale?: number
}

type SocialSettings = {
  heading?: string
  layout?: { direction?: 'row' | 'column'; align?: 'left' | 'center' | 'right'; gapPx?: number }
  items?: Partial<Record<SocialChannel, SocialItem>>
}

type SocialStyle = {
  offsetY?: number
  showLabel?: boolean
  uniformButtons?: boolean
  uniformWidthPx?: number
  uniformHeightPx?: number
  uniformContentAlign?: 'left' | 'center'
  headingFontSize?: number
  headingFontFamily?: string
  headingFontWeight?: number
  headingColor?: string
  headingBold?: boolean
  headingAlign?: 'left' | 'center' | 'right'
  container?: { bgColor?: string; radius?: number; padding?: number; shadow?: boolean; borderWidth?: number; borderColor?: string }
  buttonDefaults?: ButtonStyle
  brandColors?: boolean
  brandMode?: 'bg' | 'icon'
}

type CombinedState = { settings: SocialSettings; style: SocialStyle }
type Props = { settings: SocialSettings; style?: SocialStyle; onChange: (next: CombinedState) => void }

const CHANNELS: Array<{ key: SocialChannel; title: string; placeholder: string; icon: string }> = [
  { key: 'facebook', title: 'Facebook', placeholder: 'https://facebook.com/...', icon: '📘' },
  { key: 'instagram', title: 'Instagram', placeholder: 'https://instagram.com/...', icon: '📷' },
  { key: 'linkedin', title: 'LinkedIn', placeholder: 'https://linkedin.com/in/...', icon: '💼' },
  { key: 'tiktok', title: 'TikTok', placeholder: 'https://tiktok.com/@...', icon: '🎵' },
  { key: 'youtube', title: 'YouTube', placeholder: 'https://youtube.com/@...', icon: '▶️' },
  { key: 'website', title: 'Website', placeholder: 'https://teusite.com', icon: '🌐' },
]

function clampNum(v: any, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function inferChannelFromUrl(url: string): SocialChannel | null {
  const u = (url || '').toLowerCase()
  if (u.includes('facebook.com')) return 'facebook'
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('linkedin.com')) return 'linkedin'
  if (u.includes('tiktok.com')) return 'tiktok'
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  return null
}

function coerceItems(input: any): Partial<Record<SocialChannel, SocialItem>> {
  if (!input) return {}
  if (Array.isArray(input)) {
    const out: Partial<Record<SocialChannel, SocialItem>> = {}
    for (const it of input) {
      const ch: SocialChannel | null = (it?.id as SocialChannel) || inferChannelFromUrl(it?.url) || null
      if (!ch) continue
      out[ch] = { enabled: it?.enabled ?? true, label: it?.label ?? '', url: it?.url ?? '' }
    }
    return out
  }
  if (typeof input === 'object') return input
  return {}
}

function normalizeCombined(inputSettings: SocialSettings, inputStyle?: SocialStyle): CombinedState {
  const settings: SocialSettings = {
    heading: inputSettings.heading ?? 'Redes Sociais',
    layout: { direction: inputSettings.layout?.direction ?? 'row', align: inputSettings.layout?.align ?? 'center', gapPx: inputSettings.layout?.gapPx ?? 10 },
    items: coerceItems((inputSettings as any).items),
  }
  const style: SocialStyle = {
    offsetY: inputStyle?.offsetY ?? 0,
    showLabel: inputStyle?.showLabel ?? true,
    uniformButtons: inputStyle?.uniformButtons ?? false,
    uniformWidthPx: inputStyle?.uniformWidthPx ?? 160,
    uniformHeightPx: inputStyle?.uniformHeightPx ?? 52,
    uniformContentAlign: inputStyle?.uniformContentAlign ?? 'center',
    headingFontSize: inputStyle?.headingFontSize ?? 13,
    headingFontFamily: inputStyle?.headingFontFamily ?? '',
    headingFontWeight: inputStyle?.headingFontWeight ?? 900,
    headingColor: inputStyle?.headingColor ?? '#111827',
    headingBold: inputStyle?.headingBold ?? true,
    headingAlign: inputStyle?.headingAlign ?? 'left',
    container: {
      bgColor: inputStyle?.container?.bgColor ?? 'transparent',
      radius: inputStyle?.container?.radius ?? 14,
      padding: inputStyle?.container?.padding ?? 16,
      shadow: inputStyle?.container?.shadow ?? false,
      borderWidth: inputStyle?.container?.borderWidth ?? 0,
      borderColor: inputStyle?.container?.borderColor ?? 'rgba(0,0,0,0.08)',
    },
    buttonDefaults: {
      sizePx: inputStyle?.buttonDefaults?.sizePx ?? 44,
      radius: inputStyle?.buttonDefaults?.radius ?? 14,
      bgColor: inputStyle?.buttonDefaults?.bgColor ?? '#ffffff',
      bgMode: inputStyle?.buttonDefaults?.bgMode ?? 'solid',
      bgGradient: inputStyle?.buttonDefaults?.bgGradient ?? { from: '#111827', to: '#374151', angle: 135 },
      borderEnabled: inputStyle?.buttonDefaults?.borderEnabled ?? true,
      borderWidth: inputStyle?.buttonDefaults?.borderWidth ?? 1,
      borderColor: inputStyle?.buttonDefaults?.borderColor ?? 'rgba(0,0,0,0.10)',
      iconColor: inputStyle?.buttonDefaults?.iconColor ?? '#111827',
      shadow: inputStyle?.buttonDefaults?.shadow ?? false,
      textColor: inputStyle?.buttonDefaults?.textColor ?? '#111827',
      fontFamily: inputStyle?.buttonDefaults?.fontFamily ?? '',
      fontWeight: inputStyle?.buttonDefaults?.fontWeight ?? 800,
      labelFontSize: inputStyle?.buttonDefaults?.labelFontSize ?? 13,
      paddingY: inputStyle?.buttonDefaults?.paddingY ?? 10,
      paddingX: inputStyle?.buttonDefaults?.paddingX ?? 12,
      iconScale: inputStyle?.buttonDefaults?.iconScale ?? 0.58,
    },
    brandColors: inputStyle?.brandColors ?? false,
    brandMode: inputStyle?.brandMode ?? 'bg',
  }
  return { settings, style }
}

export default function SocialBlockEditor({ settings, style, onChange }: Props) {
  const { openPicker } = useColorPicker()
  const { t } = useLanguage()
  const [local, setLocal] = useState<CombinedState>(() => normalizeCombined(settings, style))
  const [activeSection, setActiveSection] = useState<string | null>('channels')

  React.useEffect(() => setLocal(normalizeCombined(settings, style)), [settings, style])

  function patch(fn: (d: CombinedState) => void) {
    const next = structuredClone(local)
    fn(next)
    next.settings.items = coerceItems((next.settings as any).items)
    setLocal(next)
    onChange(next)
  }

  const s = local.settings
  const st = local.style
  const layout = s.layout || {}
  const items = coerceItems((s as any).items)
  const container = st.container || {}
  const btn = st.buttonDefaults || {}

  const pickEyedropper = (apply: (hex: string) => void) => openPicker({ mode: 'eyedropper', onPick: apply })

  const bgEnabled = (container.bgColor ?? 'transparent') !== 'transparent'
  const borderEnabled = (container.borderWidth ?? 0) > 0
  const defaultsBorderEnabled = btn.borderEnabled ?? true
  const defaultsBgMode = (btn.bgMode ?? 'solid') as 'solid' | 'gradient'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ========== REDES SOCIAIS (LINKS) ========== */}
      <CollapsibleSection title="🔗 Redes sociais" subtitle="Facebook, Instagram, LinkedIn, etc." isOpen={activeSection === 'channels'} onToggle={() => setActiveSection(activeSection === 'channels' ? null : 'channels')}>
        {CHANNELS.map((cdef) => {
          const it = items[cdef.key] || {}
          const isEnabled = it.enabled ?? false
          return (
            <div key={cdef.key} style={{ padding: 12, background: isEnabled ? 'rgba(59,130,246,0.05)' : 'rgba(0,0,0,0.02)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, border: isEnabled ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{cdef.icon} {cdef.title}</span>
                <Toggle active={isEnabled} onClick={() => patch((d) => {
                  const obj = coerceItems((d.settings as any).items)
                  const cur = obj[cdef.key] || {}
                  obj[cdef.key] = { ...cur, enabled: !isEnabled }
                  d.settings.items = obj
                })} />
              </div>
              {isEnabled && (
                <>
                  <Row label="URL">
                    <input type="text" value={it.url ?? ''} onChange={(e) => patch((d) => {
                      const obj = coerceItems((d.settings as any).items)
                      const cur = obj[cdef.key] || {}
                      obj[cdef.key] = { ...cur, url: e.target.value }
                      d.settings.items = obj
                    })} placeholder={cdef.placeholder} style={inputStyle} />
                  </Row>
                  <Row label="Label">
                    <input type="text" value={it.label ?? ''} onChange={(e) => patch((d) => {
                      const obj = coerceItems((d.settings as any).items)
                      const cur = obj[cdef.key] || {}
                      obj[cdef.key] = { ...cur, label: e.target.value }
                      d.settings.items = obj
                    })} placeholder={cdef.title} style={inputStyle} />
                  </Row>
                </>
              )}
            </div>
          )
        })}
      </CollapsibleSection>

      {/* ========== TÍTULO ========== */}
      <CollapsibleSection title="📝 Título" subtitle="Texto, cor, fonte" isOpen={activeSection === 'title'} onToggle={() => setActiveSection(activeSection === 'title' ? null : 'title')}>
        <Row label="Texto">
          <input type="text" value={s.heading ?? ''} onChange={(e) => patch((d) => (d.settings.heading = e.target.value))} placeholder="Redes Sociais" style={inputStyle} />
        </Row>
        <Row label="Alinhamento">
          <div style={{ display: 'flex', gap: 6 }}>
            {(['left', 'center', 'right'] as const).map((a) => (
              <MiniButton key={a} active={(st.headingAlign ?? 'left') === a} onClick={() => patch((d) => (d.style.headingAlign = a))}>
                {a === 'left' ? '◀' : a === 'center' ? '●' : '▶'}
              </MiniButton>
            ))}
          </div>
        </Row>
        <Row label="Cor">
          <ColorPickerPro value={st.headingColor ?? '#111827'} onChange={(hex) => patch((d) => (d.style.headingColor = hex))} onEyedropper={() => pickEyedropper((hex) => patch((d) => (d.style.headingColor = hex)))} />
        </Row>
        <Row label="Negrito">
          <Toggle active={st.headingBold ?? true} onClick={() => patch((d) => (d.style.headingBold = !(st.headingBold ?? true)))} />
        </Row>
        <Row label="Fonte"><FontPicker value={st.headingFontFamily ?? ""} onChange={(v) => patch((d) => (d.style.headingFontFamily = v || ""))} /></Row>
        <Row label="Peso">
          <select value={String(st.headingFontWeight ?? 900)} onChange={(e) => patch((d) => (d.style.headingFontWeight = clampNum(e.target.value, 900)))} style={selectStyle}>
            <option value="400">Normal</option>
            <option value="600">Semi</option>
            <option value="700">Bold</option>
            <option value="800">Extra</option>
            <option value="900">Black</option>
          </select>
        </Row>
        <Row label="Tamanho">
          <input type="range" min={10} max={28} value={st.headingFontSize ?? 13} onChange={(e) => patch((d) => (d.style.headingFontSize = Number(e.target.value)))} style={{ flex: 1 }} />
          <span style={rightNum}>{st.headingFontSize ?? 13}px</span>
        </Row>
      </CollapsibleSection>

      {/* ========== LAYOUT ========== */}
      <CollapsibleSection title="🎛 Layout" subtitle="Direção, espaçamento" isOpen={activeSection === 'layout'} onToggle={() => setActiveSection(activeSection === 'layout' ? null : 'layout')}>
        <Row label="Direção">
          <div style={{ display: 'flex', gap: 6 }}>
            <MiniButton active={(layout.direction ?? 'row') === 'row'} onClick={() => patch((d) => (d.settings.layout = { ...layout, direction: 'row' }))}>Linha</MiniButton>
            <MiniButton active={layout.direction === 'column'} onClick={() => patch((d) => (d.settings.layout = { ...layout, direction: 'column' }))}>Coluna</MiniButton>
          </div>
        </Row>
        <Row label="Alinhamento">
          <div style={{ display: 'flex', gap: 6 }}>
            {(['left', 'center', 'right'] as const).map((a) => (
              <MiniButton key={a} active={(layout.align ?? 'center') === a} onClick={() => patch((d) => (d.settings.layout = { ...layout, align: a }))}>
                {a === 'left' ? '◀' : a === 'center' ? '●' : '▶'}
              </MiniButton>
            ))}
          </div>
        </Row>
        <Row label="Espaçamento">
          <input type="range" min={0} max={28} step={2} value={layout.gapPx ?? 10} onChange={(e) => patch((d) => (d.settings.layout = { ...layout, gapPx: Number(e.target.value) }))} style={{ flex: 1 }} />
          <span style={rightNum}>{layout.gapPx ?? 10}px</span>
        </Row>
        <Row label="Mostrar texto">
          <Toggle active={st.showLabel ?? true} onClick={() => patch((d) => (d.style.showLabel = !(st.showLabel ?? true)))} />
        </Row>
        <Row label="Uniforme">
          <Toggle active={st.uniformButtons ?? false} onClick={() => patch((d) => (d.style.uniformButtons = !(st.uniformButtons ?? false)))} />
        </Row>
        {st.uniformButtons && (
          <>
            <Row label="Largura">
              <input type="range" min={80} max={300} step={10} value={st.uniformWidthPx ?? 160} onChange={(e) => patch((d) => (d.style.uniformWidthPx = Number(e.target.value)))} style={{ flex: 1 }} />
              <span style={rightNum}>{st.uniformWidthPx ?? 160}px</span>
            </Row>
            <Row label="Altura">
              <input type="range" min={32} max={80} step={4} value={st.uniformHeightPx ?? 52} onChange={(e) => patch((d) => (d.style.uniformHeightPx = Number(e.target.value)))} style={{ flex: 1 }} />
              <span style={rightNum}>{st.uniformHeightPx ?? 52}px</span>
            </Row>
            <Row label="Conteúdo">
              <div style={{ display: 'flex', gap: 6 }}>
                <MiniButton active={(st.uniformContentAlign ?? 'center') === 'left'} onClick={() => patch((d) => (d.style.uniformContentAlign = 'left'))}>◀</MiniButton>
                <MiniButton active={(st.uniformContentAlign ?? 'center') === 'center'} onClick={() => patch((d) => (d.style.uniformContentAlign = 'center'))}>●</MiniButton>
              </div>
            </Row>
          </>
        )}
        <Row label="Cores de marca">
          <Toggle active={st.brandColors ?? false} onClick={() => patch((d) => (d.style.brandColors = !(st.brandColors ?? false)))} />
        </Row>
        {st.brandColors && (
          <Row label="Modo">
            <div style={{ display: 'flex', gap: 6 }}>
              <MiniButton active={(st.brandMode ?? 'bg') === 'bg'} onClick={() => patch((d) => (d.style.brandMode = 'bg'))}>Fundo</MiniButton>
              <MiniButton active={st.brandMode === 'icon'} onClick={() => patch((d) => (d.style.brandMode = 'icon'))}>Ícone</MiniButton>
            </div>
          </Row>
        )}
      </CollapsibleSection>

      {/* ========== CONTAINER ========== */}
      <CollapsibleSection title="📦 Container" subtitle="Fundo, borda, padding" isOpen={activeSection === 'container'} onToggle={() => setActiveSection(activeSection === 'container' ? null : 'container')}>
        <Row label="Fundo">
          <Toggle active={bgEnabled} onClick={() => patch((d) => (d.style.container = { ...container, bgColor: bgEnabled ? 'transparent' : '#ffffff' }))} />
        </Row>
        {bgEnabled && (
          <Row label="Cor">
            <ColorPickerPro value={container.bgColor ?? '#ffffff'} onChange={(hex) => patch((d) => (d.style.container = { ...container, bgColor: hex }))} onEyedropper={() => pickEyedropper((hex) => patch((d) => (d.style.container = { ...container, bgColor: hex })))} />
          </Row>
        )}
        <Row label="Sombra">
          <Toggle active={container.shadow ?? false} onClick={() => patch((d) => (d.style.container = { ...container, shadow: !container.shadow }))} />
        </Row>
        <Row label="Borda">
          <Toggle active={borderEnabled} onClick={() => patch((d) => (d.style.container = { ...container, borderWidth: borderEnabled ? 0 : 1 }))} />
        </Row>
        {borderEnabled && (
          <>
            <Row label="Espessura">
              <input type="range" min={1} max={6} value={container.borderWidth ?? 1} onChange={(e) => patch((d) => (d.style.container = { ...container, borderWidth: Number(e.target.value) }))} style={{ flex: 1 }} />
              <span style={rightNum}>{container.borderWidth ?? 1}px</span>
            </Row>
            <Row label="Cor borda">
              <ColorPickerPro value={container.borderColor ?? 'rgba(0,0,0,0.08)'} onChange={(hex) => patch((d) => (d.style.container = { ...container, borderColor: hex }))} onEyedropper={() => pickEyedropper((hex) => patch((d) => (d.style.container = { ...container, borderColor: hex })))} />
            </Row>
          </>
        )}
        <Row label="Raio">
          <input type="range" min={0} max={32} step={2} value={container.radius ?? 14} onChange={(e) => patch((d) => (d.style.container = { ...container, radius: Number(e.target.value) }))} style={{ flex: 1 }} />
          <span style={rightNum}>{container.radius ?? 14}px</span>
        </Row>
        <Row label="Padding">
          <input type="range" min={0} max={32} step={2} value={container.padding ?? 16} onChange={(e) => patch((d) => (d.style.container = { ...container, padding: Number(e.target.value) }))} style={{ flex: 1 }} />
          <span style={rightNum}>{container.padding ?? 16}px</span>
        </Row>
      </CollapsibleSection>

      {/* ========== ESTILO DOS BOTÕES ========== */}
      <CollapsibleSection title="🎨 Estilo dos botões" subtitle="Cores, tamanhos, fonte" isOpen={activeSection === 'btnDefaults'} onToggle={() => setActiveSection(activeSection === 'btnDefaults' ? null : 'btnDefaults')}>
        <Row label="Tamanho">
          <input type="range" min={24} max={64} value={btn.sizePx ?? 44} onChange={(e) => patch((d) => (d.style.buttonDefaults = { ...btn, sizePx: Number(e.target.value) }))} style={{ flex: 1 }} />
          <span style={rightNum}>{btn.sizePx ?? 44}px</span>
        </Row>
        <Row label="Raio">
          <input type="range" min={0} max={32} value={btn.radius ?? 14} onChange={(e) => patch((d) => (d.style.buttonDefaults = { ...btn, radius: Number(e.target.value) }))} style={{ flex: 1 }} />
          <span style={rightNum}>{btn.radius ?? 14}px</span>
        </Row>
        <Row label="Modo fundo">
          <div style={{ display: 'flex', gap: 6 }}>
            <MiniButton active={defaultsBgMode === 'solid'} onClick={() => patch((d) => (d.style.buttonDefaults = { ...btn, bgMode: 'solid' }))}>Sólido</MiniButton>
            <MiniButton active={defaultsBgMode === 'gradient'} onClick={() => patch((d) => (d.style.buttonDefaults = { ...btn, bgMode: 'gradient' }))}>Degradê</MiniButton>
          </div>
        </Row>
        {defaultsBgMode === 'solid' && (
          <Row label="Cor fundo">
            <ColorPickerPro value={btn.bgColor ?? '#ffffff'} onChange={(hex) => patch((d) => (d.style.buttonDefaults = { ...btn, bgColor: hex }))} onEyedropper={() => pickEyedropper((hex) => patch((d) => (d.style.buttonDefaults = { ...btn, bgColor: hex })))} />
          </Row>
        )}
        {defaultsBgMode === 'gradient' && (
          <>
            <Row label="Cor inicial">
              <ColorPickerPro value={btn.bgGradient?.from ?? '#111827'} onChange={(hex) => patch((d) => (d.style.buttonDefaults = { ...btn, bgGradient: { ...(btn.bgGradient || {}), from: hex } }))} onEyedropper={() => pickEyedropper((hex) => patch((d) => (d.style.buttonDefaults = { ...btn, bgGradient: { ...(btn.bgGradient || {}), from: hex } })))} />
            </Row>
            <Row label="Cor final">
              <ColorPickerPro value={btn.bgGradient?.to ?? '#374151'} onChange={(hex) => patch((d) => (d.style.buttonDefaults = { ...btn, bgGradient: { ...(btn.bgGradient || {}), to: hex } }))} onEyedropper={() => pickEyedropper((hex) => patch((d) => (d.style.buttonDefaults = { ...btn, bgGradient: { ...(btn.bgGradient || {}), to: hex } })))} />
            </Row>
            <Row label="Ângulo">
              <input type="range" min={0} max={360} step={15} value={btn.bgGradient?.angle ?? 135} onChange={(e) => patch((d) => (d.style.buttonDefaults = { ...btn, bgGradient: { ...(btn.bgGradient || {}), angle: Number(e.target.value) } }))} style={{ flex: 1 }} />
              <span style={rightNum}>{btn.bgGradient?.angle ?? 135}°</span>
            </Row>
          </>
        )}
        <Row label="Borda">
          <Toggle active={defaultsBorderEnabled} onClick={() => patch((d) => (d.style.buttonDefaults = { ...btn, borderEnabled: !defaultsBorderEnabled }))} />
        </Row>
        {defaultsBorderEnabled && (
          <>
            <Row label="Espessura">
              <input type="range" min={1} max={6} value={btn.borderWidth ?? 1} onChange={(e) => patch((d) => (d.style.buttonDefaults = { ...btn, borderWidth: Number(e.target.value) }))} style={{ flex: 1 }} />
              <span style={rightNum}>{btn.borderWidth ?? 1}px</span>
            </Row>
            <Row label="Cor borda">
              <ColorPickerPro value={btn.borderColor ?? 'rgba(0,0,0,0.10)'} onChange={(hex) => patch((d) => (d.style.buttonDefaults = { ...btn, borderColor: hex }))} onEyedropper={() => pickEyedropper((hex) => patch((d) => (d.style.buttonDefaults = { ...btn, borderColor: hex })))} />
            </Row>
          </>
        )}
        <Row label="Cor ícone">
          <ColorPickerPro value={btn.iconColor ?? '#111827'} onChange={(hex) => patch((d) => (d.style.buttonDefaults = { ...btn, iconColor: hex }))} onEyedropper={() => pickEyedropper((hex) => patch((d) => (d.style.buttonDefaults = { ...btn, iconColor: hex })))} />
        </Row>
        <Row label="Cor texto">
          <ColorPickerPro value={btn.textColor ?? '#111827'} onChange={(hex) => patch((d) => (d.style.buttonDefaults = { ...btn, textColor: hex }))} onEyedropper={() => pickEyedropper((hex) => patch((d) => (d.style.buttonDefaults = { ...btn, textColor: hex })))} />
        </Row>
        <Row label="Fonte">
        <Row label="Fonte"><FontPicker value={btn.fontFamily ?? ""} onChange={(v) => patch((d) => (d.style.buttonDefaults = { ...btn, fontFamily: v || "" }))} /></Row>
        <Row label="Peso">
          <select value={String(btn.fontWeight ?? 800)} onChange={(e) => patch((d) => (d.style.buttonDefaults = { ...btn, fontWeight: clampNum(e.target.value, 800) }))} style={selectStyle}>
            <option value="400">Normal</option>
            <option value="600">Semi</option>
            <option value="700">Bold</option>
            <option value="800">Extra</option>
            <option value="900">Black</option>
          </select>
        </Row>
        <Row label="Tamanho texto">
          <input type="range" min={8} max={24} value={btn.labelFontSize ?? 13} onChange={(e) => patch((d) => (d.style.buttonDefaults = { ...btn, labelFontSize: Number(e.target.value) }))} style={{ flex: 1 }} />
          <span style={rightNum}>{btn.labelFontSize ?? 13}px</span>
        </Row>
        <Row label="Escala ícone">
          <input type="range" min={0.4} max={0.9} step={0.02} value={btn.iconScale ?? 0.58} onChange={(e) => patch((d) => (d.style.buttonDefaults = { ...btn, iconScale: Number(e.target.value) }))} style={{ flex: 1 }} />
          <span style={rightNum}>{(btn.iconScale ?? 0.58).toFixed(2)}</span>
        </Row>
        <Row label="Padding Y">
          <input type="range" min={0} max={24} value={btn.paddingY ?? 10} onChange={(e) => patch((d) => (d.style.buttonDefaults = { ...btn, paddingY: Number(e.target.value) }))} style={{ flex: 1 }} />
          <span style={rightNum}>{btn.paddingY ?? 10}px</span>
        </Row>
        <Row label="Padding X">
          <input type="range" min={0} max={32} value={btn.paddingX ?? 12} onChange={(e) => patch((d) => (d.style.buttonDefaults = { ...btn, paddingX: Number(e.target.value) }))} style={{ flex: 1 }} />
          <span style={rightNum}>{btn.paddingX ?? 12}px</span>
        </Row>
        <Row label="Sombra">
          <Toggle active={btn.shadow ?? false} onClick={() => patch((d) => (d.style.buttonDefaults = { ...btn, shadow: !btn.shadow }))} />
        </Row>
      </CollapsibleSection>

      {/* ========== POSIÇÃO ========== */}
      <CollapsibleSection title="📍 Posição" subtitle="Offset vertical" isOpen={activeSection === 'position'} onToggle={() => setActiveSection(activeSection === 'position' ? null : 'position')}>
        <Row label="Offset Y">
          <input type="range" min={-80} max={80} step={4} value={st.offsetY ?? 0} onChange={(e) => patch((d) => (d.style.offsetY = Number(e.target.value)))} style={{ flex: 1 }} />
          <span style={rightNum}>{st.offsetY ?? 0}px</span>
        </Row>
        <Row label="">
          <Button onClick={() => patch((d) => (d.style.offsetY = 0))}>Reset</Button>
        </Row>
      </CollapsibleSection>

    </div>
  )
}

// ===== COMPONENTES AUXILIARES =====

const rightNum: React.CSSProperties = { fontSize: 12, opacity: 0.7, minWidth: 45, textAlign: 'right' }
const selectStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', fontWeight: 600, fontSize: 12, minWidth: 90 }
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
    <button onClick={onClick} style={{ padding: '6px 12px', borderRadius: 10, border: active ? '2px solid #3b82f6' : '1px solid rgba(0,0,0,0.10)', background: active ? 'rgba(59,130,246,0.1)' : '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 11, color: active ? '#3b82f6' : '#333', minWidth: 32 }}>
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
