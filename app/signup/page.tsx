'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Depois do signup → onboarding planos
    router.push('/onboarding/plans')
  }

  return (
    <main className="page-wrapper">
      <div className="signup-area">
        <div className="wrapper">
          <div className="row">

            {/* LEFT */}
            <div className="col-lg-6 bg-color-blackest left-wrapper">
              <div className="sign-up-box">

                <div className="signup-box-top">
                  <img
                    src="/assets/images/logo/logo-dark.png"
                    alt="Kardme"
                    style={{ maxWidth: 160 }}
                  />
                </div>

                <div className="signup-box-bottom">
                  <div className="signup-box-content">

                    <h3 style={{ marginBottom: 24 }}>Criar conta no Kardme</h3>

                    <form onSubmit={handleSignup}>

                      <div className="input-section mail-section">
                        <input
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="input-section password-section">
                        <input
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>

                      {error && (
                        <p style={{ color: 'red', marginTop: 10 }}>
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="btn-default"
                        disabled={loading}
                      >
                        {loading ? 'A criar conta…' : 'Criar conta grátis'}
                      </button>

                    </form>
                  </div>

                  <div className="signup-box-footer">
                    <div className="bottom-text">
                      Já tens conta?
                      <a href="/login" className="btn-read-more ml--5">
                        <span>Entrar</span>
                      </a>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="col-lg-6 right-wrapper">
              <div className="client-feedback-area">
                <h2 style={{ maxWidth: 400 }}>
                  O teu cartão digital começa aqui
                </h2>
                <p style={{ opacity: 0.8, marginTop: 12 }}>
                  Cria, partilha e gere o teu cartão profissional em segundos.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
