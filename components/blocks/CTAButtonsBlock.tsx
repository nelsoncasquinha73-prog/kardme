'use client'

import React from 'react'

type IconMode = 'none' | 'library' | 'upload'

type CtaButton = {
  id: string
  label: string
  url: string
  openInNewTab?: boolean
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
  }

  container?: {
    padding?: number
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
  // WhatsApp shortcuts
  if (u.startsWith('wa.me/')) return `https://${u}`
  if (u.startsWith('www.')) return `https://${u}`
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(u)) return `https://${u}`
  return u
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

  const buttons = Array.isArray(s.buttons) ? s.buttons : []
  if (buttons.length === 0) {
    return <div style={{ opacity: 0.6, fontSize: 13 }}>Sem botões — adiciona o primeiro CTA</div>
  }

  const layout = s.layout ?? 'stack'
  const gap = s.gapPx ?? 10

  const wrap: React.CSSProperties = {
    transform: st.offsetY ? `translateY(${st.offsetY}px)` : undefined,
    padding: st.container?.padding ?? 0,
    display: 'flex',
    flexDirection: layout === 'row' ? 'row' : 'column',
    gap,
    alignItems: mapAlign(s.align),
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
    width: layout === 'row' ? 'auto' : '100%',
    maxWidth: layout === 'row' ? 260 : undefined,
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

    // modo library: para não te prender já num pacote de ícones específico,
    // deixamos placeholder; quando quiseres, ligamos ao teu picker de react-icons.
    // Por agora, se não houver uploadUrl, não mostra.
    return null
  }

  return (
    <div style={wrap}>
      {buttons.map((b) => {
        const href = normalizeUrl(b.url)
        const isHttp = href.startsWith('http://') || href.startsWith('https://')
        const target = b.openInNewTab && isHttp ? '_blank' : undefined
        const rel = target ? 'noreferrer' : undefined

        const icon = renderIcon(b)
        const iconPos = b.icon?.position ?? 'left'

        return (
          <a
            key={b.id}
            href={href || '#'}
            target={target}
            rel={rel}
            style={baseBtn}
            data-no-block-select="1"
            onClick={(e) => {
              if (!href) e.preventDefault()
              // hook para analytics futuro:
              // console.log('click_cta_button', { cardId, buttonId: b.id, url: href })
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
