'use client'

import { useState } from 'react'
import Link from 'next/link'
import ThemeSwitcher from '@/components/auth/ThemeSwitcher'
import { supabase } from '@/lib/supabaseClient'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setOk(null)
    setLoading(true)

    try {
      const redirectTo = `${window.location.origin}/reset-password`

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })
      if (error) throw error

      setOk('Se o email existir, enviámos um link para redefinir a password.')
    } catch (e: any) {
      setError(e?.message || 'Erro ao enviar email de recuperação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <ThemeSwitcher />

      <main className="page-wrapper auth-scope">
        <div className="signup-area">
          <div className="wrapper">
            <div className="row">
              <div className="col-lg-6 bg-color-blackest left-wrapper">
                <div className="sign-up-box">
                  <div className="signup-box-top">
                    <Link href="/" aria-label="Ir para a homepage">
                      <img className="logo-light" src="/assets/images/logo/logo.png" alt="Kardme logo" />
                      <img className="logo-dark" src="/assets/images/light/logo/logo-dark.png" alt="Kardme logo dark" />
                    </Link>
                  </div>

                  <div className="signup-box-bottom">
                    <div className="signup-box-content">
                      <h4 style={{ marginBottom: 12 }}>Recuperar password</h4>

                      <form onSubmit={handleSubmit}>
                        <div className="input-section mail-section">
                          <div className="icon">
                            <i className="fa-sharp fa-regular fa-envelope" />
                          </div>
                          <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>

                        <button type="submit" className="btn-default" disabled={loading}>
                          {loading ? 'A enviar...' : 'Enviar link'}
                        </button>

                        {ok && <p style={{ color: 'green', marginTop: 10, fontSize: 14 }}>{ok}</p>}
                        {error && <p style={{ color: 'crimson', marginTop: 10, fontSize: 14 }}>{error}</p>}
                      </form>

                      <div style={{ marginTop: 14 }}>
                        <Link className="btn-read-more" href="/login">
                          <span>Voltar ao login</span>
                        </Link>
                      </div>
                    </div>

                    <div className="signup-box-footer">
                      <div className="bottom-text">
                        Ainda não tens conta?
                        <Link className="btn-read-more ml--5" href="/signup">
                          <span>Sign Up</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-6 right-wrapper">
                <div className="client-feedback-area">
                  <div className="single-feedback">
                    <div className="inner">
                      <div className="content">
                        <p className="description">Enviamos-te um link para redefinires a password.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <Link className="close-button" href="/" aria-label="Fechar">
          <i className="fa-sharp fa-regular fa-x" />
        </Link>
      </main>
    </>
  )
}
