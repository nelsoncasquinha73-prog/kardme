'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import KardmeShowcase from '@/components/KardmeShowcase'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user || null)
      setLoading(false)
    }
    getUser()
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

  // Loading state - mostra navbar com botões padrão
  if (loading) {
    return (
      <main className="landing-page">
        <nav className="navbar navbar-expand-lg navbar-dark bg-transparent">
          <div className="container">
            <Link className="navbar-brand" href="/">
              <span style={{ fontSize: 24, fontWeight: 900 }}>Kardme</span>
            </Link>
            <div className="navbar-nav ms-auto" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Link className="nav-link" href="/signin">
                Entrar
              </Link>
              <Link className="btn btn-primary" href="/signup">
                Criar cartão grátis
              </Link>
            </div>
          </div>
        </nav>
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>A carregar...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="landing-page">
      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-transparent">
        <div className="container">
          <Link className="navbar-brand" href="/">
            <span style={{ fontSize: 24, fontWeight: 900 }}>Kardme</span>
          </Link>

          <div className="navbar-nav ms-auto" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {user ? (
              <>
                <Link className="nav-link" href="/dashboard">
                  Dashboard
                </Link>
                <Link className="btn btn-primary" href="/dashboard/plans">
                  Upgrade
                </Link>
              </>
            ) : (
              <>
                <Link className="nav-link" href="/signin">
                  Entrar
                </Link>
                <Link className="btn btn-primary" href="/signup">
                  Criar cartão grátis
                </Link>
              </>
            )}
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
                  <p className="heroCtaHint">Cria o teu cartão em 60 segundos</p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {user ? (
                      <>
                        <Link className="btn-default" href="/dashboard/catalog">
                          Ir para catálogo
                        </Link>
                        <Link
                          className="btn-default"
                          href="/dashboard"
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                          }}
                        >
                          Ir para dashboard
                        </Link>
                      </>
                    ) : (
                      <Link className="btn-default" href="/signup">
                        Criar cartão grátis
                      </Link>
                    )}
                  </div>
                  <p className="heroCtaMicro">Sem cartão de crédito. 3 meses grátis.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-shape">
          <img className="bg-shape-one" src="/assets/images/bg/bg-shape-four.png" alt="Bg Shape" />
          <img className="bg-shape-two" src="/assets/images/bg/bg-shape-five.png" alt="Bg Shape" />
        </div>
      </div>

      {/* SHOWCASE SECTION */}
      <section className="showcase-section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h2 className="section-title">Vê como funciona</h2>
              <p className="section-description">Exemplos de cartões digitais criados em Kardme</p>
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
              <p className="section-description">Em 3 passos simples, tens o teu cartão pronto</p>
            </div>
          </div>

          <div className="row" style={{ marginTop: 40 }}>
            <div className="col-lg-4 col-md-6">
              <div className="service-item">
                <div className="service-icon">
                  <i className="fas fa-cube"></i>
                </div>
                <h3>Escolhe um template</h3>
                <p>Seleciona um design premium já pronto para o teu setor</p>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="service-item">
                <div className="service-icon">
                  <i className="fas fa-edit"></i>
                </div>
                <h3>Personaliza</h3>
                <p>Adiciona a tua foto, dados e informações de contacto</p>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="service-item">
                <div className="service-icon">
                  <i className="fas fa-share-alt"></i>
                </div>
                <h3>Partilha</h3>
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
              <p className="section-description">Tudo o que precisas para um cartão profissional</p>
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
                <p>Vê quantas pessoas viram e clicaram no teu cartão</p>
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
              <h2 className="section-title">Planos simples e transparentes</h2>
              <p className="section-description">Começa grátis, upgrade quando precisares</p>
            </div>
          </div>

          <div className="row" style={{ marginTop: 40 }}>
            {/* FREE PLAN */}
            <div className="col-lg-4 col-md-6">
              <div className="pricing-item">
                <h3 className="pricing-title">Grátis</h3>
                <p className="pricing-subtitle">Para começar</p>
                <div className="pricing-price">
                  <span className="price">€0</span>
                  <span className="period">*</span>
                </div>
                <ul className="pricing-list">
                  <li>
                    <i className="fas fa-check"></i> 1 cartão digital
                  </li>
                  <li>
                    <i className="fas fa-check"></i> 10 templates
                  </li>
                  <li>
                    <i className="fas fa-check"></i> Analytics completo
                  </li>
                  <li>
                    <i className="fas fa-check"></i> Gestão de leads
                  </li>
                </ul>
                <Link href="/signup" className="btn btn-outline">
                  Criar cartão grátis
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
                  <span className="period">/mês</span>
                </div>
                <ul className="pricing-list">
                  <li>
                    <i className="fas fa-check"></i> Cartões ilimitados
                  </li>
                  <li>
                    <i className="fas fa-check"></i> Todos os templates
                  </li>
                  <li>
                    <i className="fas fa-check"></i> Customização avançada
                  </li>
                  <li>
                    <i className="fas fa-check"></i> Analytics &amp; Leads
                  </li>
                </ul>
                {user ? (
                  <button
                    onClick={() => handleUpgradeClick('monthly')}
                    className="btn btn-primary"
                    style={{ width: '100%', border: 'none', cursor: 'pointer' }}
                  >
                    Fazer upgrade
                  </button>
                ) : (
                  <Link href="/signup" className="btn btn-primary">
                    Começar
                  </Link>
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
                  <li>
                    <i className="fas fa-check"></i> Tudo do Pro
                  </li>
                  <li>
                    <i className="fas fa-check"></i> Cartões NFC
                  </li>
                  <li>
                    <i className="fas fa-check"></i> Suporte prioritário
                  </li>
                  <li>
                    <i className="fas fa-check"></i> Integrações custom
                  </li>
                </ul>
                <a href="mailto:hello@kardme.com" className="btn btn-outline">
                  Contactar
                </a>
              </div>
            </div>
          </div>

                   {/* ANNUAL OPTION */}
          <div className="row justify-content-center" style={{ marginTop: 40 }}>
            <div className="col-lg-8 text-center">
              <p style={{ color: 'rgba(255,255,255,0.70)', marginBottom: 16 }}>
                Preferes pagar anualmente? Poupa 20% com €69/ano
              </p>
              {user ? (
                <button
                  onClick={() => handleUpgradeClick('yearly')}
                  className="btn btn-outline"
                  style={{ cursor: 'pointer' }}
                >
                  Upgrade anual (€69/ano)
                </button>
              ) : (
                <Link href="/signup" className="btn btn-outline">
                  Começar com plano anual
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL SECTION */}
      <section className="cta-final-section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h2 className="section-title">Pronto para começar?</h2>
              <p className="section-description">Junta-te a milhares de profissionais a usar Kardme</p>
              <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                {user ? (
                  <>
                    <Link className="btn-default" href="/dashboard/catalog">
                      Ver catálogo
                    </Link>
                    <button
                      onClick={() => handleUpgradeClick('monthly')}
                      className="btn-default"
                      style={{
                        background: 'rgba(139, 92, 246, 0.8)',
                        border: '1px solid rgba(139, 92, 246, 0.5)',
                        cursor: 'pointer',
                      }}
                    >
                      Upgrade Pro
                    </button>
                  </>
                ) : (
                  <Link className="btn-default" href="/signup">
                    Criar cartão grátis
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

