import React from 'react'
import '@/styles/card-frame.css'

type Props = {
  children: React.ReactNode
  background?: string
}

export default function MobileCardFrame({ children, background }: Props) {
  return (
    <div className="cardFrameRoot" style={{ background: background ?? 'transparent' }}>
      <div className="cardFrameShell">{children}</div>
    </div>
  )
}
