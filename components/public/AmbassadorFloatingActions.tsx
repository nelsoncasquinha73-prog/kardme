'use client'

import { useState } from 'react'
import { FiShare2, FiX } from 'react-icons/fi'
import { BsQrCode } from 'react-icons/bs'
import { HiOutlineUserAdd } from 'react-icons/hi'
import QRCodeModal from './QRCodeModal'

type Props = {
  ambassadorUrl: string
  ambassadorName: string
  ambassadorId: string
  buttonColor?: string
}

export default function AmbassadorFloatingActions({
  ambassadorUrl,
  ambassadorName,
  ambassadorId,
  buttonColor = '#8B5CF6',
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const handleShare = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: ambassadorName,
          url: ambassadorUrl,
        })
        return
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(ambassadorUrl)
        alert('Link copiado com sucesso!')
        return
      }

      prompt('Copia este link:', ambassadorUrl)
    } catch (error) {
      console.error('Erro ao partilhar:', error)
    }
  }

  const handleSaveContact = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${ambassadorName}
URL:${ambassadorUrl}
END:VCARD`

    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${ambassadorName.replace(/\s+/g, '-')}.vcf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
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
    background: buttonColor,
    color: '#fff',
  }

  const secondaryButton: React.CSSProperties = {
    ...buttonBase,
    width: 48,
    height: 48,
    background: '#fff',
    color: buttonColor,
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
          zIndex: 1000,
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
                handleShare()
                setExpanded(false)
              }}
              style={secondaryButton}
              aria-label="Partilhar"
              title="Partilhar"
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
              title="QR Code"
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
              title="Guardar contacto"
            >
              <HiOutlineUserAdd size={24} />
            </button>
          </>
        )}
      </div>

      {showQR && (
        <QRCodeModal
          url={ambassadorUrl}
          title={ambassadorName}
          onClose={() => setShowQR(false)}
        />
      )}
    </>
  )
}
