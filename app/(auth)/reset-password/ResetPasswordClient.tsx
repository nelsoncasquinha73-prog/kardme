'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import ThemeSwitcher from '@/components/auth/ThemeSwitcher'
import PasswordInput from '@/components/ui/PasswordInput'
import { supabase } from '@/lib/supabaseClient'

function getHashParams() {
  if (typeof window === 'undefined') return new URLSearchParams()
  const hash = window.location.hash?.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash
  return new URLSearchParams(hash || '')
}

export default function ResetPasswordClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const code = useMemo(() => searchParams.get('code'), [searchParams])

  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setError(null)

      try {
        const hashParams = getHashParams()
        const hashError = hashParams.get('error')
        const hashErrorDesc = hashParams.get('error_description')
        if (hashError) {
          throw new Error(decodeURIComponent(hashErrorDesc || 'Link inválido ou expirado.'))
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else {
          const access_token = hashParams.get('access_token')
          const refresh_token = hashParams.get('refresh_token')

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token })
            if (error) throw error

            window.history.replaceState({}, document.title, window.location.pathname)
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Link inválido ou expirado.')
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [code])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setOk(null)
    setLoading(true)

    try {
      if (password.length < 6) throw new Error('A password deve ter pelo menos 6 caracteres.')
      if (password !== confirmPassword) throw new Error('As passwords não coincidem.')

      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) throw new Error('Sessão inválida. Pede um novo link de recuperação.')

      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      setOk('Password alterada com sucesso. Faz login novamente.')

      await supabase.auth.signOut()
      router.push('/login')
    } catch (e: any) {
      setError(e?.message || 'Erro ao atualizar password.')
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
                      <h4 style={{ marginBottom: 12 }}>Definir nova password</h4>

                      {!ready ? (
                        <p style={{ opacity: 0.8 }}>A validar link...</p>
                      ) : error ? (
                        <>
                          <p style={{ color: 'crimson', marginTop: 10, fontSize: 14 }}>{error}</p>
                          <div style={{ marginTop: 14 }}>
                            <Link className="btn-read-more" href="/forgot-password">
                              <span>Pedir novo link</span>
                            </Link>
                          </div>
                        </>
                      ) : (
                        <form onSubmit={handleSubmit}>
                          <div className="input-section password-section">
                            <div className="icon">
                              <i className="fa-sharp fa-regular fa-lock" />
                            </div>
                            <PasswordInput
                              value={password}
                              onChange={setPassword}
                              placeholder="Nova password"
                              required
                              autoComplete="new-password"
                              minLength={6}
                            />
                          </div>

                          <div className="input-section password-section">
                            <div className="icon">
                              <i className="fa-sharp fa-regular fa-lock" />
                            </div>
                            <PasswordInput
                              value={confirmPassword}
                              onChange={setConfirmPassword}
                              placeholder="Confirmar nova password"
                              required
                              autoComplete="new-password"
                              minLength={6}
                            />
                          </div>

                          <button type="submit" className="btn-default" disabled={loading}>
                            {loading ? 'A guardar...' : 'Guardar password'}
                          </button>

                          {ok && <p style={{ color: 'green', marginTop: 10, fontSize: 14 }}>{ok}</p>}
                          {error && <p style={{ color: 'crimson', marginTop: 10, fontSize: 14 }}>{error}</p>}
                        </form>
                      )}

                      <div style={{ marginTop: 14 }}>
                        <Link className="btn-read-more" href="/login">
                          <span>Voltar ao login</span>
                        </Link>
                      </div>
                    </div>

                    <div className="signup-box-footer">
                      <div className="bottom-text">
                        Não tens conta?
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
                        <p className="description">Define uma password forte e volta ao login.</p>
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
