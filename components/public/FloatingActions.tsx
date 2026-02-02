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

type SocialLink = {
  type: string
  url: string
  label?: string
}

type Props = {
  cardUrl: string
  cardTitle?: string
  vCardData?: {
    name?: string
    profession?: string
    company?: string
    avatar?: string
    phones?: string[]
    emails?: string[]
    website?: string
    address?: string
    socialLinks?: SocialLink[]
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

    const lines: string[] = [
      'BEGIN:VCARD',
      'VERSION:3.0',
    ]

    // Nome
    if (vCardData.name) {
      lines.push(`FN:${vCardData.name}`)
      const nameParts = vCardData.name.split(' ')
      if (nameParts.length > 1) {
        const lastName = nameParts.pop()
        const firstName = nameParts.join(' ')
        lines.push(`N:${lastName};${firstName};;;`)
      } else {
        lines.push(`N:${vCardData.name};;;;`)
      }
    }

    // Profissão
    if (vCardData.profession) {
      lines.push(`TITLE:${vCardData.profession}`)
    }

    // Empresa
    if (vCardData.company) {
      lines.push(`ORG:${vCardData.company}`)
    }

    // Avatar/Foto
    if (vCardData.avatar) {
      lines.push(`PHOTO;VALUE=URI:${vCardData.avatar}`)
    }

    // Telefones
    if (vCardData.phones && vCardData.phones.length > 0) {
      vCardData.phones.forEach((phone, index) => {
        if (phone) {
          const type = index === 0 ? 'CELL' : 'WORK'
          lines.push(`TEL;TYPE=${type}:${phone}`)
        }
      })
    }

    // Emails
    if (vCardData.emails && vCardData.emails.length > 0) {
      vCardData.emails.forEach((email, index) => {
        if (email) {
          const type = index === 0 ? 'INTERNET' : 'WORK'
          lines.push(`EMAIL;TYPE=${type}:${email}`)
        }
      })
    }

    // Website
    if (vCardData.website) {
      lines.push(`URL;TYPE=WORK:${vCardData.website}`)
    }

    // URL do cartão digital
    if (cardUrl) {
      lines.push(`URL;TYPE=HOME:${cardUrl}`)
    }

    // Endereço
    if (vCardData.address) {
      lines.push(`ADR;TYPE=WORK:;;${vCardData.address};;;;`)
    }

    // Redes sociais como URLs extras e X-SOCIALPROFILE
    if (vCardData.socialLinks && vCardData.socialLinks.length > 0) {
      vCardData.socialLinks.forEach((link) => {
        if (link.url) {
          const socialType = link.type?.toUpperCase() || 'OTHER'
          lines.push(`X-SOCIALPROFILE;TYPE=${socialType}:${link.url}`)
        }
      })
    }

    // Nota com link do cartão
    lines.push(`NOTE:Cartão digital: ${cardUrl}`)

    lines.push('END:VCARD')

    const vCard = lines.join('\r\n')
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
