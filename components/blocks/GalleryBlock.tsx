'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

type GalleryItem = {
  uid: string
  url: string
  caption?: string
  enabled?: boolean
}

type GallerySettings = {
  items: GalleryItem[]
  layout?: {
    containerMode?: 'full' | 'moldura' | 'autoadapter'
    gapPx?: number
    itemWidthPx?: number
    itemHeightPx?: number
    objectFit?: 'cover' | 'contain'

    // autoplay
    autoplay?: boolean
    autoplayIntervalMs?: number // ex: 3500
  }
}

type GalleryStyle = {
  container?: {
    bgColor?: string
    radius?: number
    padding?: number
    shadow?: boolean
    borderWidth?: number
    borderColor?: string
    enabled?: boolean
  }
}

type Props = {
  settings: GallerySettings
  style?: GalleryStyle
}

function containerStyleFromJson(style: GalleryStyle['container']): React.CSSProperties {
  const s = style || {}
  const enabled = s.enabled !== false

  return {
    backgroundColor: enabled ? (s.bgColor ?? 'transparent') : 'transparent',
    borderRadius: s.radius != null ? `${s.radius}px` : undefined,
    padding: s.padding != null ? `${s.padding}px` : '8px',
    boxShadow: s.shadow ? '0 10px 30px rgba(0,0,0,0.14)' : undefined,
    borderStyle: s.borderWidth ? 'solid' : undefined,
    borderWidth: s.borderWidth ? `${s.borderWidth}px` : undefined,
    borderColor: s.borderColor ?? undefined,
  }
}

export default function GalleryBlock({ settings, style }: Props) {
  const s = settings || { items: [] }
  const st = style || {}

  const containerStyle = containerStyleFromJson(st.container)
  const gapPx = s.layout?.gapPx ?? 12
  const containerMode = s.layout?.containerMode ?? 'full'

  const itemWidthPx = s.layout?.itemWidthPx ?? (containerMode === 'autoadapter' ? 180 : 240)
  const itemHeightPx = s.layout?.itemHeightPx ?? (containerMode === 'autoadapter' ? 120 : 160)
  const objectFit = s.layout?.objectFit ?? 'cover'

  const autoplay = s.layout?.autoplay !== false // default ON
  const autoplayIntervalMs = s.layout?.autoplayIntervalMs ?? 3500

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [isUserInteracting, setIsUserInteracting] = useState(false)

  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const interactionTimeoutRef = useRef<number | null>(null)

  const visibleItems = useMemo(
    () => (s.items || []).filter((item) => item.enabled !== false && item.url),
    [s.items]
  )

  if (visibleItems.length === 0) return null

  // Helpers: calcula o "passo" de scroll (largura do item + gap)
  const stepPx = itemWidthPx + gapPx

  function markUserInteracting() {
    setIsUserInteracting(true)
    if (interactionTimeoutRef.current) window.clearTimeout(interactionTimeoutRef.current)
    interactionTimeoutRef.current = window.setTimeout(() => {
      setIsUserInteracting(false)
    }, 1200) // após 1.2s sem interação, volta a autoplay
  }

  useEffect(() => {
    if (!autoplay) return
    if (isHovering) return
    if (isUserInteracting) return
    if (lightboxIndex !== null) return // não mexer com lightbox aberto
    if (!scrollerRef.current) return
    if (visibleItems.length <= 1) return

    const el = scrollerRef.current

    const id = window.setInterval(() => {
      // Se alguém começou a interagir entretanto, não força scroll
      if (isHovering || isUserInteracting || lightboxIndex !== null) return
      if (!el) return

      const maxScrollLeft = el.scrollWidth - el.clientWidth
      const next = Math.min(el.scrollLeft + stepPx, maxScrollLeft)

      // Se chegou ao fim, volta ao início suavemente
      if (Math.abs(el.scrollLeft - maxScrollLeft) < 2) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
        return
      }

      el.scrollTo({ left: next, behavior: 'smooth' })
    }, autoplayIntervalMs)

    return () => window.clearInterval(id)
  }, [autoplay, autoplayIntervalMs, isHovering, isUserInteracting, lightboxIndex, stepPx, visibleItems.length])

  useEffect(() => {
    return () => {
      if (interactionTimeoutRef.current) window.clearTimeout(interactionTimeoutRef.current)
    }
  }, [])

  return (
    <>
      <div
        ref={scrollerRef}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onTouchStart={markUserInteracting}
        onTouchMove={markUserInteracting}
        onWheel={markUserInteracting}
        onScroll={markUserInteracting}
        style={{
          ...containerStyle,
          display: 'flex',
          overflowX: 'auto',
          gap: gapPx,
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',

          padding: containerMode === 'full' ? 0 : containerStyle.padding,
          borderRadius: containerMode === 'full' ? 0 : containerStyle.borderRadius,
          boxShadow: containerMode === 'full' ? 'none' : containerStyle.boxShadow,
          borderStyle: containerMode === 'full' ? 'none' : containerStyle.borderStyle,
          borderWidth: containerMode === 'full' ? 0 : containerStyle.borderWidth,
          borderColor: containerMode === 'full' ? 'transparent' : containerStyle.borderColor,
        }}
      >
        {visibleItems.map((item, i) => (
          <div
            key={item.uid}
            style={{
              flex: '0 0 auto',
              scrollSnapAlign: 'center',
              cursor: 'pointer',
              borderRadius: 12,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              width: itemWidthPx,
              height: itemHeightPx,
            }}
            onClick={() => setLightboxIndex(i)}
          >
            <img
              src={item.url}
              alt={item.caption || `Imagem ${i + 1}`}
              style={{ width: '100%', height: '100%', objectFit, display: 'block' }}
              loading="lazy"
              draggable={false}
            />
            {item.caption && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  width: '100%',
                  background: 'rgba(0,0,0,0.4)',
                  color: 'white',
                  padding: '4px 8px',
                  fontSize: 12,
                  textAlign: 'center',
                  userSelect: 'none',
                }}
              >
                {item.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          items={visibleItems}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIndex) => setLightboxIndex(newIndex)}
        />
      )}
    </>
  )
}

type LightboxProps = {
  items: GalleryItem[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}

function Lightbox({ items, currentIndex, onClose, onNavigate }: LightboxProps) {
  const item = items[currentIndex]

  const prev = () => onNavigate((currentIndex - 1 + items.length) % items.length)
  const next = () => onNavigate((currentIndex + 1) % items.length)

  // Zoom simples: click alterna entre 1x e 2x
  const [zoom, setZoom] = useState<1 | 2>(1)

  useEffect(() => {
    // sempre que muda de imagem, reset zoom
    setZoom(1)
  }, [currentIndex])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.82)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        cursor: 'zoom-out',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: '92vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'default',
        }}
      >
        <div
          style={{
            maxWidth: '92vw',
            maxHeight: '82vh',
            overflow: 'auto',
            borderRadius: 12,
          }}
        >
          <img
            src={item.url}
            alt={item.caption || `Imagem ${currentIndex + 1}`}
            style={{
              maxWidth: zoom === 1 ? '92vw' : '160vw',
              maxHeight: zoom === 1 ? '82vh' : '140vh',
              borderRadius: 12,
              display: 'block',
              cursor: zoom === 1 ? 'zoom-in' : 'zoom-out',
            }}
            onClick={() => setZoom((z) => (z === 1 ? 2 : 1))}
            loading="eager"
            draggable={false}
          />
        </div>

        {item.caption && (
          <div style={{ marginTop: 10, color: 'white', fontSize: 14, textAlign: 'center' }}>
            {item.caption}
          </div>
        )}

        <button
          onClick={prev}
          style={navBtnLeft}
          aria-label="Imagem anterior"
        >
          ‹
        </button>

        <button
          onClick={next}
          style={navBtnRight}
          aria-label="Próxima imagem"
        >
          ›
        </button>

        <button
          onClick={onClose}
          style={closeBtn}
          aria-label="Fechar"
        >
          ×
        </button>
      </div>
    </div>
  )
}

const navBtnLeft: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: 8,
  transform: 'translateY(-50%)',
  background: 'rgba(255,255,255,0.22)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 999,
  width: 44,
  height: 44,
  cursor: 'pointer',
  fontSize: 26,
  fontWeight: 900,
  color: '#fff',
  userSelect: 'none',
}

const navBtnRight: React.CSSProperties = {
  ...navBtnLeft,
  left: 'auto',
  right: 8,
}

const closeBtn: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 8,
  background: 'rgba(255,255,255,0.22)',
  border: '1px solid rgba(255,255,255,0.18)',
  borderRadius: 999,
  width: 36,
  height: 36,
  cursor: 'pointer',
  fontSize: 22,
  fontWeight: 900,
  color: '#fff',
  userSelect: 'none',
  lineHeight: 1,
}
