// components/dashboard/block-editors/SocialBlockEditor.tsx
'use client'

import React, { useState } from 'react'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import SwatchRow from '@/components/editor/SwatchRow'
import { FONT_OPTIONS } from '@/lib/fontes'
import { Section, Row, Toggle, input, select, rightNum } from '@/components/editor/ui'
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

  container?: {
    bgColor?: string
    radius?: number
    padding?: number
    shadow?: boolean
    borderWidth?: number
    borderColor?: string
  }

  buttonDefaults?: ButtonStyle

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


const miniBtn: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fff',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 13,
}
function clampNum(v: any, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function stop(e: React.PointerEvent | React.MouseEvent) {
  e.stopPropagation?.()
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

// MIGRAÇÃO: se vier array antigo, converte para object
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
    layout: {
      direction: inputSettings.layout?.direction ?? 'row',
      align: inputSettings.layout?.align ?? 'center',
      gapPx: inputSettings.layout?.gapPx ?? 10,
    },
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
  const [local, setLocal] = useState<CombinedState>(() => normalizeCombined(settings, style))
  const { t } = useLanguage()

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
  const container = st.container || {}
  const btn = st.buttonDefaults || {}

  const pick = (apply: (hex: string) => void) => openPicker({ mode: 'eyedropper', onPick: apply })

  const bgEnabled = (container.bgColor ?? 'transparent') !== 'transparent'
  const borderEnabled = (container.borderWidth ?? 0) > 0

  const defaultsBorderEnabled = btn.borderEnabled ?? true
  const defaultsBgMode = (btn.bgMode ?? 'solid') as 'solid' | 'gradient'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title={t('editor.position')}>
        <Row label={t('editor.move_y')}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" onClick={() => patch((d) => (d.style.offsetY = (st.offsetY ?? 0) - 4))} style={miniBtn}>⬆️</button>
            <button type="button" onClick={() => patch((d) => (d.style.offsetY = (st.offsetY ?? 0) + 4))} style={miniBtn}>⬇️</button>
            <button type="button" onClick={() => patch((d) => (d.style.offsetY = 0))} style={miniBtn}>Reset</button>
            <span style={{ fontSize: 12, opacity: 0.7, width: 60, textAlign: 'right' }}>{st.offsetY ?? 0}px</span>
          </div>
        </Row>
      </Section>

      <Section title={t('editor.content')}>
        <Row label={t('editor.title')}>
          <input
            value={s.heading ?? 'Redes Sociais'}
            onChange={(e) => patch((d) => (d.settings.heading = e.target.value))}
            style={input}
            placeholder="Redes Sociais"
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>

        <Row label={t('editor.title_alignment')}>
          <select
            value={st.headingAlign ?? 'left'}
            onChange={(e) => patch((d) => (d.style.headingAlign = e.target.value as any))}
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

        <Row label={t('editor.title_color')}>
          <SwatchRow
            value={st.headingColor ?? '#111827'}
            onChange={(hex) => patch((d) => (d.style.headingColor = hex))}
            onEyedropper={() => pick((hex) => patch((d) => (d.style.headingColor = hex)))}
          />
        </Row>

        <Row label={t('editor.bold')}>
          <Toggle active={st.headingBold ?? true} onClick={() => patch((d) => (d.style.headingBold = !(st.headingBold ?? true)))} />
        </Row>

        <Row label={t('editor.title_font')}>
          <select
            value={st.headingFontFamily ?? ''}
            onChange={(e) => patch((d) => (d.style.headingFontFamily = e.target.value || ''))}
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

        <Row label={t('editor.title_weight')}>
          <select
            value={String(st.headingFontWeight ?? 900)}
            onChange={(e) => patch((d) => (d.style.headingFontWeight = clampNum(e.target.value, 900)))}
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

        <Row label={t('editor.title_size')}>
          <input
            type="number"
            min={10}
            max={32}
            value={st.headingFontSize ?? 13}
            onChange={(e) => patch((d) => (d.style.headingFontSize = Math.max(10, Math.min(32, Number(e.target.value)))))}
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>
      </Section>

      <Section title={t('editor.layout')}>
        <Row label={t('editor.direction')}>
          <select
            value={layout.direction ?? 'row'}
            onChange={(e) => patch((d) => (d.settings.layout = { ...layout, direction: e.target.value as any }))}
            style={select}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          >
            <option value="row">Linha</option>
            <option value="column">Coluna</option>
          </select>
        </Row>

        <Row label={t('editor.alignment')}>
          <select
            value={layout.align ?? 'center'}
            onChange={(e) => patch((d) => (d.settings.layout = { ...layout, align: e.target.value as any }))}
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

        <Row label={t('editor.button_spacing')}>
          <input
            type="range"
            min={0}
            max={28}
            step={1}
            value={layout.gapPx ?? 10}
            onChange={(e) => patch((d) => (d.settings.layout = { ...layout, gapPx: clampNum(e.target.value, 10) }))}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
          <span style={rightNum}>{layout.gapPx ?? 10}px</span>
        </Row>
      </Section>

      <Section title={t('editor.block_appearance')}>
        <Row label={t('editor.background')}>
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
          <Row label={t('editor.bg_color')}>
            <SwatchRow
              value={container.bgColor ?? '#ffffff'}
              onChange={(hex) => patch((d) => (d.style.container = { ...container, bgColor: hex }))}
              onEyedropper={() => pick((hex) => patch((d) => (d.style.container = { ...container, bgColor: hex })))}
            />
          </Row>
        )}

        <Row label={t('editor.shadow')}>
          <Toggle
            active={container.shadow ?? false}
            onClick={() => patch((d) => (d.style.container = { ...container, shadow: !(container.shadow ?? false) }))}
          />
        </Row>

        <Row label={t('editor.border')}>
          <Toggle
            active={borderEnabled}
            onClick={() => patch((d) => (d.style.container = { ...container, borderWidth: borderEnabled ? 0 : 1 }))}
          />
        </Row>

        {borderEnabled && (
          <>
            <Row label={t('editor.thickness')}>
              <input
                type="range"
                min={1}
                max={6}
                step={1}
                value={container.borderWidth ?? 1}
                onChange={(e) => patch((d) => (d.style.container = { ...container, borderWidth: clampNum(e.target.value, 1) }))}
                data-no-block-select="1"
                onPointerDown={stop}
                onMouseDown={stop}
              />
              <span style={rightNum}>{container.borderWidth ?? 1}px</span>
            </Row>

            <Row label="Cor da borda">
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
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
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
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
          <span style={rightNum}>{container.padding ?? 16}px</span>
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
                data-no-block-select="1"
                onPointerDown={stop}
                onMouseDown={stop}
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
                data-no-block-select="1"
                onPointerDown={stop}
                onMouseDown={stop}
              />
            </Row>

            <Row label="Alinhamento do conteúdo">
              <select
                value={st.uniformContentAlign ?? 'center'}
                onChange={(e) => patch((d) => (d.style.uniformContentAlign = e.target.value as any))}
                style={select}
                data-no-block-select="1"
                onPointerDown={stop}
                onMouseDown={stop}
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
              data-no-block-select="1"
              onPointerDown={stop}
              onMouseDown={stop}
            >
              <option value="bg">Fundo (ícone branco)</option>
              <option value="icon">Só ícone (fundo neutro)</option>
            </select>
          </Row>
        )}
      </Section>

      <Section title="Estilos dos botões (defaults)">
        <Row label="Tamanho">
          <input
            type="range"
            min={24}
            max={64}
            step={1}
            value={btn.sizePx ?? 44}
            onChange={(e) => patch((d) => (d.style.buttonDefaults = { ...btn, sizePx: clampNum(e.target.value, 44) }))}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
          <span style={rightNum}>{btn.sizePx ?? 44}px</span>
        </Row>

        <Row label="Raio (formato do botão)">
          <input
            type="range"
            min={0}
            max={32}
            step={1}
            value={btn.radius ?? 14}
            onChange={(e) => patch((d) => (d.style.buttonDefaults = { ...btn, radius: clampNum(e.target.value, 14) }))}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
          <span style={rightNum}>{btn.radius ?? 14}px</span>
        </Row>

        <Row label="Modo do fundo">
          <select
            value={defaultsBgMode}
            onChange={(e) => patch((d) => (d.style.buttonDefaults = { ...btn, bgMode: e.target.value as any }))}
            style={select}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          >
            <option value="solid">Sólido</option>
            <option value="gradient">Degradê</option>
          </select>
        </Row>

        {defaultsBgMode === 'gradient' && (
          <>
            <Row label="Degradê (from)">
              <SwatchRow
                value={btn.bgGradient?.from ?? '#111827'}
                onChange={(hex) =>
                  patch((d) => (d.style.buttonDefaults = { ...btn, bgGradient: { ...(btn.bgGradient || {}), from: hex } }))
                }
                onEyedropper={() =>
                  pick((hex) =>
                    patch((d) => (d.style.buttonDefaults = { ...btn, bgGradient: { ...(btn.bgGradient || {}), from: hex } }))
                  )
                }
              />
            </Row>

            <Row label="Degradê (to)">
              <SwatchRow
                value={btn.bgGradient?.to ?? '#374151'}
                onChange={(hex) =>
                  patch((d) => (d.style.buttonDefaults = { ...btn, bgGradient: { ...(btn.bgGradient || {}), to: hex } }))
                }
                onEyedropper={() =>
                  pick((hex) =>
                    patch((d) => (d.style.buttonDefaults = { ...btn, bgGradient: { ...(btn.bgGradient || {}), to: hex } }))
                  )
                }
              />
            </Row>

            <Row label="Ângulo">
              <input
                type="number"
                min={0}
                max={360}
                value={btn.bgGradient?.angle ?? 135}
                onChange={(e) =>
                  patch((d) => (d.style.buttonDefaults = { ...btn, bgGradient: { ...(btn.bgGradient || {}), angle: Number(e.target.value) } }))
                }
                style={input}
                data-no-block-select="1"
                onPointerDown={stop}
                onMouseDown={stop}
              />
            </Row>
          </>
        )}

        <Row label={t('editor.background')}>
          <SwatchRow
            value={btn.bgColor ?? '#ffffff'}
            onChange={(hex) => patch((d) => (d.style.buttonDefaults = { ...btn, bgColor: hex }))}
            onEyedropper={() => pick((hex) => patch((d) => (d.style.buttonDefaults = { ...btn, bgColor: hex })))}
            disabled={defaultsBgMode === 'gradient'}
          />
        </Row>

        <Row label={t('editor.border')}>
          <Toggle
            active={defaultsBorderEnabled}
            onClick={() => patch((d) => (d.style.buttonDefaults = { ...btn, borderEnabled: !defaultsBorderEnabled }))}
          />
        </Row>

        {defaultsBorderEnabled && (
          <>
            <Row label={t('editor.thickness')}>
              <input
                type="range"
                min={1}
                max={6}
                step={1}
                value={btn.borderWidth ?? 1}
                onChange={(e) => patch((d) => (d.style.buttonDefaults = { ...btn, borderWidth: clampNum(e.target.value, 1) }))}
                data-no-block-select="1"
                onPointerDown={stop}
                onMouseDown={stop}
              />
              <span style={rightNum}>{btn.borderWidth ?? 1}px</span>
            </Row>

            <Row label="Cor da borda">
              <SwatchRow
                value={btn.borderColor ?? 'rgba(0,0,0,0.10)'}
                onChange={(hex) => patch((d) => (d.style.buttonDefaults = { ...btn, borderColor: hex }))}
                onEyedropper={() => pick((hex) => patch((d) => (d.style.buttonDefaults = { ...btn, borderColor: hex })))}
              />
            </Row>
          </>
        )}

        <Row label="Cor do ícone">
          <SwatchRow
            value={btn.iconColor ?? '#111827'}
            onChange={(hex) => patch((d) => (d.style.buttonDefaults = { ...btn, iconColor: hex }))}
            onEyedropper={() => pick((hex) => patch((d) => (d.style.buttonDefaults = { ...btn, iconColor: hex })))}
          />
        </Row>

        <Row label="Cor do texto">
          <SwatchRow
            value={btn.textColor ?? '#111827'}
            onChange={(hex) => patch((d) => (d.style.buttonDefaults = { ...btn, textColor: hex }))}
            onEyedropper={() => pick((hex) => patch((d) => (d.style.buttonDefaults = { ...btn, textColor: hex })))}
          />
        </Row>

        <Row label="Fonte">
          <select
            value={btn.fontFamily ?? ''}
            onChange={(e) => patch((d) => (d.style.buttonDefaults = { ...btn, fontFamily: e.target.value || '' }))}
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

        <Row label="Peso do texto">
          <select
            value={String(btn.fontWeight ?? 800)}
            onChange={(e) => patch((d) => (d.style.buttonDefaults = { ...btn, fontWeight: clampNum(e.target.value, 800) }))}
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

        <Row label="Tamanho do texto (px)">
          <input
            type="number"
            min={8}
            max={36}
            value={btn.labelFontSize ?? 13}
            onChange={(e) =>
              patch((d) => (d.style.buttonDefaults = { ...btn, labelFontSize: Math.max(8, Math.min(36, Number(e.target.value))) }))
            }
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>

        <Row label="Escala do ícone">
          <input
            type="range"
            min={0.4}
            max={0.9}
            step={0.01}
            value={btn.iconScale ?? 0.58}
            onChange={(e) => patch((d) => (d.style.buttonDefaults = { ...btn, iconScale: Number(e.target.value) }))}
            style={{ width: 140 }}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
          <span style={rightNum}>{(btn.iconScale ?? 0.58).toFixed(2)}</span>
        </Row>

        <Row label="Padding Y">
          <input
            type="range"
            min={0}
            max={24}
            step={1}
            value={btn.paddingY ?? 10}
            onChange={(e) => patch((d) => (d.style.buttonDefaults = { ...btn, paddingY: clampNum(e.target.value, 10) }))}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
          <span style={rightNum}>{btn.paddingY ?? 10}px</span>
        </Row>

        <Row label="Padding X">
          <input
            type="range"
            min={0}
            max={32}
            step={1}
            value={btn.paddingX ?? 12}
            onChange={(e) => patch((d) => (d.style.buttonDefaults = { ...btn, paddingX: clampNum(e.target.value, 12) }))}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
          <span style={rightNum}>{btn.paddingX ?? 12}px</span>
        </Row>

        <Row label="Sombra do botão">
          <Toggle active={btn.shadow ?? false} onClick={() => patch((d) => (d.style.buttonDefaults = { ...btn, shadow: !(btn.shadow ?? false) }))} />
        </Row>
      </Section>

      <Section title="Links (por rede)">
        {CHANNELS.map((c) => {
          const itemsObj = coerceItems((s as any).items)
          const item = itemsObj?.[c.key] || {}

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
            >
              <strong style={{ fontSize: 13 }}>{c.title}</strong>

              <Row label="Ativo">
                <Toggle
                  active={item.enabled ?? false}
                  onClick={() =>
                    patch((d) => {
                      const obj = coerceItems((d.settings as any).items)
                      const cur = obj[c.key] || {}
                      obj[c.key] = { ...cur, enabled: !(cur.enabled ?? false) }
                      d.settings.items = obj
                    })
                  }
                />
              </Row>

              <Row label="Label (opcional)">
                <input
                  value={item.label ?? ''}
                  onChange={(e) =>
                    patch((d) => {
                      const obj = coerceItems((d.settings as any).items)
                      const cur = obj[c.key] || {}
                      obj[c.key] = { ...cur, label: e.target.value }
                      d.settings.items = obj
                    })
                  }
                  style={input}
                  placeholder="Ex: Instagram"
                  data-no-block-select="1"
                  onPointerDown={stop}
                  onMouseDown={stop}
                />
              </Row>

              <Row label="URL">
                <input
                  value={item.url ?? ''}
                  onChange={(e) =>
                    patch((d) => {
                      const obj = coerceItems((d.settings as any).items)
                      const cur = obj[c.key] || {}
                      obj[c.key] = { ...cur, url: e.target.value, enabled: true }
                      d.settings.items = obj
                    })
                  }
                  style={input}
                  placeholder={c.placeholder}
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
