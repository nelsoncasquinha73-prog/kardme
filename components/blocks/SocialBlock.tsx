'use client'

import React from 'react'
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTiktok, FaYoutube, FaGlobe } from 'react-icons/fa'

type SocialChannel = 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'website'

type SocialItemObj = { enabled?: boolean; label?: string; url?: string }
type SocialItemArray = { uid?: string; id?: SocialChannel | null; enabled?: boolean; label?: string; url?: string }

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
  // pode vir como object (novo) ou array (antigo)
  items?: Partial<Record<SocialChannel, SocialItemObj>> | SocialItemArray[]
}

type SocialStyle = {
  offsetY?: number
  showLabel?: boolean
  uniformButtons?: boolean
  uniformWidthPx?: number
  uniformHeightPx?: number
  uniformContentAlign?: 'left' | 'center'

  headingFontSize?: number

  container?: { bgColor?: string; radius?: number; padding?: number; shadow?: boolean; borderWidth?: number; borderColor?: string }

  buttonDefaults?: ButtonStyle
  buttons?: Partial<Record<SocialChannel, ButtonStyle>>

  headingFontFamily?: string
  headingFontWeight?: number
  headingColor?: string
  headingBold?: boolean
  headingAlign?: 'left' | 'center' | 'right'

  brandColors?: boolean
  brandMode?: 'bg' | 'icon'
}

type Props = { settings: SocialSettings; style?: SocialStyle }

const ICONS_MAP: Record<SocialChannel, React.ElementType> = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  linkedin: FaLinkedinIn,
  tiktok: FaTiktok,
  youtube: FaYoutube,
  website: FaGlobe,
}

const BRAND: Record<SocialChannel, { bg: string; icon: string; text: string }> = {
  facebook: { bg: '#1877F2', icon: '#ffffff', text: '#ffffff' },
  instagram: { bg: '#E1306C', icon: '#ffffff', text: '#ffffff' },
  linkedin: { bg: '#0A66C2', icon: '#ffffff', text: '#ffffff' },
  tiktok: { bg: '#111827', icon: '#ffffff', text: '#ffffff' },
  youtube: { bg: '#FF0000', icon: '#ffffff', text: '#ffffff' },
  website: { bg: '#111827', icon: '#ffffff', text: '#ffffff' },
}

function isNonEmpty(v?: string) {
  return typeof v === 'string' && v.trim().length > 0
}

function sanitizeUrl(raw: string) {
  const v = raw.trim()
  if (!v) return null
  if (!/^https?:\/\//i.test(v)) return `https://${v}`
  return v
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

function defaultLabel(ch: SocialChannel) {
  switch (ch) {
    case 'facebook': return 'Facebook'
    case 'instagram': return 'Instagram'
    case 'linkedin': return 'LinkedIn'
    case 'tiktok': return 'TikTok'
    case 'youtube': return 'YouTube'
    case 'website': return 'Website'
  }
}

function normalizeItems(items: SocialSettings['items']): Array<{ ch: SocialChannel; item: SocialItemObj; href: string }> {
  const channels: SocialChannel[] = ['facebook', 'instagram', 'linkedin', 'tiktok', 'youtube', 'website']
  if (!items) return []

  // formato antigo: array
  if (Array.isArray(items)) {
    return items
      .map((it) => {
        const ch = it.id ?? null
        if (!ch) return null
        if (it.enabled === false) return null
        if (!isNonEmpty(it.url)) return null
        const href = sanitizeUrl(it.url!)
        if (!href) return null
        return { ch, item: { enabled: it.enabled, label: it.label, url: it.url }, href }
      })
      .filter(Boolean) as any
  }

  // formato novo: object
  return channels
    .map((ch) => {
      const item = (items as any)[ch] as SocialItemObj | undefined
      if (!item) return null
      if (item.enabled === false) return null
      if (!isNonEmpty(item.url)) return null
      const href = sanitizeUrl(item.url!)
      if (!href) return null
      return { ch, item, href }
    })
    .filter(Boolean) as any
}

export default function SocialBlock({ settings, style }: Props) {
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
    borderRadius: hasBg || hasShadow || hasBorder ? (container.radius != null ? `${container.radius}px` : undefined) : undefined,
    padding: hasBg || hasShadow || hasBorder ? (container.padding != null ? `${container.padding}px` : '16px') : '0px',
    boxShadow: hasShadow ? '0 10px 30px rgba(0,0,0,0.14)' : undefined,
    borderStyle: hasBorder ? 'solid' : undefined,
    borderWidth: hasBorder ? `${container.borderWidth}px` : undefined,
    borderColor: hasBorder ? (container.borderColor ?? undefined) : undefined,
  }

  const justifyContent = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'

  const visible = normalizeItems(s.items)
  if (visible.length === 0) return null

  const firstBs = mergeBtn(st.buttonDefaults, st.buttons?.[visible[0].ch])
  const uniformWidthPx = st.uniformWidthPx ?? computeUniformWidthPx(showLabel, firstBs.sizePx)
  const uniformHeightPx = st.uniformHeightPx ?? computeUniformHeightPx(showLabel, firstBs.sizePx)
  const uniformContentAlign: 'left' | 'center' = st.uniformContentAlign ?? 'center'

  const brandOn = st.brandColors === true
  const brandMode = st.brandMode ?? 'bg'

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
          const base = mergeBtn(st.buttonDefaults, st.buttons?.[ch])

          const bs = brandOn
            ? (() => {
                const b = BRAND[ch]
                if (brandMode === 'icon') {
                  return { ...base, iconColor: b.bg, textColor: b.bg }
                }
                return { ...base, bgMode: 'solid' as const, bgColor: b.bg, iconColor: b.icon, textColor: b.text, borderEnabled: false, borderWidth: 0 }
              })()
            : base

          const label = item.label || defaultLabel(ch)
          const Icon = ICONS_MAP[ch]
          const bgBtn = buttonBackground(bs)

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
              target="_blank"
              rel="noreferrer"
              style={{
                width: uniformButtons ? uniformWidthPx : undefined,
                height: uniformButtons ? uniformHeightPx : undefined,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: contentJustify,
                gap: showLabel ? 10 : 0,
                textDecoration: 'none',
                color: bs.textColor,
                padding: showLabel ? `${bs.paddingY}px ${bs.paddingX}px` : `${bs.paddingY}px`,
                borderRadius: bs.radius,
                background: bgBtn,
                border: bs.borderWidth > 0 ? `${bs.borderWidth}px solid ${bs.borderColor}` : 'none',
                boxShadow: bs.shadow ? '0 10px 26px rgba(0,0,0,0.16)' : 'none',
                cursor: 'pointer',
                userSelect: 'none',
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
                <Icon color={bs.iconColor} size={iconSize} />
              </span>

              {showLabel && (
                <span
                  style={{
                    fontWeight: bs.fontWeight ?? 800,
                    fontSize: bs.labelFontSize ?? 13,
                    opacity: 0.95,
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
