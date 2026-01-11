'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useTheme } from '@/components/theme/ThemeProvider'

export type ServiceItem = {
  id: string
  enabled: boolean
  imageSrc?: string
  imageAlt?: string
  title: string
  price?: string
  subtitle?: string
  description?: string
  actionType: 'link' | 'modal' | 'none'
  actionLabel?: string
  actionUrl?: string
  details?: string
  features?: string[]
}

export type ServicesSettings = {
  heading?: string
  layout?: 'grid' | 'list' | 'carousel'
  items?: ServiceItem[]
}

export type ServicesStyle = {
  offsetY?: number
  container?: {
    bgColor?: string // 'transparent' => OFF
    radius?: number
    padding?: number
    shadow?: boolean
    borderWidth?: number
    borderColor?: string
  }
  headingColor?: string
  headingFontWeight?: number
  headingFontSize?: number
  headingAlign?: 'left' | 'center' | 'right'
  textColor?: string
  textFontWeight?: number
  textFontSize?: number

  cardRadiusPx?: number
  cardBorderWidth?: number
  cardBorderColor?: string
  cardShadow?: boolean
  cardBgColor?: string // 'transparent' => OFF

  rowGapPx?: number
  colGapPx?: number
  buttonBgColor?: string
  buttonTextColor?: string
  buttonBorderWidth?: number
  buttonBorderColor?: string
  buttonRadiusPx?: number
  imageRadiusPx?: number
  imageAspectRatio?: number
}

export default function ServicesBlock({
  settings,
  style,
}: {
  settings: ServicesSettings
  style?: ServicesStyle
}) {
  const s = settings || {}
  const st = style || {}

  const [modalOpen, setModalOpen] = useState<string | null>(null)
  const theme = useTheme()

  const container = st.container || {}

  // Container (bloco) — padrão igual aos outros blocos:
  // bgColor === 'transparent' => OFF
  const containerBg = container.bgColor ?? 'transparent'
  const containerHasBg = containerBg !== 'transparent' && containerBg !== 'rgba(0,0,0,0)'
  const containerHasShadow = container.shadow === true
  const containerHasBorder = (container.borderWidth ?? 0) > 0

  // Se tiver sombra mas bg OFF, mete um “quase branco” para a sombra ficar natural (igual ao que já tinhas)
  const containerEffectiveBg =
    containerHasShadow && !containerHasBg ? 'rgba(255,255,255,0.92)' : containerBg

  const wrapStyle: React.CSSProperties = {
    marginTop: st.offsetY ? `${st.offsetY}px` : undefined,
    backgroundColor: containerHasBg || containerHasShadow ? containerEffectiveBg : 'transparent',
    borderRadius:
      containerHasBg || containerHasShadow || containerHasBorder
        ? (container.radius != null ? `${container.radius}px` : undefined)
        : undefined,
    padding:
      containerHasBg || containerHasShadow || containerHasBorder
        ? (container.padding != null ? `${container.padding}px` : '16px')
        : '0px',
    boxShadow: containerHasShadow ? '0 10px 30px rgba(0,0,0,0.14)' : undefined,
    borderStyle: containerHasBorder ? 'solid' : undefined,
    borderWidth: containerHasBorder ? `${container.borderWidth}px` : undefined,
    borderColor: containerHasBorder ? (container.borderColor ?? undefined) : undefined,
  }

  const heading = s.heading ?? 'Serviços e Produtos'
  const items = (s.items || []).filter((i) => i.enabled)

  const cardRadius = st.cardRadiusPx ?? 12
  const cardBorderWidth = st.cardBorderWidth ?? 1
  const cardBorderColor = st.cardBorderColor ?? '#e5e7eb'
  const cardShadow = st.cardShadow ?? true

  // Cartões: bgColor === 'transparent' => OFF
  const cardBg = st.cardBgColor ?? '#ffffff'
  const cardHasBg = cardBg !== 'transparent' && cardBg !== 'rgba(0,0,0,0)'

  const rowGap = st.rowGapPx ?? 16
  const colGap = st.colGapPx ?? 16
  const buttonBg = st.buttonBgColor ?? '#0070f3'
  const buttonText = st.buttonTextColor ?? '#fff'
  const buttonBorderWidth = st.buttonBorderWidth ?? 0
  const buttonBorderColor = st.buttonBorderColor ?? 'transparent'
  const buttonRadius = st.buttonRadiusPx ?? 8
  const imageRadius = st.imageRadiusPx ?? 8
  const imageAspectRatio = st.imageAspectRatio ?? 1.5

  if (items.length === 0) return null

  return (
    <section style={wrapStyle}>
      {heading && (
        <h2
          style={{
            fontWeight: st.headingFontWeight ?? 700,
            fontSize: st.headingFontSize ?? 20,
            marginBottom: 20,
            color: st.headingColor ?? '#111827',
            textAlign: st.headingAlign ?? 'left',
          }}
        >
          {heading}
        </h2>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))',
          gap: `${rowGap}px ${colGap}px`,
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              borderRadius: cardRadius,
              border: `${cardBorderWidth}px solid ${cardBorderColor}`,
              boxShadow: cardShadow ? '0 2px 8px rgba(0,0,0,0.1)' : undefined,
              overflow: 'hidden',
              backgroundColor: cardHasBg ? cardBg : 'transparent',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {item.imageSrc && (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: `${100 / imageAspectRatio}%`,
                  overflow: 'hidden',
                }}
              >
                <Image
                  src={item.imageSrc}
                  alt={item.imageAlt ?? item.title}
                  fill
                  style={{ objectFit: 'cover', borderRadius: `${imageRadius}px` }}
                />
              </div>
            )}

            <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 18,
                  color: st.textColor ?? '#111827',
                }}
              >
                {item.title}
              </h3>

              {item.subtitle && (
                <div
                  style={{
                    fontSize: 14,
                    color: st.textColor ?? '#555',
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                >
                  {item.subtitle}
                </div>
              )}

              {item.price && (
                <div
                  style={{
                    marginTop: 6,
                    fontWeight: 700,
                    fontSize: 16,
                    color: st.textColor ?? '#111827',
                  }}
                >
                  {item.price}
                </div>
              )}

              {item.description && (
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 14,
                    color: st.textColor ?? '#444',
                    flexGrow: 1,
                  }}
                >
                  {item.description}
                </p>
              )}

              {item.actionType !== 'none' && (
                <div style={{ marginTop: 12 }}>
                  {item.actionType === 'link' && item.actionUrl ? (
                    <a
                      href={item.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        backgroundColor: buttonBg,
                        color: buttonText,
                        borderRadius: buttonRadius,
                        border: `${buttonBorderWidth}px solid ${buttonBorderColor}`,
                        textDecoration: 'none',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {item.actionLabel || 'Ver mais'}
                    </a>
                  ) : item.actionType === 'modal' ? (
                    <button
                      onClick={() => setModalOpen(item.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: buttonBg,
                        color: buttonText,
                        borderRadius: buttonRadius,
                        border: `${buttonBorderWidth}px solid ${buttonBorderColor}`,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {item.actionLabel || 'Ver mais'}
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <Modal
          onClose={() => setModalOpen(null)}
          item={items.find((i) => i.id === modalOpen)!}
          style={st}
        />
      )}
    </section>
  )
}

function Modal({
  onClose,
  item,
  style,
}: {
  onClose: () => void
  item: ServiceItem
  style?: ServicesStyle
}) {
  if (!item) return null

  const bg = style?.container?.bgColor ?? '#fff'
  const radius = style?.container?.radius ?? 12
  const padding = style?.container?.padding ?? 24
  const textColor = style?.textColor ?? '#111827'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: bg,
          borderRadius: radius,
          padding,
          maxWidth: 600,
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          color: textColor,
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'transparent',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            color: textColor,
          }}
          aria-label="Fechar"
        >
          ×
        </button>

        <h3 style={{ marginTop: 0, marginBottom: 8 }}>{item.title}</h3>

        {item.price && (
          <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12, color: textColor }}>
            {item.price}
          </div>
        )}

        {item.description && <p style={{ marginBottom: 12 }}>{item.description}</p>}

        {item.features && item.features.length > 0 && (
          <ul style={{ marginBottom: 12, paddingLeft: 20 }}>
            {item.features.map((f, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
