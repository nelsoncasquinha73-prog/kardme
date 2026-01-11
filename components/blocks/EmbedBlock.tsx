'use client'

import React from 'react'

type Props = {
  settings: {
    embedCode?: string
    embedUrl?: string
    width?: string
    height?: string
  }
  style?: any
}

export default function EmbedBlock({ settings, style }: Props) {
  const { embedCode, embedUrl, width = '100%', height = '300px' } = settings || {}

  // Se o embedCode existir, renderiza como HTML seguro (usar com cuidado)
  if (embedCode) {
    return (
      <div
        style={{ width, height, overflow: 'hidden', ...style }}
        dangerouslySetInnerHTML={{ __html: embedCode }}
      />
    )
  }

  // Se só houver URL, renderiza iframe
  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        width={width}
        height={height}
        frameBorder="0"
        allowFullScreen
        style={{ border: 'none', ...style }}
        title="Embed Block"
      />
    )
  }

  return null
}
