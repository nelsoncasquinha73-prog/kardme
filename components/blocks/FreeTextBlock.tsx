'use client'

import React, { useId, useState } from 'react'
import { createPortal } from 'react-dom'

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
  const [mounted, setMounted] = useState(false)
  React.useEffect(() => setMounted(true), [])

  const htmlScopeId = useId()

  const compact = st.compact === true
  const title = (s.title ?? '').trim()
  const text = (s.text ?? '').trim()
  const pad = c.padding ?? (compact ? 10 : 14)
  const isHtml = true  // Always render as HTML (FreeText uses RichTextEditor)

  const wrap: React.CSSProperties = {
    transform: st.offsetY ? `translateY(${st.offsetY}px)` : undefined, position: 'relative', zIndex: 1,
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
    
    // Procura SPAN com data-modal-id
    const modalSpan = target.closest('[data-modal-id]')
    if (modalSpan) {
      e.preventDefault()
      e.stopPropagation()
      const modalId = modalSpan.getAttribute('data-modal-id') || ''
      if (modals[modalId]) {
        setOpenModal(modalId)
      }
      return
    }
    
    // Procura A com href #modal:
    if (target.tagName === 'A') {
      const href = target.getAttribute('href') || ''
      if (href.includes('#modal:')) {
        e.preventDefault()
        e.stopPropagation()
        const modalId = href.split('#modal:')[1]
        if (modals[modalId]) console.log('[FreeTextBlock] opening modal:', modalId)
        setOpenModal(modalId)
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
            <div id={htmlScopeId} style={textStyle} onClickCapture={handleClick} data-no-block-select="1">
              <style>{`
                #${htmlScopeId} { color: ${st.textColor ?? '#111827'}; }
                #${htmlScopeId} * { color: inherit; }
                #${htmlScopeId} a { color: inherit; text-decoration: underline; cursor: pointer; }
                #${htmlScopeId} span[data-modal-id] { text-decoration: underline; cursor: pointer; color: #3b82f6; }
                #${htmlScopeId} p { margin: 0 0 10px 0; }
                #${htmlScopeId} ul, #${htmlScopeId} ol { margin: 8px 0 8px 18px; padding: 0; }
              `}</style>
              <div dangerouslySetInnerHTML={{ __html: text }} />
            </div>
          ) : (
            <p style={textStyle} onClickCapture={handleClick} data-no-block-select="1">{text}</p>
          )
        ) : null}
      </div>

      {mounted && activeModal
    ? createPortal(
        <div
          onClick={() => setOpenModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 2147483647,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 18,
              maxWidth: 560,
              width: '100%',
              maxHeight: '85vh',
              overflow: 'hidden',
              boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                background: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                borderBottom: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#111827' }}>
                {activeModal.label}
              </h3>
              <button
                onClick={() => setOpenModal(null)}
                aria-label="Fechar"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: 'none',
                  background: 'rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                padding: 16,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                fontSize: 14,
                lineHeight: 1.7,
                color: '#374151',
              }}
              dangerouslySetInnerHTML={{ __html: activeModal.content }}
            />
          </div>
        </div>,
        document.body
      )
    : null}
    </div>
  )
}
