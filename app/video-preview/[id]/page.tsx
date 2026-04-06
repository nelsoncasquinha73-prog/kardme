'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getEmailVideoPreview, incrementVideoPreviewView, incrementVideoPreviewClick } from '@/lib/crm/emailVideoPreviews'
import { EmailVideoPreview } from '@/lib/crm/emailVideoPreviews'

export default function VideoPreviewPage() {
  const params = useParams()
  const id = params.id as string
  const [preview, setPreview] = useState<EmailVideoPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPreview() {
      try {
        const data = await getEmailVideoPreview(id)
        setPreview(data)
        await incrementVideoPreviewView(id)
      } catch (err) {
        console.error('Erro ao carregar preview:', err)
        setError('Vídeo não encontrado')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadPreview()
    }
  }, [id])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#fff',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p>A carregar vídeo...</p>
        </div>
      </div>
    )
  }

  if (error || !preview) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#fff',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <p>{error || 'Vídeo não encontrado'}</p>
        </div>
      </div>
    )
  }

  const handleCtaClick = () => {
    incrementVideoPreviewClick(id)
    if (preview.cta_url) {
      window.open(preview.cta_url, '_blank')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '40px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        maxWidth: 800,
        width: '100%',
        background: '#1e293b',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          position: 'relative',
          paddingBottom: '56.25%',
          height: 0,
          overflow: 'hidden',
          background: '#000',
        }}>
          <video
            src={preview.video_url}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
            controls
            poster={preview.thumbnail_url || undefined}
          />
        </div>

        <div style={{
          padding: '40px',
          color: '#fff',
        }}>
          {preview.title && (
            <h1 style={{
              margin: '0 0 16px 0',
              fontSize: 28,
              fontWeight: 700,
              color: '#fff',
            }}>
              {preview.title}
            </h1>
          )}

          {preview.description && (
            <p style={{
              margin: '0 0 24px 0',
              fontSize: 16,
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.7)',
            }}>
              {preview.description}
            </p>
          )}

          <div style={{
            display: 'flex',
            gap: 24,
            marginBottom: 24,
            paddingBottom: 24,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                Visualizações
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>
                {preview.view_count || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                Cliques
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>
                {preview.click_count || 0}
              </div>
            </div>
          </div>

          {preview.cta_url && (
            <button
              onClick={handleCtaClick}
              style={{
                width: '100%',
                padding: '14px 24px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(16,185,129,0.3)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {preview.cta_text || 'Ver mais'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
