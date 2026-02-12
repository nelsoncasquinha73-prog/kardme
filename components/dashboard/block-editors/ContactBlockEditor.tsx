'use client'

import React, { useEffect, useState } from 'react'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import ColorPickerPro from '@/components/editor/ColorPickerPro'
import { FONT_OPTIONS } from '@/lib/fontes'
import { useLanguage } from '@/components/language/LanguageProvider'

type ContactChannel = 'phone' | 'email' | 'whatsapp' | 'telegram'

type ContactItem = {
  enabled?: boolean
  label?: string
  value?: string
}

type ButtonGradient = {
  from?: string
  to?: string
  angle?: number
}

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
  layout?: {
    direction?: 'row' | 'column'
    align?: 'left' | 'center' | 'right'
    gapPx?: number
  }
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
  container?: {
    bgColor?: string
    radius?: number
    padding?: number
    shadow?: boolean
    borderWidth?: number
    borderColor?: string
  }
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

function normalizeContactSettings(input: Partial<ContactSettings>): ContactSettings {
  return {
    heading: input.heading ?? 'Contacto',
    layout: {
      direction: input.layout?.direction ?? 'row',
      align: input.layout?.align ?? 'center',
      gapPx: input.layout?.gapPx ?? 10,
    },
    items: input.items || {},
  }
}

function normalizeContactStyle(input?: Partial<ContactStyle>): ContactStyle {
  input = input || {}
  return {
    offsetY: input.offsetY ?? 0,
    showLabel: input.showLabel ?? true,
    uniformButtons: input.uniformButtons ?? false,
    uniformWidthPx: input.uniformWidthPx ?? 160,
    uniformHeightPx: input.uniformHeightPx ?? 52,
    uniformContentAlign: input.uniformContentAlign ?? 'center',
    headingFontSize: input.headingFontSize ?? 13,
    container: {
      bgColor: input.container?.bgColor ?? 'transparent',
      radius: input.container?.radius ?? 14,
      padding: input.container?.padding ?? 16,
      shadow: input.container?.shadow ?? false,
      borderWidth: input.container?.borderWidth ?? 0,
      borderColor: input.container?.borderColor ?? 'rgba(0,0,0,0.08)',
    },
    buttonDefaults: {
      sizePx: input.buttonDefaults?.sizePx ?? 44,
      radius: input.buttonDefaults?.radius ?? 14,
      bgColor: input.buttonDefaults?.bgColor ?? '#ffffff',
      bgMode: input.buttonDefaults?.bgMode ?? 'solid',
      bgGradient: input.buttonDefaults?.bgGradient ?? { from: '#111827', to: '#374151', angle: 135 },
      borderEnabled: input.buttonDefaults?.borderEnabled ?? true,
      borderWidth: input.buttonDefaults?.borderWidth ?? 1,
      borderColor: input.buttonDefaults?.borderColor ?? 'rgba(0,0,0,0.10)',
      iconColor: input.buttonDefaults?.iconColor ?? '#111827',
      shadow: input.buttonDefaults?.shadow ?? false,
      textColor: input.buttonDefaults?.textColor ?? '#111827',
      fontFamily: input.buttonDefaults?.fontFamily ?? '',
      fontWeight: input.buttonDefaults?.fontWeight ?? 800,
      labelFontSize: input.buttonDefaults?.labelFontSize ?? 13,
      paddingY: input.buttonDefaults?.paddingY ?? 10,
      paddingX: input.buttonDefaults?.paddingX ?? 12,
      iconScale: input.buttonDefaults?.iconScale ?? 0.58,
    },
    buttons: input.buttons || {},
    headingFontFamily: input.headingFontFamily ?? '',
    headingFontWeight: input.headingFontWeight ?? 900,
    headingColor: input.headingColor ?? '#111827',
    headingBold: input.headingBold ?? true,
    headingAlign: input.headingAlign ?? 'left',
  }
}

export default function ContactBlockEditor({ settings, style, onChangeSettings, onChangeStyle }: Props) {
  const { openPicker } = useColorPicker()
  const { t } = useLanguage()

  const [localSettings, setLocalSettings] = useState<ContactSettings>(() => normalizeContactSettings(settings))
  const [localStyle, setLocalStyle] = useState<ContactStyle>(() => normalizeContactStyle(style))
  const [activeSection, setActiveSection] = useState<string | null>('channels')

  useEffect(() => {
    setLocalSettings(normalizeContactSettings(settings))
  }, [settings])

  useEffect(() => {
    setLocalStyle(normalizeContactStyle(style))
  }, [style])

  function patchSettings(fn: (s: ContactSettings) => void) {
    const next = structuredClone(localSettings)
    fn(next)
    setLocalSettings(next)
    onChangeSettings(next)
  }

  function patchStyle(fn: (s: ContactStyle) => void) {
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

  const setSettings = (patch: Partial<ContactSettings>) => patchSettings((s) => Object.assign(s, patch))
  const setLayout = (patch: Partial<NonNullable<ContactSettings['layout']>>) =>
    patchSettings((s) => { s.layout = { ...s.layout, ...patch } })
  const setItem = (ch: ContactChannel, patch: Partial<ContactItem>) =>
    patchSettings((s) => { s.items = { ...s.items, [ch]: { ...s.items?.[ch], ...patch } } })
  const setStyle = (patch: Partial<ContactStyle>) => patchStyle((s) => Object.assign(s, patch))
  const setContainer = (patch: Partial<NonNullable<ContactStyle['container']>>) =>
    patchStyle((s) => { s.container = { ...s.container, ...patch } })
  const setBtnDefaults = (patch: Partial<ButtonStyle>) =>
    patchStyle((s) => { s.buttonDefaults = { ...s.buttonDefaults, ...patch } })
  const setBtn = (ch: ContactChannel, patch: Partial<ButtonStyle>) =>
    patchStyle((s) => { s.buttons = { ...s.buttons, [ch]: { ...(s.buttons?.[ch] || {}), ...patch } } })

  const bgEnabled = (container.bgColor ?? 'transparent') !== 'transparent'
  const borderEnabled = (container.borderWidth ?? 0) > 0
  const defaultsBorderEnabled = btnDefaults.borderEnabled ?? true
  const defaultsBgMode = (btnDefaults.bgMode ?? 'solid') as 'solid' | 'gradient'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ========== SECÇÃO 4: CONTAINER ========== */}
      <CollapsibleSection
        title="📦 Container"
        subtitle="Fundo, borda, padding"
        isOpen={activeSection === 'container'}
        onToggle={() => setActiveSection(activeSection === 'container' ? null : 'container')}
      >
        <Row label="Fundo">
          <Toggle
            active={bgEnabled}
            onClick={() => setContainer({ bgColor: bgEnabled ? 'transparent' : '#ffffff' })}
          />
        </Row>

        {bgEnabled && (
          <Row label="Cor fundo">
            <ColorPickerPro
              value={container.bgColor ?? '#ffffff'}
              onChange={(hex) => setContainer({ bgColor: hex })}
              onEyedropper={() => pickEyedropper((hex) => setContainer({ bgColor: hex }))}
            />
          </Row>
        )}

        <Row label="Sombra">
          <Toggle
            active={container.shadow ?? false}
            onClick={() => setContainer({ shadow: !(container.shadow ?? false) })}
          />
        </Row>

        <Row label="Borda">
          <Toggle
            active={borderEnabled}
            onClick={() => setContainer({ borderWidth: borderEnabled ? 0 : 1 })}
          />
        </Row>

        {borderEnabled && (
          <>
            <Row label="Espessura">
              <input
                type="range"
                min={1}
                max={6}
                step={1}
                value={container.borderWidth ?? 1}
                onChange={(e) => setContainer({ borderWidth: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={rightNum}>{container.borderWidth ?? 1}px</span>
            </Row>

            <Row label="Cor borda">
              <ColorPickerPro
                value={container.borderColor ?? 'rgba(0,0,0,0.08)'}
                onChange={(hex) => setContainer({ borderColor: hex })}
                onEyedropper={() => pickEyedropper((hex) => setContainer({ borderColor: hex }))}
              />
            </Row>
          </>
        )}

        <Row label="Raio">
          <input
            type="range"
            min={0}
            max={32}
            step={2}
            value={container.radius ?? 14}
            onChange={(e) => setContainer({ radius: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={rightNum}>{container.radius ?? 14}px</span>
        </Row>

        <Row label="Padding">
          <input
            type="range"
            min={0}
            max={32}
            step={2}
            value={container.padding ?? 16}
            onChange={(e) => setContainer({ padding: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={rightNum}>{container.padding ?? 16}px</span>
        </Row>
      </CollapsibleSection>

      {/* ========== SECÇÃO 5: ESTILO DOS BOTÕES (DEFAULTS) ========== */}
      <CollapsibleSection
        title="🎨 Estilo dos botões"
        subtitle="Cores, tamanhos, degradê"
        isOpen={activeSection === 'btnDefaults'}
        onToggle={() => setActiveSection(activeSection === 'btnDefaults' ? null : 'btnDefaults')}
      >
        <Row label="Tamanho">
          <input
            type="range"
            min={32}
            max={64}
            step={2}
            value={btnDefaults.sizePx ?? 44}
            onChange={(e) => setBtnDefaults({ sizePx: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={rightNum}>{btnDefaults.sizePx ?? 44}px</span>
        </Row>

        <Row label="Raio">
          <input
            type="range"
            min={0}
            max={32}
            step={2}
            value={btnDefaults.radius ?? 14}
            onChange={(e) => setBtnDefaults({ radius: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={rightNum}>{btnDefaults.radius ?? 14}px</span>
        </Row>

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />

        <Row label="Modo fundo">
          <div style={{ display: 'flex', gap: 6 }}>
            <MiniButton
              active={defaultsBgMode === 'solid'}
              onClick={() => setBtnDefaults({ bgMode: 'solid' })}
            >
              Sólido
            </MiniButton>
            <MiniButton
              active={defaultsBgMode === 'gradient'}
              onClick={() => setBtnDefaults({ bgMode: 'gradient' })}
            >
              Degradê
            </MiniButton>
          </div>
        </Row>

        {defaultsBgMode === 'solid' && (
          <Row label="Cor fundo">
            <ColorPickerPro
              value={btnDefaults.bgColor ?? '#ffffff'}
              onChange={(hex) => setBtnDefaults({ bgColor: hex })}
              onEyedropper={() => pickEyedropper((hex) => setBtnDefaults({ bgColor: hex }))}
            />
          </Row>
        )}

        {defaultsBgMode === 'gradient' && (
          <>
            <Row label="Cor inicial">
              <ColorPickerPro
                value={btnDefaults.bgGradient?.from ?? '#111827'}
                onChange={(hex) => setBtnDefaults({ bgGradient: { ...btnDefaults.bgGradient, from: hex } })}
                onEyedropper={() => pickEyedropper((hex) => setBtnDefaults({ bgGradient: { ...btnDefaults.bgGradient, from: hex } }))}
              />
            </Row>

            <Row label="Cor final">
              <ColorPickerPro
                value={btnDefaults.bgGradient?.to ?? '#374151'}
                onChange={(hex) => setBtnDefaults({ bgGradient: { ...btnDefaults.bgGradient, to: hex } })}
                onEyedropper={() => pickEyedropper((hex) => setBtnDefaults({ bgGradient: { ...btnDefaults.bgGradient, to: hex } }))}
              />
            </Row>

            <Row label="Ângulo">
              <input
                type="range"
                min={0}
                max={360}
                step={15}
                value={btnDefaults.bgGradient?.angle ?? 135}
                onChange={(e) => setBtnDefaults({ bgGradient: { ...btnDefaults.bgGradient, angle: Number(e.target.value) } })}
                style={{ flex: 1 }}
              />
              <span style={rightNum}>{btnDefaults.bgGradient?.angle ?? 135}°</span>
            </Row>
          </>
        )}

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />

        <Row label="Borda">
          <Toggle
            active={defaultsBorderEnabled}
            onClick={() => setBtnDefaults({ borderEnabled: !defaultsBorderEnabled })}
          />
        </Row>

        {defaultsBorderEnabled && (
          <>
            <Row label="Espessura">
              <input
                type="range"
                min={1}
                max={6}
                step={1}
                value={btnDefaults.borderWidth ?? 1}
                onChange={(e) => setBtnDefaults({ borderWidth: Number(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={rightNum}>{btnDefaults.borderWidth ?? 1}px</span>
            </Row>

            <Row label="Cor borda">
              <ColorPickerPro
                value={btnDefaults.borderColor ?? 'rgba(0,0,0,0.10)'}
                onChange={(hex) => setBtnDefaults({ borderColor: hex })}
                onEyedropper={() => pickEyedropper((hex) => setBtnDefaults({ borderColor: hex }))}
              />
            </Row>
          </>
        )}

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />

        <Row label="Cor ícone">
          <ColorPickerPro
            value={btnDefaults.iconColor ?? '#111827'}
            onChange={(hex) => setBtnDefaults({ iconColor: hex })}
            onEyedropper={() => pickEyedropper((hex) => setBtnDefaults({ iconColor: hex }))}
          />
        </Row>

        <Row label="Cor texto">
          <ColorPickerPro
            value={btnDefaults.textColor ?? '#111827'}
            onChange={(hex) => setBtnDefaults({ textColor: hex })}
            onEyedropper={() => pickEyedropper((hex) => setBtnDefaults({ textColor: hex }))}
          />
        </Row>

        <Row label="Fonte">
          <select
            value={btnDefaults.fontFamily ?? ''}
            onChange={(e) => setBtnDefaults({ fontFamily: e.target.value || undefined })}
            style={selectStyle}
          >
            <option value="">Padrão</option>
            {FONT_OPTIONS.map((o) => (
              <option key={o.label} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Row>

        <Row label="Peso texto">
          <select
            value={String(btnDefaults.fontWeight ?? 800)}
            onChange={(e) => setBtnDefaults({ fontWeight: Number(e.target.value) })}
            style={selectStyle}
          >
            <option value="400">Normal</option>
            <option value="600">Semi</option>
            <option value="700">Bold</option>
            <option value="800">Extra</option>
            <option value="900">Black</option>
          </select>
        </Row>

        <Row label="Tamanho texto">
          <input
            type="range"
            min={10}
            max={20}
            step={1}
            value={btnDefaults.labelFontSize ?? 13}
            onChange={(e) => setBtnDefaults({ labelFontSize: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={rightNum}>{btnDefaults.labelFontSize ?? 13}px</span>
        </Row>

        <Row label="Escala ícone">
          <input
            type="range"
            min={0.4}
            max={0.9}
            step={0.05}
            value={btnDefaults.iconScale ?? 0.58}
            onChange={(e) => setBtnDefaults({ iconScale: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={rightNum}>{(btnDefaults.iconScale ?? 0.58).toFixed(2)}</span>
        </Row>

        <Row label="Padding Y">
          <input
            type="range"
            min={0}
            max={24}
            step={2}
            value={btnDefaults.paddingY ?? 10}
            onChange={(e) => setBtnDefaults({ paddingY: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={rightNum}>{btnDefaults.paddingY ?? 10}px</span>
        </Row>

        <Row label="Padding X">
          <input
            type="range"
            min={0}
            max={32}
            step={2}
            value={btnDefaults.paddingX ?? 12}
            onChange={(e) => setBtnDefaults({ paddingX: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={rightNum}>{btnDefaults.paddingX ?? 12}px</span>
        </Row>

        <Row label="Sombra">
          <Toggle
            active={btnDefaults.shadow ?? false}
            onClick={() => setBtnDefaults({ shadow: !(btnDefaults.shadow ?? false) })}
          />
        </Row>
      </CollapsibleSection>

      {/* ========== SECÇÃO 6: OVERRIDE POR BOTÃO ========== */}
      <CollapsibleSection
        title="🔧 Personalizar por botão"
        subtitle="Override individual"
        isOpen={activeSection === 'btnOverride'}
        onToggle={() => setActiveSection(activeSection === 'btnOverride' ? null : 'btnOverride')}
      >
        <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 8 }}>
          Personaliza cada botão individualmente. Deixa vazio para usar os defaults.
        </div>

        {CHANNELS.map(({ key, title, icon }) => {
          const b = btns[key] || {}
          const bBorderEnabled = b.borderEnabled ?? defaultsBorderEnabled
          const bBgMode = (b.bgMode ?? defaultsBgMode) as 'solid' | 'gradient'
          const isEnabled = (items[key]?.enabled ?? true)

          if (!isEnabled) return null

          return (
            <div
              key={key}
              style={{
                padding: 12,
                background: 'rgba(0,0,0,0.02)',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 13 }}>{icon} {title}</span>

              <Row label="Modo fundo">
                <div style={{ display: 'flex', gap: 6 }}>
                  <MiniButton
                    active={bBgMode === 'solid'}
                    onClick={() => setBtn(key, { bgMode: 'solid' })}
                  >
                    Sólido
                  </MiniButton>
                  <MiniButton
                    active={bBgMode === 'gradient'}
                    onClick={() => setBtn(key, { bgMode: 'gradient' })}
                  >
                    Degradê
                  </MiniButton>
                </div>
              </Row>

              {bBgMode === 'solid' && (
                <Row label="Cor fundo">
                  <ColorPickerPro
                    value={b.bgColor ?? btnDefaults.bgColor ?? '#ffffff'}
                    onChange={(hex) => setBtn(key, { bgColor: hex })}
                    onEyedropper={() => pickEyedropper((hex) => setBtn(key, { bgColor: hex }))}
                  />
                </Row>
              )}

              {bBgMode === 'gradient' && (
                <>
                  <Row label="Cor inicial">
                    <ColorPickerPro
                      value={b.bgGradient?.from ?? btnDefaults.bgGradient?.from ?? '#111827'}
                      onChange={(hex) => setBtn(key, { bgGradient: { ...(b.bgGradient || {}), from: hex } })}
                      onEyedropper={() => pickEyedropper((hex) => setBtn(key, { bgGradient: { ...(b.bgGradient || {}), from: hex } }))}
                    />
                  </Row>

                  <Row label="Cor final">
                    <ColorPickerPro
                      value={b.bgGradient?.to ?? btnDefaults.bgGradient?.to ?? '#374151'}
                      onChange={(hex) => setBtn(key, { bgGradient: { ...(b.bgGradient || {}), to: hex } })}
                      onEyedropper={() => pickEyedropper((hex) => setBtn(key, { bgGradient: { ...(b.bgGradient || {}), to: hex } }))}
                    />
                  </Row>

                  <Row label="Ângulo">
                    <input
                      type="range"
                      min={0}
                      max={360}
                      step={15}
                      value={b.bgGradient?.angle ?? btnDefaults.bgGradient?.angle ?? 135}
                      onChange={(e) => setBtn(key, { bgGradient: { ...(b.bgGradient || {}), angle: Number(e.target.value) } })}
                      style={{ flex: 1 }}
                    />
                    <span style={rightNum}>{b.bgGradient?.angle ?? btnDefaults.bgGradient?.angle ?? 135}°</span>
                  </Row>
                </>
              )}

              <Row label="Borda">
                <Toggle
                  active={bBorderEnabled}
                  onClick={() => setBtn(key, { borderEnabled: !bBorderEnabled })}
                />
              </Row>

              {bBorderEnabled && (
                <Row label="Cor borda">
                  <ColorPickerPro
                    value={b.borderColor ?? btnDefaults.borderColor ?? 'rgba(0,0,0,0.10)'}
                    onChange={(hex) => setBtn(key, { borderColor: hex })}
                    onEyedropper={() => pickEyedropper((hex) => setBtn(key, { borderColor: hex }))}
                  />
                </Row>
              )}

              <Row label="Cor ícone">
                <ColorPickerPro
                  value={b.iconColor ?? btnDefaults.iconColor ?? '#111827'}
                  onChange={(hex) => setBtn(key, { iconColor: hex })}
                  onEyedropper={() => pickEyedropper((hex) => setBtn(key, { iconColor: hex }))}
                />
              </Row>

              <Row label="Cor texto">
                <ColorPickerPro
                  value={b.textColor ?? btnDefaults.textColor ?? '#111827'}
                  onChange={(hex) => setBtn(key, { textColor: hex })}
                  onEyedropper={() => pickEyedropper((hex) => setBtn(key, { textColor: hex }))}
                />
              </Row>

              <Row label="Sombra">
                <Toggle
                  active={b.shadow ?? btnDefaults.shadow ?? false}
                  onClick={() => setBtn(key, { shadow: !(b.shadow ?? btnDefaults.shadow ?? false) })}
                />
              </Row>
            </div>
          )
        })}
      </CollapsibleSection>

      {/* ========== SECÇÃO 7: POSIÇÃO ========== */}
      <CollapsibleSection
        title="📍 Posição"
        subtitle="Offset do bloco"
        isOpen={activeSection === 'position'}
        onToggle={() => setActiveSection(activeSection === 'position' ? null : 'position')}
      >
        <Row label="Offset Y">
          <input
            type="range"
            min={-80}
            max={80}
            step={4}
            value={st.offsetY ?? 0}
            onChange={(e) => setStyle({ offsetY: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={rightNum}>{st.offsetY ?? 0}px</span>
        </Row>

        <Row label="">
          <Button onClick={() => setStyle({ offsetY: 0 })}>Reset</Button>
        </Row>
      </CollapsibleSection>

    </div>
  )
}

// =======================
// Componentes auxiliares
// =======================

const rightNum: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
  minWidth: 45,
  textAlign: 'right',
}

const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fff',
  fontWeight: 600,
  fontSize: 12,
  minWidth: 100,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fff',
  fontSize: 13,
  fontWeight: 500,
}

function CollapsibleSection({ title, subtitle, isOpen, onToggle, children }: {
  title: string
  subtitle?: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{subtitle}</div>}
        </div>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 8,
            background: 'rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </div>
      </button>
      {isOpen && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>{label}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{children}</div>
    </div>
  )
}

function Button({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.10)',
        background: '#fff',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: 12,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function MiniButton({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 10,
        border: active ? '2px solid #3b82f6' : '1px solid rgba(0,0,0,0.10)',
        background: active ? 'rgba(59,130,246,0.1)' : '#fff',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: 11,
        color: active ? '#3b82f6' : '#333',
        transition: 'all 0.15s',
        minWidth: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  )
}

function Toggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        background: active ? '#3b82f6' : '#e5e7eb',
        position: 'relative',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: active ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }}
      />
    </button>
  )
}
