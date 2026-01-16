// components/dashboard/block-editors/SocialBlockEditor.tsx
'use client'

import React, { useRef, useState } from 'react'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import SwatchRow from '@/components/editor/SwatchRow'
import { FONT_OPTIONS } from '@/lib/fontes'
import { Section, Row, Toggle, input, select, rightNum } from '@/components/editor/ui'

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

  container?: {
    bgColor?: string
    radius?: number
    padding?: number
    shadow?: boolean
    borderWidth?: number
    borderColor?: string
  }

  buttonDefaults?: ButtonStyle

  // brand
  brandColors?: boolean
  brandMode?: 'bg' | 'icon'
}

type CombinedState = { settings: SocialSettings; style: SocialStyle }
type Props = { settings: SocialSettings; style?: SocialStyle; onChange: (next: CombinedState) => void }

const CHANNELS: Array<{ key: SocialChannel; title: string; placeholder: string }> = [
  { key: 'facebook', title: 'Facebook', placeholder: 'https://facebook.com/...' },
  { key: 'instagram', title: 'Instagram', placeholder: 'https://instagram.com/...' },
  { key: 'linkedin', title: 'LinkedIn', placeholder: 'https://linkedin.com/in/...' },
  { key: 'tiktok', title: 'TikTok', placeholder: 'https://tiktok.com/@...' },
  { key: 'youtube', title: 'YouTube', placeholder: 'https://youtube.com/@...' },
  { key: 'website', title: 'Website', placeholder: 'https://teusite.com' },
]

function clampNum(v: any, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

// ⚠️ IMPORTANT: NÃO usar preventDefault aqui (mata foco/colar em inputs)
function stop(e: React.PointerEvent | React.MouseEvent) {
  e.stopPropagation?.()
}

function normalizeCombined(inputSettings: SocialSettings, inputStyle?: SocialStyle): CombinedState {
  const settings: SocialSettings = {
    heading: inputSettings?.heading ?? 'Redes Sociais',
    layout: {
      direction: inputSettings?.layout?.direction ?? 'row',
      align: inputSettings?.layout?.align ?? 'center',
      gapPx: inputSettings?.layout?.gapPx ?? 10,
    },
    items: inputSettings?.items || {},
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

  const isEditingRef = useRef(false)
  const lastIncomingKeyRef = useRef<string>('')

  const incomingKey = JSON.stringify({ settings: settings || {}, style: style || {} })
  const [local, setLocal] = useState<CombinedState>(() => {
    lastIncomingKeyRef.current = incomingKey
    return normalizeCombined(settings, style)
  })

  // Sync seguro: só atualiza local quando NÃO estás a editar
  React.useEffect(() => {
    if (incomingKey === lastIncomingKeyRef.current) return
    lastIncomingKeyRef.current = incomingKey

    if (isEditingRef.current) return
    setLocal(normalizeCombined(settings, style))
  }, [incomingKey, settings, style])

  const markEditing = () => {
    isEditingRef.current = true
  }
  const unmarkEditing = () => {
    // pequeno “delay” para evitar blur -> autosave -> sync durante clique
    window.setTimeout(() => {
      isEditingRef.current = false
    }, 250)
  }

  const editProps = {
    onFocus: markEditing,
    onBlur: unmarkEditing,
    'data-no-block-select': '1',
    onPointerDown: stop,
    onMouseDown: stop,
  } as const

  function patch(fn: (d: CombinedState) => void) {
    setLocal((prev) => {
      const next = structuredClone(prev)
      fn(next)
      onChange(next)
      return next
    })
  }

  const s = local.settings
  const st = local.style
  const layout = s.layout || {}
  const container = st.container || {}
  const btn = st.buttonDefaults || {}

  const pick = (apply: (hex: string) => void) => openPicker({ mode: 'eyedropper', onPick: apply })

  const bgEnabled = (container.bgColor ?? 'transparent') !== 'transparent'
  const borderEnabled = (container.borderWidth ?? 0) > 0
  const defaultsBorderEnabled = btn.borderEnabled ?? true
  const defaultsBgMode = (btn.bgMode ?? 'solid') as 'solid' | 'gradient'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title="Conteúdo">
        <Row label="Título">
          <input
            value={s.heading ?? 'Redes Sociais'}
            onChange={(e) => patch((d) => (d.settings.heading = e.target.value))}
            style={input}
            placeholder="Redes Sociais"
            {...editProps}
          />
        </Row>

        <Row label="Alinhamento do título">
          <select
            value={st.headingAlign ?? 'left'}
            onChange={(e) => patch((d) => (d.style.headingAlign = e.target.value as any))}
            style={select}
            {...editProps}
          >
            <option value="left">Esquerda</option>
            <option value="center">Centro</option>
            <option value="right">Direita</option>
          </select>
        </Row>

        <Row label="Cor do título">
          <SwatchRow
            value={st.headingColor ?? '#111827'}
            onChange={(hex) => patch((d) => (d.style.headingColor = hex))}
            onEyedropper={() => pick((hex) => patch((d) => (d.style.headingColor = hex)))}
          />
        </Row>

        <Row label="Negrito">
          <Toggle active={st.headingBold ?? true} onClick={() => patch((d) => (d.style.headingBold = !(st.headingBold ?? true)))} />
        </Row>

        <Row label="Fonte do título">
          <select
            value={st.headingFontFamily ?? ''}
            onChange={(e) => patch((d) => (d.style.headingFontFamily = e.target.value || ''))}
            style={select}
            {...editProps}
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
            onChange={(e) => patch((d) => (d.style.headingFontWeight = clampNum(e.target.value, 900)))}
            style={select}
            {...editProps}
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
            onChange={(e) => patch((d) => (d.style.headingFontSize = Math.max(10, Math.min(32, Number(e.target.value)))))}
            style={input}
            {...editProps}
          />
        </Row>
      </Section>

      <Section title="Layout (alinhamento e espaçamento)">
        <Row label="Direção">
          <select
            value={layout.direction ?? 'row'}
            onChange={(e) => patch((d) => (d.settings.layout = { ...layout, direction: e.target.value as any }))}
            style={select}
            {...editProps}
          >
            <option value="row">Linha</option>
            <option value="column">Coluna</option>
          </select>
        </Row>

        <Row label="Alinhamento">
          <select
            value={layout.align ?? 'center'}
            onChange={(e) => patch((d) => (d.settings.layout = { ...layout, align: e.target.value as any }))}
            style={select}
            {...editProps}
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
            onChange={(e) => patch((d) => (d.settings.layout = { ...layout, gapPx: clampNum(e.target.value, 10) }))}
            {...editProps}
          />
          <span style={rightNum}>{layout.gapPx ?? 10}px</span>
        </Row>
      </Section>

      <Section title="Botões">
        <Row label="Mostrar texto nos botões">
          <Toggle active={st.showLabel ?? true} onClick={() => patch((d) => (d.style.showLabel = !(st.showLabel ?? true)))} />
        </Row>

        <Row label="Botões com tamanho uniforme">
          <Toggle active={st.uniformButtons ?? false} onClick={() => patch((d) => (d.style.uniformButtons = !(st.uniformButtons ?? false)))} />
        </Row>

        {st.uniformButtons && (
          <>
            <Row label="Largura fixa (px)">
              <input
                type="number"
                min={44}
                max={400}
                value={st.uniformWidthPx ?? 160}
                onChange={(e) => patch((d) => (d.style.uniformWidthPx = clampNum(e.target.value, 160)))}
                style={input}
                {...editProps}
              />
            </Row>

            <Row label="Altura fixa (px)">
              <input
                type="number"
                min={24}
                max={120}
                value={st.uniformHeightPx ?? 52}
                onChange={(e) => patch((d) => (d.style.uniformHeightPx = clampNum(e.target.value, 52)))}
                style={input}
                {...editProps}
              />
            </Row>

            <Row label="Alinhamento do conteúdo">
              <select
                value={st.uniformContentAlign ?? 'center'}
                onChange={(e) => patch((d) => (d.style.uniformContentAlign = e.target.value as any))}
                style={select}
                {...editProps}
              >
                <option value="left">Esquerda</option>
                <option value="center">Centro</option>
              </select>
            </Row>
          </>
        )}

        <Row label="Cores de marca">
          <Toggle active={st.brandColors ?? false} onClick={() => patch((d) => (d.style.brandColors = !(st.brandColors ?? false)))} />
        </Row>

        {st.brandColors && (
          <Row label="Modo">
            <select
              value={st.brandMode ?? 'bg'}
              onChange={(e) => patch((d) => (d.style.brandMode = e.target.value as any))}
              style={select}
              {...editProps}
            >
              <option value="bg">Fundo (ícone branco)</option>
              <option value="icon">Só ícone (fundo neutro)</option>
            </select>
          </Row>
        )}
      </Section>

      <Section title="Aparência do bloco">
        <Row label="Fundo">
          <Toggle
            active={bgEnabled}
            onClick={() =>
              patch((d) => {
                d.style.container = { ...container, bgColor: bgEnabled ? 'transparent' : '#ffffff' }
              })
            }
          />
        </Row>

        {bgEnabled && (
          <Row label="Cor fundo">
            <SwatchRow
              value={container.bgColor ?? '#ffffff'}
              onChange={(hex) => patch((d) => (d.style.container = { ...container, bgColor: hex }))}
              onEyedropper={() => pick((hex) => patch((d) => (d.style.container = { ...container, bgColor: hex })))}
            />
          </Row>
        )}

        <Row label="Sombra">
          <Toggle active={container.shadow ?? false} onClick={() => patch((d) => (d.style.container = { ...container, shadow: !(container.shadow ?? false) }))} />
        </Row>

        <Row label="Borda">
          <Toggle active={borderEnabled} onClick={() => patch((d) => (d.style.container = { ...container, borderWidth: borderEnabled ? 0 : 1 }))} />
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
                onChange={(e) => patch((d) => (d.style.container = { ...container, borderWidth: clampNum(e.target.value, 1) }))}
                {...editProps}
              />
              <span style={rightNum}>{container.borderWidth ?? 1}px</span>
            </Row>

            <Row label="Cor borda">
              <SwatchRow
                value={container.borderColor ?? 'rgba(0,0,0,0.08)'}
                onChange={(hex) => patch((d) => (d.style.container = { ...container, borderColor: hex }))}
                onEyedropper={() => pick((hex) => patch((d) => (d.style.container = { ...container, borderColor: hex })))}
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
            onChange={(e) => patch((d) => (d.style.container = { ...container, radius: clampNum(e.target.value, 14) }))}
            {...editProps}
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
            onChange={(e) => patch((d) => (d.style.container = { ...container, padding: clampNum(e.target.value, 16) }))}
            {...editProps}
          />
          <span style={rightNum}>{container.padding ?? 16}px</span>
        </Row>
      </Section>

      <Section title="Links (por rede)">
        {CHANNELS.map((c) => {
          const item = s.items?.[c.key] || {}
          return (
            <div
              key={c.key}
              style={{
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 14,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
              onPointerDown={stop}
              onMouseDown={stop}
            >
              <strong style={{ fontSize: 13 }}>{c.title}</strong>

              <Row label="Ativo">
                <Toggle
                  active={item.enabled ?? false}
                  onClick={() =>
                    patch((d) => {
                      d.settings.items = d.settings.items || {}
                      const cur = d.settings.items[c.key] || {}
                      d.settings.items[c.key] = { ...cur, enabled: !(cur.enabled ?? false) }
                    })
                  }
                />
              </Row>

              <Row label="Label (opcional)">
                <input
                  value={item.label ?? ''}
                  onChange={(e) =>
                    patch((d) => {
                      d.settings.items = d.settings.items || {}
                      const cur = d.settings.items[c.key] || {}
                      d.settings.items[c.key] = { ...cur, label: e.target.value }
                    })
                  }
                  style={input}
                  placeholder="Ex: Instagram"
                  {...editProps}
                />
              </Row>

              <Row label="URL">
                <input
                  value={item.url ?? ''}
                  onChange={(e) =>
                    patch((d) => {
                      d.settings.items = d.settings.items || {}
                      const cur = d.settings.items[c.key] || {}
                      d.settings.items[c.key] = { ...cur, url: e.target.value, enabled: true }
                    })
                  }
                  style={input}
                  placeholder={c.placeholder}
                  {...editProps}
                />
              </Row>
            </div>
          )
        })}
      </Section>
    </div>
  )
}
