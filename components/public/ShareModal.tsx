'use client'

import { useState } from 'react'
import { FiX, FiCopy, FiCheck, FiChevronRight } from 'react-icons/fi'
import { FaFacebook, FaLinkedin, FaPinterest, FaReddit, FaWhatsapp, FaSnapchat } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { HiOutlineMail } from 'react-icons/hi'

type Props = {
  url: string
  title?: string
  onClose: () => void
}

export default function ShareModal({ url, title, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title || 'Vê o meu cartão digital')

  const shareOptions = [
    {
      name: 'Partilhar no Facebook',
      icon: <FaFacebook size={24} color="#1877F2" />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'Partilhar no Twitter',
      icon: <FaXTwitter size={24} color="#000" />,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: 'Partilhar no LinkedIn',
      icon: <FaLinkedin size={24} color="#0A66C2" />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      name: 'Partilhar por email',
      icon: <HiOutlineMail size={24} color="#333" />,
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
    },
    {
      name: 'Partilhar no Pinterest',
      icon: <FaPinterest size={24} color="#E60023" />,
      href: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}`,
    },
    {
      name: 'Partilhar no Reddit',
      icon: <FaReddit size={24} color="#FF4500" />,
      href: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    },
    {
      name: 'Partilhar no WhatsApp',
      icon: <FaWhatsapp size={24} color="#25D366" />,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      name: 'Partilhar no Snapchat',
      icon: <FaSnapchat size={24} color="#FFFC00" style={{ background: '#000', borderRadius: 4, padding: 2 }} />,
      href: `https://www.snapchat.com/share?url=${encodedUrl}`,
    },
  ]

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 2000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 24,
          width: '100%',
          maxWidth: 420,
          maxHeight: '80vh',
          overflow: 'auto',
          padding: '20px 0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 20px 16px',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: '#1a1a1a' }}>
            Share My vCard
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <FiX size={18} color="#666" />
          </button>
        </div>

        {/* Share options */}
        <div style={{ padding: '8px 0' }}>
          {shareOptions.map((option) => (
            <a
              key={option.name}
              href={option.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 20px',
                textDecoration: 'none',
                color: '#1a1a1a',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                {option.icon}
              </div>
              <span style={{ flex: 1, fontSize: 16, fontWeight: 500 }}>{option.name}</span>
              <FiChevronRight size={20} color="#ccc" />
            </a>
          ))}
        </div>

        {/* Copy URL */}
        <div style={{ padding: '16px 20px 8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#f5f5f5',
              borderRadius: 12,
              padding: '4px 4px 4px 16px',
            }}
          >
            <input
              type="text"
              value={url}
              readOnly
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                fontSize: 14,
                color: '#666',
                outline: 'none',
                minWidth: 0,
              }}
            />
            <button
              onClick={handleCopy}
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                border: 'none',
                background: copied ? '#10B981' : '#1a1a1a',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {copied ? <FiCheck size={20} /> : <FiCopy size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
