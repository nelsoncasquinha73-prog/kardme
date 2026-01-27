import UpgradeProCTA from '@/components/billing/UpgradeProCTA'

export default function PlansPage() {
  return (
    <div style={{ padding: 24, maxWidth: 980, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: 'rgba(255,255,255,0.92)' }}>Planos</h1>
      <p style={{ marginTop: 8, color: 'rgba(255,255,255,0.60)' }}>
        Escolhe o plano certo para desbloquear templates, analytics e NFC.
      </p>

      <div style={{ marginTop: 18 }}>
        <UpgradeProCTA />
      </div>

      <div
        style={{
          marginTop: 16,
          fontSize: 13,
          color: 'rgba(255,255,255,0.55)',
          lineHeight: 1.5,
        }}
      >
        NFC é uma compra única por cartão (slug) e requer Pro ativo.
      </div>
    </div>
  )
}
