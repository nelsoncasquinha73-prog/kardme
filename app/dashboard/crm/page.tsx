'use client'

import Link from 'next/link'

export default function CrmProPage() {
  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>CRM Pro</h1>
      <p style={{ opacity: 0.8, marginBottom: 16 }}>
        O CRM Pro vai transformar as tuas leads em clientes com pipeline, tarefas, mensagens por nicho e email broadcast (sem spam).
      </p>

      <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
        <div style={{ padding: 14, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, background: '#fff' }}>
          <div style={{ fontWeight: 800 }}>Pipeline por nicho</div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>Imobiliário, Network Marketing e Geral.</div>
        </div>
        <div style={{ padding: 14, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, background: '#fff' }}>
          <div style={{ fontWeight: 800 }}>Tarefas e lembretes</div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>Follow-up guiado para não perderes leads.</div>
        </div>
        <div style={{ padding: 14, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, background: '#fff' }}>
          <div style={{ fontWeight: 800 }}>Biblioteca de mensagens</div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>WhatsApp e email 1:1 com templates prontos.</div>
        </div>
        <div style={{ padding: 14, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, background: '#fff' }}>
          <div style={{ fontWeight: 800 }}>Email Broadcast (opt-in)</div>
          <div style={{ fontSize: 13, opacity: 0.75 }}>Envios segmentados apenas para quem aceitou receber novidades.</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link href="/dashboard/plans" style={{ padding: '10px 14px', borderRadius: 12, background: 'var(--color-primary)', color: '#fff', fontWeight: 800, textDecoration: 'none' }}>
          Ativar CRM Pro
        </Link>
        <Link href="/dashboard/leads" style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', fontWeight: 800, textDecoration: 'none', color: '#111827' }}>
          Voltar ao CRM Mini
        </Link>
      </div>
    </div>
  )
}
