import Link from 'next/link'

export default function BookingsPage() {
  return (
    <div className="dashboard-wrap">
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Reuniões</h1>
            <p className="dashboard-subtitle">Agendar e gerir reuniões com clientes.</p>
          </div>
          <Link className="btn-secondary" href="/dashboard">
            ← Voltar
          </Link>
        </div>

        <div
          style={{
            marginTop: 48,
            textAlign: 'center',
            padding: 64,
          }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: 16,
            }}
          >
            📅
          </div>
          <p
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: 'rgba(255,255,255,0.85)',
              marginBottom: 8,
            }}
          >
            Em breve
          </p>
          <p
            style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            Estamos a trabalhar nesta funcionalidade. Volta em breve!
          </p>
        </div>
      </div>
    </div>
  )
}
