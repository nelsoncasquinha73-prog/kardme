'use client'

import { useMemo, useState } from 'react'

export default function CardPublicLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)

  const publicBase = useMemo(() => {
    // Em produção, idealmente usar o domínio final
    // Se quiseres, podemos trocar por uma env var tipo NEXT_PUBLIC_PUBLIC_BASE_URL
    return 'https://kardme.com'
  }, [])

  const url = `${publicBase}/${slug}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // fallback: nada
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        padding: '10px 12px',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(0,0,0,0.18)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.85 }}>Link do cartão</div>
        <div style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {url}
        </div>
      </div>

      <button
        type="button"
        onClick={copy}
        style={{
          height: 34,
          padding: '0 12px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.16)',
          background: 'rgba(255,255,255,0.06)',
          color: 'inherit',
          fontWeight: 900,
          cursor: 'pointer',
        }}
      >
        {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}
