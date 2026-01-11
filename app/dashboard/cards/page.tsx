'use client'

import Link from 'next/link'

export default function CardsPage() {
  return (
    <div>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>
        💳 Cartões Digitais
      </h1>

      <p style={{ marginBottom: 24, color: '#555' }}>
        Gere os teus cartões digitais, links e NFC num só lugar.
      </p>

      {/* Empty state */}
      <div
        style={{
          background: '#fff',
          padding: 32,
          borderRadius: 12,
          textAlign: 'center',
          maxWidth: 600,
        }}
      >
        <h3 style={{ marginBottom: 12 }}>
          Ainda não tens cartões
        </h3>

        <p style={{ marginBottom: 24 }}>
          Cria o teu primeiro cartão digital em menos de 1 minuto.
        </p>

        <Link
          href="/dashboard/cards/new"
          style={{
            display: 'inline-block',
            padding: '12px 20px',
            background: '#000',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
          }}
        >
          + Criar cartão
        </Link>
      </div>
    </div>
  )
}
