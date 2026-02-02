'use client'

import { QRCodeSVG } from 'qrcode.react'
import { FiX, FiDownload } from 'react-icons/fi'

type Props = {
  url: string
  title?: string
  onClose: () => void
}

export default function QRCodeModal({ url, title, onClose }: Props) {
  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = img.width * 2
      canvas.height = img.height * 2
      ctx?.scale(2, 2)
      ctx?.drawImage(img, 0, 0)
      
      const pngUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = pngUrl
      link.download = `qrcode-${title || 'cartao'}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
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
          maxWidth: 340,
          padding: 24,
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: '#1a1a1a' }}>
            QR Code
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

        {/* QR Code */}
        <div
          style={{
            background: '#fff',
            padding: 20,
            borderRadius: 16,
            display: 'inline-block',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <QRCodeSVG
            id="qr-code-svg"
            value={url}
            size={200}
            level="H"
            includeMargin={false}
            style={{ display: 'block' }}
          />
        </div>

        {/* URL */}
        <p
          style={{
            fontSize: 13,
            color: '#888',
            marginTop: 16,
            marginBottom: 20,
            wordBreak: 'break-all',
          }}
        >
          {url}
        </p>

        {/* Download button */}
        <button
          onClick={handleDownload}
          style={{
            width: '100%',
            height: 48,
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <FiDownload size={18} />
          Descarregar QR Code
        </button>
      </div>
    </div>
  )
}
