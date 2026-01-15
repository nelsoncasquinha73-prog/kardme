'use client'

import React from 'react'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import SwatchRow from '@/components/editor/SwatchRow'
import { FONT_OPTIONS } from '@/lib/fontes'
import { Section, Row, Toggle, input, select, rightNum } from '@/components/editor/ui'

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

const CHANNELS: Array<{ key: ContactChannel; title: string; placeholder: string }> = [
  { key: 'phone', title: 'Telemóvel', placeholder: '+351 9xx xxx xxx' },
  { key: 'email', title: 'Email', placeholder: 'nome@dominio.pt' },
  { key: 'whatsapp', title: 'WhatsApp', placeholder: '+351 9xx xxx xxx' },
  { key: 'telegram', title: 'Telegram', placeholder: '@username' },
]

function clampNum(v: any, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export default function ContactBlockEditor({ settings, style, onChangeSettings, onChangeStyle }: Props) {
  const { openPicker } = useColorPicker()
  const s = settings || {}
  const st = style || {}

  const layout = s.layout || {}
  const items = s.items || {}

  const container = st.container || {}
  const btnDefaults = st.buttonDefaults || {}
  const btns = st.buttons || {}

  const pick = (apply: (hex: string) => void) => openPicker({ mode: 'eyedropper', onPick: apply })

  const setSettings = (patch: Partial<ContactSettings>) => onChangeSettings({ ...s, ...patch })
  const setLayout = (patch: Partial<NonNullable<ContactSettings['layout']>>) =>
    setSettings({ layout: { ...layout, ...patch } })

  const setItem = (ch: ContactChannel, patch: Partial<ContactItem>) => {
    setSettings({
      items: {
        ...items,
        [ch]: {
          ...(items[ch] || {}),
          ...patch,
        },
      },
    })
  }

  const setStyle = (patch: Partial<ContactStyle>) => onChangeStyle({ ...st, ...patch })
  const setContainer = (patch: Partial<NonNullable<ContactStyle['container']>>) =>
    setStyle({ container: { ...container, ...patch } })

  const setBtnDefaults = (patch: Partial<ButtonStyle>) =>
    setStyle({ buttonDefaults: { ...btnDefaults, ...patch } })

  const setBtn = (ch: ContactChannel, patch: Partial<ButtonStyle>) =>
    setStyle({
      buttons: {
        ...btns,
        [ch]: {
          ...(btns[ch] || {}),
          ...patch,
        },
      },
    })

  // Booleans explícitos para evitar undefined e bugs
  const headingBold = st.headingBold ?? true
  const showLabel = st.showLabel ?? true
  const uniformButtons = st.uniformButtons ?? false

  const bgEnabled = (container.bgColor ?? 'transparent') !== 'transparent'
  const borderEnabled = (container.borderWidth ?? 0) > 0

  const defaultsBorderEnabled = btnDefaults.borderEnabled ?? true
  const defaultsBgMode = (btnDefaults.bgMode ?? 'solid') as 'solid' | 'gradient'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title="Conteúdo">
        <Row label="Título">
          <input
            value={s.heading ?? 'Contacto'}
            onChange={(e) => setSettings({ heading: e.target.value })}
            style={input}
            placeholder="Contacto"
          />
        </Row>

        <Row label="Alinhamento do título">
          <select
            value={st.headingAlign ?? 'left'}
            onChange={(e) => setStyle({ headingAlign: e.target.value as 'left' | 'center' | 'right' })}
            style={select}
          >
            <option value="left">Esquerda</option>
            <option value="center">Centro</option>
            <option value="right">Direita</option>
          </select>
        </Row>

        <Row label="Cor do título">
          <SwatchRow
            value={st.headingColor ?? '#111827'}
            onChange={(hex) => setStyle({ headingColor: hex })}
            onEyedropper={() => pick((hex) => setStyle({ headingColor: hex }))}
          />
        </Row>

        <Row label="Negrito">
          <Toggle active={headingBold} onClick={() => setStyle({ headingBold: !headingBold })} />
        </Row>

        <Row label="Fonte do título">
          <select
            value={st.headingFontFamily ?? ''}
            onChange={(e) => setStyle({ headingFontFamily: e.target.value || undefined })}
            style={select}
          >
            <option value="">Padrão</option>
            {FONT_OPTIONS.map((o) => (
              <option key={o.label} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Row>

        <Row label="Peso do título">
          <select
            value={String(st.headingFontWeight ?? 900)}
            onChange={(e) => setStyle({ headingFontWeight: clampNum(e.target.value, 900) })}
            style={select}
          >
            <option value="400">Normal (400)</option>
            <option value="600">Semi (600)</option>
            <option value="700">Bold (700)</option>
            <option value="800">Extra (800)</option>
            <option value="900">Black (900)</option>
          </select>
        </Row>

        <Row label="Tamanho do título (px)">
          <input
            type="number"
            min={10}
            max={32}
            value={st.headingFontSize ?? 13}
            onChange={(e) => {
              const v = e.target.value
              if (v === '') return setStyle({ headingFontSize: undefined })
              setStyle({ headingFontSize: Math.max(10, Math.min(32, Number(v))) })
            }}
            style={input}
          />
        </Row>

        <Section title="Layout (alinhamento e espaçamento)">
          <Row label="Direção">
            <select
              value={layout.direction ?? 'row'}
              onChange={(e) => setLayout({ direction: e.target.value as 'row' | 'column' })}
              style={select}
            >
              <option value="row">Linha</option>
              <option value="column">Coluna</option>
            </select>
          </Row>

          <Row label="Alinhamento">
            <select
              value={layout.align ?? 'center'}
              onChange={(e) => setLayout({ align: e.target.value as 'left' | 'center' | 'right' })}
              style={select}
            >
              <option value="left">Esquerda</option>
              <option value="center">Centro</option>
              <option value="right">Direita</option>
            </select>
          </Row>

          <Row label="Espaço entre botões (px)">
            <input
              type="range"
              min={0}
              max={28}
              step={1}
              value={layout.gapPx ?? 10}
              onChange={(e) => setLayout({ gapPx: clampNum(e.target.value, 10) })}
            />
            <span style={rightNum}>{layout.gapPx ?? 10}px</span>
          </Row>
        </Section>

        {CHANNELS.map((cdef) => {
          const it = items[cdef.key] || {}
          const isEnabled = it.enabled ?? true

          return (
            <div
              key={cdef.key}
              style={{
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 14,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 13 }}>{cdef.title}</strong>
                <Toggle active={isEnabled} onClick={() => setItem(cdef.key, { enabled: !isEnabled })} />
              </div>

              <Row label="Valor">
                <input
                  value={it.value ?? ''}
                  onChange={(e) => setItem(cdef.key, { value: e.target.value })}
                  placeholder={cdef.placeholder}
                  style={input}
                  disabled={!isEnabled}
                />
              </Row>

              <Row label="Label">
                <input
                  value={it.label ?? ''}
                  onChange={(e) => setItem(cdef.key, { label: e.target.value })}
                  placeholder={`Ex: \${cdef.title}`}
                  style={input}
                  disabled={!isEnabled}
                />
              </Row>
            </div>
          )
        })}
      </Section>

      <Section title="Layout dos botões">
        <Row label="Mostrar texto nos botões">
          <Toggle active={showLabel} onClick={() => setStyle({ showLabel: !showLabel })} />
        </Row>

        <Row label="Botões com tamanho uniforme">
          <Toggle active={uniformButtons} onClick={() => setStyle({ uniformButtons: !uniformButtons })} />
        </Row>

        {uniformButtons && (
          <>
            <Row label="Largura fixa dos botões (px)">
              <input
                type="number"
                min={44}
                max={400}
                value={st.uniformWidthPx ?? 160}
                onChange={(e) => setStyle({ uniformWidthPx: clampNum(e.target.value, 160) })}
                style={input}
              />
            </Row>

            <Row label="Altura fixa dos botões (px)">
              <input
                type="number"
                min={24}
                max={120}
                value={st.uniformHeightPx ?? 52}
                onChange={(e) => setStyle({ uniformHeightPx: clampNum(e.target.value, 52) })}
                style={input}
              />
            </Row>

            <Row label="Alinhamento do conteúdo">
              <select
                value={st.uniformContentAlign ?? 'center'}
                onChange={(e) => setStyle({ uniformContentAlign: e.target.value as 'left' | 'center' })}
                style={select}
              >
                <option value="left">Esquerda</option>
                <option value="center">Centro</option>
              </select>
            </Row>
          </>
        )}
      </Section>

      <Section title="Aparência do bloco">
        <Row label="Fundo">
          <Toggle active={bgEnabled} onClick={() => setContainer({ bgColor: bgEnabled ? 'transparent' : '#ffffff' })} />
        </Row>

        {bgEnabled && (
          <Row label="Cor fundo">
            <SwatchRow
              value={container.bgColor ?? '#ffffff'}
              onChange={(hex) => setContainer({ bgColor: hex })}
              onEyedropper={() => pick((hex) => setContainer({ bgColor: hex }))}
            />
          </Row>
        )}

        <Row label="Sombra">
          <Toggle active={container.shadow ?? false} onClick={() => setContainer({ shadow: !(container.shadow ?? false) })} />
        </Row>

        <Row label="Borda">
          <Toggle active={borderEnabled} onClick={() => setContainer({ borderWidth: borderEnabled ? 0 : 1 })} />
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
                onChange={(e) => setContainer({ borderWidth: clampNum(e.target.value, 1) })}
              />
              <span style={rightNum}>{container.borderWidth ?? 1}px</span>
            </Row>

            <Row label="Cor borda">
              <SwatchRow
                value={container.borderColor ?? '#e5e7eb'}
                onChange={(hex) => setContainer({ borderColor: hex })}
                onEyedropper={() => pick((hex) => setContainer({ borderColor: hex }))}
              />
            </Row>
          </>
        )}

        <Row label="Raio">
          <input
            type="range"
            min={0}
            max={32}
            step={1}
            value={container.radius ?? 14}
            onChange={(e) => setContainer({ radius: clampNum(e.target.value, 14) })}
          />
          <span style={rightNum}>{container.radius ?? 14}px</span>
        </Row>

        <Row label="Padding">
          <input
            type="range"
            min={0}
            max={28}
            step={1}
            value={container.padding ?? 16}
            onChange={(e) => setContainer({ padding: clampNum(e.target.value, 16) })}
          />
          <span style={rightNum}>{container.padding ?? 16}px</span>
        </Row>
      </Section>

      <Section title="Estilos dos botões (defaults)">
        <Row label="Tamanho">
          <input
            type="range"
            min={24}
            max={64}
            step={1}
            value={btnDefaults.sizePx ?? 44}
            onChange={(e) => setBtnDefaults({ sizePx: clampNum(e.target.value, 44) })}
          />
          <span style={rightNum}>{btnDefaults.sizePx ?? 44}px</span>
        </Row>

        <Row label="Raio">
          <input
            type="range"
            min={0}
            max={32}
            step={1}
            value={btnDefaults.radius ?? 14}
            onChange={(e) => setBtnDefaults({ radius: clampNum(e.target.value, 14) })}
          />
          <span style={rightNum}>{btnDefaults.radius ?? 14}px</span>
        </Row>

        <Row label="Modo Fundo">
          <select
            value={defaultsBgMode}
            onChange={(e) => setBtnDefaults({ bgMode: e.target.value as 'solid' | 'gradient' })}
            style={select}
          >
            <option value="solid">Sólido</option>
            <option value="gradient">Degradê</option>
          </select>
        </Row>

        {defaultsBgMode === 'gradient' && (
          <>
            <Row label="Cor Degradê (from)">
              <SwatchRow
                value={btnDefaults.bgGradient?.from ?? '#111827'}
                onChange={(hex) => setBtnDefaults({ bgGradient: { ...btnDefaults.bgGradient, from: hex } })}
                onEyedropper={() => pick((hex) => setBtnDefaults({ bgGradient: { ...btnDefaults.bgGradient, from: hex } }))}
              />
            </Row>

            <Row label="Cor Degradê (to)">
              <SwatchRow
                value={btnDefaults.bgGradient?.to ?? '#374151'}
                onChange={(hex) => setBtnDefaults({ bgGradient: { ...btnDefaults.bgGradient, to: hex } })}
                onEyedropper={() => pick((hex) => setBtnDefaults({ bgGradient: { ...btnDefaults.bgGradient, to: hex } }))}
              />
            </Row>

            <Row label="Ângulo (deg)">
              <input
                type="number"
                min={0}
                max={360}
                value={btnDefaults.bgGradient?.angle ?? 135}
                onChange={(e) => setBtnDefaults({ bgGradient: { ...btnDefaults.bgGradient, angle: Number(e.target.value) } })}
                style={{ width: 70, fontSize: 14, padding: 6, borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)' }}
              />
            </Row>
          </>
        )}

        <Row label="Fundo">
          <SwatchRow
            value={btnDefaults.bgColor ?? '#ffffff'}
            onChange={(hex) => setBtnDefaults({ bgColor: hex })}
            onEyedropper={() => pick((hex) => setBtnDefaults({ bgColor: hex }))}
            disabled={defaultsBgMode === 'gradient'}
          />
        </Row>

        <Row label="Borda">
          <Toggle active={defaultsBorderEnabled} onClick={() => setBtnDefaults({ borderEnabled: !defaultsBorderEnabled })} />
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
                onChange={(e) => setBtnDefaults({ borderWidth: clampNum(e.target.value, 1) })}
              />
              <span style={rightNum}>{btnDefaults.borderWidth ?? 1}px</span>
            </Row>

            <Row label="Cor borda">
              <SwatchRow
                value={btnDefaults.borderColor ?? 'rgba(0,0,0,0.10)'}
                onChange={(hex) => setBtnDefaults({ borderColor: hex })}
                onEyedropper={() => pick((hex) => setBtnDefaults({ borderColor: hex }))}
              />
            </Row>
          </>
        )}

        <Row label="Ícone">
          <SwatchRow
            value={btnDefaults.iconColor ?? '#111827'}
            onChange={(hex) => setBtnDefaults({ iconColor: hex })}
            onEyedropper={() => pick((hex) => setBtnDefaults({ iconColor: hex }))}
          />
        </Row>

        <Row label="Texto">
          <SwatchRow
            value={btnDefaults.textColor ?? '#111827'}
            onChange={(hex) => setBtnDefaults({ textColor: hex })}
            onEyedropper={() => pick((hex) => setBtnDefaults({ textColor: hex }))}
          />
        </Row>

        <Row label="Fonte">
          <select
            value={btnDefaults.fontFamily ?? ''}
            onChange={(e) => setBtnDefaults({ fontFamily: e.target.value || undefined })}
            style={select}
          >
            <option value="">Padrão</option>
            {FONT_OPTIONS.map((o) => (
              <option key={o.label} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Row>

        <Row label="Peso do texto">
          <select
            value={String(btnDefaults.fontWeight ?? 800)}
            onChange={(e) => setBtnDefaults({ fontWeight: clampNum(e.target.value, 800) })}
            style={select}
          >
            <option value="400">Normal (400)</option>
            <option value="600">Semi (600)</option>
            <option value="700">Bold (700)</option>
            <option value="800">Extra (800)</option>
            <option value="900">Black (900)</option>
          </select>
        </Row>

        <Row label="Tamanho do texto (px)">
          <input
            type="number"
            min={8}
            max={36}
            value={btnDefaults.labelFontSize ?? 13}
            onChange={(e) => {
              const v = e.target.value
              if (v === '') return setBtnDefaults({ labelFontSize: undefined })
              setBtnDefaults({ labelFontSize: Math.max(8, Math.min(36, Number(v))) })
            }}
            style={input}
          />
        </Row>

        <Row label="Escala do ícone">
          <input
            type="range"
            min={0.4}
            max={0.9}
            step={0.01}
            value={btnDefaults.iconScale ?? 0.58}
            onChange={(e) => setBtnDefaults({ iconScale: Number(e.target.value) })}
            style={{ width: 140 }}
          />
          <span style={rightNum}>{(btnDefaults.iconScale ?? 0.58).toFixed(2)}</span>
        </Row>

        <Row label="Padding Y">
          <input
            type="range"
            min={0}
            max={24}
            step={1}
            value={btnDefaults.paddingY ?? 10}
            onChange={(e) => setBtnDefaults({ paddingY: clampNum(e.target.value, 10) })}
          />
          <span style={rightNum}>{btnDefaults.paddingY ?? 10}px</span>
        </Row>

        <Row label="Padding X">
          <input
            type="range"
            min={0}
            max={32}
            step={1}
            value={btnDefaults.paddingX ?? 12}
            onChange={(e) => setBtnDefaults({ paddingX: clampNum(e.target.value, 12) })}
          />
          <span style={rightNum}>{btnDefaults.paddingX ?? 12}px</span>
        </Row>

        <Row label="Sombra">
          <Toggle
            active={btnDefaults.shadow ?? false}
            onClick={() => setBtnDefaults({ shadow: !(btnDefaults.shadow ?? false) })}
          />
        </Row>
      </Section>

      <Section title="Estilos por botão (override)">
        {CHANNELS.map(({ key, title }) => {
          const b = btns[key] || {}

          const bBorderEnabled = b.borderEnabled ?? defaultsBorderEnabled
          const bBgMode = (b.bgMode ?? defaultsBgMode) as 'solid' | 'gradient'

          return (
            <div
              key={key}
              style={{
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 14,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <strong style={{ fontSize: 13 }}>{title}</strong>

              <Row label="Modo Fundo">
                <select
                  value={bBgMode}
                  onChange={(e) => setBtn(key, { bgMode: e.target.value as 'solid' | 'gradient' })}
                  style={select}
                >
                  <option value="solid">Sólido</option>
                  <option value="gradient">Degradê</option>
                </select>
              </Row>

              {bBgMode === 'gradient' && (
                <>
                  <Row label="Cor Degradê (from)">
                    <SwatchRow
                      value={b.bgGradient?.from ?? btnDefaults.bgGradient?.from ?? '#111827'}
                      onChange={(hex) => setBtn(key, { bgGradient: { ...(b.bgGradient || {}), from: hex } })}
                      onEyedropper={() => pick((hex) => setBtn(key, { bgGradient: { ...(b.bgGradient || {}), from: hex } }))}
                    />
                  </Row>

                  <Row label="Cor Degradê (to)">
                    <SwatchRow
                      value={b.bgGradient?.to ?? btnDefaults.bgGradient?.to ?? '#374151'}
                      onChange={(hex) => setBtn(key, { bgGradient: { ...(b.bgGradient || {}), to: hex } })}
                      onEyedropper={() => pick((hex) => setBtn(key, { bgGradient: { ...(b.bgGradient || {}), to: hex } }))}
                    />
                  </Row>

                  <Row label="Ângulo (deg)">
                    <input
                      type="number"
                      min={0}
                      max={360}
                      value={b.bgGradient?.angle ?? btnDefaults.bgGradient?.angle ?? 135}
                      onChange={(e) => setBtn(key, { bgGradient: { ...(b.bgGradient || {}), angle: clampNum(e.target.value, 135) } })}
                      style={{
                        width: 70,
                        fontSize: 14,
                        padding: 6,
                        borderRadius: 8,
                        border: '1px solid rgba(0,0,0,0.12)',
                      }}
                    />
                  </Row>
                </>
              )}

              <Row label="Fundo">
                <SwatchRow
                  value={b.bgColor ?? btnDefaults.bgColor ?? '#ffffff'}
                  onChange={(hex) => setBtn(key, { bgColor: hex })}
                  onEyedropper={() => pick((hex) => setBtn(key, { bgColor: hex }))}
                  disabled={bBgMode === 'gradient'}
                />
              </Row>

              <Row label="Borda">
                <Toggle active={bBorderEnabled} onClick={() => setBtn(key, { borderEnabled: !bBorderEnabled })} />
              </Row>

              {bBorderEnabled && (
                <>
                  <Row label="Espessura">
                    <input
                      type="range"
                      min={1}
                      max={6}
                      step={1}
                      value={b.borderWidth ?? btnDefaults.borderWidth ?? 1}
                      onChange={(e) => setBtn(key, { borderWidth: clampNum(e.target.value, 1) })}
                    />
                    <span style={rightNum}>{b.borderWidth ?? btnDefaults.borderWidth ?? 1}px</span>
                  </Row>

                  <Row label="Cor borda">
                    <SwatchRow
                      value={b.borderColor ?? btnDefaults.borderColor ?? 'rgba(0,0,0,0.10)'}
                      onChange={(hex) => setBtn(key, { borderColor: hex })}
                      onEyedropper={() => pick((hex) => setBtn(key, { borderColor: hex }))}
                    />
                  </Row>
                </>
              )}

              <Row label="Ícone">
                <SwatchRow
                  value={b.iconColor ?? btnDefaults.iconColor ?? '#111827'}
                  onChange={(hex) => setBtn(key, { iconColor: hex })}
                  onEyedropper={() => pick((hex) => setBtn(key, { iconColor: hex }))}
                />
              </Row>

              <Row label="Texto">
                <SwatchRow
                  value={b.textColor ?? btnDefaults.textColor ?? '#111827'}
                  onChange={(hex) => setBtn(key, { textColor: hex })}
                  onEyedropper={() => pick((hex) => setBtn(key, { textColor: hex }))}
                />
              </Row>

              <Row label="Fonte">
                <select
                  value={b.fontFamily ?? btnDefaults.fontFamily ?? ''}
                  onChange={(e) => setBtn(key, { fontFamily: e.target.value || undefined })}
                  style={select}
                >
                  <option value="">Padrão</option>
                  {FONT_OPTIONS.map((o) => (
                    <option key={o.label} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Row>

              <Row label="Peso do texto">
                <select
                  value={String(b.fontWeight ?? btnDefaults.fontWeight ?? 800)}
                  onChange={(e) => setBtn(key, { fontWeight: clampNum(e.target.value, 800) })}
                  style={select}
                >
                  <option value="400">Normal (400)</option>
                  <option value="600">Semi (600)</option>
                  <option value="700">Bold (700)</option>
                  <option value="800">Extra (800)</option>
                  <option value="900">Black (900)</option>
                </select>
              </Row>

              <Row label="Tamanho do texto (px)">
                <input
                  type="number"
                  min={8}
                  max={36}
                  value={b.labelFontSize ?? btnDefaults.labelFontSize ?? 13}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === '') return setBtn(key, { labelFontSize: undefined })
                    setBtn(key, { labelFontSize: Math.max(8, Math.min(36, Number(v))) })
                  }}
                  style={input}
                />
              </Row>

              <Row label="Escala do ícone">
                <input
                  type="range"
                  min={0.4}
                  max={0.9}
                  step={0.01}
                  value={b.iconScale ?? btnDefaults.iconScale ?? 0.58}
                  onChange={(e) => setBtn(key, { iconScale: Number(e.target.value) })}
                  style={{ width: 140 }}
                />
                <span style={rightNum}>{(b.iconScale ?? btnDefaults.iconScale ?? 0.58).toFixed(2)}</span>
              </Row>

              <Row label="Padding Y">
                <input
                  type="range"
                  min={0}
                  max={24}
                  step={1}
                  value={b.paddingY ?? btnDefaults.paddingY ?? 10}
                  onChange={(e) => setBtn(key, { paddingY: clampNum(e.target.value, 10) })}
                />
                <span style={rightNum}>{b.paddingY ?? btnDefaults.paddingY ?? 10}px</span>
              </Row>

              <Row label="Padding X">
                <input
                  type="range"
                  min={0}
                  max={32}
                  step={1}
                  value={b.paddingX ?? btnDefaults.paddingX ?? 12}
                  onChange={(e) => setBtn(key, { paddingX: clampNum(e.target.value, 12) })}
                />
                <span style={rightNum}>{b.paddingX ?? btnDefaults.paddingX ?? 12}px</span>
              </Row>

              <Row label="Sombra">
                <Toggle active={b.shadow ?? false} onClick={() => setBtn(key, { shadow: !(b.shadow ?? false) })} />
              </Row>
            </div>
          )
        })}
      </Section>
    </div>
  )
}

