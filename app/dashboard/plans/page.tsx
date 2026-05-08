'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useLanguage } from '@/components/language/LanguageProvider'
import { FiCheck, FiZap, FiLayout, FiBarChart2, FiUsers, FiCreditCard } from 'react-icons/fi'

export default function PlansPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null)

  useEffect(() => {
    const checkPublishedCards = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser()
        if (!authData?.user?.id) return
        
        const { data: cards } = await supabase
          .from('cards')
          .select('id')
          .eq('user_id', authData.user.id)
          .eq('published', true)
          .limit(1)
        
        setHasPublishedCard((cards?.length ?? 0) > 0)
      } catch (e) {
        console.error('Erro ao verificar cartões:', e)
      }
    }
    checkPublishedCards()
  }, [])
  const [error, setError] = useState<string | null>(null)
  const [includeCRMProMonthly, setIncludeCRMProMonthly] = useState(false)
  const [includeCRMProYearly, setIncludeCRMProYearly] = useState(false)
  const [hasPublishedCard, setHasPublishedCard] = useState(false)


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

  const proBenefits = [
    '30+ templates profissionais',
    'Cartões digitais + NFC',
    'Analytics (views, clicks, leads)',
    'Exportar leads (CSV)',
  ]

  const crmProBenefits = [
    'Mensagem de boas-vindas automática',
    'Aviso de nova lead (notificação)',
    'Video Tracking (sabe quem viu)',
    'Email Marketing (campanhas + templates)',
    'Lead Magnets (e-book, raffle, wheel)',
    'Pipeline Kanban (organiza leads)',
    'Follow-ups & Calendário (tarefas)',
    'Qualificação de leads (status, tags, filtros)',
  ]

  const cardStyle = (highlighted: boolean) => ({
    flex: 1,
    minWidth: 280,
    minHeight: 520,
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

  const calculateTotal = (billing: 'monthly' | 'yearly', includeCRM: boolean) => {
    const basePrice = billing === 'monthly' ? 6.99 : 69
    const crmPrice = billing === 'monthly' ? 5.99 : 59
    const total = includeCRM ? basePrice + crmPrice : basePrice
    return total.toFixed(2)
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
              Kardme Pro — Mensal
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

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: hasPublishedCard ? 'pointer' : 'not-allowed', opacity: hasPublishedCard ? 1 : 0.5 }}>
            <input
              type="checkbox"
              checked={includeCRMProMonthly}
              onChange={(e) => setIncludeCRMProMonthly(e.target.checked)}
              disabled={!hasPublishedCard}
              style={{ width: 18, height: 18, accentColor: '#3b82f6' }}
            />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
              Adicionar CRM Pro {hasPublishedCard ? '(recomendado)' : '(publica um cartão primeiro)'} (+€5,99/mês)
            </span>
          </label>

          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
            <p style={{ margin: '0 0 6px', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Total/mês</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>
              €{calculateTotal('monthly', includeCRMProMonthly)}
            </p>
          </div>

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
              Kardme Pro — Anual
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

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: hasPublishedCard ? 'pointer' : 'not-allowed', opacity: hasPublishedCard ? 1 : 0.5 }}>
            <input
              type="checkbox"
              checked={includeCRMProYearly}
              onChange={(e) => setIncludeCRMProYearly(e.target.checked)}
              disabled={!hasPublishedCard}
              style={{ width: 18, height: 18, accentColor: '#3b82f6' }}
            />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
              Adicionar CRM Pro {hasPublishedCard ? '(recomendado)' : '(publica um cartão primeiro)'} (+€59/ano)
            </span>
          </label>

          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
            <p style={{ margin: '0 0 6px', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Total/ano</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>
              €{calculateTotal('yearly', includeCRMProYearly)}
            </p>
          </div>

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


      {/* CRM PRO STANDALONE CARDS */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', marginTop: 20 }}>
        {/* CRM PRO MENSAL */}
        <div style={cardStyle(false)}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
              🧠 CRM Pro
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
              Mensal
            </div>
            <div style={{ fontSize: 12, color: 'rgba(99,102,241,0.7)', marginTop: 6 }}>
              Complemento do Kardme Pro — automação, email, video tracking
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>
                €5,99
              </span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>
                /{t('plans.month') || 'mês'}
              </span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
            <p style={{ margin: '0 0 6px', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Total/mês</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>
              €5,99
            </p>
          </div>

          <button
            onClick={() => startCheckout('monthly', 'monthly')}
            disabled={loading === 'monthly' || !hasPublishedCard}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              cursor: (loading === 'monthly' || !hasPublishedCard) ? 'not-allowed' : 'pointer',
              opacity: (loading === 'monthly' || !hasPublishedCard) ? 0.5 : 1,
              transition: 'all 0.2s',
            }}
          >
            {loading === 'monthly' ? (t('plans.loading') || 'A abrir...') : (t('plans.subscribe') || 'Subscrever')}
          </button>

          {!hasPublishedCard && (
            <p style={{ fontSize: 12, color: 'rgba(255,193,7,0.8)', marginTop: 10, textAlign: 'center' }}>
              ⚠️ Publica um cartão primeiro
            </p>
          )}
        </div>

        {/* CRM PRO ANUAL */}
        <div style={cardStyle(true)}>
          <div style={badgeStyle}>
            {t('plans.recommended') || '⭐ Recomendado'}
          </div>

          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
              🧠 CRM Pro
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
              Anual
            </div>
            <div style={{ fontSize: 12, color: 'rgba(99,102,241,0.7)', marginTop: 6 }}>
              Complemento do Kardme Pro — automação, email, video tracking
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>
                €59
              </span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>
                /{t('plans.year') || 'ano'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, marginTop: 4 }}>
              {t('plans.save_2_months') || 'Poupa 2 meses! 🎉'}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
            <p style={{ margin: '0 0 6px', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Total/ano</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>
              €59,00
            </p>
          </div>

          <button
            onClick={() => startCheckout('yearly', 'yearly')}
            disabled={loading === 'yearly' || !hasPublishedCard}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              cursor: (loading === 'yearly' || !hasPublishedCard) ? 'not-allowed' : 'pointer',
              opacity: (loading === 'yearly' || !hasPublishedCard) ? 0.5 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
            }}
          >
            {loading === 'yearly' ? (t('plans.loading') || 'A abrir...') : (t('plans.subscribe') || 'Subscrever')}
          </button>

          {!hasPublishedCard && (
            <p style={{ fontSize: 12, color: 'rgba(255,193,7,0.8)', marginTop: 10, textAlign: 'center' }}>
              ⚠️ Publica um cartão primeiro
            </p>
          )}
        </div>
      </div>

      {/* O QUE ESTÁ INCLUÍDO */}
      <div style={{ marginTop: 40, maxWidth: 900, margin: '40px auto 0' }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 950, color: 'rgba(255,255,255,0.98)', textAlign: 'center' }}>
          Kardme Pro
        </h2>
        <p style={{ margin: '8px auto 0', color: 'rgba(255,255,255,0.55)', fontSize: 13, textAlign: 'center', maxWidth: 680 }}>
          Escolhe Mensal ou Anual. Se quiseres, adiciona o <b style={{ color: 'rgba(255,255,255,0.85)' }}>CRM Pro</b> para automação, follow-ups e vendas.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
          {/* KARDME PRO */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
              📇 Kardme Pro
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>
              Incluído em todos os planos
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {proBenefits.map((txt) => (
                <div key={txt} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                  <span style={{ color: '#22c55e', fontWeight: 700, marginTop: 2, flexShrink: 0 }}>✓</span>
                  <span>{txt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CRM PRO */}
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
              🧠 CRM Pro (Add-on opcional)
            </div>
            <div style={{ fontSize: 12, color: 'rgba(99,102,241,0.7)', marginBottom: 14 }}>
              Automação, follow-ups e vendas
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {crmProBenefits.map((txt) => (
                <div key={txt} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                  <span style={{ color: '#3b82f6', fontWeight: 700, marginTop: 2, flexShrink: 0 }}>✓</span>
                  <span>{txt}</span>
                </div>
              ))}
            </div>
            {!hasPublishedCard && (
              <div style={{ marginTop: 14, padding: 10, background: 'rgba(255,193,7,0.1)', borderRadius: 8, fontSize: 12, color: 'rgba(255,193,7,0.8)' }}>
                ⚠️ Publica um cartão para ativar o CRM Pro
              </div>
            )}
          </div>
        </div>
      </div>

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
    </div>
  )
}
