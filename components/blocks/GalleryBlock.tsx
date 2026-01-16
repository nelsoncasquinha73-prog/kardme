'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import AutoplayImport from 'embla-carousel-autoplay'

const Autoplay = (AutoplayImport as any)?.default ?? AutoplayImport

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

    autoplay?: boolean
    autoplayIntervalMs?: number
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

  const autoplayEnabled = s.layout?.autoplay !== false // default ON
  const autoplayIntervalMs = s.layout?.autoplayIntervalMs ?? 3500

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const visibleItems = useMemo(
    () => (s.items || []).filter((item) => item.enabled !== false && item.url),
    [s.items]
  )

  if (visibleItems.length === 0) return null

  // plugin (não chamamos play/stop em useEffect para evitar crash no refresh)
  const autoplay = useRef(
    Autoplay({ delay: autoplayIntervalMs, stopOnInteraction: true, stopOnMouseEnter: true })
  )

  // só ativa plugin se autoplay ON e houver +1 imagem
  const plugins =
    autoplayEnabled && visibleItems.length > 1
      ? [autoplay.current]
      : []

  const [emblaRef] = useEmblaCarousel(
    {
      loop: visibleItems.length > 1,
      align: 'center',
      dragFree: false,
      containScroll: 'trimSnaps',
    },
    plugins
  )

  const viewportStyle: React.CSSProperties = {
    ...containerStyle,
    overflow: 'hidden',

    padding: containerMode === 'full' ? 0 : containerStyle.padding,
    borderRadius: containerMode === 'full' ? 0 : containerStyle.borderRadius,
    boxShadow: containerMode === 'full' ? 'none' : containerStyle.boxShadow,
    borderStyle: containerMode === 'full' ? 'none' : containerStyle.borderStyle,
    borderWidth: containerMode === 'full' ? 0 : containerStyle.borderWidth,
    borderColor: containerMode === 'full' ? 'transparent' : containerStyle.borderColor,
  }

  return (
    <>
      <div style={viewportStyle} ref={emblaRef}>
        <div
          style={{
            display: 'flex',
            gap: gapPx,
            paddingBottom: 2,
            touchAction: 'pan-y',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {visibleItems.map((item, i) => (
            <div
              key={item.uid}
              style={{
                flex: '0 0 auto',
                width: itemWidthPx,
              }}
            >
              <div
                style={{
                  cursor: 'pointer',
                  borderRadius: 12,
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  width: itemWidthPx,
                  height: itemHeightPx,
                }}
                onClick={() => {
                  // pausa autoplay antes de abrir popup (evita crashes e melhora UX)
                  autoplay.current?.stop?.()
                  setLightboxIndex(i)
                }}
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
            </div>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          items={visibleItems}
          currentIndex={lightboxIndex}
          onClose={() => {
            setLightboxIndex(null)
            // retoma autoplay quando fecha (se aplicável)
            if (autoplayEnabled && visibleItems.length > 1) autoplay.current?.play?.()
          }}
          onNavigate={(newIndex) => setLightboxIndex(newIndex)}
        />
      )}
    </>
  )
}

/* ===== Lightbox ===== */

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

  const [zoom, setZoom] = useState<1 | 2>(1)

  useEffect(() => setZoom(1), [currentIndex])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  const startXRef = useRef<number | null>(null)

  return (
    <div
      onClick={onClose}
      onTouchStart={(e) => (startXRef.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        const startX = startXRef.current
        const endX = e.changedTouches[0]?.clientX ?? null
        if (startX == null || endX == null) return
        const dx = endX - startX
        if (Math.abs(dx) < 40) return
        if (dx > 0) prev()
        else next()
      }}
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
        <div style={{ maxWidth: '92vw', maxHeight: '82vh', overflow: 'auto', borderRadius: 12 }}>
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

        <button onClick={prev} style={navBtnLeft} aria-label="Imagem anterior">
          ‹
        </button>
        <button onClick={next} style={navBtnRight} aria-label="Próxima imagem">
          ›
        </button>
        <button onClick={onClose} style={closeBtn} aria-label="Fechar">
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

const navBtnRight: React.CSSProperties = { ...navBtnLeft, left: 'auto', right: 8 }

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
