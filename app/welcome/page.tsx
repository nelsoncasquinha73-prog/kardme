import Link from 'next/link'

export default function WelcomePage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 520, width: '100%' }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>Conta criada ✅</h1>

        <p style={{ marginBottom: 16, lineHeight: 1.5 }}>
          Enviámos-te um email para confirmares a conta.  
          Depois de confirmares, já podes fazer login.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link
            href="/login"
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: '#7c5cff',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Ir para Login
          </Link>

          <Link
            href="/"
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'inherit',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Voltar à Home
          </Link>
        </div>

        <p style={{ marginTop: 16, opacity: 0.8, fontSize: 14 }}>
          Se não receberes o email, verifica o spam/promoções.
        </p>
      </div>
    </main>
  )
}
