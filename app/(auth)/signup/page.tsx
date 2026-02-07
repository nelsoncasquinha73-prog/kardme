'use client'
import LanguageDropdown from '@/components/language/LanguageDropdown'

import { useLanguage } from '@/components/language/LanguageProvider'
import { useState } from 'react'
import Link from 'next/link'
import ThemeSwitcher from '@/components/auth/ThemeSwitcher'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'


const baseTranslations = {
  firstNameLabel: 'First name',
  lastNameLabel: 'Last name',
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
  en: baseTranslations,
  pt: {
    firstNameLabel: 'Nome',
    lastNameLabel: 'Apelido',
    phoneLabel: 'Telemóvel',
    emailLabel: 'Email',
    passwordLabel: 'Criar password',
    confirmPasswordLabel: 'Confirmar password',
    submitButton: 'Criar conta',
    passwordsMismatchError: 'Passwords não coincidem',
    phoneInvalidError: 'Telemóvel inválido (mínimo 9 dígitos)',
    successMessage: 'Conta criada! Verifica o email para confirmar.',
  },
  'pt-br': {
    firstNameLabel: 'Nome',
    lastNameLabel: 'Sobrenome',
    phoneLabel: 'Celular',
    emailLabel: 'Email',
    passwordLabel: 'Criar senha',
    confirmPasswordLabel: 'Confirmar senha',
    submitButton: 'Criar conta',
    passwordsMismatchError: 'Senhas não coincidem',
    phoneInvalidError: 'Celular inválido (mínimo 9 dígitos)',
    successMessage: 'Conta criada! Verifique o email para confirmar.',
  },
  es: {
    firstNameLabel: 'Nombre',
    lastNameLabel: 'Apellido',
    phoneLabel: 'Teléfono',
    emailLabel: 'Email',
    passwordLabel: 'Crear contraseña',
    confirmPasswordLabel: 'Confirmar contraseña',
    submitButton: 'Crear cuenta',
    passwordsMismatchError: 'Las contraseñas no coinciden',
    phoneInvalidError: 'Teléfono inválido (mínimo 9 dígitos)',
    successMessage: 'Cuenta creada! Revisa tu email para confirmar.',
  },
  fr: {
    firstNameLabel: 'Prénom',
    lastNameLabel: 'Nom',
    phoneLabel: 'Téléphone',
    emailLabel: 'Email',
    passwordLabel: 'Créer mot de passe',
    confirmPasswordLabel: 'Confirmer mot de passe',
    submitButton: 'Créer un compte',
    passwordsMismatchError: 'Les mots de passe ne correspondent pas',
    phoneInvalidError: 'Téléphone invalide (minimum 9 chiffres)',
    successMessage: 'Compte créé! Vérifiez votre email pour confirmer.',
  },
  de: {
    firstNameLabel: 'Vorname',
    lastNameLabel: 'Nachname',
    phoneLabel: 'Telefon',
    emailLabel: 'Email',
    passwordLabel: 'Passwort erstellen',
    confirmPasswordLabel: 'Passwort bestätigen',
    submitButton: 'Konto erstellen',
    passwordsMismatchError: 'Passwörter stimmen nicht überein',
    phoneInvalidError: 'Ungültige Telefonnummer (mindestens 9 Ziffern)',
    successMessage: 'Konto erstellt! Überprüfen Sie Ihre Email zur Bestätigung.',
  },
  it: {
    firstNameLabel: 'Nome',
    lastNameLabel: 'Cognome',
    phoneLabel: 'Telefono',
    emailLabel: 'Email',
    passwordLabel: 'Crea password',
    confirmPasswordLabel: 'Conferma password',
    submitButton: 'Crea account',
    passwordsMismatchError: 'Le password non corrispondono',
    phoneInvalidError: 'Telefono non valido (minimo 9 cifre)',
    successMessage: 'Account creato! Controlla la tua email per confermare.',
  },
  ar: {
    firstNameLabel: 'الاسم الأول',
    lastNameLabel: 'اسم العائلة',
    phoneLabel: 'الهاتف',
    emailLabel: 'البريد الإلكتروني',
    passwordLabel: 'إنشاء كلمة مرور',
    confirmPasswordLabel: 'تأكيد كلمة المرور',
    submitButton: 'إنشاء حساب',
    passwordsMismatchError: 'كلمات المرور غير متطابقة',
    phoneInvalidError: 'رقم هاتف غير صالح (9 أرقام على الأقل)',
    successMessage: 'تم إنشاء الحساب! تحقق من بريدك الإلكتروني للتأكيد.',
  },
}

export default function SignupPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('351') // Portugal como default
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState<string | null>(null)

  const { lang } = useLanguage()
  const t = translations[lang] || translations.pt

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        // Só faz UPDATE, não INSERT/UPSERT
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({
            nome: firstName.trim(),
            apelido: lastName.trim(),
            phone: phone.trim(),
          })
          .eq('id', userId)

        if (profileErr) {
          console.warn('Falha ao atualizar perfil (pode ser por sessão ainda não ativa):', profileErr)
        }
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
        <div style={{ position: "absolute", top: 16, right: 16, zIndex: 2000 }}>
          <LanguageDropdown />
        </div>
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
                    <img className="logo-light" src="/kardme-logo.png" alt="sign-up logo" />
                    <img className="logo-dark" src="/kardme-logo.png" alt="ChatBot Logo" />
                  </div>

                  <div className="signup-box-bottom">
                    <div className="signup-box-content">
                      <form onSubmit={onSubmit}>
                        <div className="input-section">
                          <input
                            type="text"
                            placeholder={t.firstNameLabel}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="input-section">
                          <input
                            type="text"
                            placeholder={t.lastNameLabel}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="input-section">
                          <PhoneInput
                            country={'pt'}
                            value={phone}
                            onChange={setPhone}
                            enableSearch
                            inputProps={{
                              name: 'phone',
                              required: true,
                              autoFocus: false,
                            }}
                            placeholder={t.phoneLabel}
                            inputStyle={{ width: '100%' }}
                            buttonStyle={{ background: 'transparent', border: 'none' }}
                            dropdownStyle={{ background: '#111', color: '#fff' }}
                          />
                        </div>
                        <div className="input-section mail-section">
                          <input
                            type="email"
                            placeholder={t.emailLabel}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="input-section password-section">
                          <input
                            type="password"
                            placeholder={t.passwordLabel}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                          />
                        </div>
                        <div className="input-section password-section">
                          <input
                            type="password"
                            placeholder={t.confirmPasswordLabel}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                          />
                        </div>

                        <button type="submit" className="btn-default" disabled={loading}>
                          {loading ? 'A criar...' : t.submitButton}
                        </button>

                        {ok && <p style={{ color: 'green', marginTop: 10, fontSize: 14 }}>{ok}</p>}
                        {error && <p style={{ color: 'crimson', marginTop: 10, fontSize: 14 }}>{error}</p>}
                      </form>
                    </div>

                    <div className="signup-box-footer">
                      <div className="bottom-text">
                        Já tens conta?{' '}
                        <Link href="/login" className="btn-read-more">
                          Entrar
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
                          Rainbow-Themes é agora uma componente crucial do nosso trabalho! Facilitamos a colaboração entre departamentos agrupando o nosso trabalho.
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
      </main>
    </>
  )
}
