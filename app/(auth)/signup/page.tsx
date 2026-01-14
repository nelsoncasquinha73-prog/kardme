'use client'

import { useLanguage } from '@/components/language/LanguageProvider'
import { useState } from 'react'
import Link from 'next/link'
import ThemeSwitcher from '@/components/auth/ThemeSwitcher'
import SignupForm from '@/components/auth/SignupForm'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

const baseTranslations = {
  nameLabel: 'Name',
  phoneLabel: 'Phone',
  emailLabel: 'Email',
  passwordLabel: 'Create password',
  confirmPasswordLabel: 'Confirm password',
  submitButton: 'Sign Up',
  passwordsMismatchError: 'Passwords do not match',
  phoneInvalidError: 'Invalid phone (min 9 digits)',
  successMessage: 'Account created! Check your email to confirm.',
}

const translations: Record<string, typeof baseTranslations> = {
  pt: {
    nameLabel: 'Nome',
    phoneLabel: 'Telemóvel',
    emailLabel: 'Email',
    passwordLabel: 'Criar password',
    confirmPasswordLabel: 'Confirmar password',
    submitButton: 'Criar conta',
    passwordsMismatchError: 'Passwords não coincidem',
    phoneInvalidError: 'Telemóvel inválido (mínimo 9 dígitos)',
    successMessage: 'Conta criada! Verifica o email para confirmar.',
  },
  en: baseTranslations,
  es: baseTranslations,
  fr: baseTranslations,
  de: baseTranslations,
  it: baseTranslations,
  ar: baseTranslations,
  'pt-br': {
    nameLabel: 'Nome',
    phoneLabel: 'Telefone',
    emailLabel: 'Email',
    passwordLabel: 'Criar senha',
    confirmPasswordLabel: 'Confirmar senha',
    submitButton: 'Criar conta',
    passwordsMismatchError: 'Senhas não coincidem',
    phoneInvalidError: 'Telefone inválido (mínimo 9 dígitos)',
    successMessage: 'Conta criada! Verifique o email para confirmar.',
  },
}

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const { lang } = useLanguage()
  const t = translations[lang] || translations.pt

  const onSubmit = async ({
    name,
    phone,
    email,
    password,
    confirmPassword,
  }: {
    name: string
    phone: string
    email: string
    password: string
    confirmPassword: string
  }) => {
    setError(null)
    setOk(null)
    setLoading(true)

    try {
      if (password !== confirmPassword) throw new Error(t.passwordsMismatchError)

      const digits = phone.replace(/\D/g, '')
      if (digits.length < 9) throw new Error(t.phoneInvalidError)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/welcome`,
        },
      })
      if (error) throw error

      const userId = data?.user?.id
      if (userId) {
        const { error: profileErr } = await supabase
          .from('profiles')
          .upsert(
            { id: userId, full_name: name, phone: phone.trim() },
            { onConflict: 'id' }
          )
        if (profileErr) throw profileErr
      }

      setOk(t.successMessage)
      router.push('/welcome')
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <ThemeSwitcher />

      <main className="page-wrapper auth-scope">
        <div id="my_switcher" className="my_switcher">
          <ul>
            <li>
              <a href="#" data-theme="light" className="setColor light">
                <img src="/assets/images/light/switch/sun-01.svg" alt="Sun images" />
                <span title="Light Mode">Light</span>
              </a>
            </li>
            <li>
              <a href="#" data-theme="dark" className="setColor dark">
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
                    <img className="logo-light" src="/assets/images/logo/logo.png" alt="sign-up logo" />
                    <img className="logo-dark" src="/assets/images/light/logo/logo-dark.png" alt="ChatBot Logo" />
                  </div>

                  <div className="signup-box-bottom">
                    <div className="signup-box-content">
                      <SignupForm t={t} onSubmit={onSubmit} loading={loading} error={error} ok={ok} />
                    </div>

                    <div className="signup-box-footer">
                      <div className="bottom-text">
                        Do you have an account?
                        <Link className="btn-read-more ml--5" href="/login">
                          <span>Sign In</span>
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
                        <a className="image" href="#">
                          <img src="/assets/images/team/team-02sm.jpg" alt="" />
                        </a>
                      </div>

                      <div className="rating">
                        <a href="#rating"><i className="fa-sharp fa-solid fa-star" /></a>
                        <a href="#rating"><i className="fa-sharp fa-solid fa-star" /></a>
                        <a href="#rating"><i className="fa-sharp fa-solid fa-star" /></a>
                        <a href="#rating"><i className="fa-sharp fa-solid fa-star" /></a>
                        <a href="#rating"><i className="fa-sharp fa-solid fa-star" /></a>
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
        </div>

        <Link className="close-button" href="/" aria-label="Fechar">
          <i className="fa-sharp fa-regular fa-x" />
        </Link>
      </main>
    </>
  )
}
