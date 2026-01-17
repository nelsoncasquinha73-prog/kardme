// components/blocks/ServicesBlock.tsx
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import AutoplayImport from 'embla-carousel-autoplay'

const Autoplay = (AutoplayImport as any)?.default ?? AutoplayImport

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
  carousel?: {
    autoplay?: boolean
    autoplayIntervalMs?: number
    showDots?: boolean
    showArrows?: boolean
    arrowsDesktopOnly?: boolean
  }
  items?: ServiceItem[]
}

export type ServicesStyle = {
  offsetY?: number

  // título (igual ao SocialBlock)
  headingFontFamily?: string
  headingFontWeight?: number
  headingColor?: string
  headingBold?: boolean
  headingAlign?: 'left' | 'center' | 'right'
  headingFontSize?: number

  container?: {
    bgColor?: string // 'transparent' => OFF
    radius?: number
    padding?: number
    shadow?: boolean
    borderWidth?: number
    borderColor?: string
  }

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

  // carrossel
  carouselCardWidthPx?: number // 260–360
  carouselGapPx?: number
  carouselSidePaddingPx?: number
  carouselDotsColor?: string
  carouselDotsActiveColor?: string
  carouselArrowsBg?: string
  carouselArrowsIconColor?: string
}

export default function ServicesBlock({ settings, style }: { settings: ServicesSettings; style?: ServicesStyle }) {
  const s = settings || {}
  const st = style || {}

  const [modalOpen, setModalOpen] = useState<string | null>(null)

  // Container (bloco)
  const container = st.container || {}
  const containerBg = container.bgColor ?? 'transparent'
  const containerHasBg = containerBg !== 'transparent' && containerBg !== 'rgba(0,0,0,0)'
  const containerHasShadow = container.shadow === true
  const containerHasBorder = (container.borderWidth ?? 0) > 0
  const containerEffectiveBg = containerHasShadow && !containerHasBg ? 'rgba(255,255,255,0.92)' : containerBg

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
  const items = useMemo(() => (s.items || []).filter((i) => i.enabled), [s.items])

  const layout = s.layout ?? 'grid'

  const cardRadius = st.cardRadiusPx ?? 12
  const cardBorderWidth = st.cardBorderWidth ?? 1
  const cardBorderColor = st.cardBorderColor ?? '#e5e7eb'
  const cardShadow = st.cardShadow ?? true

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

  // título igual ao SocialBlock
  const hasHeading = typeof heading === 'string' && heading.trim().length > 0
  const headingBoldOn = st.headingBold !== false

  // ===== Carrossel (Embla) =====
  const autoplayEnabled = s.carousel?.autoplay !== false // default ON
  const autoplayIntervalMs = s.carousel?.autoplayIntervalMs ?? 3500

  const showDots = s.carousel?.showDots !== false // default ON
  const showArrows = s.carousel?.showArrows === true // default OFF (para não poluir)
  const arrowsDesktopOnly = s.carousel?.arrowsDesktopOnly !== false // default ON

  const cardWidthPx = clamp(st.carouselCardWidthPx ?? 300, 260, 360)
  const carouselGapPx = st.carouselGapPx ?? colGap
  const sidePaddingPx = st.carouselSidePaddingPx ?? 12

  const dotsColor = st.carouselDotsColor ?? 'rgba(0,0,0,0.25)'
  const dotsActiveColor = st.carouselDotsActiveColor ?? 'rgba(0,0,0,0.65)'

  const arrowsBg = st.carouselArrowsBg ?? 'rgba(255,255,255,0.9)'
  const arrowsIcon = st.carouselArrowsIconColor ?? '#111827'

  const autoplay = useRef(Autoplay({ delay: autoplayIntervalMs, stopOnInteraction: true, stopOnMouseEnter: true }))
  const plugins = layout === 'carousel' && autoplayEnabled && items.length > 1 ? [autoplay.current] : []

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: layout === 'carousel' && items.length > 1,
      align: 'start',
      dragFree: false,
      containScroll: 'trimSnaps',
    },
    plugins
  )

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [snapCount, setSnapCount] = useState(0)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])

  useEffect(() => {
    if (!emblaApi) return

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap() || 0)
    const onReInit = () => {
      setSnapCount(emblaApi.scrollSnapList().length)
      onSelect()
    }

    setSnapCount(emblaApi.scrollSnapList().length)
    onSelect()

    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onReInit)

    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onReInit)
    }
  }, [emblaApi])

  const canUseCarouselUi = layout === 'carousel' && items.length > 1
  const showArrowsNow = canUseCarouselUi && showArrows && (!arrowsDesktopOnly || isDesktop)

  const prev = () => emblaApi?.scrollPrev()
  const next = () => emblaApi?.scrollNext()
  const goTo = (idx: number) => emblaApi?.scrollTo(idx)

  return (
    <section style={wrapStyle}>
      {hasHeading && (
        <div
          style={{
            fontWeight: headingBoldOn ? (st.headingFontWeight ?? 900) : 500,
            fontSize: st.headingFontSize ?? 13,
            opacity: 0.75,
            marginBottom: 10,
            fontFamily: st.headingFontFamily || undefined,
            color: st.headingColor ?? '#111827',
            textAlign: st.headingAlign ?? 'left',
          }}
        >
          {heading}
        </div>
      )}

      {layout === 'carousel' ? (
        <div style={{ position: 'relative' }}>
          {/* viewport */}
          <div
            ref={emblaRef}
            style={{
              overflow: 'hidden',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* container */}
            <div
              style={{
                display: 'flex',
                gap: carouselGapPx,
                paddingLeft: sidePaddingPx,
                paddingRight: sidePaddingPx,
                paddingBottom: 2,
                touchAction: 'pan-y',
              }}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    flex: '0 0 auto',
                    width: cardWidthPx,
                    maxWidth: '90%',
                  }}
                >
                  <ServiceCard
                    item={item}
                    st={st}
                    cardRadius={cardRadius}
                    cardBorderWidth={cardBorderWidth}
                    cardBorderColor={cardBorderColor}
                    cardShadow={cardShadow}
                    cardHasBg={cardHasBg}
                    cardBg={cardBg}
                    buttonBg={buttonBg}
                    buttonText={buttonText}
                    buttonBorderWidth={buttonBorderWidth}
                    buttonBorderColor={buttonBorderColor}
                    buttonRadius={buttonRadius}
                    imageRadius={imageRadius}
                    imageAspectRatio={imageAspectRatio}
                    onOpenModal={() => setModalOpen(item.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* arrows (opcionais / desktop) */}
          {showArrowsNow && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Anterior"
                style={arrowStyle('left', arrowsBg, arrowsIcon)}
                data-no-block-select="1"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Seguinte"
                style={arrowStyle('right', arrowsBg, arrowsIcon)}
                data-no-block-select="1"
              >
                ›
              </button>
            </>
          )}

          {/* dots */}
          {canUseCarouselUi && showDots && snapCount > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
                marginTop: 10,
                userSelect: 'none',
              }}
              data-no-block-select="1"
            >
              {Array.from({ length: snapCount }).map((_, i) => {
                const active = i === selectedIndex
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Ir para o item ${i + 1}`}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      backgroundColor: active ? dotsActiveColor : dotsColor,
                      transform: active ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 120ms ease, background-color 120ms ease',
                    }}
                  />
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: layout === 'list' ? '1fr' : 'repeat(auto-fill,minmax(280px,1fr))',
            gap: `${rowGap}px ${colGap}px`,
          }}
        >
          {items.map((item) => (
            <ServiceCard
              key={item.id}
              item={item}
              st={st}
              cardRadius={cardRadius}
              cardBorderWidth={cardBorderWidth}
              cardBorderColor={cardBorderColor}
              cardShadow={cardShadow}
              cardHasBg={cardHasBg}
              cardBg={cardBg}
              buttonBg={buttonBg}
              buttonText={buttonText}
              buttonBorderWidth={buttonBorderWidth}
              buttonBorderColor={buttonBorderColor}
              buttonRadius={buttonRadius}
              imageRadius={imageRadius}
              imageAspectRatio={imageAspectRatio}
              onOpenModal={() => setModalOpen(item.id)}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal onClose={() => setModalOpen(null)} item={items.find((i) => i.id === modalOpen)!} style={st} />
      )}
    </section>
  )
}

function ServiceCard({
  item,
  st,
  cardRadius,
  cardBorderWidth,
  cardBorderColor,
  cardShadow,
  cardHasBg,
  cardBg,
  buttonBg,
  buttonText,
  buttonBorderWidth,
  buttonBorderColor,
  buttonRadius,
  imageRadius,
  imageAspectRatio,
  onOpenModal,
}: {
  item: ServiceItem
  st?: ServicesStyle
  cardRadius: number
  cardBorderWidth: number
  cardBorderColor: string
  cardShadow: boolean
  cardHasBg: boolean
  cardBg: string
  buttonBg: string
  buttonText: string
  buttonBorderWidth: number
  buttonBorderColor: string
  buttonRadius: number
  imageRadius: number
  imageAspectRatio: number
  onOpenModal: () => void
}) {
  const textColor = st?.textColor ?? '#111827'

  return (
    <div
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
          <Image src={item.imageSrc} alt={item.imageAlt ?? item.title} fill style={{ objectFit: 'cover', borderRadius: `${imageRadius}px` }} />
        </div>
      )}

      <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: 18, color: textColor }}>{item.title}</h3>

        {item.subtitle && (
          <div style={{ fontSize: 14, color: st?.textColor ?? '#555', marginTop: 4, fontWeight: 500 }}>{item.subtitle}</div>
        )}

        {item.price && <div style={{ marginTop: 6, fontWeight: 700, fontSize: 16, color: textColor }}>{item.price}</div>}

        {item.description && (
          <p style={{ marginTop: 8, fontSize: 14, color: st?.textColor ?? '#444', flexGrow: 1 }}>{item.description}</p>
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
                onClick={onOpenModal}
                style={{
                  padding: '8px 16px',
                  backgroundColor: buttonBg,
                  color: buttonText,
                  borderRadius: buttonRadius,
                  border: `${buttonBorderWidth}px solid ${buttonBorderColor}`,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                data-no-block-select="1"
              >
                {item.actionLabel || 'Ver mais'}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

function Modal({ onClose, item, style }: { onClose: () => void; item: ServiceItem; style?: ServicesStyle }) {
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
        padding: 16,
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
          data-no-block-select="1"
        >
          ×
        </button>

        <h3 style={{ marginTop: 0, marginBottom: 8 }}>{item.title}</h3>

        {item.price && <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12, color: textColor }}>{item.price}</div>}
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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function arrowStyle(side: 'left' | 'right', bg: string, icon: string): React.CSSProperties {
  return {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    [side]: 6,
    width: 34,
    height: 34,
    borderRadius: 999,
    border: '1px solid rgba(0,0,0,0.10)',
    background: bg,
    color: icon,
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    boxShadow: '0 10px 26px rgba(0,0,0,0.10)',
    fontSize: 22,
    lineHeight: 1,
  }
}
