'use client'

import { useState } from 'react'
import { FiShare2, FiX } from 'react-icons/fi'
import { BsQrCode } from 'react-icons/bs'
import { HiOutlineUserAdd } from 'react-icons/hi'
import ShareModal from './ShareModal'
import QRCodeModal from './QRCodeModal'

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
  vCardData?: {
    name?: string
    profession?: string
    company?: string
    phone?: string
    email?: string
    website?: string
    address?: string
  }
  settings?: Settings
}

export default function FloatingActions({ cardUrl, cardTitle, vCardData, settings }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showQR, setShowQR] = useState(false)

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
    if (!vCardData) return

    const vCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      vCardData.name ? `FN:${vCardData.name}` : '',
      vCardData.name ? `N:${vCardData.name.split(' ').reverse().join(';')};;;` : '',
      vCardData.profession ? `TITLE:${vCardData.profession}` : '',
      vCardData.company ? `ORG:${vCardData.company}` : '',
      vCardData.phone ? `TEL;TYPE=CELL:${vCardData.phone}` : '',
      vCardData.email ? `EMAIL:${vCardData.email}` : '',
      vCardData.website ? `URL:${vCardData.website}` : '',
      cardUrl ? `URL;TYPE=WORK:${cardUrl}` : '',
      vCardData.address ? `ADR:;;${vCardData.address};;;;` : '',
      `NOTE:Cartão digital: ${cardUrl}`,
      'END:VCARD',
    ].filter(Boolean).join('\n')

    const blob = new Blob([vCard], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${vCardData.name || 'contacto'}.vcf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
            {/* Share */}
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

            {/* Save Contact */}
            {s.showSaveContact && vCardData && (
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
    </>
  )
}
