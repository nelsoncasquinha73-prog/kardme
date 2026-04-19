'use client'

import React, { useState } from 'react'
import { BsQrCode } from 'react-icons/bs'
import QRCodeModal from '@/components/public/QRCodeModal'

type AmbassadorFloatingBarProps = {
  onPublish: () => void
  onSave: () => void
  publishLoading: boolean
  saveLoading: boolean
  canPublish: boolean
  isPublished: boolean
  ambassadorSlug: string
}

export default function AmbassadorFloatingBar({
  onPublish,
  onSave,
  publishLoading,
  saveLoading,
  canPublish,
  isPublished,
  ambassadorSlug,
}: AmbassadorFloatingBarProps) {
  const [showQR, setShowQR] = useState(false)

  // URL pública do embaixador
  const ambassadorUrl = typeof window !== 'undefined' 
    ? window.location.origin + '/' + ambassadorSlug
    : '/' + ambassadorSlug

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(148, 163, 184, 0.2)',
          padding: '12px 16px',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          display: 'flex',
          gap: 12,
          zIndex: 999,
        }}
      >
        <button
          onClick={onPublish}
          disabled={!canPublish || publishLoading}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 10,
            border: '1px solid rgba(168,85,247,0.35)',
            background: canPublish ? 'rgba(168,85,247,0.15)' : 'rgba(107,114,128,0.1)',
            color: canPublish ? '#d8b4fe' : '#9ca3af',
            cursor: canPublish ? 'pointer' : 'not-allowed',
            fontSize: 13,
            fontWeight: 700,
            opacity: canPublish ? 1 : 0.5,
            transition: 'all 0.2s ease',
          }}
        >
          {publishLoading ? '...' : isPublished ? 'Despublicar' : 'Publicar'}
        </button>

        <button
          onClick={() => setShowQR(true)}
          style={{
            flex: 0.8,
            padding: '12px 16px',
            borderRadius: 10,
            border: '1px solid rgba(59, 130, 246, 0.35)',
            background: 'rgba(59, 130, 246, 0.15)',
            color: '#93c5fd',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.2s ease',
          }}
        >
          <BsQrCode size={16} />
          QR
        </button>

        <button
          onClick={onSave}
          disabled={saveLoading}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 10,
            border: '1px solid rgba(16,185,129,0.35)',
            background: 'rgba(16,185,129,0.15)',
            color: '#86efac',
            cursor: saveLoading ? 'not-allowed' : 'pointer',
            fontSize: 13,
            fontWeight: 700,
            opacity: saveLoading ? 0.6 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          {saveLoading ? 'A guardar...' : 'Guardar'}
        </button>
      </div>

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
