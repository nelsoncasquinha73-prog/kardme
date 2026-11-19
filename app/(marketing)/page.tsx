'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FiBookOpen, FiCreditCard, FiGift, FiMail, FiShare2, FiUsers } from 'react-icons/fi'
import { supabase } from '@/lib/supabaseClient'
import KardmeShowcase from '@/components/KardmeShowcase'
import { useLanguage } from '@/components/language/LanguageProvider'
import LanguageSelect from './LanguageSelect'
import styles from './marketing.module.css'

const features = [
  { id: 'card', icon: FiCreditCard, image: '/assets/kardme/cards/card-2.png', width: 500, height: 500 },
  { id: 'crm', icon: FiUsers, image: '/assets/kardme/marketing/crm.png', width: 741, height: 470 },
  { id: 'email', icon: FiMail, image: '/assets/kardme/marketing/email.png', width: 305, height: 352 },
] as const

const steps = [
  { id: 'create', icon: FiCreditCard },
  { id: 'share', icon: FiShare2 },
  { id: 'follow', icon: FiUsers },
] as const

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState(false)
  const { lang, t } = useLanguage()
  const copy = (key: string) => t(`marketing.${key}`)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  async function startUpgrade() {
    if (!userId) {
      window.location.href = '/signup'
      return
    }

    setCheckingOut(true)
    setCheckoutError(false)
    try {
      const res = await fetch('/api/stripe/checkout-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, billing: 'monthly' }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error('Checkout URL unavailable')
      window.location.href = data.url
    } catch {
      setCheckoutError(true)
    } finally {
      setCheckingOut(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const formatMoney = (amount: number) => new Intl.NumberFormat(lang, {
    style: 'currency', currency: 'EUR', minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)

  const createAction = (
    <Link href={userId ? '/dashboard/catalog' : '/signup'} className={styles.primary}>
      {userId ? t('landing.go_to_catalog') : copy('create_card')}
    </Link>
  )

  const upgradeAction = (
    <button type="button" className={styles.primary} disabled={checkingOut} onClick={startUpgrade}>
      {checkingOut ? t('plans.loading') : t('landing.upgrade_pro')}
    </button>
  )

  return (
    <>
      <header className={styles.header}>
        <nav className={styles.shell} aria-label={copy('navigation')}>
          <Link href="/" aria-label="Kardme" className={styles.logo}>
            <Image src="/kardme-logo.png" width={182} height={182} alt="" />
          </Link>
          <div className={styles.sections}>
            <a href="#product">{copy('product')}</a>
            <a href="#examples">{copy('examples')}</a>
            <a href="#pricing">{copy('pricing')}</a>
            <a href="#academy">Academy</a>
          </div>
          <div className={styles.navActions}>
            {userId ? (
              <>
                <Link href="/dashboard">{t('nav.dashboard')}</Link>
                <Link href="/dashboard/plans">{t('landing.upgrade')}</Link>
                <button type="button" onClick={logout}>{t('common.logout')}</button>
              </>
            ) : (
              <>
                <Link href="/login">{t('auth.login')}</Link>
                {createAction}
              </>
            )}
            <label className={styles.language}>
              <span className={styles.srOnly}>{copy('language')}</span>
              <LanguageSelect />
            </label>
          </div>
        </nav>
      </header>

      <main id="main-content">
        <section className={styles.hero}>
          <div className={`${styles.shell} ${styles.heroGrid}`}>
            <div>
              <h1>{copy('hero_title')}</h1>
              <p>{copy('hero_body')}</p>
              <div className={styles.actions}>
                {createAction}
                <a className={styles.secondary} href="#examples">{copy('demo')}</a>
                {userId && <Link className={styles.secondary} href="/dashboard">{t('nav.dashboard')}</Link>}
              </div>
            </div>
            <a href="#examples" className={styles.heroVisual} aria-label={copy('demo')}>
              <Image src="/assets/kardme/cards/card-1.png" width={500} height={500}
                sizes="(max-width: 800px) 85vw, 470px" alt={copy('card_alt')} preload />
            </a>
          </div>
        </section>

        <div id="product">
          {features.map(({ id, icon: Icon, image, width, height }) => (
            <section key={id} className={`${styles.section} ${id === 'crm' ? styles.dark : styles.light}`}>
              <div className={`${styles.shell} ${styles.split} ${id === 'crm' ? styles.reverse : ''}`}>
                <div>
                  <span className={styles.featureIcon}><Icon aria-hidden="true" /></span>
                  {id !== 'card' && <span className={styles.tag}>CRM Pro</span>}
                  <h2>{copy(`${id}_title`)}</h2>
                  <p>{copy(`${id}_body`)}</p>
                </div>
                <figure className={id === 'crm' ? styles.capture : styles.cardFrame}>
                  <Image src={image} width={width} height={height}
                    className={id === 'email' ? styles.emailCapture : undefined}
                    sizes={id === 'email' ? '305px' : '(max-width: 800px) 92vw, 640px'}
                    alt={copy(`${id}_alt`)} />
                </figure>
              </div>
            </section>
          ))}

          <section className={`${styles.section} ${styles.dark}`}>
            <div className={`${styles.shell} ${styles.split} ${styles.reverse}`}>
              <div>
                <span className={styles.featureIcon}><FiGift aria-hidden="true" /></span>
                <span className={styles.tag}>CRM Pro</span>
                <h2>{copy('magnets_title')}</h2>
                <p>{copy('magnets_body')}</p>
                <ul className={styles.magnetList}>
                  {['ebook', 'raffle', 'wheel'].map((type) => (
                    <li key={type}>{copy(type)}</li>
                  ))}
                </ul>
              </div>
              <figure className={`${styles.capture} ${styles.magnetCapture}`}>
                <Image src="/assets/kardme/marketing/lead-magnet.png" width={490} height={570}
                  sizes="(max-width: 500px) 92vw, 400px" alt={copy('magnets_alt')} />
              </figure>
            </div>
          </section>
        </div>

        <section id="examples" className={`${styles.section} ${styles.light}`}>
          <div className={`${styles.shell} ${styles.split}`}>
            <div>
              <h2>{copy('examples_title')}</h2>
              <p>{copy('examples_body')}</p>
            </div>
            <KardmeShowcase />
          </div>
        </section>

        <section className={`${styles.section} ${styles.dark}`}>
          <div className={styles.shell}>
            <h2>{copy('steps_title')}</h2>
            <ol className={styles.grid}>
              {steps.map(({ id, icon: Icon }) => (
                <li key={id} className={styles.panel}>
                  <span className={styles.featureIcon}><Icon aria-hidden="true" /></span>
                  <h3>{copy(`step_${id}`)}</h3>
                  <p>{copy(`step_${id}_body`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="pricing" className={`${styles.section} ${styles.light}`}>
          <div className={styles.shell}>
            <h2>{copy('pricing')}</h2>
            <p>{copy('pricing_body')}</p>
            <div className={styles.grid}>
              <article className={`${styles.panel} ${styles.featured}`}>
                <h3>{copy('card_title')}</h3>
                <p>{copy('per_card')}</p>
                <p className={styles.price}><bdi>{formatMoney(6.99)}</bdi> <small>/ {t('landing.month')}</small></p>
                <p><bdi>{formatMoney(69)}</bdi> / {copy('year')}</p>
                {userId ? upgradeAction : <Link className={styles.primary} href="/signup">{copy('create_card')}</Link>}
                {userId
                  ? <Link className={styles.textLink} href="/dashboard/plans">{copy('view_plans')}</Link>
                  : <Link className={styles.textLink} href="/signup">{copy('annual_signup')}</Link>}
              </article>
              <article className={styles.panel}>
                <h3>CRM Pro</h3>
                <p>{copy('addon')}</p>
                <p className={styles.price}><bdi>{formatMoney(5.99)}</bdi> <small>/ {t('landing.month')}</small></p>
                <p><bdi>{formatMoney(59)}</bdi> / {copy('year')}</p>
                <p className={styles.bundle}>{copy('bundle')} <strong><bdi>{formatMoney(69 + 59)}</bdi> / {copy('year')}</strong></p>
              </article>
              <article className={styles.panel}>
                <h3>{copy('teams')}</h3>
                <p>{copy('teams_body')}</p>
                <a className={styles.secondary} href="mailto:hello@kardme.com">{copy('contact')}</a>
              </article>
            </div>
          </div>
        </section>

        <section id="academy" className={`${styles.section} ${styles.dark}`}>
          <div className={`${styles.shell} ${styles.academy}`}>
            <div>
              <span className={styles.featureIcon}><FiBookOpen aria-hidden="true" /></span>
              <h2>Kardme Academy</h2>
              <p>{copy('academy_body')}</p>
            </div>
            <div className={styles.actions}>
              {userId
                ? <Link className={styles.primary} href="/dashboard/biblioteca">{copy('academy_open')}</Link>
                : <Link className={styles.primary} href="/login">{copy('academy_login')}</Link>}
              <a className={styles.secondary} href="#examples">{copy('demo')}</a>
            </div>
          </div>
        </section>

        <section className={styles.final}>
          <div className={styles.shell}>
            <h2>{copy('final_title')}</h2>
            <div className={styles.actions}>
              {createAction}
              {userId && upgradeAction}
            </div>
          </div>
        </section>
        <span role="status" className={styles.srOnly}>{checkoutError ? t('plans.error_checkout') : ''}</span>
        {checkoutError && <p className={styles.error}>{t('plans.error_checkout')}</p>}
      </main>
    </>
  )
}
