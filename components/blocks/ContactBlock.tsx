'use client'

import React from 'react'
import { FaWhatsapp, FaPhone, FaEnvelope } from 'react-icons/fa'
import { SiTelegram } from 'react-icons/si'

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

  iconScale?: number // 0.40–0.90 (default 0.58)
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
}

const ICONS_MAP: Record<ContactChannel, React.ElementType> = {
  phone: FaPhone,
  email: FaEnvelope,
  whatsapp: FaWhatsapp,
  telegram: SiTelegram,
}

function isNonEmpty(v?: string) {
  return typeof v === 'string' && v.trim().length > 0
}

function normalizePhone(raw: string) {
  return raw.replace(/[^\d+]/g, '')
}

function buildHref(channel: ContactChannel, item: ContactItem) {
  const v = (item.value || '').trim()
  if (!v) return null

  if (channel === 'phone') {
    const p = normalizePhone(v)
    return p ? `tel:${p}` : null
  }

  if (channel === 'email') return `mailto:${v}`

  if (channel === 'whatsapp') {
    const p = normalizePhone(v).replace(/^\+/, '')
    return p ? `https://wa.me/${p}` : null
  }

  if (channel === 'telegram') {
    const u = v.replace(/^@/, '')
    return u ? `https://t.me/${u}` : null
  }

  return null
}

function mergeBtn(defaults?: ButtonStyle, specific?: ButtonStyle): Required<ButtonStyle> {
  const d = defaults || {}
  const s = specific || {}

  const borderEnabled = s.borderEnabled ?? d.borderEnabled ?? true

  return {
    sizePx: s.sizePx ?? d.sizePx ?? 44,
    radius: s.radius ?? d.radius ?? 14,

    bgColor: s.bgColor ?? d.bgColor ?? '#ffffff',
    bgMode: s.bgMode ?? d.bgMode ?? 'solid',
    bgGradient: s.bgGradient ?? d.bgGradient ?? { from: '#111827', to: '#374151', angle: 135 },

    borderEnabled,
    borderWidth: borderEnabled ? (s.borderWidth ?? d.borderWidth ?? 1) : 0,
    borderColor: s.borderColor ?? d.borderColor ?? 'rgba(0,0,0,0.10)',

    iconColor: s.iconColor ?? d.iconColor ?? '#111827',
    shadow: s.shadow ?? d.shadow ?? false,
    textColor: s.textColor ?? d.textColor ?? '#111827',

    fontFamily: s.fontFamily ?? d.fontFamily ?? '',
    fontWeight: s.fontWeight ?? d.fontWeight ?? 800,
    labelFontSize: s.labelFontSize ?? d.labelFontSize ?? 13,

    paddingY: s.paddingY ?? d.paddingY ?? 10,
    paddingX: s.paddingX ?? d.paddingX ?? 12,

    iconScale: s.iconScale ?? d.iconScale ?? 0.58,
  }
}

function buttonBackground(bs: Required<ButtonStyle>) {
  if (bs.bgMode === 'gradient') {
    const from = bs.bgGradient?.from ?? '#111827'
    const to = bs.bgGradient?.to ?? '#374151'
    const angle = bs.bgGradient?.angle ?? 135
    return `linear-gradient(${angle}deg, ${from}, ${to})`
  }
  return bs.bgColor
}

function computeUniformWidthPx(showLabel: boolean, sizePx: number) {
  if (!showLabel) return Math.max(44, sizePx + 24)
  return 160
}

function computeUniformHeightPx(showLabel: boolean, sizePx: number) {
  if (!showLabel) return Math.max(44, sizePx + 20)
  return 52
}

export default function ContactBlock({ settings, style }: Props) {
  const s = settings || {}
  const st = style || {}

  const layout = s.layout || {}
  const direction = layout.direction ?? 'row'
  const gapPx = layout.gapPx ?? 10
  const align = layout.align ?? 'center'

  const showLabel = st.showLabel !== false
  const uniformButtons = st.uniformButtons === true

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

  const justifyContent =
    align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'

  const items = s.items || {}
  const channels: ContactChannel[] = ['phone', 'email', 'whatsapp', 'telegram']

  const visible = channels
    .map((ch) => {
      const item = items[ch]
      if (!item) return null
      if (item.enabled === false) return null
      if (!isNonEmpty(item.value)) return null
      const href = buildHref(ch, item as ContactItem)
      if (!href) return null
      return { ch, item: item as ContactItem, href }
    })
    .filter(Boolean) as Array<{ ch: ContactChannel; item: ContactItem; href: string }>

  if (visible.length === 0) return null

  const firstBs = mergeBtn(st.buttonDefaults, st.buttons?.[visible[0].ch])

  const uniformWidthPx =
    st.uniformWidthPx ?? computeUniformWidthPx(showLabel, firstBs.sizePx)

  const uniformHeightPx =
    st.uniformHeightPx ?? computeUniformHeightPx(showLabel, firstBs.sizePx)

  const uniformContentAlign: 'left' | 'center' =
    st.uniformContentAlign ?? 'center'

  return (
    <section style={wrapStyle}>
      {isNonEmpty(s.heading) && (
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
          {s.heading}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: direction,
          gap: gapPx,
          justifyContent,
          alignItems: 'center',
          flexWrap: direction === 'row' ? 'wrap' : 'nowrap',
        }}
      >
        {visible.map(({ ch, item, href }) => {
          const bs = mergeBtn(st.buttonDefaults, st.buttons?.[ch])
          const label = item.label || defaultLabel(ch)
          const IconComponent = ICONS_MAP[ch]

          const bg = buttonBackground(bs)

          const contentJustify = showLabel
            ? uniformButtons
              ? uniformContentAlign === 'center'
                ? 'center'
                : 'flex-start'
              : 'flex-start'
            : 'center'

          const iconSize = Math.round(bs.sizePx * (bs.iconScale ?? 0.58))

          return (
            <a
              key={ch}
              href={href}
              target={ch === 'email' || ch === 'phone' ? undefined : '_blank'}
              rel={ch === 'email' || ch === 'phone' ? undefined : 'noreferrer'}
              style={{
                width: uniformButtons ? uniformWidthPx : undefined,
                height: uniformButtons ? uniformHeightPx : undefined,

                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: contentJustify,
                gap: showLabel ? 10 : 0,

                textDecoration: 'none',
                color: bs.textColor,

                padding: showLabel
                  ? `${bs.paddingY}px ${bs.paddingX}px`
                  : `${bs.paddingY}px`,

                borderRadius: bs.radius,
                background: bg,
                border: bs.borderWidth > 0 ? `${bs.borderWidth}px solid ${bs.borderColor}` : 'none',
                boxShadow: bs.shadow ? '0 10px 26px rgba(0,0,0,0.16)' : 'none',

                cursor: 'pointer',
                userSelect: 'none',
                transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <span
                style={{
                  width: bs.sizePx,
                  height: bs.sizePx,
                  borderRadius: Math.min(bs.radius, 999),
                  display: 'grid',
                  placeItems: 'center',
                  flex: '0 0 auto',
                }}
              >
                <IconComponent color={bs.iconColor} size={iconSize} />
              </span>

              {showLabel && (
                <span
                  style={{
                    fontWeight: bs.fontWeight ?? 800,
                    fontSize: bs.labelFontSize ?? 13,
                    opacity: 0.9,
                    color: bs.textColor,
                    fontFamily: bs.fontFamily || undefined,
                    lineHeight: 1.1,
                  }}
                >
                  {label}
                </span>
              )}
            </a>
          )
        })}
      </div>
    </section>
  )
}

function defaultLabel(ch: ContactChannel) {
  switch (ch) {
    case 'phone':
      return 'Ligar'
    case 'email':
      return 'Email'
    case 'whatsapp':
      return 'WhatsApp'
    case 'telegram':
      return 'Telegram'
  }
}

// micro-migração: preencher borderEnabled quando vierem dados antigos
export function migrateContactButtonStyle(bs?: ButtonStyle): ButtonStyle | undefined {
  if (!bs) return bs
  return {
    ...bs,
    borderEnabled: bs.borderEnabled ?? (bs.borderWidth != null ? bs.borderWidth > 0 : true),
  }
}
