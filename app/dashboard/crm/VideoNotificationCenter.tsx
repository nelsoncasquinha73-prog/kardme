'use client'

import { useEffect, useRef, useState } from 'react'
import { subscribeToVideoViews } from '@/lib/crm/videoNotifications'
import { supabase } from '@/lib/supabaseClient'
import { RealtimeChannel } from '@supabase/supabase-js'

interface VideoNotification {
  id: string
  previewId: string
  timestamp: string
  viewCount: number
}

interface VideoNotificationCenterProps {
  userId: string
}

export default function VideoNotificationCenter({ userId }: VideoNotificationCenterProps) {
  const [notifications, setNotifications] = useState<VideoNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null)

  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userId) return

    let mounted = true

    const initSubscription = async () => {
      const sub = await subscribeToVideoViews(userId, (data) => {
        if (!mounted) return

        const notification: VideoNotification = {
          id: `${data.previewId}-${Date.now()}`,
          previewId: data.previewId,
          timestamp: data.timestamp,
          viewCount: data.viewCount,
        }

        setNotifications((prev) => [notification, ...prev.slice(0, 9)])

        if (!isOpen) {
          setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
          }, 5000)
        }
      })

      if (!mounted) return
      setSubscription(sub)
    }

    initSubscription()

    return () => {
      mounted = false
      if (subscription) supabase.removeChannel(subscription)
    }
  }, [userId, isOpen])

  useEffect(() => {
    if (!isOpen) return

    const onMouseDown = (e: MouseEvent) => {
      const el = rootRef.current
      if (!el) return
      if (!el.contains(e.target as Node)) setIsOpen(false)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  const count = notifications.length
  const badgeText = count > 9 ? '9+' : String(count)

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        title="Notificação de video view"
        aria-label="Notificação de video view"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        style={{
          position: 'relative',
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.14)',
          color: 'rgba(255,255,255,0.92)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 16, lineHeight: '16px' }}>⭐</span>

        {count > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              background: '#ef4444',
              color: '#fff',
              borderRadius: 999,
              padding: '2px 7px',
              fontSize: 11,
              fontWeight: 900,
              lineHeight: '14px',
              border: '2px solid #0b1220',
            }}
          >
            {badgeText}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Notificações de vídeos"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 340,
            background: '#0b1220',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 12,
            boxShadow: '0 18px 60px rgba(0,0,0,0.55)',
            zIndex: 1000,
            maxHeight: 420,
            overflow: 'auto',
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 900, fontSize: 12 }}>
              Notificações de vídeos
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.85)',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 12,
                cursor: 'pointer',
              }}
              title="Fechar"
            >
              Fechar
            </button>
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: 18, textAlign: 'center', color: 'rgba(255,255,255,0.65)' }}>
              <p style={{ margin: 0, fontSize: 12 }}>Nenhuma visualização ainda</p>
            </div>
          ) : (
            <div>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 900, color: '#34d399' }}>
                      👁️ Vídeo visualizado
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
                      {notif.timestamp}
                    </p>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#60a5fa' }}>{notif.viewCount}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
