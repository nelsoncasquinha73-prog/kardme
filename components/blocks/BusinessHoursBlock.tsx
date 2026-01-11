'use client'

import React from 'react'

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

type TimeRange = {
  from: string
  to: string
  label?: string
}

type HoursDay = {
  enabled: boolean
  ranges: TimeRange[]
}

export type BusinessHoursSettings = {
  heading?: string
  format?: 'seg-dom' | 'seg-sex' | 'custom'
  days?: Partial<Record<DayKey, HoursDay>>
}

export type BusinessHoursStyle = {
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

  timeFormat?: '24h' | '12h' // novo: formato de hora para mostrar
}

type Props = {
  settings: BusinessHoursSettings
  style?: BusinessHoursStyle
}

const DAY_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

const DAY_LABEL_PT: Record<DayKey, string> = {
  mon: 'SEG',
  tue: 'TER',
  wed: 'QUA',
  thu: 'QUI',
  fri: 'SEX',
  sat: 'SÁB',
  sun: 'DOM',
}

function isNonEmpty(v?: string) {
  return typeof v === 'string' && v.trim().length > 0
}

// Converte "HH:mm" 24h para 12h AM/PM
function formatTime(time24: string, format: '24h' | '12h') {
  if (format === '24h') return time24
  const [hStr, m] = time24.split(':')
  let h = Number(hStr)
  const ampm = h < 12 ? 'AM' : 'PM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${m} ${ampm}`
}

function normalizeDay(d?: HoursDay): HoursDay {
  return {
    enabled: d?.enabled ?? false,
    ranges: Array.isArray(d?.ranges) && d!.ranges.length > 0 ? d!.ranges : [{ from: '09:00', to: '18:00' }],
  }
}

function formatRanges(ranges: TimeRange[], timeFormat: '24h' | '12h') {
  return ranges
    .filter((r) => isNonEmpty(r.from) && isNonEmpty(r.to))
    .map((r, i) => {
      const base = `${formatTime(r.from, timeFormat)}–${formatTime(r.to, timeFormat)}`
      const label = (r.label || '').trim()
      // Só mostra label no último intervalo do dia
      return i === ranges.length - 1 && label ? `${base} ${label}` : base
    })
    .join(' · ')
}

export default function BusinessHoursBlock({ settings, style }: Props) {
  const s = settings || {}
  const st = style || {}

  const container = st.container || {}
  const bg = container.bgColor ?? 'transparent'
  const hasBg = bg !== 'transparent' && bg !== 'rgba(0,0,0,0)'
  const hasShadow = container.shadow === true
  const hasBorder = (container.borderWidth ?? 0) > 0
  const effectiveBg = hasShadow && !hasBg ? 'rgba(255,255,255,0.92)' : bg

  const wrapStyle: React.CSSProperties = {
    marginTop: st.offsetY ? `${st.offsetY}px` : undefined,

    backgroundColor: hasBg || hasShadow ? effectiveBg : 'transparent',

    borderRadius:
      hasBg || hasShadow || hasBorder
        ? (container.radius != null ? `${container.radius}px` : undefined)
        : undefined,

    padding:
      hasBg || hasShadow || hasBorder
        ? (container.padding != null ? `${container.padding}px` : '16px')
        : '0px',

    boxShadow: hasShadow ? '0 10px 30px rgba(0,0,0,0.14)' : undefined,

    borderStyle: hasBorder ? 'solid' : undefined,
    borderWidth: hasBorder ? `${container.borderWidth}px` : undefined,
    borderColor: hasBorder ? (container.borderColor ?? undefined) : undefined,
  }

  const heading = s.heading ?? 'Horário'
  const days = s.days || {}

  const anyEnabled = DAY_ORDER.some((k) => normalizeDay(days[k]).enabled)
  if (!anyEnabled) return null

  const rowGap = st.rowGapPx ?? 8
  const dayW = st.dayLabelWidthPx ?? 52

  const timeFormat = st.timeFormat ?? '24h'

  return (
    <section style={wrapStyle}>
      {isNonEmpty(heading) && (
        <div
          style={{
            fontWeight: st.headingBold === false ? 500 : (st.headingFontWeight ?? 900),
            fontSize: st.headingFontSize ?? 13,
            opacity: 0.75,
            marginBottom: 10,
            fontFamily: st.headingFontFamily || undefined,
            color: st.headingColor ?? '#111827',
            textAlign: st.headingAlign ?? 'left',
          }}
        >
          {heading}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: rowGap }}>
        {DAY_ORDER.map((k) => {
          const d = normalizeDay(days[k])
          const line = d.enabled ? formatRanges(d.ranges, timeFormat) : 'Fechado'

          return (
            <div
              key={k}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 10,
                color: st.textColor ?? '#111827',
                fontFamily: st.textFontFamily || undefined,
                fontWeight: st.textFontWeight ?? 700,
                fontSize: st.textFontSize ?? 13,
              }}
            >
              <div style={{ width: dayW, opacity: 0.7 }}>{DAY_LABEL_PT[k]}</div>
              <div style={{ opacity: d.enabled ? 0.95 : 0.55 }}>{line}</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
