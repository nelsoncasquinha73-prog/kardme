'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { FiShare2, FiX, FiDownload, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { BsQrCode } from 'react-icons/bs'
import ShareModal from './ShareModal'
import QRCodeModal from './QRCodeModal'

type Settings = {
  enabled?: boolean
  showShare?: boolean
  showQR?: boolean
  showSaveContact?: boolean
  buttonColor?: string
  buttonSize?: number
  buttonPosition?: 'left' | 'right'
  buttonBottom?: number
  buttonSide?: number
}

type Props = {
  cardUrl: string
  cardTitle?: string
  cardId: string
  settings?: Settings
}

export default function FloatingActions({ cardUrl, cardTitle, cardId, settings }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [autoCompact, setAutoCompact] = useState(false)
  const [compactOpen, setCompactOpen] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const actionsRef = useRef<HTMLDivElement>(null)

  // Recolher durante o scroll e regressar 400 ms depois de parar.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let lastY = window.scrollY

    const onScroll = () => {
      const currentY = window.scrollY
      if (Math.abs(currentY - lastY) < 2) return
      lastY = currentY

      setIsScrolling(true)
      setExpanded(false)
      setCompactOpen(false)
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => setIsScrolling(false), 400)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (timer) clearTimeout(timer)
    }
  }, [])

  // Default: tudo ativo
  const s = {
    enabled: settings?.enabled ?? true,
    showShare: settings?.showShare ?? true,
    showQR: settings?.showQR ?? true,
    showSaveContact: settings?.showSaveContact ?? true,
    buttonColor: settings?.buttonColor ?? '#8B5CF6',
    buttonSize: Math.max(36, Math.min(56, settings?.buttonSize ?? 56)),
    buttonPosition: settings?.buttonPosition ?? 'right',
    buttonBottom: Math.max(0, Math.min(150, settings?.buttonBottom ?? 24)),
    buttonSide: Math.max(0, Math.min(100, settings?.buttonSide ?? 16)),
  }

  // Detetar sobreposição com elementos interativos do cartão público.
  useEffect(() => {
    if (!s.enabled || typeof window === 'undefined') return

    let frame = 0

    const check = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const root = document.querySelector('.cardMain')
        if (!root || window.innerWidth > 767) {
          setAutoCompact(false)
          return
        }

        const size = s.buttonSize
        const gap = 12
        const bottom = window.innerHeight - s.buttonBottom
        const left = s.buttonPosition === 'left'
          ? s.buttonSide
          : window.innerWidth - s.buttonSide - size

        // Área original dos dois botões, independentemente do modo compacto.
        const zone = {
          left,
          right: left + size,
          top: bottom - (size * 2 + gap),
          bottom,
        }

        const targets = root.querySelectorAll<HTMLElement>(
          'button, input, textarea, select, a[href], [role="button"]'
        )

        const overlapping = Array.from(targets).some((el) => {
          const rect = el.getBoundingClientRect()
          if (rect.width === 0 || rect.height === 0) return false
          return rect.left < zone.right &&
            rect.right > zone.left &&
            rect.top < zone.bottom &&
            rect.bottom > zone.top
        })

        setAutoCompact(overlapping)
      })
    }

    check()
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [
    s.enabled,
    s.buttonSize,
    s.buttonPosition,
    s.buttonSide,
    s.buttonBottom,
  ])

  const compact = (autoCompact || isScrolling) && !compactOpen

  // Se desativado, não renderiza nada
  if (!s.enabled) return null

  // Se todos os botões estão desativados, não renderiza
  if (!s.showShare && !s.showQR && !s.showSaveContact) return null

  const handleSaveContact = () => {
    // Registar evento de guardar contacto (fire-and-forget)
    console.log('📥 Saving contact for card:', cardId)
    supabase.from('card_events').insert({
      card_id: cardId,
      event_type: 'save_contact',
      created_at: new Date().toISOString(),
    })
    
    window.location.href = `/api/vcard/${cardId}`
  }

  const buttonBase: React.CSSProperties = {
    width: s.buttonSize,
    height: s.buttonSize,
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
    transition: 'all 0.2s ease',
  }

  const mainButton: React.CSSProperties = {
    ...buttonBase,
    background: s.buttonColor,
    color: '#fff',
  }

  const secondaryButton: React.CSSProperties = {
    ...buttonBase,
    width: Math.max(32, s.buttonSize - 8),
    height: Math.max(32, s.buttonSize - 8),
    background: '#fff',
    color: s.buttonColor,
  }

  return (
    <>
      {/* FAB Container */}
      <div
        style={{
          position: 'fixed',
          ...(s.buttonPosition === 'left' ? { left: s.buttonSide } : { right: s.buttonSide }),
          bottom: `calc(${s.buttonBottom}px + env(safe-area-inset-bottom))`,
          display: 'flex',
          flexDirection: 'column-reverse',
          alignItems: 'center',
          gap: 12,
          zIndex: 1000,
          transition: 'transform 250ms ease, opacity 250ms ease',
          willChange: 'transform',
        }}
      >
        {/* Guardar contacto: recolhe juntamente com o botão principal */}
        {s.showSaveContact && !compactOpen && (
          <button
            type="button"
            onClick={handleSaveContact}
            tabIndex={compact ? -1 : 0}
            aria-hidden={compact}
            style={{
              ...mainButton,
              opacity: compact ? 0 : 1,
              position: compact ? 'absolute' : 'relative',
              bottom: compact ? s.buttonSize + 12 : undefined,
              transform: compact
                ? `translateX(${s.buttonPosition === 'right' ? '' : '-'}${s.buttonSide + s.buttonSize}px)`
                : 'translateX(0)',
              pointerEvents: compact ? 'none' : 'auto',
              transition: 'transform 250ms ease, opacity 250ms ease',
            }}
            aria-label="Guardar contacto"
            title="Guardar contacto"
          >
            <FiDownload size={Math.round(s.buttonSize * 0.45)} />
          </button>
        )}

        {/* Botão principal: desliza para a margem e mantém uma aba acessível */}
        <button
          type="button"
          onClick={() => {
            if (compact) {
              setCompactOpen(true)
              setExpanded(false)
            } else if (compactOpen) {
              setCompactOpen(false)
              setExpanded(false)
            } else {
              setExpanded(!expanded)
            }
          }}
          style={{
            ...mainButton,
            width: compact ? 24 : s.buttonSize,
            height: compact ? 44 : s.buttonSize,
            borderRadius: compact
              ? (s.buttonPosition === 'right' ? '10px 0 0 10px' : '0 10px 10px 0')
              : '50%',
            transform: compact
              ? `translateX(${s.buttonPosition === 'right' ? '' : '-'}${s.buttonSide}px)`
              : 'translateX(0)',
            transition: 'transform 250ms ease, width 250ms ease, height 250ms ease, border-radius 250ms ease',
          }}
          aria-label={compact ? 'Mostrar ações do cartão' : expanded || compactOpen ? 'Fechar menu' : 'Abrir menu'}
          title={compact ? 'Mostrar ações' : undefined}
        >
          {compact
            ? (s.buttonPosition === 'right'
                ? <FiChevronLeft size={22} />
                : <FiChevronRight size={22} />)
            : expanded || compactOpen
              ? <FiX size={Math.round(s.buttonSize * 0.43)} />
              : <FiShare2 size={Math.round(s.buttonSize * 0.43)} />}
        </button>

        {/* Ação de guardar no menu compacto */}
        {!compact && compactOpen && s.showSaveContact && (
          <button
            type="button"
            onClick={handleSaveContact}
            style={secondaryButton}
            aria-label="Guardar contacto"
          >
            <FiDownload size={Math.round(s.buttonSize * 0.39)} />
          </button>
        )}

        {/* Secondary buttons */}
        {!compact && (expanded || compactOpen) && (
          <>
            
            {s.showShare && (
              <button
                onClick={() => {
                  setShowShare(true)
                  setExpanded(false)
                  setCompactOpen(false)
                }}
                style={secondaryButton}
                aria-label="Partilhar"
              >
                <FiShare2 size={Math.round(s.buttonSize * 0.39)} />
              </button>
            )}

            {/* QR Code */}
            {s.showQR && (
              <button
                onClick={() => {
                  setShowQR(true)
                  setExpanded(false)
                  setCompactOpen(false)
                }}
                style={secondaryButton}
                aria-label="QR Code"
              >
                <BsQrCode size={Math.round(s.buttonSize * 0.39)} />
              </button>
            )}

          </>
        )}
      </div>

      {/* Modals */}
      {showShare && (
        <ShareModal
          url={cardUrl}
          title={cardTitle}
          onClose={() => setShowShare(false)}
        />
      )}

      {showQR && (
        <QRCodeModal
          url={cardUrl}
          title={cardTitle}
          onClose={() => setShowQR(false)}
        />
      )}


    </>
  )
}
