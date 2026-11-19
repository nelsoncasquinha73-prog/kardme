'use client'

import Link from 'next/link'
import { LanguageProvider, useLanguage } from '@/components/language/LanguageProvider'
import styles from './marketing.module.css'

function MarketingFooter() {
  const { t } = useLanguage()

  return (
    <footer className={styles.footer}>
      <div className={styles.shell}>
        <p>© {new Date().getFullYear()} Kardme. {t('marketing.rights')}</p>
        <div>
          <Link href="/privacy">{t('marketing.privacy')}</Link>
          <Link href="/terms">{t('marketing.terms')}</Link>
          <a href="mailto:admin@kardme.com">{t('marketing.contact')}</a>
        </div>
      </div>
    </footer>
  )
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className={styles.root}>
        {children}
        <MarketingFooter />
      </div>
    </LanguageProvider>
  )
}
