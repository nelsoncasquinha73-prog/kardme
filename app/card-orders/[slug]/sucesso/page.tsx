'use client'

import { useRouter } from 'next/navigation'
import { use } from 'react'

export default function SucessoPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()
  const { slug } = use(params)

  const whatsappMessage = encodeURIComponent(
    `Olá! 👋\n\nO teu pedido de cartão foi recebido com sucesso. Vamos avançar com a produção em breve. Se for preciso confirmar algum detalhe, vamos contactar-te.\n\nReferência do pedido: ${slug}`
  )
  const whatsappLink = `https://wa.me/?text=${whatsappMessage}`

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 16,
        padding: 40,
        maxWidth: 560,
        width: '100%',
        textAlign: 'left',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 900,
            color: '#fff',
          }}>
            ✓
          </div>
          <div>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: 0 }}>
              Pedido submetido
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: '4px 0 0 0', fontSize: 13 }}>
              Referência: <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>{slug}</span>
            </p>
          </div>
        </div>

        <p style={{
          color: 'rgba(255,255,255,0.75)',
          fontSize: 14,
          lineHeight: 1.6,
          marginBottom: 18,
        }}>
          Obrigado! Recebemos o teu pedido e vamos avançar com a produção. Se for preciso confirmar algum detalhe, vamos contactar-te em breve.
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 18,
        }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, margin: 0 }}>
            Dica: se te esqueceste de alguma coisa, envia-nos a informação por WhatsApp ou email e nós ajustamos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '12px 14px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 13,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            💬 Falar no WhatsApp
          </a>

          <button
            onClick={() => router.push(`/card-orders/${slug}`)}
            style={{
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ← Voltar ao pedido
          </button>

          <button
            onClick={() => router.push('/')}
            style={{
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
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
