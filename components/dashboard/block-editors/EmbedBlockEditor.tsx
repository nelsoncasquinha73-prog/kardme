'use client'

import React, { useState } from 'react'

type Props = {
  settings: {
    embedCode?: string
    embedUrl?: string
    width?: string
    height?: string
  }
  style?: any
  onChangeSettings: (s: any) => void
  onChangeStyle: (s: any) => void
}

export default function EmbedBlockEditor({ settings, style, onChangeSettings, onChangeStyle }: Props) {
  const [embedCode, setEmbedCode] = useState(settings.embedCode || '')
  const [embedUrl, setEmbedUrl] = useState(settings.embedUrl || '')
  const [width, setWidth] = useState(settings.width || '100%')
  const [height, setHeight] = useState(settings.height || '300px')

  function updateSettings() {
    onChangeSettings({ embedCode, embedUrl, width, height })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label>
        Código Embed (HTML)
        <textarea
          value={embedCode}
          onChange={(e) => setEmbedCode(e.target.value)}
          onBlur={updateSettings}
          rows={6}
          style={{ width: '100%', fontFamily: 'monospace', fontSize: 12, borderRadius: 6, padding: 8 }}
          placeholder="Cole o código HTML aqui"
        />
      </label>

      <label>
        URL Embed (iframe)
        <input
          type="text"
          value={embedUrl}
          onChange={(e) => setEmbedUrl(e.target.value)}
          onBlur={updateSettings}
          style={{ width: '100%', padding: 8, borderRadius: 6 }}
          placeholder="https://"
        />
      </label>

      <label>
        Largura
        <input
          type="text"
          value={width}
          onChange={(e) => setWidth(e.target.value)}
          onBlur={updateSettings}
          style={{ width: '100%', padding: 8, borderRadius: 6 }}
          placeholder="Ex: 100%, 600px"
        />
      </label>

      <label>
        Altura
        <input
          type="text"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          onBlur={updateSettings}
          style={{ width: '100%', padding: 8, borderRadius: 6 }}
          placeholder="Ex: 300px, 100vh"
        />
      </label>
    </div>
  )
}
