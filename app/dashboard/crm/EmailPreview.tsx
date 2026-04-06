'use client'

import { EmailBlock } from './EmailCampaignEditor'

interface EmailPreviewProps {
  blocks: EmailBlock[]
  title: string
  subject: string
  preheader: string
}

export default function EmailPreview({ blocks, title, subject, preheader }: EmailPreviewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f3f4f6' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#111827' }}>Preview</h3>
        <p style={{ margin: '0 0 4px', fontSize: 12, color: '#6b7280' }}>📧 {subject}</p>
        {preheader && <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>{preheader}</p>}
      </div>

      {/* Email Canvas */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 500,
            background: '#fff',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          {blocks.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
              <p style={{ margin: 0, fontSize: 14 }}>Sem blocos ainda</p>
            </div>
          ) : (
            <div style={{ padding: '24px 20px' }}>
              {blocks.map((block, idx) => (
                <div key={block.id} style={{ marginBottom: idx === blocks.length - 1 ? 24 : 16 }}>
                  {renderEmailBlock(block)}
                </div>
              ))}

              {/* Footer com Unsubscribe */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 20, marginTop: 20, textAlign: 'center' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: 12, color: '#6b7280' }}>
                  Kardme © 2026. All rights reserved.
                </p>
                <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
                  <a href="#" style={{ color: '#3b82f6', textDecoration: 'none', marginRight: 12 }}>Unsubscribe</a>
                  <span style={{ color: '#d1d5db' }}>|</span>
                  <a href="#" style={{ color: '#3b82f6', textDecoration: 'none', marginLeft: 12 }}>Manage Preferences</a>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function renderEmailBlock(block: any) {
  const { type, content } = block

  switch (type) {
    case 'text':
      return (
        <div
          style={{
            fontSize: content.fontSize || 16,
            color: content.color || '#111827',
            textAlign: content.align || 'left',
            fontWeight: content.fontWeight || 400,
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {content.text}
        </div>
      )

    case 'image':
      return content.url ? (
        <img
          src={content.url}
          alt={content.alt || ''}
          style={{
            width: content.width || '100%',
            borderRadius: content.borderRadius || 0,
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: 200,
            background: '#f3f4f6',
            borderRadius: content.borderRadius || 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af',
            fontSize: 14,
          }}
        >
          [Imagem]
        </div>
      )

    case 'button':
      return (
        <div style={{ textAlign: content.align || 'center' }}>
          <a
            href={content.url || '#'}
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: content.backgroundColor || '#10b981',
              color: content.textColor || '#ffffff',
              textDecoration: 'none',
              borderRadius: content.borderRadius || 6,
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {content.text}
          </a>
        </div>
      )

    case 'divider':
      return (
        <div
          style={{
            height: content.thickness || 1,
            background: content.color || '#e5e7eb',
            margin: `${content.marginTop || 0}px 0 ${content.marginBottom || 0}px`,
          }}
        />
      )

    case 'spacer':
      return <div style={{ height: content.height || 24 }} />

    case 'video':
      return (
        <div
          style={{
            width: content.width || '100%',
            margin: '0 auto',
            textAlign: content.align || 'center',
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              width: '100%',
              maxWidth: 500,
              background: '#000',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {content.thumbnail ? (
              <img
                src={content.thumbnail}
                alt="Video thumbnail"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  paddingBottom: '56.25%',
                  background: '#1a1a1a',
                }}
              />
            )}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 60,
                height: 60,
                background: 'rgba(16, 185, 129, 0.9)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
              }}
            >
              ▶️
            </div>
          </div>
        </div>
      )

    default:
      return null
  }
}
