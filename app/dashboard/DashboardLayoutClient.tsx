'use client'

import { useSearchParams } from 'next/navigation'

type Props = {
  pathname: string
  titleByPrefix: Array<{ prefix: string; title: string }>
}

export function useDashboardTitle(pathname: string, titleByPrefix: Array<{ prefix: string; title: string }>) {
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template_id')

  if (pathname.match(/^\/dashboard\/cards\/[^/]+\/theme/)) {
    return templateId ? '✏️ ' + 'Editar template' : '✏️ ' + 'Editor'
  }

  const match = titleByPrefix.find(
    (x) => pathname === x.prefix || pathname.startsWith(x.prefix + '/')
  )
  return match?.title || 'Kardme'
}
