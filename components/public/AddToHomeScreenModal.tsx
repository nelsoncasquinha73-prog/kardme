'use client'

import { FiX } from 'react-icons/fi'
import { FiUpload } from 'react-icons/fi'
import { useLanguage } from '@/components/language/LanguageProvider'

type Props = {
  onClose: () => void
}

export default function AddToHomeScreenModal({ onClose }: Props) {
  const { t } = useLanguage()

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
            {t('fab.addToHomeScreen.title')}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ marginBottom: '24px', lineHeight: 1.6, color: '#333' }}>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>
            {t('fab.addToHomeScreen.description')}
          </p>

          <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
            <li style={{ marginBottom: '12px' }}>
              {t('fab.addToHomeScreen.step1')}
            </li>
            <li style={{ marginBottom: '12px' }}>
              {t('fab.addToHomeScreen.step2')}
            </li>
            <li style={{ marginBottom: '12px' }}>
              {t('fab.addToHomeScreen.step3')}
            </li>
          </ol>

          <div
            style={{
              marginTop: '20px',
              padding: '12px',
              backgroundColor: '#f0f0f0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: '2px solid #8B5CF6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: '#fff',
              }}
            >
              <FiUpload size={18} style={{ color: '#8B5CF6' }} />
            </div>
            <span style={{ fontSize: '13px', color: '#666' }}>
              {t('fab.addToHomeScreen.hint')}
            </span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#8B5CF6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#7c3aed')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#8B5CF6')}
        >
          {t('fab.addToHomeScreen.understood')}
        </button>
      </div>
    </div>
  )
}
