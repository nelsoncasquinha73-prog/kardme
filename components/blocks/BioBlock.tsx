'use client'

import React from 'react'

type BioSettings = {
  text: string
}

type BioStyle = {
  offsetY?: number

  textColor?: string
  fontFamily?: string // pode ser "Dancing Script" ou "var(--font-dancing)"
  bold?: boolean
  fontSize?: number
  lineHeight?: number
  align?: 'left' | 'center' | 'right'

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
  settings: BioSettings
  style?: BioStyle
}

const FONT_MAP: Record<string, string> = {
  System: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  Serif: 'serif',
  Monospace: 'monospace',
}

function mapGoogleFont(ff?: string) {
  if (!ff) return undefined

  // ✅ se já vier como variável CSS, usa direto
  if (ff.startsWith('var(--font-')) return ff

  // compat: se vier com nomes antigos
  switch (ff) {
    case 'Inter':
      return 'var(--font-inter)'
    case 'Poppins':
      return 'var(--font-poppins)'
    case 'Montserrat':
      return 'var(--font-montserrat)'
    case 'Roboto':
      return 'var(--font-roboto)'
    case 'Open Sans':
      return 'var(--font-open-sans)'
    case 'Lato':
      return 'var(--font-lato)'
    case 'Nunito':
      return 'var(--font-nunito)'
    case 'Playfair Display':
      return 'var(--font-playfair)'
    case 'Dancing Script':
      return 'var(--font-dancing)'
    default:
      return undefined
  }
}

export default function BioBlock({ settings, style }: Props) {
  if (!settings?.text) return null

  const container = style?.container || {}
  const bg = container.bgColor ?? 'transparent'
  const shadowOn = container.shadow === true

  const effectiveBg =
    shadowOn && (bg === 'transparent' || bg === 'rgba(0,0,0,0)')
      ? 'rgba(255,255,255,0.92)'
      : bg

  const containerStyle: React.CSSProperties = {
    marginTop: style?.offsetY ? `${style.offsetY}px` : undefined,

    backgroundColor: effectiveBg,
    borderRadius: container.radius != null ? `${container.radius}px` : undefined,
    padding: container.padding != null ? `${container.padding}px` : '16px',
    boxShadow: container.shadow
      ? '0 10px 30px rgba(0,0,0,0.18), 0 2px 10px rgba(0,0,0,0.10)'
      : undefined,

    borderStyle: container.borderWidth ? 'solid' : undefined,
    borderWidth: container.borderWidth ? `${container.borderWidth}px` : undefined,
    borderColor: container.borderColor ?? undefined,
  }

  const globalFontFamily = FONT_MAP.System
  const resolvedFont = mapGoogleFont(style?.fontFamily)

  const textStyle: React.CSSProperties = {
    color: style?.textColor ?? '#111827',
    fontFamily: resolvedFont ?? style?.fontFamily ?? globalFontFamily,
    fontWeight: style?.bold ? 700 : 400,
    fontSize: style?.fontSize != null ? `${style.fontSize}px` : '15px',
    lineHeight: style?.lineHeight ?? 1.6,
    textAlign: style?.align ?? 'center',
    whiteSpace: 'pre-wrap',
  }

  return (
    <section style={containerStyle}>
      <p style={textStyle}>{settings.text}</p>
    </section>
  )
}
