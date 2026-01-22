'use client'

import Link from 'next/link'
import KardmeShowcase from '@/components/KardmeShowcase'

export default function Home() {
  return (
    <main className="landing-page">
      <nav
        className="navbar navbar-expand-lg navbar-dark bg-transparent"
        style={{ paddingTop: 20, paddingBottom: 20 }}
      >
        <div className="container">
          <Link className="navbar-brand" href="/">
            <span style={{ fontSize: 24, fontWeight: 900 }}>Kardme</span>
          </Link>

          <div className="navbar-nav ms-auto" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link className="nav-link" href="/signin">
              Entrar
            </Link>
            <Link className="btn btn-primary" href="/signup">
              Criar grátis
            </Link>
          </div>
        </div>
      </nav>

      <div
        className="slider-area slider-style-1 variation-default heroGrid"
        style={{ minHeight: 'auto', height: 'auto', padding: '30px 0' }}
      >
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

                {/* CTA CARD (no HERO) */}
                <div className="heroCtaCard">
                  <p className="heroCtaHint">Cria o teu cartão em 60 segundos</p>
                  <Link className="btn-default" href="/signup">
                    Quero o meu cartão premium
                  </Link>
                  <p className="heroCtaMicro">Sem cartão de crédito. Começa grátis.</p>
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

      <section style={{ background: 'var(--color-bg)', padding: '60px 20px' }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center" style={{ marginBottom: 40 }}>
              <h2 className="section-title">Vê como funciona</h2>
              <p className="section-description">Exemplos de cartões digitais criados em Kardme</p>
            </div>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-6">
              <KardmeShowcase />
            </div>
          </div>
        </div>
      </section>

      <section className="service-area service-style-1 padding-top-80 padding-bottom-80">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h2 className="section-title">Como funciona</h2>
              <p className="section-description">Em 3 passos simples, tens o teu cartão pronto</p>
            </div>
          </div>

          <div className="row padding-top-50">
            <div className="col-lg-4 col-md-6">
              <div className="service-item service-item-1">
                <div className="service-icon">
                  <i className="fas fa-cube"></i>
                </div>
                <h3>Escolhe um template</h3>
                <p>Seleciona um design premium já pronto para o teu setor</p>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="service-item service-item-1">
                <div className="service-icon">
                  <i className="fas fa-edit"></i>
                </div>
                <h3>Personaliza</h3>
                <p>Adiciona a tua foto, dados e informações de contacto</p>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="service-item service-item-1">
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

      <section className="feature-area feature-style-1 padding-top-80 padding-bottom-80">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h2 className="section-title">Porquê Kardme?</h2>
              <p className="section-description">Tudo o que precisas para um cartão profissional</p>
            </div>
          </div>

          <div className="row padding-top-50">
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

      <section className="pricing-area pricing-style-1 padding-top-80 padding-bottom-80">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h2 className="section-title">Planos simples e transparentes</h2>
              <p className="section-description">Começa grátis, upgrade quando precisares</p>
            </div>
          </div>

          <div className="row padding-top-50">
            <div className="col-lg-4 col-md-6">
              <div className="pricing-item pricing-item-1">
                <h3 className="pricing-title">Grátis</h3>
                <p className="pricing-subtitle">Para começar</p>
                <div className="pricing-price">
                  <span className="price">€0</span>
                  <span className="period">/mês</span>
                </div>
                <ul className="pricing-list">
                  <li>
                    <i className="fas fa-check"></i> 1 cartão digital
                  </li>
                  <li>
                    <i className="fas fa-check"></i> Templates básicos
                  </li>
                  <li>
                    <i className="fas fa-check"></i> Customização limitada
                  </li>
                  <li>
                    <i className="fas fa-times"></i> Analytics
                  </li>
                </ul>
                <Link href="/signup" className="btn btn-outline">
                  Começar
                </Link>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="pricing-item pricing-item-1 pricing-item-featured">
                <div className="pricing-badge">Mais popular</div>
                <h3 className="pricing-title">Pro</h3>
                <p className="pricing-subtitle">Para profissionais</p>
                <div className="pricing-price">
                  <span className="price">€9.99</span>
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
                    <i className="fas fa-check"></i> Customização completa
                  </li>
                  <li>
                    <i className="fas fa-check"></i> Analytics &amp; Leads
                  </li>
                </ul>
                <Link href="/signup" className="btn btn-primary">
                  Começar
                </Link>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="pricing-item pricing-item-1">
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
        </div>
      </section>

      <section className="cta-area cta-style-1 padding-top-80 padding-bottom-80">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h2 className="section-title">Pronto para começar?</h2>
              <p className="section-description">Junta-te a milhares de profissionais a usar Kardme</p>
              <div className="form-group" style={{ marginTop: 18 }}>
                <Link className="btn-default" href="/signup">
                  Quero o meu cartão premium
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
