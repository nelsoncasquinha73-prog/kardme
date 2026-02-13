'use client'

import React, { useEffect, useState } from 'react'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import ColorPickerPro from '@/components/editor/ColorPickerPro'
import FontPicker from '@/components/editor/FontPicker'
import { useLanguage } from '@/components/language/LanguageProvider'

type ContactChannel = 'phone' | 'email' | 'whatsapp' | 'telegram'
type ContactItem = { enabled?: boolean; label?: string; value?: string }
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
type ContactSettings = {
  heading?: string
  layout?: { direction?: 'row' | 'column'; align?: 'left' | 'center' | 'right'; gapPx?: number }
  items?: Partial<Record<ContactChannel, ContactItem>>
}
type ContactStyle = {
  offsetY?: number
  showLabel?: boolean
  uniformButtons?: boolean
  uniformWidthPx?: number
  uniformHeightPx?: number
  uniformContentAlign?: 'left' | 'center'
  headingFontSize?: number
  container?: { bgColor?: string; radius?: number; padding?: number; shadow?: boolean; borderWidth?: number; borderColor?: string }
  buttonDefaults?: ButtonStyle
  buttons?: Partial<Record<ContactChannel, ButtonStyle>>
  headingFontFamily?: string
  headingFontWeight?: number
  headingColor?: string
  headingBold?: boolean
  headingAlign?: 'left' | 'center' | 'right'
}
type Props = {
  settings: ContactSettings
  style?: ContactStyle
  onChangeSettings: (s: ContactSettings) => void
  onChangeStyle: (s: ContactStyle) => void
}

const CHANNELS: Array<{ key: ContactChannel; title: string; placeholder: string; icon: string }> = [
  { key: 'phone', title: 'Telemóvel', placeholder: '+351 9xx xxx xxx', icon: '📞' },
  { key: 'email', title: 'Email', placeholder: 'nome@dominio.pt', icon: '✉️' },
  { key: 'whatsapp', title: 'WhatsApp', placeholder: '+351 9xx xxx xxx', icon: '💬' },
  { key: 'telegram', title: 'Telegram', placeholder: '@username', icon: '✈️' },
]

function clampNum(v: any, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function normalizeSettings(input: Partial<ContactSettings>): ContactSettings {
  return {
    heading: input.heading ?? 'Contacto',
    layout: { direction: input.layout?.direction ?? 'row', align: input.layout?.align ?? 'center', gapPx: input.layout?.gapPx ?? 10 },
    items: input.items || {},
  }
}

function normalizeStyle(input?: Partial<ContactStyle>): ContactStyle {
  const i = input || {}
  return {
    offsetY: i.offsetY ?? 0,
    showLabel: i.showLabel ?? true,
    uniformButtons: i.uniformButtons ?? false,
    uniformWidthPx: i.uniformWidthPx ?? 160,
    uniformHeightPx: i.uniformHeightPx ?? 52,
    uniformContentAlign: i.uniformContentAlign ?? 'center',
    headingFontSize: i.headingFontSize ?? 13,
    container: {
      bgColor: i.container?.bgColor ?? 'transparent',
      radius: i.container?.radius ?? 14,
      padding: i.container?.padding ?? 16,
      shadow: i.container?.shadow ?? false,
      borderWidth: i.container?.borderWidth ?? 0,
      borderColor: i.container?.borderColor ?? 'rgba(0,0,0,0.08)',
    },
    buttonDefaults: {
      sizePx: i.buttonDefaults?.sizePx ?? 44,
      radius: i.buttonDefaults?.radius ?? 14,
      bgColor: i.buttonDefaults?.bgColor ?? '#ffffff',
      bgMode: i.buttonDefaults?.bgMode ?? 'solid',
      bgGradient: i.buttonDefaults?.bgGradient ?? { from: '#111827', to: '#374151', angle: 135 },
      borderEnabled: i.buttonDefaults?.borderEnabled ?? true,
      borderWidth: i.buttonDefaults?.borderWidth ?? 1,
      borderColor: i.buttonDefaults?.borderColor ?? 'rgba(0,0,0,0.10)',
      iconColor: i.buttonDefaults?.iconColor ?? '#111827',
      shadow: i.buttonDefaults?.shadow ?? false,
      textColor: i.buttonDefaults?.textColor ?? '#111827',
      fontFamily: i.buttonDefaults?.fontFamily ?? '',
      fontWeight: i.buttonDefaults?.fontWeight ?? 800,
      labelFontSize: i.buttonDefaults?.labelFontSize ?? 13,
      paddingY: i.buttonDefaults?.paddingY ?? 10,
      paddingX: i.buttonDefaults?.paddingX ?? 12,
      iconScale: i.buttonDefaults?.iconScale ?? 0.58,
    },
    buttons: i.buttons || {},
    headingFontFamily: i.headingFontFamily ?? '',
    headingFontWeight: i.headingFontWeight ?? 900,
    headingColor: i.headingColor ?? '#111827',
    headingBold: i.headingBold ?? true,
    headingAlign: i.headingAlign ?? 'left',
  }
}

export default function ContactBlockEditor({ settings, style, onChangeSettings, onChangeStyle }: Props) {
  const { openPicker } = useColorPicker()
  const { t } = useLanguage()
  const [localSettings, setLocalSettings] = useState<ContactSettings>(() => normalizeSettings(settings))
  const [localStyle, setLocalStyle] = useState<ContactStyle>(() => normalizeStyle(style))
  const [activeSection, setActiveSection] = useState<string | null>('channels')

  useEffect(() => { setLocalSettings(normalizeSettings(settings)) }, [settings])
  useEffect(() => { setLocalStyle(normalizeStyle(style)) }, [style])

  const patchSettings = (fn: (s: ContactSettings) => void) => {
    const next = structuredClone(localSettings)
    fn(next)
    setLocalSettings(next)
    onChangeSettings(next)
  }

  const patchStyle = (fn: (s: ContactStyle) => void) => {
    const next = structuredClone(localStyle)
    fn(next)
    setLocalStyle(next)
    onChangeStyle(next)
  }

  const s = localSettings
  const st = localStyle
  const layout = s.layout || {}
  const items = s.items || {}
  const container = st.container || {}
  const btnDefaults = st.buttonDefaults || {}
  const btns = st.buttons || {}

  const pickEyedropper = (apply: (hex: string) => void) => openPicker({ mode: 'eyedropper', onPick: apply })

  const setSettings = (patch: Partial<ContactSettings>) => patchSettings((x) => Object.assign(x, patch))
  const setLayout = (patch: Partial<NonNullable<ContactSettings['layout']>>) => patchSettings((x) => { x.layout = { ...x.layout, ...patch } })
  const setItem = (ch: ContactChannel, patch: Partial<ContactItem>) => patchSettings((x) => { x.items = { ...x.items, [ch]: { ...x.items?.[ch], ...patch } } })
  const setStyle = (patch: Partial<ContactStyle>) => patchStyle((x) => Object.assign(x, patch))
  const setContainer = (patch: Partial<NonNullable<ContactStyle['container']>>) => patchStyle((x) => { x.container = { ...x.container, ...patch } })
  const setBtnDefaults = (patch: Partial<ButtonStyle>) => patchStyle((x) => { x.buttonDefaults = { ...x.buttonDefaults, ...patch } })
  const setBtn = (ch: ContactChannel, patch: Partial<ButtonStyle>) => patchStyle((x) => { x.buttons = { ...x.buttons, [ch]: { ...(x.buttons?.[ch] || {}), ...patch } } })

  const bgEnabled = (container.bgColor ?? 'transparent') !== 'transparent'
  const borderEnabled = (container.borderWidth ?? 0) > 0
  const defaultsBorderEnabled = btnDefaults.borderEnabled ?? true
  const defaultsBgMode = (btnDefaults.bgMode ?? 'solid') as 'solid' | 'gradient'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ========== CANAIS DE CONTACTO ========== */}
      <CollapsibleSection title={`📞 ${t('contact_editor.section_channels')}`} subtitle={t('contact_editor.section_channels_subtitle')} isOpen={activeSection === 'channels'} onToggle={() => setActiveSection(activeSection === 'channels' ? null : 'channels')}>
        {CHANNELS.map((cdef) => {
          const it = items[cdef.key] || {}
          const isEnabled = it.enabled ?? true
          return (
            <div key={cdef.key} style={{ padding: 12, background: isEnabled ? 'rgba(59,130,246,0.05)' : 'rgba(0,0,0,0.02)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, border: isEnabled ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{cdef.icon} {cdef.title}</span>
                <Toggle active={isEnabled} onClick={() => setItem(cdef.key, { enabled: !isEnabled })} />
              </div>
              {isEnabled && (
                <>
                  <Row label={t('contact_editor.label_value')}>
                    <input type="text" value={it.value ?? ''} onChange={(e) => setItem(cdef.key, { value: e.target.value })} placeholder={cdef.placeholder} style={inputStyle} />
                  </Row>
                  <Row label={t('contact_editor.label_label')}>
                    <input type="text" value={it.label ?? ''} onChange={(e) => setItem(cdef.key, { label: e.target.value })} placeholder={cdef.title} style={inputStyle} />
                  </Row>
                </>
              )}
            </div>
          )
        })}
      </CollapsibleSection>

      {/* ========== TÍTULO ========== */}
      <CollapsibleSection title={`📝 ${t('contact_editor.section_title')}`} subtitle={t('contact_editor.section_title_subtitle')} isOpen={activeSection === 'title'} onToggle={() => setActiveSection(activeSection === 'title' ? null : 'title')}>
        <Row label={t('contact_editor.label_text')}>
          <input type="text" value={s.heading ?? ''} onChange={(e) => setSettings({ heading: e.target.value })} placeholder={t('contact_editor.placeholder_contact')} style={inputStyle} />
        </Row>
        <Row label={t('contact_editor.label_alignment')}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['left', 'center', 'right'] as const).map((a) => (
              <MiniButton key={a} active={(st.headingAlign ?? 'left') === a} onClick={() => setStyle({ headingAlign: a })}>
                {a === 'left' ? '◀' : a === 'center' ? '●' : '▶'}
              </MiniButton>
            ))}
          </div>
        </Row>
        <Row label={t('contact_editor.label_color')}>
          <ColorPickerPro value={st.headingColor ?? '#111827'} onChange={(hex) => setStyle({ headingColor: hex })} onEyedropper={() => pickEyedropper((hex) => setStyle({ headingColor: hex }))} />
        </Row>
        <Row label={t('contact_editor.label_bold')}>
          <Toggle active={st.headingBold ?? true} onClick={() => setStyle({ headingBold: !(st.headingBold ?? true) })} />
        </Row>
        <Row label={t('contact_editor.label_font')}><FontPicker value={st.headingFontFamily ?? ""} onChange={(v) => setStyle({ headingFontFamily: v || undefined })} /></Row>
        <Row label={t('contact_editor.label_weight')}>
          <select value={String(st.headingFontWeight ?? 900)} onChange={(e) => setStyle({ headingFontWeight: clampNum(e.target.value, 900) })} style={selectStyle}>
            <option value="400">Normal</option>
            <option value="600">Semi</option>
            <option value="700">Bold</option>
            <option value="800">Extra</option>
            <option value="900">Black</option>
          </select>
        </Row>
        <Row label={t('contact_editor.label_size')}>
          <input type="range" min={10} max={28} value={st.headingFontSize ?? 13} onChange={(e) => setStyle({ headingFontSize: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.headingFontSize ?? 13}px</span>
        </Row>
      </CollapsibleSection>

      {/* ========== LAYOUT ========== */}
      <CollapsibleSection title={`🎛 ${t('contact_editor.section_layout')}`} subtitle={t('contact_editor.section_layout_subtitle')} isOpen={activeSection === 'layout'} onToggle={() => setActiveSection(activeSection === 'layout' ? null : 'layout')}>
        <Row label={t('contact_editor.label_direction')}>
          <div style={{ display: 'flex', gap: 6 }}>
            <MiniButton active={(layout.direction ?? 'row') === 'row'} onClick={() => setLayout({ direction: 'row' })}>Linha</MiniButton>
            <MiniButton active={layout.direction === 'column'} onClick={() => setLayout({ direction: 'column' })}>Coluna</MiniButton>
          </div>
        </Row>
        <Row label={t('contact_editor.label_alignment')}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['left', 'center', 'right'] as const).map((a) => (
              <MiniButton key={a} active={(layout.align ?? 'center') === a} onClick={() => setLayout({ align: a })}>
                {a === 'left' ? '◀' : a === 'center' ? '●' : '▶'}
              </MiniButton>
            ))}
          </div>
        </Row>
        <Row label={t('contact_editor.label_spacing')}>
          <input type="range" min={0} max={28} step={2} value={layout.gapPx ?? 10} onChange={(e) => setLayout({ gapPx: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{layout.gapPx ?? 10}px</span>
        </Row>
        <Row label={t('contact_editor.label_show_text')}>
          <Toggle active={st.showLabel ?? true} onClick={() => setStyle({ showLabel: !(st.showLabel ?? true) })} />
        </Row>
        <Row label={t('contact_editor.label_uniform')}>
          <Toggle active={st.uniformButtons ?? false} onClick={() => setStyle({ uniformButtons: !(st.uniformButtons ?? false) })} />
        </Row>
        {st.uniformButtons && (
          <>
            <Row label={t('contact_editor.label_width')}>
              <input type="range" min={80} max={300} step={10} value={st.uniformWidthPx ?? 160} onChange={(e) => setStyle({ uniformWidthPx: Number(e.target.value) })} style={{ flex: 1 }} />
              <span style={rightNum}>{st.uniformWidthPx ?? 160}px</span>
            </Row>
            <Row label={t('contact_editor.label_height')}>
              <input type="range" min={32} max={80} step={4} value={st.uniformHeightPx ?? 52} onChange={(e) => setStyle({ uniformHeightPx: Number(e.target.value) })} style={{ flex: 1 }} />
              <span style={rightNum}>{st.uniformHeightPx ?? 52}px</span>
            </Row>
            <Row label={t('contact_editor.label_content')}>
              <div style={{ display: 'flex', gap: 6 }}>
                <MiniButton active={(st.uniformContentAlign ?? 'center') === 'left'} onClick={() => setStyle({ uniformContentAlign: 'left' })}>◀</MiniButton>
                <MiniButton active={(st.uniformContentAlign ?? 'center') === 'center'} onClick={() => setStyle({ uniformContentAlign: 'center' })}>●</MiniButton>
              </div>
            </Row>
          </>
        )}
      </CollapsibleSection>

      {/* ========== CONTAINER ========== */}
      <CollapsibleSection title={`📦 ${t('contact_editor.section_container')}`} subtitle={t('contact_editor.section_container_subtitle')} isOpen={activeSection === 'container'} onToggle={() => setActiveSection(activeSection === 'container' ? null : 'container')}>
        <Row label={t('contact_editor.label_background')}>
          <Toggle active={bgEnabled} onClick={() => setContainer({ bgColor: bgEnabled ? 'transparent' : '#ffffff' })} />
        </Row>
        {bgEnabled && (
          <Row label={t('contact_editor.label_color')}>
            <ColorPickerPro value={container.bgColor ?? '#ffffff'} onChange={(hex) => setContainer({ bgColor: hex })} onEyedropper={() => pickEyedropper((hex) => setContainer({ bgColor: hex }))} />
          </Row>
        )}
        <Row label={t('contact_editor.label_shadow')}>
          <Toggle active={container.shadow ?? false} onClick={() => setContainer({ shadow: !container.shadow })} />
        </Row>
        <Row label={t('contact_editor.label_border')}>
          <Toggle active={borderEnabled} onClick={() => setContainer({ borderWidth: borderEnabled ? 0 : 1 })} />
        </Row>
        {borderEnabled && (
          <>
            <Row label={t('contact_editor.label_border_thickness')}>
              <input type="range" min={1} max={6} value={container.borderWidth ?? 1} onChange={(e) => setContainer({ borderWidth: Number(e.target.value) })} style={{ flex: 1 }} />
              <span style={rightNum}>{container.borderWidth ?? 1}px</span>
            </Row>
            <Row label={t('contact_editor.label_border_color')}>
              <ColorPickerPro value={container.borderColor ?? 'rgba(0,0,0,0.08)'} onChange={(hex) => setContainer({ borderColor: hex })} onEyedropper={() => pickEyedropper((hex) => setContainer({ borderColor: hex }))} />
            </Row>
          </>
        )}
        <Row label={t('contact_editor.label_radius')}>
          <input type="range" min={0} max={32} step={2} value={container.radius ?? 14} onChange={(e) => setContainer({ radius: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{container.radius ?? 14}px</span>
        </Row>
        <Row label={t('contact_editor.label_padding')}>
          <input type="range" min={0} max={32} step={2} value={container.padding ?? 16} onChange={(e) => setContainer({ padding: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{container.padding ?? 16}px</span>
        </Row>
      </CollapsibleSection>

      {/* ========== ESTILO DOS BOTÕES (DEFAULTS) ========== */}
      <CollapsibleSection title="🎨 Estilo dos botões" subtitle="Cores, tamanhos, fonte" isOpen={activeSection === 'btnDefaults'} onToggle={() => setActiveSection(activeSection === 'btnDefaults' ? null : 'btnDefaults')}>
        <Row label={t('contact_editor.label_size')}>
          <input type="range" min={24} max={64} value={btnDefaults.sizePx ?? 44} onChange={(e) => setBtnDefaults({ sizePx: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{btnDefaults.sizePx ?? 44}px</span>
        </Row>
        <Row label={t('contact_editor.label_radius')}>
          <input type="range" min={0} max={32} value={btnDefaults.radius ?? 14} onChange={(e) => setBtnDefaults({ radius: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{btnDefaults.radius ?? 14}px</span>
        </Row>
        <Row label="Modo fundo">
          <div style={{ display: 'flex', gap: 6 }}>
            <MiniButton active={defaultsBgMode === 'solid'} onClick={() => setBtnDefaults({ bgMode: 'solid' })}>Sólido</MiniButton>
            <MiniButton active={defaultsBgMode === 'gradient'} onClick={() => setBtnDefaults({ bgMode: 'gradient' })}>Degradê</MiniButton>
          </div>
        </Row>
        {defaultsBgMode === 'solid' && (
          <Row label="Cor fundo">
            <ColorPickerPro value={btnDefaults.bgColor ?? '#ffffff'} onChange={(hex) => setBtnDefaults({ bgColor: hex })} onEyedropper={() => pickEyedropper((hex) => setBtnDefaults({ bgColor: hex }))} />
          </Row>
        )}
        {defaultsBgMode === 'gradient' && (
          <>
            <Row label="Cor inicial">
              <ColorPickerPro value={btnDefaults.bgGradient?.from ?? '#111827'} onChange={(hex) => setBtnDefaults({ bgGradient: { ...btnDefaults.bgGradient, from: hex } })} onEyedropper={() => pickEyedropper((hex) => setBtnDefaults({ bgGradient: { ...btnDefaults.bgGradient, from: hex } }))} />
            </Row>
            <Row label="Cor final">
              <ColorPickerPro value={btnDefaults.bgGradient?.to ?? '#374151'} onChange={(hex) => setBtnDefaults({ bgGradient: { ...btnDefaults.bgGradient, to: hex } })} onEyedropper={() => pickEyedropper((hex) => setBtnDefaults({ bgGradient: { ...btnDefaults.bgGradient, to: hex } }))} />
            </Row>
            <Row label="Ângulo">
              <input type="range" min={0} max={360} step={15} value={btnDefaults.bgGradient?.angle ?? 135} onChange={(e) => setBtnDefaults({ bgGradient: { ...btnDefaults.bgGradient, angle: Number(e.target.value) } })} style={{ flex: 1 }} />
              <span style={rightNum}>{btnDefaults.bgGradient?.angle ?? 135}°</span>
            </Row>
          </>
        )}
        <Row label={t('contact_editor.label_border')}>
          <Toggle active={defaultsBorderEnabled} onClick={() => setBtnDefaults({ borderEnabled: !defaultsBorderEnabled })} />
        </Row>
        {defaultsBorderEnabled && (
          <>
            <Row label={t('contact_editor.label_border_thickness')}>
              <input type="range" min={1} max={6} value={btnDefaults.borderWidth ?? 1} onChange={(e) => setBtnDefaults({ borderWidth: Number(e.target.value) })} style={{ flex: 1 }} />
              <span style={rightNum}>{btnDefaults.borderWidth ?? 1}px</span>
            </Row>
            <Row label={t('contact_editor.label_border_color')}>
              <ColorPickerPro value={btnDefaults.borderColor ?? 'rgba(0,0,0,0.10)'} onChange={(hex) => setBtnDefaults({ borderColor: hex })} onEyedropper={() => pickEyedropper((hex) => setBtnDefaults({ borderColor: hex }))} />
            </Row>
          </>
        )}
        <Row label="Cor ícone">
          <ColorPickerPro value={btnDefaults.iconColor ?? '#111827'} onChange={(hex) => setBtnDefaults({ iconColor: hex })} onEyedropper={() => pickEyedropper((hex) => setBtnDefaults({ iconColor: hex }))} />
        </Row>
        <Row label="Cor texto">
          <ColorPickerPro value={btnDefaults.textColor ?? '#111827'} onChange={(hex) => setBtnDefaults({ textColor: hex })} onEyedropper={() => pickEyedropper((hex) => setBtnDefaults({ textColor: hex }))} />
        </Row>
        <Row label={t('contact_editor.label_font')}><FontPicker value={btnDefaults.fontFamily ?? ""} onChange={(v) => setBtnDefaults({ fontFamily: v || undefined })} /></Row>
        <Row label={t('contact_editor.label_weight')}>
          <select value={String(btnDefaults.fontWeight ?? 800)} onChange={(e) => setBtnDefaults({ fontWeight: clampNum(e.target.value, 800) })} style={selectStyle}>
            <option value="400">Normal</option>
            <option value="600">Semi</option>
            <option value="700">Bold</option>
            <option value="800">Extra</option>
            <option value="900">Black</option>
          </select>
        </Row>
        <Row label="Tamanho texto">
          <input type="range" min={8} max={24} value={btnDefaults.labelFontSize ?? 13} onChange={(e) => setBtnDefaults({ labelFontSize: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{btnDefaults.labelFontSize ?? 13}px</span>
        </Row>
        <Row label="Escala ícone">
          <input type="range" min={0.4} max={0.9} step={0.02} value={btnDefaults.iconScale ?? 0.58} onChange={(e) => setBtnDefaults({ iconScale: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{(btnDefaults.iconScale ?? 0.58).toFixed(2)}</span>
        </Row>
        <Row label="Padding Y">
          <input type="range" min={0} max={24} value={btnDefaults.paddingY ?? 10} onChange={(e) => setBtnDefaults({ paddingY: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{btnDefaults.paddingY ?? 10}px</span>
        </Row>
        <Row label="Padding X">
          <input type="range" min={0} max={32} value={btnDefaults.paddingX ?? 12} onChange={(e) => setBtnDefaults({ paddingX: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{btnDefaults.paddingX ?? 12}px</span>
        </Row>
        <Row label={t('contact_editor.label_shadow')}>
          <Toggle active={btnDefaults.shadow ?? false} onClick={() => setBtnDefaults({ shadow: !btnDefaults.shadow })} />
        </Row>
      </CollapsibleSection>

      {/* ========== OVERRIDE POR BOTÃO ========== */}
      <CollapsibleSection title="🔧 Por botão" subtitle="Override individual" isOpen={activeSection === 'btnOverride'} onToggle={() => setActiveSection(activeSection === 'btnOverride' ? null : 'btnOverride')}>
        {CHANNELS.filter((c) => items[c.key]?.enabled !== false).map(({ key, title, icon }) => {
          const b = btns[key] || {}
          const bBgMode = (b.bgMode ?? defaultsBgMode) as 'solid' | 'gradient'
          const bBorderEnabled = b.borderEnabled ?? defaultsBorderEnabled
          return (
            <div key={key} style={{ padding: 12, background: 'rgba(0,0,0,0.02)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, border: '1px solid rgba(0,0,0,0.06)', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{icon} {title}</span>
              <Row label="Modo fundo">
                <div style={{ display: 'flex', gap: 6 }}>
                  <MiniButton active={bBgMode === 'solid'} onClick={() => setBtn(key, { bgMode: 'solid' })}>Sólido</MiniButton>
                  <MiniButton active={bBgMode === 'gradient'} onClick={() => setBtn(key, { bgMode: 'gradient' })}>Degradê</MiniButton>
                </div>
              </Row>
              {bBgMode === 'solid' && (
                <Row label="Cor fundo">
                  <ColorPickerPro value={b.bgColor ?? btnDefaults.bgColor ?? '#ffffff'} onChange={(hex) => setBtn(key, { bgColor: hex })} onEyedropper={() => pickEyedropper((hex) => setBtn(key, { bgColor: hex }))} />
                </Row>
              )}
              {bBgMode === 'gradient' && (
                <>
                  <Row label="Cor inicial">
                    <ColorPickerPro value={b.bgGradient?.from ?? btnDefaults.bgGradient?.from ?? '#111827'} onChange={(hex) => setBtn(key, { bgGradient: { ...(b.bgGradient || {}), from: hex } })} onEyedropper={() => pickEyedropper((hex) => setBtn(key, { bgGradient: { ...(b.bgGradient || {}), from: hex } }))} />
                  </Row>
                  <Row label="Cor final">
                    <ColorPickerPro value={b.bgGradient?.to ?? btnDefaults.bgGradient?.to ?? '#374151'} onChange={(hex) => setBtn(key, { bgGradient: { ...(b.bgGradient || {}), to: hex } })} onEyedropper={() => pickEyedropper((hex) => setBtn(key, { bgGradient: { ...(b.bgGradient || {}), to: hex } }))} />
                  </Row>
                  <Row label="Ângulo">
                    <input type="range" min={0} max={360} step={15} value={b.bgGradient?.angle ?? btnDefaults.bgGradient?.angle ?? 135} onChange={(e) => setBtn(key, { bgGradient: { ...(b.bgGradient || {}), angle: Number(e.target.value) } })} style={{ flex: 1 }} />
                    <span style={rightNum}>{b.bgGradient?.angle ?? btnDefaults.bgGradient?.angle ?? 135}°</span>
                  </Row>
                </>
              )}
              <Row label={t('contact_editor.label_border')}>
                <Toggle active={bBorderEnabled} onClick={() => setBtn(key, { borderEnabled: !bBorderEnabled })} />
              </Row>
              {bBorderEnabled && (
                <>
                  <Row label={t('contact_editor.label_border_thickness')}>
                    <input type="range" min={1} max={6} value={b.borderWidth ?? btnDefaults.borderWidth ?? 1} onChange={(e) => setBtn(key, { borderWidth: Number(e.target.value) })} style={{ flex: 1 }} />
                    <span style={rightNum}>{b.borderWidth ?? btnDefaults.borderWidth ?? 1}px</span>
                  </Row>
                  <Row label={t('contact_editor.label_border_color')}>
                    <ColorPickerPro value={b.borderColor ?? btnDefaults.borderColor ?? 'rgba(0,0,0,0.10)'} onChange={(hex) => setBtn(key, { borderColor: hex })} onEyedropper={() => pickEyedropper((hex) => setBtn(key, { borderColor: hex }))} />
                  </Row>
                </>
              )}
              <Row label="Cor ícone">
                <ColorPickerPro value={b.iconColor ?? btnDefaults.iconColor ?? '#111827'} onChange={(hex) => setBtn(key, { iconColor: hex })} onEyedropper={() => pickEyedropper((hex) => setBtn(key, { iconColor: hex }))} />
              </Row>
              <Row label="Cor texto">
                <ColorPickerPro value={b.textColor ?? btnDefaults.textColor ?? '#111827'} onChange={(hex) => setBtn(key, { textColor: hex })} onEyedropper={() => pickEyedropper((hex) => setBtn(key, { textColor: hex }))} />
              </Row>
              <Row label={t('contact_editor.label_font')}><FontPicker value={b.fontFamily ?? btnDefaults.fontFamily ?? ""} onChange={(v) => setBtn(key, { fontFamily: v || undefined })} /></Row>
              <Row label={t('contact_editor.label_weight')}>
                <select value={String(b.fontWeight ?? btnDefaults.fontWeight ?? 800)} onChange={(e) => setBtn(key, { fontWeight: clampNum(e.target.value, 800) })} style={selectStyle}>
                  <option value="400">Normal</option>
                  <option value="600">Semi</option>
                  <option value="700">Bold</option>
                  <option value="800">Extra</option>
                  <option value="900">Black</option>
                </select>
              </Row>
              <Row label="Tamanho texto">
                <input type="range" min={8} max={24} value={b.labelFontSize ?? btnDefaults.labelFontSize ?? 13} onChange={(e) => setBtn(key, { labelFontSize: Number(e.target.value) })} style={{ flex: 1 }} />
                <span style={rightNum}>{b.labelFontSize ?? btnDefaults.labelFontSize ?? 13}px</span>
              </Row>
              <Row label="Escala ícone">
                <input type="range" min={0.4} max={0.9} step={0.02} value={b.iconScale ?? btnDefaults.iconScale ?? 0.58} onChange={(e) => setBtn(key, { iconScale: Number(e.target.value) })} style={{ flex: 1 }} />
                <span style={rightNum}>{(b.iconScale ?? btnDefaults.iconScale ?? 0.58).toFixed(2)}</span>
              </Row>
              <Row label="Padding Y">
                <input type="range" min={0} max={24} value={b.paddingY ?? btnDefaults.paddingY ?? 10} onChange={(e) => setBtn(key, { paddingY: Number(
e.target.value) })} style={{ flex: 1 }} />
                <span style={rightNum}>{b.paddingY ?? btnDefaults.paddingY ?? 10}px</span>
              </Row>
              <Row label="Padding X">
                <input type="range" min={0} max={32} value={b.paddingX ?? btnDefaults.paddingX ?? 12} onChange={(e) => setBtn(key, { paddingX: Number(e.target.value) })} style={{ flex: 1 }} />
                <span style={rightNum}>{b.paddingX ?? btnDefaults.paddingX ?? 12}px</span>
              </Row>
              <Row label={t('contact_editor.label_shadow')}>
                <Toggle active={b.shadow ?? false} onClick={() => setBtn(key, { shadow: !b.shadow })} />
              </Row>
            </div>
          )
        })}
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
