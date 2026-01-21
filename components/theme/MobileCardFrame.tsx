import React from 'react'
import '@/styles/card-frame.css'

type Props = {
  children: React.ReactNode
  background?: string
}

export default function MobileCardFrame({ children, background }: Props) {
  return (
    <div
      className="cardFrameRoot"
      style={
        {
          background: background ?? 'transparent',
          // safe-area vars (usadas no CSS)
          ['--safe-top' as any]: 'env(safe-area-inset-top)',
          ['--safe-right' as any]: 'env(safe-area-inset-right)',
          ['--safe-bottom' as any]: 'env(safe-area-inset-bottom)',
          ['--safe-left' as any]: 'env(safe-area-inset-left)',
        } as React.CSSProperties
      }
    >
      <div className="cardFrameShell">{children}</div>
    </div>
  )
}
