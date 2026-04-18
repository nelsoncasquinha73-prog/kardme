'use client'

import { useState } from 'react'
import { FiShare2, FiX } from 'react-icons/fi'
import { BsQrCode } from 'react-icons/bs'
import { HiOutlineUserAdd } from 'react-icons/hi'
import ShareModal from '@/components/public/ShareModal'
import QRCodeModal from '@/components/public/QRCodeModal'

type AmbassadorFloatingActionsProps = {
  ambassadorUrl: string
  ambassadorSlug: string
}

export default function AmbassadorFloatingActions({
  ambassadorUrl,
  ambassadorSlug,
}: AmbassadorFloatingActionsProps) {
  const [expanded, setExpanded] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const handleSaveContact = () => {
    window.location.href = '/api/vcard/ambassador/' + ambassadorSlug
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
    background: '#8B5CF6',
    color: '#fff',
  }

  const secondaryButton: React.CSSProperties = {
    ...buttonBase,
    width: 48,
    height: 48,
    background: '#fff',
    color: '#8B5CF6',
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          right: 16,
          bottom: 'calc(24px + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column-reverse',
          alignItems: 'center',
          gap: 12,
          zIndex: 2000,
        }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          style={mainButton}
          aria-label={expanded ? 'Fechar menu' : 'Abrir menu'}
        >
          {expanded ? <FiX size={24} /> : <FiShare2 size={24} />}
        </button>

        {expanded && (
          <>
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
          </>
        )}
      </div>

      {showShare && (
        <ShareModal
          url={ambassadorUrl}
          title={ambassadorSlug}
          onClose={() => setShowShare(false)}
        />
      )}

      {showQR && (
        <QRCodeModal
          url={ambassadorUrl}
          title={ambassadorSlug}
          onClose={() => setShowQR(false)}
        />
      )}
    </>
  )
}
