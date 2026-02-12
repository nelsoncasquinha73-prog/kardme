'use client'

import React from 'react'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import ColorPickerPro from '@/components/editor/ColorPickerPro'
import { useLanguage } from '@/components/language/LanguageProvider'
import { FONT_OPTIONS } from '@/lib/fontes'

type BioSettings = {
  text: string
}

type BioStyle = {
  offsetY?: number

  textColor?: string
  fontFamily?: string
  bold?: boolean
  fontSize?: number
  lineHeight?: number
  align?: 'left' | 'center' | 'right'

  container?: {
    enabled?: boolean
    bgColor?: string
    radius?: number
    padding?: number
    shadow?: boolean
    borderWidth?: number
    borderColor?: string
    widthMode?: 'full' | 'custom'
    customWidthPx?: number
  }
}

type Props = {
  settings: BioSettings
  style?: BioStyle
  onChangeSettings: (s: BioSettings) => void
  onChangeStyle: (s: BioStyle) => void
}

export default function BioBlockEditor({ settings, style, onChangeSettings, onChangeStyle }: Props) {
  const { openPicker } = useColorPicker()
  const { t } = useLanguage()

  const s: BioStyle = style || {}
  const c = s.container || {}

  const pickEyedropper = (apply: (hex: string) => void) =>
    openPicker({
      mode: 'eyedropper',
      onPick: apply,
    })

  const setContainer = (patch: Partial<NonNullable<BioStyle['container']>>) => {
    onChangeStyle({
      ...s,
      container: {
        ...c,
        ...patch,
      },
    })
  }

  const setStyle = (patch: Partial<BioStyle>) => onChangeStyle({ ...s, ...patch })

  const bgEnabled = (c.bgColor ?? 'transparent') !== 'transparent'
  const borderEnabled = (c.borderWidth ?? 0) > 0
  const widthCustom = c.widthMode === 'custom'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title={t('editor.text')}>
        <label style={{ fontSize: 12, opacity: 0.7 }}>Bio</label>
        <textarea
          value={settings.text || ''}
          onChange={(e) => onChangeSettings({ text: e.target.value })}
          rows={6}
          style={{
            width: '100%',
            fontSize: 14,
            padding: 10,
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.12)',
            outline: 'none',
            resize: 'vertical',
          }}
        />

        <Row label={t('editor.alignment')}>
          <Button onClick={() => setStyle({ align: 'left' })} active={s.align === 'left'}>
            Esquerda
          </Button>
          <Button onClick={() => setStyle({ align: 'center' })} active={(s.align ?? 'center') === 'center'}>
            Centro
          </Button>
          <Button onClick={() => setStyle({ align: 'right' })} active={s.align === 'right'}>
            Direita
          </Button>
        </Row>

        <Row label={t('editor.font')}>
          <select
            value={s.fontFamily ?? ''}
            onChange={(e) => setStyle({ fontFamily: e.target.value || undefined })}
            style={{ fontSize: 14, padding: 6, borderRadius: 6 }}
          >
            <option value="">Padrão</option>
            {FONT_OPTIONS.map((o) => (
              <option key={o.label} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Row>

        <Row label={t('editor.bold')}>
          <Toggle active={s.bold === true} onClick={() => setStyle({ bold: !(s.bold === true) })} />
        </Row>

        <Row label={t('editor.text_color')}>
          <ColorPickerPro
            value={s.textColor ?? '#111827'}
            onChange={(hex) => setStyle({ textColor: hex })}
            onEyedropper={() => pickEyedropper((hex) => setStyle({ textColor: hex }))}
            supportsGradient={false}
          />
        </Row>

        <Row label={t('editor.size')}>
          <input
            type="range"
            min={12}
            max={22}
            step={1}
            value={s.fontSize ?? 15}
            onChange={(e) => setStyle({ fontSize: Number(e.target.value) })}
          />
          <span style={{ width: 36, textAlign: 'right', fontSize: 12, opacity: 0.7 }}>{s.fontSize ?? 15}px</span>
        </Row>

        <Row label={t('editor.line_height')}>
          <input
            type="range"
            min={1.1}
            max={2.2}
            step={0.05}
            value={s.lineHeight ?? 1.6}
            onChange={(e) => setStyle({ lineHeight: Number(e.target.value) })}
          />
          <span style={{ width: 36, textAlign: 'right', fontSize: 12, opacity: 0.7 }}>
            {(s.lineHeight ?? 1.6).toFixed(2)}
          </span>
        </Row>
      </Section>

      <Section title={t('editor.block_style')}>
        <Row label={t('editor.background')}>
          <Toggle active={bgEnabled} onClick={() => setContainer({ bgColor: bgEnabled ? 'transparent' : '#ffffff' })} />
        </Row>

        {bgEnabled && (
          <Row label={t('editor.bg_color')}>
            <ColorPickerPro
              value={c.bgColor ?? '#ffffff'}
              onChange={(hex) => setContainer({ bgColor: hex })}
              onEyedropper={() => pickEyedropper((hex) => setContainer({ bgColor: hex }))}
              supportsGradient={true}
            />
          </Row>
        )}

        <Row label={t('editor.shadow')}>
          <Toggle active={c.shadow === true} onClick={() => setContainer({ shadow: !(c.shadow === true) })} />
        </Row>

        <Row label={t('editor.border')}>
          <Toggle active={borderEnabled} onClick={() => setContainer({ borderWidth: borderEnabled ? 0 : 1 })} />
        </Row>

        {borderEnabled && (
          <>
            <Row label={t('editor.thickness')}>
              <input
                type="range"
                min={1}
                max={6}
                step={1}
                value={c.borderWidth ?? 1}
                onChange={(e) => setContainer({ borderWidth: Number(e.target.value) })}
              />
              <span style={{ width: 36, textAlign: 'right', fontSize: 12, opacity: 0.7 }}>
                {c.borderWidth ?? 1}px
              </span>
            </Row>

            <Row label={t('editor.border_color')}>
              <ColorPickerPro
                value={c.borderColor ?? '#e5e7eb'}
                onChange={(hex) => setContainer({ borderColor: hex })}
                onEyedropper={() => pickEyedropper((hex) => setContainer({ borderColor: hex }))}
                supportsGradient={false}
              />
            </Row>
          </>
        )}

        <Row label={t('editor.radius')}>
          <input
            type="range"
            min={0}
            max={32}
            step={1}
            value={c.radius ?? 18}
            onChange={(e) => setContainer({ radius: Number(e.target.value) })}
          />
          <span style={{ width: 36, textAlign: 'right', fontSize: 12, opacity: 0.7 }}>{c.radius ?? 18}px</span>
        </Row>

        <Row label="Padding">
          <input
            type="range"
            min={0}
            max={28}
            step={1}
            value={c.padding ?? 16}
            onChange={(e) => setContainer({ padding: Number(e.target.value) })}
          />
          <span style={{ width: 36, textAlign: 'right', fontSize: 12, opacity: 0.7 }}>{c.padding ?? 16}px</span>
        </Row>

        <Row label="Largura personalizada">
          <Toggle active={widthCustom} onClick={() => setContainer({ widthMode: widthCustom ? 'full' : 'custom', customWidthPx: widthCustom ? undefined : 320 })} />
        </Row>

        {widthCustom && (
          <Row label="Largura">
            <input
              type="range"
              min={200}
              max={400}
              step={10}
              value={c.customWidthPx ?? 320}
              onChange={(e) => setContainer({ customWidthPx: Number(e.target.value) })}
            />
            <span style={{ width: 42, textAlign: 'right', fontSize: 12, opacity: 0.7 }}>{c.customWidthPx ?? 320}px</span>
          </Row>
        )}
      </Section>

      <Section title="Posição">
        <Row label="Mover (Y)">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" onClick={() => setStyle({ offsetY: (s.offsetY ?? 0) - 4 })} style={miniBtn}>
              ⬆️
            </button>
            <button type="button" onClick={() => setStyle({ offsetY: (s.offsetY ?? 0) + 4 })} style={miniBtn}>
              ⬇️
            </button>
            <button type="button" onClick={() => setStyle({ offsetY: 0 })} style={miniBtn}>
              Reset
            </button>
            <span style={{ fontSize: 12, opacity: 0.7, width: 70, textAlign: 'right' }}>
              {s.offsetY ?? 0}px
            </span>
          </div>
        </Row>
      </Section>
    </div>
  )
}

function Section({ title, children }: any) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: 14,
        border: '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <strong style={{ fontSize: 13 }}>{title}</strong>
      {children}
    </div>
  )
}

function Row({ label, children }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12, opacity: 0.75 }}>{label}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{children}</div>
    </div>
  )
}

function Button({ children, onClick, active }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 10px',
        borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.12)',
        background: active ? 'rgba(0,0,0,0.06)' : '#fff',
        cursor: 'pointer',
        fontWeight: 800,
        fontSize: 12,
      }}
    >
      {children}
    </button>
  )
}

function Toggle({ active, onClick }: any) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault()
      }}
      onClick={() => onClick?.()}
      style={{
        width: 46,
        height: 26,
        borderRadius: 999,
        background: active ? 'var(--color-primary)' : '#e5e7eb',
        position: 'relative',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: active ? 22 : 4,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
        }}
      />
    </button>
  )
}

const miniBtn: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fff',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: 12,
}
