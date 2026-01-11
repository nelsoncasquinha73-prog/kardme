'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function PlansPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const router = useRouter()

  const selectPlan = async (
    plan: 'free' | 'pro' | 'business'
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Sessão não encontrada. Faz login novamente.')
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        plan,
        billing: plan === 'free' ? 'monthly' : billing,
      })
      .eq('id', user.id)

    if (error) {
      console.error(error)
      alert('Erro ao guardar o plano')
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="rainbow-pricing-area rainbow-section-gap">
      <div className="container">

        {/* Header */}
        <div className="section-title text-center">
          <h4 className="subtitle">
            <span className="theme-gradient">Planos</span>
          </h4>

          <h2 className="title w-600 mb--20">
            🎉 O teu cartão gratuito já está ativo
          </h2>

          <p className="description b1">
            Escolhe agora como queres usar o Kardme
          </p>
        </div>

        {/* Toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            marginTop: 40,
            marginBottom: 40,
          }}
        >
          <button
            onClick={() => setBilling('monthly')}
            className={`btn-default ${billing === 'monthly' ? '' : 'btn-border'}`}
          >
            Mensal
          </button>

          <button
            onClick={() => setBilling('yearly')}
            className={`btn-default ${billing === 'yearly' ? '' : 'btn-border'}`}
          >
            Anual <span style={{ marginLeft: 6 }}>💰 Poupa 20%</span>
          </button>
        </div>

        <div className="row row--15">

          {/* FREE */}
          <div className="col-xl-4 col-lg-6 col-md-6 col-12 mt--30">
            <div className="rainbow-pricing style-aiwave">
              <div className="pricing-table-inner">
                <div className="pricing-header">
                  <h4 className="title">Free</h4>
                  <div className="pricing">
                    <span className="price-text">€0</span>
                  </div>
                </div>

                <div className="pricing-body">
                  <ul className="list-style--1">
                    <li>1 cartão digital</li>
                    <li>Links essenciais</li>
                    <li>Afiliação ativa</li>
                  </ul>
                </div>

                <div className="pricing-footer">
                  <button
                    className="btn-default btn-border"
                    onClick={() => selectPlan('free')}
                  >
                    Continuar com Free
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PRO */}
          <div className="col-xl-4 col-lg-6 col-md-6 col-12 mt--30">
            <div className="rainbow-pricing style-aiwave active">
              <div className="pricing-table-inner">
                <div className="pricing-header">
                  <h4 className="title">Pro</h4>

                  <div className="pricing">
                    {billing === 'yearly' && (
                      <span
                        style={{
                          textDecoration: 'line-through',
                          opacity: 0.5,
                          marginRight: 8,
                        }}
                      >
                        €108
                      </span>
                    )}

                    <span className="price-text">
                      {billing === 'monthly' ? '€9' : '€90'}
                    </span>

                    <span className="text">
                      {billing === 'monthly' ? '/mês' : '/ano'}
                    </span>
                  </div>
                </div>

                <div className="pricing-body">
                  <ul className="list-style--1">
                    <li>Vários cartões</li>
                    <li>Leads</li>
                    <li>Marcações</li>
                    <li>Afiliação</li>
                  </ul>
                </div>

                <div className="pricing-footer">
                  <button
                    className="btn-default"
                    onClick={() => selectPlan('pro')}
                  >
                    Desbloquear Pro
                  </button>
                </div>
              </div>

              <div className="feature-badge">Mais Popular</div>
            </div>
          </div>

          {/* BUSINESS */}
          <div className="col-xl-4 col-lg-6 col-md-6 col-12 mt--30">
            <div className="rainbow-pricing style-aiwave">
              <div className="pricing-table-inner">
                <div className="pricing-header">
                  <h4 className="title">Business</h4>

                  <div className="pricing">
                    {billing === 'yearly' && (
                      <span
                        style={{
                          textDecoration: 'line-through',
                          opacity: 0.5,
                          marginRight: 8,
                        }}
                      >
                        €228
                      </span>
                    )}

                    <span className="price-text">
                      {billing === 'monthly' ? '€19' : '€190'}
                    </span>

                    <span className="text">
                      {billing === 'monthly' ? '/mês' : '/ano'}
                    </span>
                  </div>
                </div>

                <div className="pricing-body">
                  <ul className="list-style--1">
                    <li>Cartões NFC</li>
                    <li>Vendas</li>
                    <li>Armazenamento avançado</li>
                    <li>Afiliação</li>
                  </ul>
                </div>

                <div className="pricing-footer">
                  <button
                    className="btn-default btn-border"
                    onClick={() => selectPlan('business')}
                  >
                    Desbloquear Business
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ENTERPRISE */}
        <div style={{ textAlign: 'center', marginTop: 80 }}>
          <h4>🏢 Enterprise</h4>
          <p style={{ opacity: 0.8 }}>
            Para empresas e equipas com 20+ cartões
          </p>
          <a href="/contact" className="btn-default btn-border">
            Fala connosco
          </a>
        </div>

      </div>
    </main>
  )
}
