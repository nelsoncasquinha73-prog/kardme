import { emailConfirmationPages, resolveConfirmationLanguage } from '@/lib/i18n/emailConfirmationPages'

export default async function Page({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const params = await searchParams
  const lang = resolveConfirmationLanguage(params.lang)
  const t = emailConfirmationPages[lang]
  return (
    <main dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>{t.successTitle}</h1>
      <p style={{ fontSize: 16, opacity: 0.85 }}>{t.successText}</p>
    </main>
  )
}
