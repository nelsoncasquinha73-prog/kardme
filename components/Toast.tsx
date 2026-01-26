'use client'

import { useEffect, useState } from 'react'

type ToastProps = {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose?: () => void
}

export default function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const bgColor = {
    success: 'rgba(34, 197, 94, 0.95)',
    error: 'rgba(239, 68, 68, 0.95)',
    info: 'rgba(59, 130, 246, 0.95)',
  }[type]

  const icon = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  }[type]

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        background: bgColor,
        color: '#fff',
        padding: '12px 20px',
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 600,
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        zIndex: 9999,
        animation: 'slideIn 0.3s ease-out',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span>{icon}</span>
      <span>{message}</span>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
