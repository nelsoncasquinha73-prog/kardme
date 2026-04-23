'use client'

import { useParams } from 'next/navigation'

export default function CardOrderSuccessPage() {
  const params = useParams()
  const slug = params?.slug as string

  const WHATSAPP_NUMBER = '351932462526'
  const msg = encodeURIComponent(
    `Olá! Submeti agora o meu pedido de cartão (${slug}) e gostaria de esclarecer uma dúvida rápida.`
  )
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '48px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 16,
          padding: 28,
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>

        <h1 style={{ fontSize: 26, margin: '0 0 10px 0', color: 'white' }}>
          Pedido submetido
        </h1>

        <p style={{ fontSize: 15, lineHeight: 1.6, color: '#cbd5e1', margin: 0 }}>
          Obrigado! Recebemos o teu pedido e vamos avançar com a produção.
          Se for preciso confirmar algum detalhe, vamos contactar-te em breve.
        </p>

        <div style={{ marginTop: 18, padding: 14, borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: 13 }}>
            Dica: se te esqueceste de alguma coisa, envia-nos a informação por WhatsApp ou email e nós ajustamos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-block',
              padding: '12px 14px',
              borderRadius: 10,
              background: '#22c55e',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            💬 Falar no WhatsApp
          </a>

          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 14px',
              borderRadius: 10,
              background: '#3b82f6',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Voltar ao início
          </a>

          <button
            onClick={() => window.close()}
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'white',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
