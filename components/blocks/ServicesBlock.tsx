'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
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

  // título do bloco
  headingFontFamily?: string
  headingFontWeight?: number
  headingColor?: string
  headingBold?: boolean
  headingAlign?: 'left' | 'center' | 'right'
  headingFontSize?: number

  // container do bloco
  container?: {
    bgColor?: string // 'transparent' => OFF
    radius?: number
    padding?: number
    shadow?: boolean
    borderWidth?: number
    borderColor?: string
  }

  // tipografia base (para texto)
  textFontFamily?: string
  textFontWeight?: number
  textFontSize?: number

  // cores específicas
  titleColor?: string
  subtitleColor?: string
  priceColor?: string
  descriptionColor?: string

  // tipografia específica (opcional)
  titleFontWeight?: number
  titleFontSize?: number
  subtitleFontWeight?: number
  subtitleFontSize?: number
  priceFontWeight?: number
  priceFontSize?: number
  descriptionFontWeight?: number
  descriptionFontSize?: number

  // card
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

  imageFocusX?: number
  imageFocusY?: number

  // ✅ NOVO: caixa do texto (dentro do card)
  contentBox?: {
    bgColor?: string // 'transparent' => OFF
    radius?: number
    padding?: number
    shadow?: boolean
    borderWidth?: number
    borderColor?: string
  }

  // carrossel
  carouselCardWidthPx?: number
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
    marginTop: typeof st.offsetY === 'number' ? `${st.offsetY}px` : undefined,
    backgroundColor: containerHasBg || containerHasShadow ? containerEffectiveBg : 'transparent',
    borderRadius: containerHasBg || containerHasShadow || containerHasBorder ? (container.radius != null ? `${container.radius}px` : undefined) : undefined,
    padding: containerHasBg || containerHasShadow || containerHasBorder ? (container.padding != null ? `${container.padding}px` : '16px') : '0px',
    boxShadow: containerHasShadow ? '0 10px 30px rgba(0,0,0,0.14)' : undefined,
    borderStyle: containerHasBorder ? 'solid' : undefined,
    borderWidth: containerHasBorder ? `${container.borderWidth}px` : undefined,
    borderColor: containerHasBorder ? container.borderColor ?? undefined : undefined,
  }

  const heading = s.heading ?? 'Serviços e Produtos'
  const items = useMemo(() => (s.items || []).filter((i) => i.enabled), [s.items])
  const layout = s.layout ?? 'grid'

  // Card base
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

  const imageAspectRatio = clamp(clampNum(st.imageAspectRatio, 1.5), 0.5, 3)
  const imageRadius = st.imageRadiusPx ?? 10

  // foco imagem
  const focusX = clamp(clampNum(st.imageFocusX, 50), 0, 100)
  const focusY = clamp(clampNum(st.imageFocusY, 50), 0, 100)
  const objectPosition = `${focusX}% ${focusY}%`

  // ===== Carrossel (Embla) =====
  const autoplayEnabled = s.carousel?.autoplay !== false
  const autoplayIntervalMs = s.carousel?.autoplayIntervalMs ?? 3500

  const showDots = s.carousel?.showDots !== false
  const showArrows = s.carousel?.showArrows === true
  const arrowsDesktopOnly = s.carousel?.arrowsDesktopOnly !== false

  const cardWidthPx = clamp(clampNum(st.carouselCardWidthPx, 320), 240, 520)
  const carouselGapPx = clamp(clampNum(st.carouselGapPx, colGap), 0, 64)

  const sidePaddingPx = clamp(
    clampNum(st.carouselSidePaddingPx, Math.max(12, Math.round((360 - cardWidthPx) / 2))),
    0,
    80
  )

  const dotsColor = st.carouselDotsColor ?? 'rgba(0,0,0,0.25)'
  const dotsActiveColor = st.carouselDotsActiveColor ?? 'rgba(0,0,0,0.65)'

  const arrowsBg = st.carouselArrowsBg ?? 'rgba(255,255,255,0.9)'
  const arrowsIcon = st.carouselArrowsIconColor ?? '#111827'

  const autoplay = useRef(Autoplay({ delay: autoplayIntervalMs, stopOnInteraction: true, stopOnMouseEnter: true }))
  const plugins = layout === 'carousel' && autoplayEnabled && items.length > 1 ? [autoplay.current] : []

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: layout === 'carousel' && items.length > 1,
      align: 'center',
      dragFree: false,
      containScroll: 'keepSnaps',
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

  const hasHeading = typeof heading === 'string' && heading.trim().length > 0
  const headingBoldOn = st.headingBold !== false


  // Early return se não houver items (depois de todos os hooks)
  if (items.length === 0) return null
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
          <div ref={emblaRef} style={{ overflow: 'hidden', WebkitTapHighlightColor: 'transparent' }}>
            <div
              style={{
                display: 'flex',
                marginLeft: -(carouselGapPx || 0),
                paddingLeft: sidePaddingPx,
                paddingRight: sidePaddingPx,
                paddingBottom: 2,
                touchAction: 'pan-y',
              }}
            >
              {items.map((item) => (
                <div key={item.id} style={{ flex: '0 0 auto', paddingLeft: carouselGapPx, width: cardWidthPx }}>
                  <ServiceCard
                    item={item}
                    st={st}
                    objectPosition={objectPosition}
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
                    imageAspectRatio={imageAspectRatio}
                    imageRadius={imageRadius}
                    onOpenModal={() => setModalOpen(item.id)}
                  />
                </div>
              ))}
            </div>
          </div>

          {showArrowsNow && (
            <>
              <button type="button" onClick={prev} aria-label="Anterior" style={arrowStyle('left', arrowsBg, arrowsIcon)} data-no-block-select="1">
                ‹
              </button>
              <button type="button" onClick={next} aria-label="Seguinte" style={arrowStyle('right', arrowsBg, arrowsIcon)} data-no-block-select="1">
                ›
              </button>
            </>
          )}

          {canUseCarouselUi && showDots && snapCount > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10, userSelect: 'none' }} data-no-block-select="1">
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
              objectPosition={objectPosition}
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
              imageAspectRatio={imageAspectRatio}
              imageRadius={imageRadius}
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
  objectPosition,
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
  imageAspectRatio,
  imageRadius,
  onOpenModal,
}: {
  item: ServiceItem
  st?: ServicesStyle
  objectPosition: string
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
  imageAspectRatio: number
  imageRadius: number
  onOpenModal: () => void
}) {
  const baseFont = st?.textFontFamily || undefined

 const titleColor = st?.titleColor ?? '#111827'
const subtitleColor = st?.subtitleColor ?? '#4b5563'
const priceColor = st?.priceColor ?? '#111827'
const descColor = st?.descriptionColor ?? '#374151'



  const titleWeight = st?.titleFontWeight ?? 800
  const titleSize = st?.titleFontSize ?? 18

  const subtitleWeight = st?.subtitleFontWeight ?? (st?.textFontWeight ?? 600)
  const subtitleSize = st?.subtitleFontSize ?? 14

  const priceWeight = st?.priceFontWeight ?? 800
  const priceSize = st?.priceFontSize ?? 16

  const descWeight = st?.descriptionFontWeight ?? (st?.textFontWeight ?? 500)
  const descSize = st?.descriptionFontSize ?? (st?.textFontSize ?? 14)

  // ✅ content box (texto dentro do card)
  const cb = st?.contentBox || {}
  const cbBg = cb.bgColor ?? 'transparent'
  const cbHasBg = cbBg !== 'transparent' && cbBg !== 'rgba(0,0,0,0)'
  const cbHasShadow = cb.shadow === true
  const cbHasBorder = (cb.borderWidth ?? 0) > 0
  const cbEffectiveBg = cbHasShadow && !cbHasBg ? 'rgba(255,255,255,0.92)' : cbBg

  const contentBoxStyle: React.CSSProperties = {
    padding: cb.padding != null ? `${cb.padding}px` : '16px',
    backgroundColor: cbHasBg || cbHasShadow ? cbEffectiveBg : 'transparent',
    borderRadius: cb.radius != null ? `${cb.radius}px` : undefined,
    boxShadow: cbHasShadow ? '0 10px 24px rgba(0,0,0,0.12)' : undefined,
    borderStyle: cbHasBorder ? 'solid' : undefined,
    borderWidth: cbHasBorder ? `${cb.borderWidth}px` : undefined,
    borderColor: cbHasBorder ? cb.borderColor ?? undefined : undefined,
  }

  return (
    <div
      style={{
        borderRadius: cardRadius,
        border: `${cardBorderWidth}px solid ${cardBorderColor}`,
        boxShadow: cardShadow ? '0 2px 10px rgba(0,0,0,0.10)' : undefined,
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
            minHeight: 160,
            overflow: 'hidden',
            borderTopLeftRadius: cardRadius,
            borderTopRightRadius: cardRadius,
          }}
        >
          <img
            src={item.imageSrc}
            alt={item.imageAlt ?? item.title}
            loading="lazy"
            draggable={false}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition,
              display: 'block',
              borderRadius: imageRadius ? `${imageRadius}px` : undefined,
            }}
          />
        </div>
      )}

      <div style={{ padding: 12, flex: 1 }}>
        <div style={{ ...contentBoxStyle, minHeight: 170, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: 0, fontWeight: titleWeight, fontSize: titleSize, color: titleColor, fontFamily: baseFont }}>
            {item.title}
          </h3>

          {item.subtitle && (
            <div
              style={{
                fontSize: subtitleSize,
                color: subtitleColor,
                marginTop: 4,
                fontWeight: subtitleWeight,
                fontFamily: baseFont,
              }}
            >
              {item.subtitle}
            </div>
          )}

          {item.price && (
            <div style={{ marginTop: 6, fontWeight: priceWeight, fontSize: priceSize, color: priceColor, fontFamily: baseFont }}>
              {item.price}
            </div>
          )}

          {item.description && (
            <p style={{ marginTop: 8, fontSize: descSize, color: descColor, fontWeight: descWeight, flexGrow: 1, fontFamily: baseFont }}>
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
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: baseFont,
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
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: baseFont,
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
    </div>
  )
}

function Modal({ onClose, item, style }: { onClose: () => void; item: ServiceItem; style?: ServicesStyle }) {
  if (!item) return null

  const bg = style?.container?.bgColor ?? '#fff'
  const radius = style?.container?.radius ?? 12
  const padding = style?.container?.padding ?? 24
  const textColor = '#111827'
  const fontFamily = style?.textFontFamily || undefined

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
          fontFamily,
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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function clampNum(v: any, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
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
