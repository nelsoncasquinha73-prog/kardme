'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ThemeSwitcher from '@/components/auth/ThemeSwitcher'
import { supabase } from '@/lib/supabaseClient'
import PasswordInput from '@/components/ui/PasswordInput'
import { useLanguage } from '@/components/language/LanguageProvider'

export default function LoginPage() {
  const router = useRouter()

  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/dashboard')
  }

  return (
    <>
      <ThemeSwitcher />

      <main className="page-wrapper auth-scope login-page">
        <div id="my_switcher" className="my_switcher">
          <ul>
            <li>
              <a href="#" data-theme="light" className="setColor light" aria-label="Light mode">
                <img src="/assets/images/light/switch/sun-01.svg" alt="Sun images" />
                <span title="Light Mode">Light</span>
              </a>
            </li>
            <li>
              <a href="#" data-theme="dark" className="setColor dark" aria-label="Dark mode">
                <img src="/assets/images/light/switch/vector.svg" alt="Vector Images" />
                <span title="Dark Mode">Dark</span>
              </a>
            </li>
          </ul>
        </div>

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
                      <div className="social-btn-grp">
                        <button className="btn-default btn-border" type="button" disabled>
                          <span className="icon-left">
                            <img src="/assets/images/sign-up/google.png" alt="Google Icon" />
                          </span>
                          {t('auth.login_google')}
                        </button>

                        <button className="btn-default btn-border" type="button" disabled>
                          <span className="icon-left">
                            <img src="/assets/images/sign-up/facebook.png" alt="Facebook Icon" />
                          </span>
                          {t('auth.login_facebook')}
                        </button>
                      </div>

                      <div className="text-social-area">
                        <hr />
                        <span>Or continue with</span>
                        <hr />
                      </div>

                      <form onSubmit={signIn}>
                        <div className="input-section mail-section">
                          <div className="icon">
                            <i className="fa-sharp fa-regular fa-envelope" />
                          </div>
                          <input
                            type="email"
                            placeholder="Enter email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="input-black-bg"
                          />
                        </div>

                        <div className="input-section password-section">
                          <div className="icon">
                            <i className="fa-sharp fa-regular fa-lock" />
                          </div>

                          <PasswordInput
                            value={password}
                            onChange={setPassword}
                            placeholder={t('auth.password')}
                            required
                            autoComplete="current-password"
                            inputClassName="input-black-bg"
                          />
                        </div>

                        <div className="forget-text">
                          <Link className="btn-read-more" href="/forgot-password">
                            <span>{t('auth.forgot_password')}</span>
                          </Link>
                        </div>

                        <button type="submit" className="btn-default" disabled={loading}>
                          {loading ? t('auth.signing_in') : t('auth.login')}
                        </button>

                        {error && <p style={{ color: 'crimson', marginTop: 10, fontSize: 14 }}>{error}</p>}
                      </form>
                    </div>

                    <div className="signup-box-footer">
                      <div className="bottom-text">
                        {t('auth.no_account')}
                        <Link className="btn-read-more ml--5" href="/signup">
                          <span>{t('auth.signup')}</span>
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
                      <div className="meta-img-section">
                        <span className="image">
                          <img src="/assets/images/team/team-02sm.jpg" alt="" />
                        </span>
                      </div>

                      <div className="rating">
                        <a href="#rating">
                          <i className="fa-sharp fa-solid fa-star" />
                        </a>
                        <a href="#rating">
                          <i className="fa-sharp fa-solid fa-star" />
                        </a>
                        <a href="#rating">
                          <i className="fa-sharp fa-solid fa-star" />
                        </a>
                        <a href="#rating">
                          <i className="fa-sharp fa-solid fa-star" />
                        </a>
                        <a href="#rating">
                          <i className="fa-sharp fa-solid fa-star" />
                        </a>
                      </div>

                      <div className="content">
                        <p className="description">
                          Rainbow-Themes is now a crucial component of our work! We made it simple to collaborate across
                          departments by grouping our work
                        </p>

                        <div className="bottom-content">
                          <div className="meta-info-section">
                            <h4 className="title-text mb--0">Guy Hawkins</h4>
                            <p className="desc mb--20">Nursing Assistant</p>
                            <div className="desc-img">
                              <img src="/assets/images/brand/brand-t.png" alt="Brand Image" />
                            </div>
                          </div>
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
        </div>
      </main>
    </>
  )
}
