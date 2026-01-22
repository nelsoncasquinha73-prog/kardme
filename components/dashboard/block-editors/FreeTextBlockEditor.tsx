'use client'

import React from 'react'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import SwatchRow from '@/components/editor/SwatchRow'
import { FONT_OPTIONS } from '@/lib/fontes'
import { Section, Row, Toggle, input, select, rightNum } from '@/components/editor/ui'

type FreeTextSettings = {
  title?: string
  text: string
}

type FreeTextStyle = {
  offsetY?: number

  titleColor?: string
  titleFontFamily?: string
  titleBold?: boolean
  titleFontSize?: number
  titleAlign?: 'left' | 'center' | 'right'

  textColor?: string
  fontFamily?: string
  bold?: boolean
  fontSize?: number
  lineHeight?: number
  align?: 'left' | 'center' | 'right'

  compact?: boolean

  container?: {
    bgColor?: string
    radius?: number
    padding?: number
    shadow?: boolean
    borderWidth?: number
    borderColor?: string
  }
}

type Props = {
  settings: FreeTextSettings
  style?: FreeTextStyle
  onChangeSettings: (s: FreeTextSettings) => void
  onChangeStyle: (s: FreeTextStyle) => void
}

export default function FreesTextBlockEditor({ settings, style, onChangeSettings, onChangeStyle }: Props) {
  const { openPicker } = useColorPicker()

  const s: FreeTextSettings = settings || { text: '' }
  const st: FreeTextStyle = style || {}
  const c = st.container || {}

  const pickEyedropper = (apply: (hex: string) => void) =>
    openPicker({
      mode: 'eyedropper',
      onPick: apply,
    })

  const updateSettings = (patch: Partial<FreeTextSettings>) => onChangeSettings({ ...s, ...patch })
  const updateStyle = (patch: Partial<FreeTextStyle>) => onChangeStyle({ ...st, ...patch })

  const updateContainer = (patch: Partial<NonNullable<FreeTextStyle['container']>>) =>
    updateStyle({ container: { ...(st.container || {}), ...patch } })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title="Conteúdo">
        <Row label="Mostrar título">
          <Toggle
            active={(s.title ?? '').trim().length > 0}
            onClick={() => {
              const has = (s.title ?? '').trim().length > 0
              updateSettings({ title: has ? '' : 'Privacidade e dados' })
            }}
          />
        </Row>

        <Row label="Título">
          <input
            value={s.title ?? ''}
            onChange={(e) => updateSettings({ title: e.target.value })}
            style={input}
            placeholder="Ex.: Privacidade e dados"
          />
        </Row>

        <Row label="Texto">
          <textarea
            value={s.text ?? ''}
            onChange={(e) => updateSettings({ text: e.target.value })}
            style={{ ...input, height: 120, resize: 'vertical' }}
            placeholder="Escreve aqui… (podes incluir links)"
          />
        </Row>

        <Row label="Modo compacto">
          <Toggle active={st.compact === true} onClick={() => updateStyle({ compact: !(st.compact === true) })} />
        </Row>
      </Section>

      <Section title="Título">
        <Row label="Cor do título">
          <SwatchRow
            value={st.titleColor ?? '#111827'}
            onChange={(hex) => updateStyle({ titleColor: hex })}
            onEyedropper={() => pickEyedropper((hex) => updateStyle({ titleColor: hex }))}
          />
        </Row>

        <Row label="Tamanho do título (px)">
          <input
            type="number"
            min={10}
            max={40}
            value={st.titleFontSize ?? 15}
            onChange={(e) => updateStyle({ titleFontSize: Number(e.target.value) })}
            style={input}
          />
        </Row>

        <Row label="Alinhamento do título">
          <select
            value={st.titleAlign ?? 'left'}
            onChange={(e) => updateStyle({ titleAlign: e.target.value as any })}
            style={select}
          >
            <option value="left">Esquerda</option>
            <option value="center">Centro</option>
            <option value="right">Direita</option>
          </select>
        </Row>

        <Row label="Fonte do título">
          <select
            value={st.titleFontFamily ?? ''}
            onChange={(e) => updateStyle({ titleFontFamily: e.target.value || undefined })}
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

        <Row label="Negrito (título)">
          <Toggle
            active={st.titleBold !== false}
            onClick={() => updateStyle({ titleBold: !(st.titleBold !== false) })}
          />
        </Row>
      </Section>

      <Section title="Tipografia (texto)">
        <Row label="Cor do texto">
          <SwatchRow
            value={st.textColor ?? '#111827'}
            onChange={(hex) => updateStyle({ textColor: hex })}
            onEyedropper={() => pickEyedropper((hex) => updateStyle({ textColor: hex }))}
          />
        </Row>

        <Row label="Tamanho do texto (px)">
          <input
            type="number"
            min={10}
            max={26}
            value={st.fontSize ?? 14}
            onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })}
            style={input}
          />
        </Row>

        <Row label="Altura da linha">
          <input
            type="range"
            min={1.1}
            max={2.0}
            step={0.05}
            value={st.lineHeight ?? 1.5}
            onChange={(e) => updateStyle({ lineHeight: Number(e.target.value) })}
          />
          <span style={rightNum}>{(st.lineHeight ?? 1.5).toFixed(2)}</span>
        </Row>

        <Row label="Alinhamento do texto">
          <select value={st.align ?? 'left'} onChange={(e) => updateStyle({ align: e.target.value as any })} style={select}>
            <option value="left">Esquerda</option>
            <option value="center">Centro</option>
            <option value="right">Direita</option>
          </select>
        </Row>

        <Row label="Fonte do texto">
          <select
            value={st.fontFamily ?? ''}
            onChange={(e) => updateStyle({ fontFamily: e.target.value || undefined })}
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

        <Row label="Negrito (texto)">
          <Toggle active={st.bold === true} onClick={() => updateStyle({ bold: !(st.bold === true) })} />
        </Row>
      </Section>

      <Section title="Container">
        <Row label="Fundo">
          <SwatchRow
            value={c.bgColor ?? 'transparent'}
            onChange={(hex) => updateContainer({ bgColor: hex })}
            onEyedropper={() => pickEyedropper((hex) => updateContainer({ bgColor: hex }))}
          />
        </Row>

        <Row label="Raio (px)">
          <input
            type="range"
            min={0}
            max={32}
            step={1}
            value={c.radius ?? 14}
            onChange={(e) => updateContainer({ radius: Number(e.target.value) })}
          />
          <span style={rightNum}>{c.radius ?? 14}px</span>
        </Row>

        <Row label="Padding (px)">
          <input
            type="range"
            min={0}
            max={28}
            step={1}
            value={c.padding ?? 14}
            onChange={(e) => updateContainer({ padding: Number(e.target.value) })}
          />
          <span style={rightNum}>{c.padding ?? 14}px</span>
        </Row>

        <Row label="Sombra">
          <Toggle active={c.shadow === true} onClick={() => updateContainer({ shadow: !(c.shadow === true) })} />
        </Row>

        <Row label="Borda (px)">
          <input
            type="range"
            min={0}
            max={6}
            step={1}
            value={c.borderWidth ?? 0}
            onChange={(e) => updateContainer({ borderWidth: Number(e.target.value) })}
          />
          <span style={rightNum}>{c.borderWidth ?? 0}px</span>
        </Row>

        <Row label="Cor da borda">
          <SwatchRow
            value={c.borderColor ?? '#e5e7eb'}
            onChange={(hex) => updateContainer({ borderColor: hex })}
            onEyedropper={() => pickEyedropper((hex) => updateContainer({ borderColor: hex }))}
          />
        </Row>
      </Section>

      <Section title="Posição">
        <Row label="Deslocamento Y (px)">
          <input
            type="range"
            min={-80}
            max={80}
            step={1}
            value={st.offsetY ?? 0}
            onChange={(e) => updateStyle({ offsetY: Number(e.target.value) })}
          />
          <span style={rightNum}>{st.offsetY ?? 0}px</span>
        </Row>
      </Section>
    </div>
  )
}
