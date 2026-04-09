'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useLanguage } from '@/components/language/LanguageProvider'
import { FiCheck, FiZap, FiLayout, FiBarChart2, FiUsers, FiCreditCard } from 'react-icons/fi'

export default function PlansPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [includeCRMProMonthly, setIncludeCRMProMonthly] = useState(false)
  const [includeCRMProYearly, setIncludeCRMProYearly] = useState(false)
  const [showCRMProModal, setShowCRMProModal] = useState(false)


  const startCheckout = async (billing: 'monthly' | 'yearly', upsell_cycle?: string | null) => {
    setLoading(billing)
    setError(null)

    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser()
      if (authErr || !authData?.user?.id) {
        setError(t('plans.error_no_session') || 'Sem sessão. Faz login novamente.')
        setLoading(null)
        return
      }

      const payload: any = {
        user_id: authData.user.id,
        billing,
        upsell_crm_pro: upsell_cycle ? true : false,
        upsell_cycle: upsell_cycle || null,
      }

      const res = await fetch('/api/stripe/checkout-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || t('plans.error_checkout') || 'Erro ao iniciar checkout.')
        setLoading(null)
        return
      }

      if (data?.url) window.location.href = data.url
      else setError(t('plans.error_no_url') || 'Checkout sem URL.')
    } catch {
      setError(t('plans.error_checkout') || 'Erro ao iniciar checkout.')
    } finally {
      setLoading(null)
    }
  }

  const benefits = [
    { icon: FiLayout, label: t('plans.benefit_templates') || '30+ templates incluídos' },
    { icon: FiBarChart2, label: t('plans.benefit_analytics') || 'Analytics completo' },
    { icon: FiUsers, label: t('plans.benefit_leads') || 'Gestão de leads/contactos' },
    { icon: FiZap, label: t('plans.benefit_nfc') || 'NFC disponível (compra única)' },
    { icon: FiCreditCard, label: t('plans.benefit_billing') || 'Faturação e portal de cliente' },
  ]

  const cardStyle = (highlighted: boolean) => ({
    flex: 1,
    background: highlighted
      ? 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.10))'
      : 'rgba(255,255,255,0.03)',
    border: highlighted
      ? '2px solid rgba(59,130,246,0.5)'
      : '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 28,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
    position: 'relative' as const,
  })

  const badgeStyle = {
    position: 'absolute' as const,
    top: -12,
    right: 20,
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    padding: '6px 12px',
    borderRadius: 20,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: 'rgba(255,255,255,0.95)', margin: 0 }}>
          {t('plans.title') || 'Escolhe o teu plano'}
        </h1>
        <p style={{ marginTop: 12, color: 'rgba(255,255,255,0.6)', fontSize: 16, maxWidth: 500, margin: '12px auto 0' }}>
          {t('plans.subtitle') || 'Desbloqueia templates premium, analytics e muito mais.'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* MENSAL */}
        <div style={cardStyle(false)}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
              {t('plans.monthly') || 'Mensal'}
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>
                €6,99
              </span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>
                /{t('plans.month') || 'mês'}
              </span>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeCRMProMonthly}
              onChange={(e) => setIncludeCRMProMonthly(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: '#3b82f6' }}
            />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
              Adicionar CRM Pro (recomendado) (+€5,99/mês)
            </span>
          </label>

          <button
            onClick={() => startCheckout('monthly', includeCRMProMonthly ? 'monthly' : null)}
            disabled={loading === 'monthly'}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              cursor: loading === 'monthly' ? 'not-allowed' : 'pointer',
              opacity: loading === 'monthly' ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
          >
            {loading === 'monthly' ? (t('plans.loading') || 'A abrir...') : (t('plans.subscribe') || 'Subscrever')}
          </button>
        </div>

        {/* ANUAL (DESTACADO) */}
        <div style={cardStyle(true)}>
          <div style={badgeStyle}>
            {t('plans.recommended') || '⭐ Recomendado'}
          </div>

          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
              {t('plans.yearly') || 'Anual'}
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>
                €69
              </span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>
                /{t('plans.year') || 'ano'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, marginTop: 4 }}>
              {t('plans.save_2_months') || 'Poupa 2 meses! 🎉'}
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeCRMProYearly}
              onChange={(e) => setIncludeCRMProYearly(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: '#3b82f6' }}
            />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
              Adicionar CRM Pro (recomendado) (+€59/ano)
            </span>
          </label>

          <button
            onClick={() => startCheckout('yearly', includeCRMProYearly ? 'yearly' : null)}
            disabled={loading === 'yearly'}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              cursor: loading === 'yearly' ? 'not-allowed' : 'pointer',
              opacity: loading === 'yearly' ? 0.7 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
            }}
          >
            {loading === 'yearly' ? (t('plans.loading') || 'A abrir...') : (t('plans.subscribe') || 'Subscrever')}
          </button>
        </div>

        {/* CRM PRO ADD-ON */}
        <div style={cardStyle(false)}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
              CRM Pro
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              Gestão de leads, email em massa, tarefas e muito mais.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {['📋 Leads ilimitadas','📧 Email em massa','📅 Calendário','📊 Pipeline','📥 CSV','🔗 Gmail'].map(f => (
                <span key={f} style={{ fontSize: 11, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: '3px 10px', color: 'rgba(255,255,255,0.8)' }}>{f}</span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => setShowCRMProModal(true)}
              style={{ width: '100%', padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
            >
              ℹ️ Saber mais sobre o CRM Pro
            </button>
            <button
              onClick={async () => {
                setLoading('monthly')
                try {
                  const { data: authData } = await supabase.auth.getUser()
                  if (!authData?.user?.id) {
                    setError('Sem sessão. Faz login novamente.')
                    setLoading(null)
                    return
                  }

                  const res = await fetch('/api/stripe/checkout-crm-pro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: authData.user.id,
                      billingCycle: 'monthly',
                    }),
                  })

                  const data = await res.json()
                  if (data?.url) window.location.href = data.url
                  else setError(data?.error || 'Erro ao iniciar checkout.')
                } catch (e) {
                  setError('Erro ao iniciar checkout.')
                } finally {
                  setLoading(null)
                }
              }}
              disabled={loading === 'monthly'}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: loading === 'monthly' ? 'not-allowed' : 'pointer',
                opacity: loading === 'monthly' ? 0.7 : 1,
              }}
            >
              {loading === 'monthly' ? 'A abrir...' : '💳 Ativar Mensal — €5,99'}
            </button>

            <button
              onClick={async () => {
                setLoading('yearly')
                try {
                  const { data: authData } = await supabase.auth.getUser()
                  if (!authData?.user?.id) {
                    setError('Sem sessão. Faz login novamente.')
                    setLoading(null)
                    return
                  }

                  const res = await fetch('/api/stripe/checkout-crm-pro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: authData.user.id,
                      billingCycle: 'annual',
                    }),
                  })

                  const data = await res.json()
                  if (data?.url) window.location.href = data.url
                  else setError(data?.error || 'Erro ao iniciar checkout.')
                } catch (e) {
                  setError('Erro ao iniciar checkout.')
                } finally {
                  setLoading(null)
                }
              }}
              disabled={loading === 'yearly'}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(59,130,246,0.2)',
                color: '#3b82f6',
                fontWeight: 700,
                fontSize: 13,
                cursor: loading === 'yearly' ? 'not-allowed' : 'pointer',
                opacity: loading === 'yearly' ? 0.7 : 1,
              }}
            >
              {loading === 'yearly' ? 'A abrir...' : '💳 Ativar Anual — €59'}
            </button>
          </div>
        </div>

      </div>

      {/* BENEFÍCIOS */}
      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 20 }}>
          {t('plans.whats_included') || 'O que está incluído'}
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
          {benefits.map((b, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.05)',
                padding: '10px 16px',
                borderRadius: 12,
                fontSize: 13,
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              <b.icon size={16} style={{ color: '#3b82f6' }} />
              {b.label}
            </div>
          ))}
        </div>
      </div>

      {/* NOTA NFC */}
      <div style={{ marginTop: 32, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
        {t('plans.nfc_note') || 'NFC é uma compra única por cartão e requer Pro ativo.'}
      </div>

      {/* ERRO */}

      {/* MODAL CRM PRO */}
      {showCRMProModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#1e1e2e', borderRadius: 20, padding: 32, maxWidth: 520, width: '100%', border: '1px solid rgba(99,102,241,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>🧠 CRM Pro</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>O teu sistema de gestão de clientes completo</div>
              </div>
              <button onClick={() => setShowCRMProModal(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 18, cursor: 'pointer', padding: '4px 10px' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
              {[
                { icon: '📋', title: 'Leads ilimitadas', desc: 'Captura e gere todos os teus contactos num só lugar.' },
                { icon: '📧', title: 'Email em massa', desc: 'Envia campanhas personalizadas com templates profissionais.' },
                { icon: '📅', title: 'Calendário de tarefas', desc: 'Agenda follow-ups, reuniões e chamadas com alertas.' },
                { icon: '📊', title: 'Pipeline visual', desc: 'Acompanha cada lead pelo funil de vendas.' },
                { icon: '📥', title: 'Import/Export CSV', desc: 'Importa leads de outras ferramentas ou exporta para Excel.' },
                { icon: '🔗', title: 'Gmail integrado', desc: 'Envia emails diretamente da tua conta Gmail.' },
                { icon: '📝', title: 'Templates de email', desc: 'Cria e reutiliza templates para poupar tempo.' },
                { icon: '🤝', title: 'Mensagem de boas-vindas', desc: 'Envia automaticamente quando um lead preenche o formulário.' },
              ].map(f => (
                <div key={f.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12 }}>
                  <span style={{ fontSize: 22 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>Escolhe o teu plano</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  onClick={async () => {
                    setShowCRMProModal(false); setLoading('monthly')
                    try {
                      const { data: authData } = await supabase.auth.getUser()
                      if (!authData?.user?.id) { setError('Sem sessão.'); setLoading(null); return }
                      const res = await fetch('/api/stripe/checkout-crm-pro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: authData.user.id, billingCycle: 'monthly' }) })
                      const d = await res.json()
                      if (d?.url) window.location.href = d.url; else setError(d?.error || 'Erro.')
                    } catch { setError('Erro.') } finally { setLoading(null) }
                  }}
                  style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                  Mensal<br/><span style={{ fontSize: 18, fontWeight: 900 }}>€5,99</span><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>/mês</span>
                </button>
                <button
                  onClick={async () => {
                    setShowCRMProModal(false); setLoading('yearly')
                    try {
                      const { data: authData } = await supabase.auth.getUser()
                      if (!authData?.user?.id) { setError('Sem sessão.'); setLoading(null); return }
                      const res = await fetch('/api/stripe/checkout-crm-pro', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: authData.user.id, billingCycle: 'annual' }) })
                      const d = await res.json()
                      if (d?.url) window.location.href = d.url; else setError(d?.error || 'Erro.')
                    } catch { setError('Erro.') } finally { setLoading(null) }
                  }}
                  style={{ padding: '14px 16px', borderRadius: 10, border: '1px solid rgba(99,102,241,0.5)', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                  Anual 🎉<br/><span style={{ fontSize: 18, fontWeight: 900 }}>€59</span><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>/ano</span>
                </button>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Poupa 18% com o plano anual</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 24,
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.30)',
            borderRadius: 12,
            padding: '12px 16px',
            color: 'rgba(252,165,165,0.95)',
            fontSize: 13,
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}
