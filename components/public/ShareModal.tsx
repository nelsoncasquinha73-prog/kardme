'use client'

import { useState } from 'react'
import { FiX, FiCopy, FiCheck, FiChevronRight } from 'react-icons/fi'
import { FaLinkedin, FaWhatsapp } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { FaFacebookMessenger } from 'react-icons/fa'
import { SiTelegram } from 'react-icons/si'
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
      name: 'Partilhar no WhatsApp',
      icon: <FaWhatsapp size={24} color="#25D366" />,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      name: 'Partilhar no Messenger',
      icon: <FaFacebookMessenger size={24} color="#0084FF" />,
      href: `https://www.facebook.com/dialog/share?app_id=YOUR_APP_ID&display=popup&href=${encodedUrl}&redirect_uri=${encodedUrl}`,
    },
    {
      name: 'Partilhar no Telegram',
      icon: <SiTelegram size={24} color="#0088cc" />,
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: 'Partilhar por SMS',
      icon: <HiOutlineMail size={24} color="#34C759" />,
      href: `sms:?body=${encodedTitle}%20${encodedUrl}`,
    },
    {
      name: 'Partilhar por Email',
      icon: <HiOutlineMail size={24} color="#333" />,
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
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
