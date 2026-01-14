'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NewCardRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/templates')
  }, [router])

  return null
}
