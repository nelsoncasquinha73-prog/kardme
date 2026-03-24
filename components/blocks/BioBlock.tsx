'use client'

import React, { useState } from 'react'
import { createPortal } from 'react-dom'

type ModalItem = { label: string; content: string }

type BioSettings = {
  text: string
  modals?: Record<string, ModalItem>
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
  const modals = settings?.modals || {}
  const [openModal, setOpenModal] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  React.useEffect(() => setMounted(true), [])
  if (!settings?.text) return null

  const resolvedFont = mapGoogleFont(style?.fontFamily)

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
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
  }

  const activeModal = openModal ? modals[openModal] : null

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

  const bioTextColor = style?.textColor ?? '#111827'

  if (isHTML) {
    return (
      <>
        <div 
          style={containerStyle}
          onClickCapture={handleClick}
          data-no-block-select="1"
        >
          <style>{`
            [data-modal-id] { text-decoration: underline; cursor: pointer; color: #3b82f6; }
            .bio-rich-text, .bio-rich-text p, .bio-rich-text div, .bio-rich-text li, .bio-rich-text span:not([style*="color"]) { color: ${bioTextColor}; }
          `}</style>
          <div className="bio-rich-text" dangerouslySetInnerHTML={{ __html: settings.text }} />
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
      </>
    )
  }

  // Plain text fallback (for old cards)
  return (
    <p style={{ ...containerStyle, whiteSpace: 'pre-wrap', margin: 0 }}>
      {settings.text}
    </p>
  )
}
