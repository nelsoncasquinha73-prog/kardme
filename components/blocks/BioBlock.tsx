'use client'

import React from 'react'

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
}

function mapGoogleFont(ff?: string) {
  if (!ff) return undefined
  if (ff.startsWith('var(--font-')) return ff
  return undefined
}

export default function BioBlock({ settings, style }: Props) {
  if (!settings?.text) return null

  const resolvedFont = mapGoogleFont(style?.fontFamily)

  const containerStyle: React.CSSProperties = {
    color: style?.textColor ?? '#111827',
    fontFamily: resolvedFont ?? style?.fontFamily ?? 'inherit',
    fontWeight: style?.bold ? 700 : 400,
    fontSize: style?.fontSize != null ? `${style.fontSize}px` : '15px',
    lineHeight: style?.lineHeight ?? 1.6,
    textAlign: style?.align ?? 'center',
  }

  // Check if text contains HTML tags
  const isHTML = /<[a-z][\s\S]*>/i.test(settings.text)

  if (isHTML) {
    return (
      <div 
        style={containerStyle} 
        dangerouslySetInnerHTML={{ __html: settings.text }} 
      />
    )
  }

  // Plain text fallback (for old cards)
  return (
    <p style={{ ...containerStyle, whiteSpace: 'pre-wrap', margin: 0 }}>
      {settings.text}
    </p>
  )
}
