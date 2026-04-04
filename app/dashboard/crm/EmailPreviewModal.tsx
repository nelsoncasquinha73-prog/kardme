'use client'

import { FiX } from 'react-icons/fi'
import EmailPreview from './EmailPreview'
import { EmailBlock } from './EmailCampaignEditor'

interface EmailPreviewModalProps {
  blocks: EmailBlock[]
  title: string
  subject: string
  preheader: string
  onClose: () => void
}

export default function EmailPreviewModal({ blocks, title, subject, preheader, onClose }: EmailPreviewModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 600,
          maxHeight: '90vh',
          background: '#f3f4f6',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#111827' }}>Preview do Email</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: 20,
            }}
          >
            <FiX />
          </button>
        </div>

        {/* Preview Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <EmailPreview blocks={blocks} title={title} subject={subject} preheader={preheader} />
        </div>
      </div>
    </div>
  )
}
