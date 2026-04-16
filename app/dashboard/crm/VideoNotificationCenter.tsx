'use client'

import { useEffect, useState, useRef } from 'react'
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
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userId) return

    const initSubscription = async () => {
      const sub = await subscribeToVideoViews(userId, (data) => {
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

      setSubscription(sub)
    }

    initSubscription()

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [userId, isOpen, subscription])

  // Click outside para fechar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: isOpen ? '#f0f9ff' : 'transparent',
          border: isOpen ? '1px solid #3b82f6' : '1px solid rgba(0,0,0,0.08)',
          color: '#111827',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.2s ease',
        }}
        title="Notificações de vídeos"
      >
        📹 Video Notifications
        {notifications.length > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              background: '#ef4444',
              color: '#fff',
              borderRadius: '50%',
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            width: 320,
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: 8,
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxHeight: 400,
            overflow: 'auto',
          }}
        >
          {notifications.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(0,0,0,0.5)' }}>
              <p style={{ margin: 0, fontSize: 12 }}>Nenhuma visualização ainda</p>
            </div>
          ) : (
            <div>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#10b981' }}>
                      👁️ Vídeo visualizado
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: 'rgba(0,0,0,0.5)' }}>
                      {notif.timestamp}
                    </p>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6' }}>
                    {notif.viewCount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
