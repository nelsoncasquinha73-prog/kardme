'use client'

import React, { useState } from 'react'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import SwatchRow from '@/components/editor/SwatchRow'
import { FONT_OPTIONS } from '@/lib/fontes'
import { Section, Row, Toggle, input, select, rightNum } from '@/components/editor/ui'

type SocialChannel = 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'website'

type SocialItem = {
  uid: string
  id?: SocialChannel | null
  enabled?: boolean
  label?: string
  url?: string
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

type SocialSettings = {
  heading?: string
  layout?: {
    direction?: 'row' | 'column'
    align?: 'left' | 'center' | 'right'
    gapPx?: number
  }
  items?: SocialItem[] // ✅ array compatível com BD
}

type SocialStyle = {
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
  buttons?: Partial<Record<SocialChannel, ButtonStyle>>

  headingFontFamily?: string
  headingFontWeight?: number
  headingColor?: string
  headingBold?: boolean
  headingAlign?: 'left' | 'center' | 'right'
}

type CombinedState = {
  settings: SocialSettings
  style: SocialStyle
}

type Props = {
  settings: SocialSettings
  style?: SocialStyle
  onChange: (next: CombinedState) => void
}

const CHANNELS: Array<{ key: SocialChannel; title: string; placeholder: string }> = [
  { key: 'facebook', title: 'Facebook', placeholder: 'https://facebook.com/...' },
  { key: 'instagram', title: 'Instagram', placeholder: 'https://instagram.com/...' },
  { key: 'linkedin', title: 'LinkedIn', placeholder: 'https://linkedin.com/in/...' },
  { key: 'tiktok', title: 'TikTok', placeholder: 'https://tiktok.com/@...' },
  { key: 'youtube', title: 'YouTube', placeholder: 'https://youtube.com/@...' },
  { key: 'website', title: 'Website', placeholder: 'https://...' },
]

function stop(e: React.PointerEvent | React.MouseEvent) {
  e.stopPropagation?.()
}

function clampNum(v: any, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function normalizeCombined(inputSettings: SocialSettings, inputStyle?: SocialStyle): CombinedState {
  const items = Array.isArray(inputSettings.items) ? inputSettings.items : []

  // garante que existe 1 item por canal (uid estável)
  const ensured = CHANNELS.map(({ key }, i) => {
    const existing = items.find((x) => x?.id === key) || items.find((x) => x?.uid === key)
    return (
      existing || {
        uid: key,
        id: key,
        enabled: false,
        url: '',
        label: '',
      }
    )
  })

  const settings: SocialSettings = {
    heading: inputSettings.heading ?? 'Redes Sociais',
    layout: {
      direction: inputSettings.layout?.direction ?? 'row',
      align: inputSettings.layout?.align ?? 'center',
      gapPx: inputSettings.layout?.gapPx ?? 10,
    },
    items: ensured,
  }

  const style: SocialStyle = {
    offsetY: inputStyle?.offsetY ?? 0,
    showLabel: inputStyle?.showLabel ?? true,
    uniformButtons: inputStyle?.uniformButtons ?? false,
    uniformWidthPx: inputStyle?.uniformWidthPx ?? 160,
    uniformHeightPx: inputStyle?.uniformHeightPx ?? 52,
    uniformContentAlign: inputStyle?.uniformContentAlign ?? 'center',
    headingFontSize: inputStyle?.headingFontSize ?? 13,
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
    buttons: inputStyle?.buttons || {},
    headingFontFamily: inputStyle?.headingFontFamily ?? '',
    headingFontWeight: inputStyle?.headingFontWeight ?? 900,
    headingColor: inputStyle?.headingColor ?? '#111827',
    headingBold: inputStyle?.headingBold ?? true,
    headingAlign: inputStyle?.headingAlign ?? 'left',
  }

  return { settings, style }
}

export default function SocialBlockEditor({ settings, style, onChange }: Props) {
  const { openPicker } = useColorPicker()
  const [local, setLocal] = useState<CombinedState>(() => normalizeCombined(settings, style))

  React.useEffect(() => {
    setLocal(normalizeCombined(settings, style))
  }, [settings, style])

  function patch(fn: (d: CombinedState) => void) {
    const next = structuredClone(local)
    fn(next)
    setLocal(next)
    onChange(next)
  }

  const setSettings = (patchSettings: Partial<SocialSettings>) =>
    patch((d) => Object.assign(d.settings, patchSettings))

  const setStylePatch = (patchStyle: Partial<SocialStyle>) =>
    patch((d) => Object.assign(d.style, patchStyle))

  const items = local.settings.items || []
  const container = local.style.container || {}
  const bgEnabled = (container.bgColor ?? 'transparent') !== 'transparent'
  const borderEnabled = (container.borderWidth ?? 0) > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title="Conteúdo">
        <Row label="Título">
          <input
            value={local.settings.heading ?? 'Redes Sociais'}
            onChange={(e) => setSettings({ heading: e.target.value })}
            style={input}
            placeholder="Redes Sociais"
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>

        <Row label="Alinhamento do título">
          <select
            value={local.style.headingAlign ?? 'left'}
            onChange={(e) => setStylePatch({ headingAlign: e.target.value as 'left' | 'center' | 'right' })}
            style={select}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          >
            <option value="left">Esquerda</option>
            <option value="center">Centro</option>
            <option value="right">Direita</option>
          </select>
        </Row>

        <Row label="Cor do título">
          <SwatchRow
            value={local.style.headingColor ?? '#111827'}
            onChange={(hex) => setStylePatch({ headingColor: hex })}
            onEyedropper={() =>
              openPicker({ mode: 'eyedropper', onPick: (hex) => setStylePatch({ headingColor: hex }) })
            }
          />
        </Row>

        <Row label="Negrito">
          <Toggle
            active={local.style.headingBold ?? true}
            onClick={() => setStylePatch({ headingBold: !(local.style.headingBold ?? true) })}
          />
        </Row>

        <Row label="Fonte do título">
          <select
            value={local.style.headingFontFamily ?? ''}
            onChange={(e) => setStylePatch({ headingFontFamily: e.target.value || undefined })}
            style={select}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
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
            value={String(local.style.headingFontWeight ?? 900)}
            onChange={(e) => setStylePatch({ headingFontWeight: clampNum(e.target.value, 900) })}
            style={select}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
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
            value={local.style.headingFontSize ?? 13}
            onChange={(e) => {
              const v = e.target.value
              if (v === '') return setStylePatch({ headingFontSize: undefined })
              setStylePatch({ headingFontSize: Math.max(10, Math.min(32, Number(v))) })
            }}
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>
      </Section>

      <Section title="Layout (alinhamento e espaçamento)">
        <Row label="Direção">
          <select
            value={local.settings.layout?.direction ?? 'row'}
            onChange={(e) =>
              setSettings({ layout: { ...local.settings.layout, direction: e.target.value as 'row' | 'column' } })
            }
            style={select}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          >
            <option value="row">Linha</option>
            <option value="column">Coluna</option>
          </select>
        </Row>

        <Row label="Alinhamento">
          <select
            value={local.settings.layout?.align ?? 'center'}
            onChange={(e) =>
              setSettings({ layout: { ...local.settings.layout, align: e.target.value as 'left' | 'center' | 'right' } })
            }
            style={select}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
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
            value={local.settings.layout?.gapPx ?? 10}
            onChange={(e) =>
              setSettings({ layout: { ...local.settings.layout, gapPx: clampNum(e.target.value, 10) } })
            }
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
          <span style={rightNum}>{local.settings.layout?.gapPx ?? 10}px</span>
        </Row>
      </Section>

      <Section title="Botões">
        <Row label="Mostrar texto nos botões">
          <Toggle
            active={local.style.showLabel ?? true}
            onClick={() => setStylePatch({ showLabel: !(local.style.showLabel ?? true) })}
          />
        </Row>

        <Row label="Botões com tamanho uniforme">
          <Toggle
            active={local.style.uniformButtons ?? false}
            onClick={() => setStylePatch({ uniformButtons: !(local.style.uniformButtons ?? false) })}
          />
        </Row>
      </Section>

      <Section title="Aparência do bloco">
        <Row label="Fundo">
          <Toggle
            active={bgEnabled}
            onClick={() => setStylePatch({ container: { ...container, bgColor: bgEnabled ? 'transparent' : '#ffffff' } })}
          />
        </Row>

        {bgEnabled && (
          <Row label="Cor fundo">
            <SwatchRow
              value={container.bgColor ?? '#ffffff'}
              onChange={(hex) => setStylePatch({ container: { ...container, bgColor: hex } })}
              onEyedropper={() =>
                openPicker({ mode: 'eyedropper', onPick: (hex) => setStylePatch({ container: { ...container, bgColor: hex } }) })
              }
            />
          </Row>
        )}

        <Row label="Sombra">
          <Toggle
            active={container.shadow ?? false}
            onClick={() => setStylePatch({ container: { ...container, shadow: !(container.shadow ?? false) } })}
          />
        </Row>

        <Row label="Borda">
          <Toggle
            active={borderEnabled}
            onClick={() => setStylePatch({ container: { ...container, borderWidth: borderEnabled ? 0 : 1 } })}
          />
        </Row>
      </Section>

      <Section title="Links (por rede)">
        {CHANNELS.map(({ key, title, placeholder }) => {
          const it = items.find((x) => x.id === key || x.uid === key) || { uid: key, id: key, enabled: false, url: '', label: '' }

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

              <Row label="Ativo">
                <Toggle
                  active={it.enabled ?? false}
                  onClick={() =>
                    patch((d) => {
                      d.settings.items = d.settings.items || []
                      const idx = d.settings.items.findIndex((x) => x.id === key || x.uid === key)
                      const current = idx >= 0 ? d.settings.items[idx] : { uid: key, id: key }
                      const next = { ...current, uid: current.uid || key, id: (current.id as any) || key, enabled: !(current.enabled ?? false) }
                      if (idx >= 0) d.settings.items[idx] = next
                      else d.settings.items.push(next as any)
                    })
                  }
                />
              </Row>

              <Row label="Label (opcional)">
                <input
                  value={it.label ?? ''}
                  onChange={(e) =>
                    patch((d) => {
                      d.settings.items = d.settings.items || []
                      const idx = d.settings.items.findIndex((x) => x.id === key || x.uid === key)
                      const current = idx >= 0 ? d.settings.items[idx] : { uid: key, id: key }
                      const next = { ...current, uid: current.uid || key, id: (current.id as any) || key, label: e.target.value }
                      if (idx >= 0) d.settings.items[idx] = next
                      else d.settings.items.push(next as any)
                    })
                  }
                  style={input}
                  placeholder={`Ex: ${title}`}
                  data-no-block-select="1"
                  onPointerDown={stop}
                  onMouseDown={stop}
                />
              </Row>

              <Row label="URL">
                <input
                  value={it.url ?? ''}
                  onChange={(e) =>
                    patch((d) => {
                      d.settings.items = d.settings.items || []
                      const idx = d.settings.items.findIndex((x) => x.id === key || x.uid === key)
                      const current = idx >= 0 ? d.settings.items[idx] : { uid: key, id: key }
                      const next = {
                        ...current,
                        uid: current.uid || key,
                        id: (current.id as any) || key,
                        url: e.target.value,
                        enabled: true,
                      }
                      if (idx >= 0) d.settings.items[idx] = next
                      else d.settings.items.push(next as any)
                    })
                  }
                  style={input}
                  placeholder={placeholder}
                  data-no-block-select="1"
                  onPointerDown={stop}
                  onMouseDown={stop}
                />
              </Row>
            </div>
          )
        })}
      </Section>
    </div>
  )
}
