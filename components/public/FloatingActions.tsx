'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { FiShare2, FiX, FiDownload } from 'react-icons/fi'
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
  const actionsRef = useRef<HTMLDivElement>(null)

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

  const compact = autoCompact && !compactOpen

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
        }}
      >
        {/* Botão compacto automático */}
        {compact && (
          <button
            type="button"
            onClick={() => {
              setCompactOpen(true)
              setExpanded(false)
            }}
            style={{
              ...mainButton,
              width: Math.max(32, s.buttonSize - 16),
              height: Math.max(32, s.buttonSize - 16),
            }}
            aria-label="Mostrar ações do cartão"
            title="Mostrar ações"
          >
            <FiShare2 size={Math.round(s.buttonSize * 0.35)} />
          </button>
        )}

        {/* Guardar contacto - sempre visível */}
        {!compact && !compactOpen && s.showSaveContact && (
          <button
            type="button"
            onClick={handleSaveContact}
            style={mainButton}
            aria-label="Guardar contacto"
            title="Guardar contacto"
          >
            <FiDownload size={Math.round(s.buttonSize * 0.45)} />
          </button>
        )}

        {/* Main FAB */}
        {!compact && <button
          onClick={() => {
            if (compactOpen) {
              setCompactOpen(false)
              setExpanded(false)
            } else {
              setExpanded(!expanded)
            }
          }}
          style={mainButton}
          aria-label={expanded ? 'Fechar menu' : 'Abrir menu'}
        >
          {expanded || compactOpen ? <FiX size={Math.round(s.buttonSize * 0.43)} /> : <FiShare2 size={Math.round(s.buttonSize * 0.43)} />}
        </button>}

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
