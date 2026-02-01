'use client'

import React from 'react'

type IconMode = 'none' | 'library' | 'upload'
type ActionType = 'link' | 'phone' | 'whatsapp'

type CtaButton = {
  id: string
  label: string
  url: string
  openInNewTab?: boolean
  actionType?: ActionType
  phone?: string
  whatsappMessage?: string
  widthMode?: '100%' | 'auto' | 'custom'
  customWidthPx?: number
  icon?: {
    mode: IconMode
    libraryName?: string
    uploadUrl?: string
    sizePx?: number
    position?: 'left' | 'right'
  }
}

type CTAButtonsSettings = {
  buttons: CtaButton[]
  layout?: 'stack' | 'row'
  align?: 'left' | 'center' | 'right'
  gapPx?: number
}

type CTAButtonsStyle = {
  offsetY?: number

  button?: {
    heightPx?: number
    radius?: number
    bgColor?: string
    textColor?: string
    fontFamily?: string
    fontSize?: number
    bold?: boolean
    borderWidth?: number
    borderColor?: string
    shadow?: boolean
    iconGapPx?: number
    widthMode?: '100%' | 'auto' | 'custom'
    customWidthPx?: number
  }

  container?: {
    enabled?: boolean
    bgColor?: string
    radius?: number
    padding?: number
    borderWidth?: number
    borderColor?: string
    shadow?: boolean
    widthMode?: 'full' | 'custom'
    customWidthPx?: number
  }
}

type Props = {
  cardId?: string
  settings: CTAButtonsSettings
  style?: CTAButtonsStyle
}

const FONT_MAP: Record<string, string> = {
  System: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  Serif: 'serif',
  Monospace: 'monospace',
}

function resolveFont(fontFamily?: string) {
  if (!fontFamily) return undefined
  if (FONT_MAP[fontFamily]) return FONT_MAP[fontFamily]
  return fontFamily
}

function normalizeUrl(url: string) {
  const u = (url || '').trim()
  if (!u) return ''
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  if (u.startsWith('mailto:') || u.startsWith('tel:')) return u
  if (u.startsWith('wa.me/')) return `https://${u}`
  if (u.startsWith('www.')) return `https://${u}`
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(u)) return `https://${u}`
  return u
}

function getButtonHref(b: CtaButton): string {
  const actionType = b.actionType || 'link'
  if (actionType === 'phone' && b.phone) {
    const cleanPhone = b.phone.replace(/[^0-9+]/g, '')
    return `tel:${cleanPhone}`
  }
  if (actionType === 'whatsapp' && b.phone) {
    const cleanPhone = b.phone.replace(/[^0-9]/g, '')
    const message = b.whatsappMessage ? encodeURIComponent(b.whatsappMessage) : ''
    return `https://wa.me/${cleanPhone}${message ? '?text=' + message : ''}`
  }
  return normalizeUrl(b.url || '')
}

function mapAlign(align?: 'left' | 'center' | 'right') {
  if (align === 'left') return 'flex-start'
  if (align === 'right') return 'flex-end'
  return 'center'
}

export default function CTAButtonsBlock({ cardId, settings, style }: Props) {
  const s: CTAButtonsSettings = settings || { buttons: [] }
  const st: CTAButtonsStyle = style || {}
  const btn = st.button || {}
  const c = st.container || {}

  const buttons = Array.isArray(s.buttons) ? s.buttons : []
  if (buttons.length === 0) {
    return <div style={{ opacity: 0.6, fontSize: 13 }}>Sem botões — adiciona o primeiro CTA</div>
  }

  const layout = s.layout ?? 'stack'
  const gap = s.gapPx ?? 10

  const wrap: React.CSSProperties = {
    transform: st.offsetY ? `translateY(${st.offsetY}px)` : undefined,
    padding: c.padding ?? 0,
    display: 'flex',
    flexDirection: layout === 'row' ? 'row' : 'column',
    gap,
    alignItems: mapAlign(s.align),
    background: c.enabled !== false ? (c.bgColor ?? 'transparent') : 'transparent',
    borderRadius: c.radius ?? 0,
    border: (c.borderWidth ?? 0) > 0 ? `${c.borderWidth}px solid ${c.borderColor ?? 'rgba(0,0,0,0.12)'}` : undefined,
    boxShadow: c.shadow ? '0 14px 40px rgba(0,0,0,0.12)' : undefined,
    width: c.widthMode === 'custom' && c.customWidthPx ? c.customWidthPx : undefined,
    maxWidth: c.widthMode === 'custom' ? '100%' : undefined,
    alignSelf: c.widthMode === 'custom' ? 'center' : undefined,
    boxSizing: 'border-box',
  }

  const getButtonWidth = (b: CtaButton): string | number | undefined => {
    const mode = b.widthMode ?? btn.widthMode ?? '100%'
    if (mode === 'custom') return b.customWidthPx ?? btn.customWidthPx ?? 200
    if (mode === 'auto') return 'auto'
    return layout === 'row' ? 'auto' : '100%'
  }

  const baseBtn: React.CSSProperties = {
    height: btn.heightPx ?? 44,
    borderRadius: btn.radius ?? 14,
    background: btn.bgColor ?? '#111827',
    color: btn.textColor ?? '#ffffff',
    border: (btn.borderWidth ?? 0) > 0 ? `${btn.borderWidth}px solid ${btn.borderColor ?? 'rgba(255,255,255,0.25)'}` : 'none',
    boxShadow: btn.shadow ? '0 18px 50px rgba(0,0,0,0.18)' : undefined,
    padding: '0 14px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: btn.iconGapPx ?? 10,
    textDecoration: 'none',
    fontFamily: resolveFont(btn.fontFamily),
    fontSize: btn.fontSize ?? 14,
    fontWeight: btn.bold ? 800 : 700,
    cursor: 'pointer',
    userSelect: 'none',
    boxSizing: 'border-box',
  }

  const renderIcon = (b: CtaButton) => {
    const ic = b.icon
    if (!ic || ic.mode === 'none') return null

    const size = ic.sizePx ?? 18

    if (ic.mode === 'upload' && ic.uploadUrl) {
      return (
        <img
          src={ic.uploadUrl}
          alt=""
          style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
          data-no-block-select="1"
        />
      )
    }

    return null
  }

  return (
    <div style={wrap}>
      {buttons.map((b) => {
        const href = getButtonHref(b)
        const isHttp = href.startsWith('http://') || href.startsWith('https://')
        const actionType = b.actionType || 'link'
        const target = actionType === 'link' && b.openInNewTab && isHttp ? '_blank' : undefined
        const rel = target ? 'noreferrer' : undefined

        const icon = renderIcon(b)
        const iconPos = b.icon?.position ?? 'left'

        const btnStyle: React.CSSProperties = {
          ...baseBtn,
          width: getButtonWidth(b),
        }

        return (
          <a
            key={b.id}
            href={href || '#'}
            target={target}
            rel={rel}
            style={btnStyle}
            data-no-block-select="1"
            onClick={(e) => {
              if (!href) e.preventDefault()
              void cardId
            }}
          >
            {icon && iconPos === 'left' ? icon : null}
            <span style={{ lineHeight: 1.1 }}>{b.label || 'Botão'}</span>
            {icon && iconPos === 'right' ? icon : null}
          </a>
        )
      })}
    </div>
  )
}
