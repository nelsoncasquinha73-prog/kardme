'use client'

import React, { useState } from 'react'

type ModalItem = { label: string; content: string }

type FreeTextSettings = {
  title?: string
  text: string
  modals?: Record<string, ModalItem>
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

export default function FreeTextBlock({ settings, style }: Props) {
  const s = settings || { text: '' }
  const st: FreeTextStyle = style || {}
  const c = st.container || {}
  const modals = s.modals || {}
  const [openModal, setOpenModal] = useState<string | null>(null)

  const compact = st.compact === true
  const title = (s.title ?? '').trim()
  const text = (s.text ?? '').trim()
  const pad = c.padding ?? (compact ? 10 : 14)
  const isHtml = text.includes('<')

  const wrap: React.CSSProperties = {
    transform: st.offsetY ? `translateY(${st.offsetY}px)` : undefined,
  }

  const containerStyle: React.CSSProperties = {
    background: c.bgColor ?? 'transparent',
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
    whiteSpace: isHtml ? undefined : 'pre-wrap',
    opacity: compact ? 0.85 : 1,
  }

  if (!title && !text) {
    return (
      <div style={wrap}>
        <div style={{ ...containerStyle, opacity: 0.6, fontSize: 13 }}>Sem conteudo</div>
      </div>
    )
  }

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.tagName === 'A') {
      const href = target.getAttribute('href') || ''
      if (href.startsWith('#modal:')) {
        e.preventDefault()
        e.stopPropagation()
        const modalId = href.replace('#modal:', '')
        if (modals[modalId]) setOpenModal(modalId)
      }
    }
  }

  const activeModal = openModal ? modals[openModal] : null

  return (
    <div style={wrap}>
      <div style={containerStyle}>
        {title ? <h3 style={titleStyle}>{title}</h3> : null}
        {text ? (
          isHtml ? (
            <div
              style={textStyle}
              dangerouslySetInnerHTML={{ __html: text }}
              onClick={handleClick}
              data-no-block-select="1"
            />
          ) : (
            <p style={textStyle}>{text}</p>
          )
        ) : null}
      </div>

      {activeModal && (
        <div
          onClick={() => setOpenModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 20,
              maxWidth: 500,
              width: '100%',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#111827' }}>{activeModal.label}</h3>
              <button
                onClick={() => setOpenModal(null)}
                style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                X
              </button>
            </div>
            <div
              style={{ padding: 20, overflowY: 'auto', fontSize: 14, lineHeight: 1.7, color: '#374151' }}
              dangerouslySetInnerHTML={{ __html: activeModal.content }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
