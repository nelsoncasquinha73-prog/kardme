'use client'

import React from 'react'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import SwatchRow from '@/components/editor/SwatchRow'
import { FONT_OPTIONS } from '@/lib/fontes'
import { Section, Row, Toggle, input, select, rightNum } from '@/components/editor/ui'

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
type TimeRange = { from: string; to: string; label?: string }

type HoursDay = {
  enabled: boolean
  ranges: TimeRange[]
}

type BusinessHoursSettings = {
  heading?: string
  format?: 'seg-dom' | 'seg-sex' | 'custom'
  days?: Partial<Record<DayKey, HoursDay>>
}

type BusinessHoursStyle = {
  offsetY?: number

  container?: {
    bgColor?: string
    radius?: number
    padding?: number
    shadow?: boolean
    borderWidth?: number
    borderColor?: string
  }

  headingColor?: string
  headingBold?: boolean
  headingFontFamily?: string
  headingFontWeight?: number
  headingFontSize?: number
  headingAlign?: 'left' | 'center' | 'right'

  textColor?: string
  textFontFamily?: string
  textFontWeight?: number
  textFontSize?: number

  rowGapPx?: number
  dayLabelWidthPx?: number

  timeFormat?: '24h' | '12h'
}

type Props = {
  settings: BusinessHoursSettings
  style?: BusinessHoursStyle
  onChangeSettings: (s: BusinessHoursSettings) => void
  onChangeStyle: (s: BusinessHoursStyle) => void
}

const DAYS: Array<{ key: DayKey; label: string }> = [
  { key: 'mon', label: 'SEG' },
  { key: 'tue', label: 'TER' },
  { key: 'wed', label: 'QUA' },
  { key: 'thu', label: 'QUI' },
  { key: 'fri', label: 'SEX' },
  { key: 'sat', label: 'SÁB' },
  { key: 'sun', label: 'DOM' },
]

const TIMES = buildTimes()

function buildTimes() {
  const out: string[] = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return out
}

function normalizeDay(d?: HoursDay): HoursDay {
  return {
    enabled: d?.enabled ?? false,
    ranges: Array.isArray(d?.ranges) && d!.ranges.length > 0 ? d!.ranges : [{ from: '09:00', to: '18:00' }],
  }
}

export default function BusinessHoursBlockEditor({ settings, style, onChangeSettings, onChangeStyle }: Props) {
  const { openPicker } = useColorPicker()
  const s = settings || {}
  const st = style || {}

  const container = st.container || {}
  const days = s.days || {}

  const pick = (apply: (hex: string) => void) => openPicker({ onPick: apply })

  const setSettings = (patch: Partial<BusinessHoursSettings>) => onChangeSettings({ ...s, ...patch })
  const setStyle = (patch: Partial<BusinessHoursStyle>) => onChangeStyle({ ...st, ...patch })

  const setContainer = (patch: Partial<NonNullable<BusinessHoursStyle['container']>>) =>
    setStyle({ container: { ...container, ...patch } })

  const setDay = (k: DayKey, patch: Partial<HoursDay>) => {
    const cur = normalizeDay(days[k])
    setSettings({
      days: {
        ...days,
        [k]: { ...cur, ...patch },
      },
    })
  }

  const setRange = (k: DayKey, idx: number, patch: Partial<TimeRange>) => {
    const cur = normalizeDay(days[k])
    const nextRanges = cur.ranges.map((r, i) => (i === idx ? { ...r, ...patch } : r))
    setDay(k, { ranges: nextRanges })
  }

  const bgEnabled = (container.bgColor ?? 'transparent') !== 'transparent'
  const borderEnabled = (container.borderWidth ?? 0) > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title="Conteúdo">
        <Row label="Título">
          <input
            value={s.heading ?? 'Horário'}
            onChange={(e) => setSettings({ heading: e.target.value })}
            style={input}
            placeholder="Horário"
          />
        </Row>

        <Row label="Formato de hora">
          <select
            value={st.timeFormat ?? '24h'}
            onChange={(e) => setStyle({ timeFormat: e.target.value as '24h' | '12h' })}
            style={select}
          >
            <option value="24h">24 horas</option>
            <option value="12h">12 horas (AM/PM)</option>
          </select>
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

        <Row label="Tamanho do título (px)">
          <input
            type="number"
            min={10}
            max={32}
            value={st.headingFontSize ?? 13}
            onChange={(e) => setStyle({ headingFontSize: Number(e.target.value) })}
            style={input}
          />
        </Row>

        <Row label="Cor do título">
          <SwatchRow
            value={st.headingColor ?? '#111827'}
            onChange={(hex) => setStyle({ headingColor: hex })}
            onEyedropper={() => pick((hex) => setStyle({ headingColor: hex }))}
          />
        </Row>

        <Row label="Negrito">
          <Toggle
            active={st.headingBold !== false}
            onClick={() => setStyle({ headingBold: !(st.headingBold !== false) })}
          />
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
            onChange={(e) => setStyle({ headingFontWeight: Number(e.target.value) })}
            style={select}
          >
            <option value="400">Normal (400)</option>
            <option value="600">Semi (600)</option>
            <option value="700">Bold (700)</option>
            <option value="800">Extra (800)</option>
            <option value="900">Black (900)</option>
          </select>
        </Row>

        <Row label="Formato da semana">
          <select
            value={s.format ?? 'seg-dom'}
            onChange={(e) => setSettings({ format: e.target.value as any })}
            style={select}
          >
            <option value="seg-dom">Segunda a Domingo</option>
            <option value="seg-sex">Segunda a Sexta</option>
            <option value="custom">Custom</option>
          </select>
        </Row>
      </Section>

      <Section title="Dias e horários">
        {DAYS.map(({ key, label }) => {
          const d = normalizeDay(days[key])
          const enabled = d.enabled === true

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 13 }}>{label}</strong>
                <Toggle active={enabled} onClick={() => setDay(key, { enabled: !enabled })} />
              </div>

              {!enabled ? (
                <div style={{ fontSize: 13, opacity: 0.6 }}>Fechado</div>
              ) : (
                <>
                  {d.ranges.slice(0, 2).map((r, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ fontSize: 12, opacity: 0.7 }}>De</span>
                      <select
                        value={r.from}
                        onChange={(e) => setRange(key, idx, { from: e.target.value })}
                        style={select}
                      >
                        {TIMES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>

                      <span style={{ fontSize: 12, opacity: 0.7 }}>Até</span>
                      <select
                        value={r.to}
                        onChange={(e) => setRange(key, idx, { to: e.target.value })}
                        style={select}
                      >
                        {TIMES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        placeholder="Nome (ex: Almoço)"
                        value={r.label ?? ''}
                        onChange={(e) => setRange(key, idx, { label: e.target.value })}
                        style={{
                          ...input,
                          width: 160,
                          fontSize: 12,
                          padding: '8px 10px',
                        }}
                      />

                      {idx === 0 ? null : (
                        <button
                          type="button"
                          onClick={() => setDay(key, { ranges: d.ranges.slice(0, 1) })}
                          style={{
                            border: '1px solid rgba(0,0,0,0.12)',
                            borderRadius: 10,
                            padding: '6px 10px',
                            background: '#fff',
                            cursor: 'pointer',
                            fontSize: 12,
                          }}
                        >
                          Remover intervalo
                        </button>
                      )}
                    </div>
                  ))}

                  {d.ranges.length < 2 && (
                    <button
                      type="button"
                      onClick={() => setDay(key, { ranges: [...d.ranges, { from: '14:00', to: '18:00' }] })}
                      style={{
                        border: '1px solid rgba(0,0,0,0.12)',
                        borderRadius: 10,
                        padding: '8px 10px',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: 12,
                        width: 'fit-content',
                      }}
                    >
                      + Adicionar intervalo
                    </button>
                  )}
                </>
              )}
            </div>
          )
        })}
      </Section>

      <Section title="Tipografia (linhas)">
        <Row label="Cor do texto">
          <SwatchRow
            value={st.textColor ?? '#111827'}
            onChange={(hex) => setStyle({ textColor: hex })}
            onEyedropper={() => pick((hex) => setStyle({ textColor: hex }))}
          />
        </Row>

        <Row label="Fonte">
          <select
            value={st.textFontFamily ?? ''}
            onChange={(e) => setStyle({ textFontFamily: e.target.value || undefined })}
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

        <Row label="Peso">
          <select
            value={String(st.textFontWeight ?? 700)}
            onChange={(e) => setStyle({ textFontWeight: Number(e.target.value) })}
            style={select}
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
            max={22}
            value={st.textFontSize ?? 13}
            onChange={(e) => setStyle({ textFontSize: Number(e.target.value) })}
            style={input}
          />
        </Row>

        <Row label="Espaçamento entre linhas (px)">
          <input
            type="range"
            min={4}
            max={18}
            step={1}
            value={st.rowGapPx ?? 8}
            onChange={(e) => setStyle({ rowGapPx: Number(e.target.value) })}
          />
          <span style={rightNum}>{st.rowGapPx ?? 8}px</span>
        </Row>

        <Row label="Largura do dia (px)">
          <input
            type="range"
            min={40}
            max={90}
            step={1}
            value={st.dayLabelWidthPx ?? 52}
            onChange={(e) => setStyle({ dayLabelWidthPx: Number(e.target.value) })}
          />
          <span style={rightNum}>{st.dayLabelWidthPx ?? 52}px</span>
        </Row>
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
          <Toggle
            active={container.shadow === true}
            onClick={() => setContainer({ shadow: !(container.shadow === true) })}
          />
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
                onChange={(e) => setContainer({ borderWidth: Number(e.target.value) })}
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
            onChange={(e) => setContainer({ radius: Number(e.target.value) })}
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
            onChange={(e) => setContainer({ padding: Number(e.target.value) })}
          />
          <span style={rightNum}>{container.padding ?? 16}px</span>
        </Row>
      </Section>
    </div>
  )
}
