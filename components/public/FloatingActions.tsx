'use client'

import { useState } from 'react'
import { FiShare2, FiX, FiUpload } from 'react-icons/fi'
import { BsQrCode } from 'react-icons/bs'
import { HiOutlineUserAdd } from 'react-icons/hi'
import { IoShareSocial } from 'react-icons/io5'
import ShareModal from './ShareModal'
import QRCodeModal from './QRCodeModal'
import AddToHomeScreenModal from './AddToHomeScreenModal'

type Settings = {
  enabled?: boolean
  showShare?: boolean
  showQR?: boolean
  showSaveContact?: boolean
  buttonColor?: string
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
  const [showAddToHome, setShowAddToHome] = useState(false)

  // Default: tudo ativo
  const s = {
    enabled: settings?.enabled ?? true,
    showShare: settings?.showShare ?? true,
    showQR: settings?.showQR ?? true,
    showSaveContact: settings?.showSaveContact ?? true,
    buttonColor: settings?.buttonColor ?? '#8B5CF6',
  }

  // Se desativado, não renderiza nada
  if (!s.enabled) return null

  // Se todos os botões estão desativados, não renderiza
  if (!s.showShare && !s.showQR && !s.showSaveContact) return null

  const handleSaveContact = () => {
    window.location.href = `/api/vcard/${cardId}`
  }

  const buttonBase: React.CSSProperties = {
    width: 56,
    height: 56,
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
    width: 48,
    height: 48,
    background: '#fff',
    color: s.buttonColor,
  }

  return (
    <>
      {/* FAB Container */}
      <div
        style={{
          position: 'fixed',
          right: 16,
          bottom: 'calc(24px + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column-reverse',
          alignItems: 'center',
          gap: 12,
          zIndex: 1000,
        }}
      >
        {/* Main FAB */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={mainButton}
          aria-label={expanded ? 'Fechar menu' : 'Abrir menu'}
        >
          {expanded ? <FiX size={24} /> : <FiShare2 size={24} />}
        </button>

        {/* Secondary buttons */}
        {expanded && (
          <>
            
            {s.showShare && (
              <button
                onClick={() => {
                  setShowShare(true)
                  setExpanded(false)
                }}
                style={secondaryButton}
                aria-label="Partilhar"
              >
                <FiShare2 size={22} />
              </button>
            )}

            {/* QR Code */}
            {s.showQR && (
              <button
                onClick={() => {
                  setShowQR(true)
                  setExpanded(false)
                }}
                style={secondaryButton}
                aria-label="QR Code"
              >
                <BsQrCode size={22} />
              </button>
            )}

            {/* Add to Home Screen */}
            <button
              onClick={() => {
                setShowAddToHome(true)
                setExpanded(false)
              }}
              style={secondaryButton}
              aria-label="Adicionar ao ecrã principal"
            >
              <div style={{ width: 26, height: 26, borderRadius: 6, border: `2px solid ${s.buttonColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiUpload size={16} /></div>
            </button>

            {/* Save Contact */}
            {s.showSaveContact && (
              <button
                onClick={() => {
                  handleSaveContact()
                  setExpanded(false)
                }}
                style={secondaryButton}
                aria-label="Guardar contacto"
              >
                <HiOutlineUserAdd size={24} />
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

      {showAddToHome && (
        <AddToHomeScreenModal
          onClose={() => setShowAddToHome(false)}
        />
      )}
    </>
  )
}
