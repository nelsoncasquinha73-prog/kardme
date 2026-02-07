'use client'

import React from 'react'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import SwatchRow from '@/components/editor/SwatchRow'
import { FONT_OPTIONS } from '@/lib/fontes'
import { Section, Row, Toggle, input, select, rightNum } from '@/components/editor/ui'

type LeadFormSettings = {
  title?: string
  description?: string
  buttonLabel?: string
  fields?: { name?: boolean; email?: boolean; phone?: boolean; message?: boolean }
  labels?: { name?: string; email?: string; phone?: string; message?: string }
  placeholders?: { name?: string; email?: string; phone?: string; message?: string }
}

type LeadFormStyle = {
  offsetY?: number
  heading?: {
    fontFamily?: string
    fontWeight?: number
    color?: string
    align?: 'left' | 'center' | 'right'
    fontSize?: number
  }
  container?: {
    enabled?: boolean
    bgColor?: string
    radius?: number
    padding?: number
    borderWidth?: number
    borderColor?: string
    shadow?: boolean
    widthMode?: "full" | "custom"
    customWidthPx?: number
  }
  inputs?: {
    bgColor?: string
    textColor?: string
    borderColor?: string
    radius?: number
    fontSize?: number
    paddingY?: number
    paddingX?: number
    labelColor?: string
    labelSize?: number
    placeholderColor?: string
  }
  button?: {
    bgColor?: string
    textColor?: string
    radius?: number
    height?: number
    fontWeight?: number
  }
}

type Props = {
  settings: LeadFormSettings
  style?: LeadFormStyle
  onChangeSettings: (s: LeadFormSettings) => void
  onChangeStyle: (s: LeadFormStyle) => void
  onBlurFlushSave?: () => void
}

function clampNum(v: any, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function stop(e: React.PointerEvent | React.MouseEvent) {
  e.stopPropagation?.()
}

export default function LeadFormBlockEditor({
  settings,
  style,
  onChangeSettings,
  onChangeStyle,
  onBlurFlushSave,
}: Props) {
  const { openPicker } = useColorPicker()

  const s = settings || {}
  const st = style || {}
  const fields = s.fields || {}
  const labels = s.labels || {}
  const placeholders = s.placeholders || {}

  const heading = st.heading || {}
  const container = st.container || {}
  const inputs = st.inputs || {}
  const button = st.button || {}

  const pick = (apply: (hex: string) => void) => openPicker({ mode: 'eyedropper', onPick: apply })

  const setSettings = (patch: Partial<LeadFormSettings>) => {
    onChangeSettings({ ...s, ...patch })
    onBlurFlushSave?.()
  }

  const setStyle = (patch: Partial<LeadFormStyle>) => {
    onChangeStyle({ ...st, ...patch })
    onBlurFlushSave?.()
  }

  const setHeading = (patch: Partial<LeadFormStyle['heading']>) => setStyle({ heading: { ...heading, ...patch } })
  const setContainer = (patch: Partial<LeadFormStyle['container']>) =>
    setStyle({ container: { ...container, ...patch } })
  const setInputs = (patch: Partial<LeadFormStyle['inputs']>) => setStyle({ inputs: { ...inputs, ...patch } })
  const setButton = (patch: Partial<LeadFormStyle['button']>) => setStyle({ button: { ...button, ...patch } })

  const setFields = (patch: Partial<LeadFormSettings['fields']>) => setSettings({ fields: { ...fields, ...patch } })
  const setLabels = (patch: Partial<LeadFormSettings['labels']>) => setSettings({ labels: { ...labels, ...patch } })
  const setPlaceholders = (patch: Partial<LeadFormSettings['placeholders']>) =>
    setSettings({ placeholders: { ...placeholders, ...patch } })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title="Conteúdo">
        <Row label="Título">
          <input
            value={s.title ?? 'Pede informação'}
            onChange={(e) => setSettings({ title: e.target.value })}
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>

        <Row label="Descrição">
          <input
            value={s.description ?? 'Deixa os teus dados e eu entro em contacto.'}
            onChange={(e) => setSettings({ description: e.target.value })}
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>

        <Row label="Texto do botão">
          <input
            value={s.buttonLabel ?? 'Enviar'}
            onChange={(e) => setSettings({ buttonLabel: e.target.value })}
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>
      </Section>

      <Section title="Campos">
        <Row label="Nome">
          <Toggle active={fields.name !== false} onClick={() => setFields({ name: !(fields.name !== false) })} />
        </Row>
        <Row label="Email">
          <Toggle active={fields.email !== false} onClick={() => setFields({ email: !(fields.email !== false) })} />
        </Row>
        <Row label="Telefone">
          <Toggle active={fields.phone !== false} onClick={() => setFields({ phone: !(fields.phone !== false) })} />
        </Row>
        <Row label="Mensagem">
          <Toggle active={fields.message !== false} onClick={() => setFields({ message: !(fields.message !== false) })} />
        </Row>

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '6px 0' }} />

        <Row label="Label Nome">
          <input
            value={labels.name ?? 'Nome'}
            onChange={(e) => setLabels({ name: e.target.value })}
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>

        <Row label="Label Email">
          <input
            value={labels.email ?? 'Email'}
            onChange={(e) => setLabels({ email: e.target.value })}
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>

        <Row label="Label Telefone">
          <input
            value={labels.phone ?? 'Telefone'}
            onChange={(e) => setLabels({ phone: e.target.value })}
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>

        <Row label="Label Mensagem">
          <input
            value={labels.message ?? 'Mensagem'}
            onChange={(e) => setLabels({ message: e.target.value })}
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)' , margin: '6px 0' }} />

        <Row label="Placeholder Nome">
          <input
            value={placeholders.name ?? ''}
            onChange={(e) => setPlaceholders({ name: e.target.value })}
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
            placeholder="Ex: Escreve o teu nome"
          />
        </Row>

        <Row label="Placeholder Email">
          <input
            value={placeholders.email ?? ''}
            onChange={(e) => setPlaceholders({ email: e.target.value })}
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
            placeholder="Ex: Escreve o teu email"
          />
        </Row>

        <Row label="Placeholder Telefone">
          <input
            value={placeholders.phone ?? ''}
            onChange={(e) => setPlaceholders({ phone: e.target.value })}
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
            placeholder="Ex: Opcional"
          />
        </Row>

        <Row label="Placeholder Mensagem">
          <input
            value={placeholders.message ?? ''}
            onChange={(e) => setPlaceholders({ message: e.target.value })}
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
            placeholder="Ex: Como posso ajudar?"
          />
        </Row>
        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)' , margin: '6px 0' }} />
      </Section>

      <Section title="Título (estilo)">
        <Row label="Alinhamento">
          <select
            value={heading.align ?? 'left'}
            onChange={(e) => setHeading({ align: e.target.value as any })}
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

        <Row label="Cor">
          <SwatchRow
            value={heading.color ?? '#111827'}
            onChange={(hex) => setHeading({ color: hex })}
            onEyedropper={() => pick((hex) => setHeading({ color: hex }))}
          />
        </Row>

        <Row label="Fonte">
          <select
            value={heading.fontFamily ?? ''}
            onChange={(e) => setHeading({ fontFamily: e.target.value || '' })}
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

        <Row label="Peso">
          <select
            value={String(heading.fontWeight ?? 900)}
            onChange={(e) => setHeading({ fontWeight: clampNum(e.target.value, 900) })}
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

        <Row label="Tamanho (px)">
          <input
            type="number"
            min={10}
            max={28}
            value={heading.fontSize ?? 14}
            onChange={(e) => setHeading({ fontSize: Math.max(10, Math.min(28, Number(e.target.value))) })}
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>
      </Section>

      <Section title="Container">
        <Row label="Ativar container">
          <Toggle active={container.enabled !== false} onClick={() => setContainer({ enabled: !(container.enabled !== false) })} />
        </Row>

        <Row label="Fundo">
          <Toggle
            active={(container.bgColor ?? 'transparent') !== 'transparent'}
            onClick={() => setContainer({ bgColor: (container.bgColor ?? 'transparent') !== 'transparent' ? 'transparent' : '#ffffff' })}
          />
        </Row>

        {(container.bgColor ?? 'transparent') !== 'transparent' && (
          <Row label="Cor do fundo">
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
          <Toggle
            active={(container.borderWidth ?? 0) > 0}
            onClick={() => setContainer({ borderWidth: (container.borderWidth ?? 0) > 0 ? 0 : 1 })}
          />
        </Row>

        {(container.borderWidth ?? 0) > 0 && (
          <>
            <Row label="Espessura">
              <input
                type="range"
                min={1}
                max={6}
                step={1}
                value={container.borderWidth ?? 1}
                onChange={(e) => setContainer({ borderWidth: clampNum(e.target.value, 1) })}
                data-no-block-select="1"
                onPointerDown={stop}
                onMouseDown={stop}
              />
              <span style={rightNum}>{container.borderWidth ?? 1}px</span>
            </Row>

            <Row label="Cor da borda">
              <SwatchRow
                value={container.borderColor ?? 'rgba(0,0,0,0.12)'}
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
            value={container.radius ?? 16}
            onChange={(e) => setContainer({ radius: clampNum(e.target.value, 16) })}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
          <span style={rightNum}>{container.radius ?? 16}px</span>
        </Row>

        <Row label="Padding">
          <input
            type="range"
            min={0}
            max={28}
            step={1}
            value={container.padding ?? 12}
            onChange={(e) => setContainer({ padding: clampNum(e.target.value, 12) })}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
          <span style={rightNum}>{container.padding ?? 12}px</span>
        </Row>

        <Row label="Largura">
          <select
            value={container.widthMode ?? "full"}
            onChange={(e) => setContainer({ widthMode: e.target.value as any })}
            style={select}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          >
            <option value="full">100%</option>
            <option value="custom">Personalizada</option>
          </select>
        </Row>

        {container.widthMode === "custom" && (
          <Row label="Largura (px)">
            <input
              type="range"
              min={200}
              max={400}
              step={5}
              value={container.customWidthPx ?? 320}
              onChange={(e) => setContainer({ customWidthPx: clampNum(e.target.value, 320) })}
              data-no-block-select="1"
              onPointerDown={stop}
              onMouseDown={stop}
            />
            <span style={rightNum}>{container.customWidthPx ?? 320}px</span>
          </Row>
        )}
      </Section>

      <Section title="Inputs">
        <Row label="Cor label">
          <SwatchRow
            value={inputs.labelColor ?? 'rgba(17,24,39,0.75)'}
            onChange={(hex) => setInputs({ labelColor: hex })}
            onEyedropper={() => pick((hex) => setInputs({ labelColor: hex }))}
          />
        </Row>

        <Row label="Tamanho label (px)">
          <input
            type="number"
            min={10}
            max={18}
            value={inputs.labelSize ?? 12}
            onChange={(e) => setInputs({ labelSize: Math.max(10, Math.min(18, Number(e.target.value))) })}
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>

        <Row label="Fundo input">
          <SwatchRow
            value={inputs.bgColor ?? '#ffffff'}
            onChange={(hex) => setInputs({ bgColor: hex })}
            onEyedropper={() => pick((hex) => setInputs({ bgColor: hex }))}
          />
        </Row>

        <Row label="Texto input">
          <SwatchRow
            value={inputs.textColor ?? '#111827'}
            onChange={(hex) => setInputs({ textColor: hex })}
            onEyedropper={() => pick((hex) => setInputs({ textColor: hex }))}
          />
        </Row>

        <Row label="Borda input">
          <SwatchRow
            value={inputs.borderColor ?? 'rgba(0,0,0,0.14)'}
            onChange={(hex) => setInputs({ borderColor: hex })}
            onEyedropper={() => pick((hex) => setInputs({ borderColor: hex }))}
          />
        </Row>

        <Row label="Raio input">
          <input
            type="range"
            min={6}
            max={24}
            step={1}
            value={inputs.radius ?? 12}
            onChange={(e) => setInputs({ radius: clampNum(e.target.value, 12) })}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
          <span style={rightNum}>{inputs.radius ?? 12}px</span>
        </Row>

        <Row label="Tamanho texto (px)">
          <input
            type="number"
            min={12}
            max={18}
            value={inputs.fontSize ?? 14}
            onChange={(e) => setInputs({ fontSize: Math.max(12, Math.min(18, Number(e.target.value))) })}
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>
      </Section>

      <Section title="Botão">
        <Row label="Cor">
          <SwatchRow
            value={button.bgColor ?? 'var(--color-primary)'}
            onChange={(hex) => setButton({ bgColor: hex })}
            onEyedropper={() => pick((hex) => setButton({ bgColor: hex }))}
          />
        </Row>

        <Row label="Texto">
          <SwatchRow
            value={button.textColor ?? '#ffffff'}
            onChange={(hex) => setButton({ textColor: hex })}
            onEyedropper={() => pick((hex) => setButton({ textColor: hex }))}
          />
        </Row>

        <Row label="Altura (px)">
          <input
            type="number"
            min={36}
            max={64}
            value={button.height ?? 44}
            onChange={(e) => setButton({ height: Math.max(36, Math.min(64, Number(e.target.value))) })}
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>

        <Row label="Raio">
          <input
            type="range"
            min={8}
            max={24}
            step={1}
            value={button.radius ?? 14}
            onChange={(e) => setButton({ radius: clampNum(e.target.value, 14) })}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />

      <Section title="Posição">
        <Row label="Mover (Y)">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" onClick={() => setStyle({ offsetY: (st.offsetY ?? 0) - 4 })} style={{ padding: '6px 8px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 12 }} data-no-block-select="1" onPointerDown={stop} onMouseDown={stop}>⬆️</button>
            <button type="button" onClick={() => setStyle({ offsetY: (st.offsetY ?? 0) + 4 })} style={{ padding: '6px 8px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 12 }} data-no-block-select="1" onPointerDown={stop} onMouseDown={stop}>⬇️</button>
            <button type="button" onClick={() => setStyle({ offsetY: 0 })} style={{ padding: '6px 8px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 12 }} data-no-block-select="1" onPointerDown={stop} onMouseDown={stop}>Reset</button>
            <span style={rightNum}>{st.offsetY ?? 0}px</span>
          </div>
        </Row>
      </Section>
          <span style={rightNum}>{button.radius ?? 14}px</span>
        </Row>
      </Section>
    </div>
  )
}
