'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import KardmeShowcase from '@/components/KardmeShowcase'
import { useLanguage } from '@/components/language/LanguageProvider'
import LanguageDropdown from '@/components/language/LanguageDropdown'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [checked, setChecked] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null)
      setChecked(true)
    })
  }, [])

  const handleUpgradeClick = async (billing: 'monthly' | 'yearly') => {
    if (!user) {
      window.location.href = '/signup'
      return
    }

    try {
      const res = await fetch('/api/stripe/checkout-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, billing }),
      })
      const data = await res.json()
      if (data?.url) window.location.href = data.url
    } catch (e) {
      console.error('Erro ao iniciar checkout:', e)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // Mostrar versão guest por defeito, só muda se user estiver logado E já verificámos
  const isLoggedIn = checked && user

  return (
    <main className="landing-page">
      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-transparent">
        <div className="container">
          <Link className="navbar-brand" href="/">
            <span style={{ fontSize: 24, fontWeight: 900 }}>Kardme</span>
          </Link>

          <div className="navbar-nav ms-auto" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {isLoggedIn ? (
              <>
                <Link className="nav-link" href="/dashboard">{t('nav.dashboard')}</Link>
                <Link className="btn btn-primary" href="/dashboard/plans">{t('landing.upgrade')}</Link>
                <button onClick={handleLogout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link className="nav-link" href="/login">{t('auth.login')}</Link>
                <Link className="btn btn-cta-green" href="/signup">{t('landing.create_free_card')}</Link>
              </>
            )}
            <LanguageDropdown />
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="slider-area slider-style-1 variation-default heroGrid">
        <div className="heroOrbs" aria-hidden="true">
          <span className="orb orb1" />
          <span className="orb orb2" />
          <span className="orb orb3" />
        </div>

        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-12">
              <div className="inner text-center">
                <h1 className="title display-one">
                  Um <span className="theme-gradient">cartão digital</span> <br /> com efeito{' '}
                  <span className="theme-gradient">wow</span>
                </h1>

                <p className="description">
                  Escolhe um template premium, personaliza ao teu estilo e partilha como um pro. <br />
                  O teu primeiro impacto nunca mais vai ser &quot;só mais um&quot;.
                </p>

                <div className="heroCtaCard">
                  <p className="heroCtaHint">{t('landing.hero_cta_hint')}</p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {isLoggedIn ? (
                      <>
                        <Link className="btn btn-cta-green" href="/dashboard/catalog">
                          Ir para catálogo
                        </Link>
                        <Link className="btn btn-secondary" href="/dashboard">
                          Dashboard
                        </Link>
                      </>
                    ) : (
                      <Link className="btn btn-cta-green" href="/signup">
                        {t('landing.create_free_card')}
                      </Link>
                    )}
                  </div>
                  <p className="heroCtaMicro">{t('landing.no_credit_card')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SHOWCASE SECTION */}
      <section className="showcase-section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h2 className="section-title">{t('landing.how_it_works')}</h2>
              <p className="section-description">{t('landing.examples_description')}</p>
            </div>
          </div>

          <div className="row justify-content-center" style={{ marginTop: 30 }}>
            <div className="col-lg-6">
              <KardmeShowcase />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h2 className="section-title">Como funciona</h2>
              <p className="section-description">{t('landing.three_steps')}</p>
            </div>
          </div>

          <div className="row" style={{ marginTop: 40 }}>
            <div className="col-lg-4 col-md-6">
              <div className="service-item">
                <div className="service-icon">
                  <i className="fas fa-cube"></i>
                </div>
                <h3>{t('landing.choose_template')}</h3>
                <p>Seleciona um design premium já pronto para o teu setor</p>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="service-item">
                <div className="service-icon">
                  <i className="fas fa-edit"></i>
                </div>
                <h3>{t('landing.customize')}</h3>
                <p>Adiciona a tua foto, dados e informações de contacto</p>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="service-item">
                <div className="service-icon">
                  <i className="fas fa-share-alt"></i>
                </div>
                <h3>{t('landing.share')}</h3>
                <p>Envia o link (e mais tarde NFC) e começa a receber contactos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY KARDME SECTION */}
      <section className="why-kardme-section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h2 className="section-title">Porquê Kardme?</h2>
              <p className="section-description">{t('landing.features_title')}</p>
            </div>
          </div>

          <div className="row" style={{ marginTop: 40 }}>
            <div className="col-lg-6 col-md-6">
              <div className="feature-item">
                <div className="feature-icon">
                  <i className="fas fa-zap"></i>
                </div>
                <h3>Rápido &amp; Simples</h3>
                <p>Cria em menos de 1 minuto, sem conhecimentos técnicos</p>
              </div>
            </div>

            <div className="col-lg-6 col-md-6">
              <div className="feature-item">
                <div className="feature-icon">
                  <i className="fas fa-palette"></i>
                </div>
                <h3>Totalmente customizável</h3>
                <p>Cores, fontes, layout — tudo à tua medida</p>
              </div>
            </div>

            <div className="col-lg-6 col-md-6">
              <div className="feature-item">
                <div className="feature-icon">
                  <i className="fas fa-mobile-alt"></i>
                </div>
                <h3>Mobile First</h3>
                <p>Perfeito em qualquer dispositivo, sempre</p>
              </div>
            </div>

            <div className="col-lg-6 col-md-6">
              <div className="feature-item">
                <div className="feature-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <h3>Analytics &amp; Leads</h3>
                <p>{t('landing.analytics_description')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="pricing-section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h2 className="section-title">{t('landing.pricing_title')}</h2>
              <p className="section-description">Começa grátis, upgrade quando precisares</p>
            </div>
          </div>

          <div className="row" style={{ marginTop: 40 }}>
            {/* FREE PLAN */}
            <div className="col-lg-4 col-md-6">
              <div className="pricing-item">
                <h3 className="pricing-title">{t('landing.free')}</h3>
                <p className="pricing-subtitle">Para começar</p>
                <div className="pricing-price">
                  <span className="price">€0</span>
                  <span className="period">*</span>
                </div>
                <ul className="pricing-list">
                  <li><i className="fas fa-check"></i> 1 {t('landing.digital_card')}</li>
                  <li><i className="fas fa-check"></i> 10 templates</li>
                  <li><i className="fas fa-check"></i> Analytics completo</li>
                  <li><i className="fas fa-check"></i> Gestão de leads</li>
                </ul>
                <Link href="/signup" className="btn btn-outline">
                  {t('landing.create_free')}
                </Link>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>
                  *3 meses de utilização grátis
                </p>
              </div>
            </div>

            {/* PRO PLAN */}
            <div className="col-lg-4 col-md-6">
              <div className="pricing-item pricing-item-featured">
                <div className="pricing-badge">Mais popular</div>
                <h3 className="pricing-title">Pro</h3>
                <p className="pricing-subtitle">Para profissionais</p>
                <div className="pricing-price">
                  <span className="price">€6,99</span>
                  <span className="period">/{t('landing.month')}</span>
                </div>
                <ul className="pricing-list">
                  <li><i className="fas fa-check"></i> {t('landing.unlimited_cards')}</li>
                  <li><i className="fas fa-check"></i> {t('landing.all_templates')}</li>
                  <li><i className="fas fa-check"></i> Customização avançada</li>
                  <li><i className="fas fa-check"></i> Analytics &amp; Leads</li>
                </ul>
                {isLoggedIn ? (
                  <button onClick={() => handleUpgradeClick('monthly')} className="btn btn-primary" style={{ width: '100%', border: 'none', cursor: 'pointer' }}>
                    Fazer upgrade
                  </button>
                ) : (
                  <Link href="/signup" className="btn btn-primary">{t('landing.start')}</Link>
                )}
              </div>
            </div>

            {/* ENTERPRISE PLAN */}
            <div className="col-lg-4 col-md-6">
              <div className="pricing-item">
                <h3 className="pricing-title">Enterprise</h3>
                <p className="pricing-subtitle">Para equipas</p>
                <div className="pricing-price">
                  <span className="price">Contactar</span>
                </div>
                <ul className="pricing-list">
                  <li><i className="fas fa-check"></i> {t('landing.everything_pro')}</li>
                  <li><i className="fas fa-check"></i> Cartões NFC</li>
                  <li><i className="fas fa-check"></i> Suporte prioritário</li>
                  <li><i className="fas fa-check"></i> Integrações custom</li>
                </ul>
                <a href="mailto:hello@kardme.com" className="btn btn-outline">Contactar</a>
              </div>
            </div>
          </div>

          {/* ANNUAL OPTION */}
          <div className="row justify-content-center" style={{ marginTop: 40 }}>
            <div className="col-lg-8 text-center">
              <p style={{ color: 'rgba(255,255,255,0.70)', marginBottom: 16 }}>
                {t('landing.yearly_discount')}
              </p>
              <Link href="/signup" className="btn btn-outline">
                {t('landing.start_yearly')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL SECTION */}
      <section className="cta-final-section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h2 className="section-title">{t('landing.ready_to_start')}</h2>
              <p className="section-description">Junta-te a milhares de profissionais a usar Kardme</p>
              <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {isLoggedIn ? (
                  <>
                    <Link className="btn btn-cta-green" href="/dashboard/catalog">Ver catálogo</Link>
                    <button onClick={() => handleUpgradeClick('monthly')} className="btn btn-primary" style={{ cursor: 'pointer' }}>
                      {t('landing.upgrade_pro')}
                    </button>
                  </>
                ) : (
                  <Link className="btn btn-cta-green" href="/signup">{t('landing.create_free_card')}</Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
