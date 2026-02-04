'use client'

import React, { useState, useMemo } from 'react'

type VideoSettings = {
  url: string
  title?: string
  thumbnailUrl?: string
}

type VideoStyle = {
  offsetY?: number
  aspectRatio?: '16:9' | '9:16' | '4:3' | '1:1'
  borderRadius?: number
  shadow?: boolean
  
  container?: {
    enabled?: boolean
    bgColor?: string
    radius?: number
    padding?: number
    shadow?: boolean
    borderWidth?: number
    borderColor?: string
    widthMode?: 'full' | 'custom'
    customWidthPx?: number
  }

  titleColor?: string
  titleFontSize?: number
  titleAlign?: 'left' | 'center' | 'right'
  showTitle?: boolean
}

type Props = {
  settings: VideoSettings
  style?: VideoStyle
}

type VideoInfo = {
  type: 'youtube' | 'vimeo' | 'direct' | 'unknown'
  videoId?: string
  embedUrl?: string
  thumbnailUrl?: string
}

function parseVideoUrl(url: string): VideoInfo {
  if (!url) return { type: 'unknown' }

  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) {
    const videoId = ytMatch[1]
    return {
      type: 'youtube',
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    }
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    const videoId = vimeoMatch[1]
    return {
      type: 'vimeo',
      videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1`,
      thumbnailUrl: undefined, // Vimeo needs API call for thumbnail
    }
  }

  // Direct video (MP4, WebM, etc.)
  if (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
    return {
      type: 'direct',
      embedUrl: url,
    }
  }

  return { type: 'unknown' }
}

function getAspectRatioPadding(ratio: string): string {
  switch (ratio) {
    case '16:9': return '56.25%'
    case '9:16': return '177.78%'
    case '4:3': return '75%'
    case '1:1': return '100%'
    default: return '56.25%'
  }
}

export default function VideoBlock({ settings, style }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const videoInfo = useMemo(() => parseVideoUrl(settings?.url || ''), [settings?.url])
  
  if (!settings?.url || videoInfo.type === 'unknown') {
    return null
  }

  const st = style || {}
  const containerEnabled = st.container?.enabled !== false
  
  const thumbnailUrl = settings.thumbnailUrl || videoInfo.thumbnailUrl
  const aspectRatio = st.aspectRatio || '16:9'
  const borderRadius = st.borderRadius ?? 12
  const showShadow = st.shadow !== false

  const containerStyle: React.CSSProperties = containerEnabled ? {
    backgroundColor: st.container?.bgColor ?? 'transparent',
    borderRadius: st.container?.radius != null ? `${st.container.radius}px` : undefined,
    padding: st.container?.padding != null ? `${st.container.padding}px` : undefined,
    boxShadow: st.container?.shadow ? '0 10px 30px rgba(0,0,0,0.14)' : undefined,
    borderStyle: st.container?.borderWidth ? 'solid' : undefined,
    borderWidth: st.container?.borderWidth ? `${st.container.borderWidth}px` : undefined,
    borderColor: st.container?.borderColor ?? undefined,
    width: st.container?.widthMode === 'custom' && st.container?.customWidthPx 
      ? `${st.container.customWidthPx}px` 
      : '100%',
    margin: st.container?.widthMode === 'custom' ? '0 auto' : undefined,
  } : {}

  const wrapperStyle: React.CSSProperties = {
    marginTop: st.offsetY != null ? `${st.offsetY}px` : undefined,
  }

  return (
    <>
      <div style={wrapperStyle}>
        {st.showTitle !== false && settings.title && (
          <div
            style={{
              color: st.titleColor ?? '#111827',
              fontSize: st.titleFontSize ?? 14,
              fontWeight: 600,
              textAlign: st.titleAlign ?? 'left',
              marginBottom: 8,
            }}
          >
            {settings.title}
          </div>
        )}
        
        <div style={containerStyle}>
          <div
            onClick={() => setIsModalOpen(true)}
            style={{
              position: 'relative',
              width: '100%',
              paddingBottom: getAspectRatioPadding(aspectRatio),
              borderRadius,
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: showShadow ? '0 4px 20px rgba(0,0,0,0.15)' : undefined,
              background: '#000',
            }}
          >
            {/* Thumbnail */}
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={settings.title || 'Video thumbnail'}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                loading="lazy"
              />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                  {videoInfo.type === 'vimeo' ? 'Vimeo Video' : 'Video'}
                </span>
              </div>
            )}
            
            {/* Play Button Overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.3)',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="#111"
                  style={{ marginLeft: 3 }}
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      {isModalOpen && (
        <VideoModal
          videoInfo={videoInfo}
          title={settings.title}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}

type VideoModalProps = {
  videoInfo: VideoInfo
  title?: string
  onClose: () => void
}

function VideoModal({ videoInfo, title, onClose }: VideoModalProps) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 900,
          maxHeight: '90vh',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: -48,
            right: 0,
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 999,
            width: 40,
            height: 40,
            cursor: 'pointer',
            fontSize: 24,
            fontWeight: 700,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
          aria-label="Fechar"
        >
          ×
        </button>

        {/* Title */}
        {title && (
          <div
            style={{
              position: 'absolute',
              top: -48,
              left: 0,
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              lineHeight: '40px',
            }}
          >
            {title}
          </div>
        )}

        {/* Video Container */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            paddingBottom: '56.25%',
            borderRadius: 12,
            overflow: 'hidden',
            background: '#000',
          }}
        >
          {videoInfo.type === 'direct' ? (
            <video
              src={videoInfo.embedUrl}
              controls
              autoPlay
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
            />
          ) : (
            <iframe
              src={videoInfo.embedUrl}
              title={title || 'Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
