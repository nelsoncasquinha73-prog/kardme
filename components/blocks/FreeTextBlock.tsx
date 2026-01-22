'use client'

import React from 'react'

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
  // permitir links tipo "www." ou domínio
  if (u.startsWith('www.')) return `https://${u}`
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(u)) return `https://${u}`
  return u
}

// transforma URLs em anchors simples (sem markdown, leve e seguro)
function linkify(text: string) {
  const t = text || ''
  const re = /(https?:\/\/[^\s]+|www\.[^\s]+|mailto:[^\s]+|tel:[^\s]+)/g
  const parts = t.split(re)

  return parts.map((part, idx) => {
    if (re.test(part)) {
      const href = normalizeUrl(part)
      return (
        <a
          key={idx}
          href={href}
          target={href.startsWith('http') ? '_blank' : undefined}
          rel={href.startsWith('http') ? 'noreferrer' : undefined}
          style={{ color: 'inherit', textDecoration: 'underline' }}
          data-no-block-select="1"
        >
          {part}
        </a>
      )
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>
  })
}

export default function FreeTextBlock({ settings, style }: Props) {
  const s = settings || { text: '' }
  const st: FreeTextStyle = style || {}
  const c = st.container || {}

  const compact = st.compact === true

  const title = (s.title ?? '').trim()
  const text = (s.text ?? '').trim()

  const pad = c.padding ?? (compact ? 10 : 14)

  const wrap: React.CSSProperties = {
    transform: st.offsetY ? `translateY(${st.offsetY}px)` : undefined,
  }

  const containerStyle: React.CSSProperties = {
    background: c.bgColor ?? (compact ? 'transparent' : 'transparent'),
    borderRadius: c.radius ?? (compact ? 12 : 14),
    padding: pad,
    boxShadow: c.shadow ? '0 16px 40px rgba(0,0,0,0.12)' : undefined,
    border: (c.borderWidth ?? 0) > 0 ? `${c.borderWidth}px solid ${c.borderColor ?? '#e5e7eb'}` : undefined,
  }

  const titleStyle: React.CSSProperties = {
    margin: 0,
    marginBottom: title ? (compact ? 6 : 8) : 0,
    color: st.titleColor ?? '#111827',
    fontFamily: resolveFont(st.titleFontFamily),
    fontWeight: st.titleBold === false ? 600 : 900,
    fontSize: st.titleFontSize ?? (compact ? 13 : 15),
    textAlign: st.titleAlign ?? 'left',
    letterSpacing: compact ? 0.1 : 0.2,
  }

  const textStyle: React.CSSProperties = {
    margin: 0,
    color: st.textColor ?? '#111827',
    fontFamily: resolveFont(st.fontFamily),
    fontWeight: st.bold ? 800 : 500,
    fontSize: st.fontSize ?? (compact ? 12 : 14),
    lineHeight: st.lineHeight ?? (compact ? 1.35 : 1.5),
    textAlign: st.align ?? 'left',
    whiteSpace: 'pre-wrap',
    opacity: compact ? 0.85 : 1,
  }

  if (!title && !text) {
    return (
      <div style={wrap}>
        <div style={{ ...containerStyle, opacity: 0.6, fontSize: 13 }}>Sem conteúdo</div>
      </div>
    )
  }

  return (
    <div style={wrap}>
      <div style={containerStyle}>
        {title ? <h3 style={titleStyle}>{title}</h3> : null}
        {text ? <p style={textStyle}>{linkify(text)}</p> : null}
      </div>
    </div>
  )
}
