'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/trackEvent'

type Props = {
  cardId: string
  children: React.ReactNode
}

export default function TrackingWrapper({ cardId, children }: Props) {
  useEffect(() => {
    // Track view (1x por sessão)
    trackEvent(cardId, 'view')
  }, [cardId])

  return <>{children}</>
}
