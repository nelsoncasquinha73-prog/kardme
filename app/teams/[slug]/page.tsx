'use client'

import { useParams } from 'next/navigation'
import { useRef, useState, type FormEvent } from 'react'

const languages = {
  'pt-PT': { name: 'Português (Portugal)', title: 'Pede o teu cartão Kardme', subtitle: 'Preenche os teus dados para começares.' },
  'pt-BR': { name: 'Português (Brasil)', title: 'Solicite seu cartão Kardme', subtitle: 'Preencha seus dados para começar.' },
  en: { name: 'English', title: 'Request your Kardme card', subtitle: 'Fill in your details to get started.' },
  it: { name: 'Italiano', title: 'Richiedi la tua Kardme', subtitle: 'Inserisci i tuoi dati per iniziare.' },
  de: { name: 'Deutsch', title: 'Fordere deine Kardme-Karte an', subtitle: 'Gib deine Daten ein, um zu beginnen.' },
  es: { name: 'Español', title: 'Solicita tu tarjeta Kardme', subtitle: 'Introduce tus datos para empezar.' },
  fr: { name: 'Français', title: 'Demandez votre carte Kardme', subtitle: 'Renseignez vos informations pour commencer.' },
  ar: { name: 'العربية', title: 'اطلب بطاقة Kardme الخاصة بك', subtitle: 'أدخل بياناتك للبدء.' },
}

const emailInstructions = {
  'pt-PT': { before: 'Depois de enviares o pedido, receberás um email com um link pessoal para completares o teu cartão Kardme.', after: 'O próximo passo é abrir o email com o teu link pessoal para completares o cartão. Verifica também a pasta Spam.' },
  'pt-BR': { before: 'Após enviar a solicitação, você receberá um e-mail com um link pessoal para completar seu cartão Kardme.', after: 'Agora, abra o e-mail com seu link pessoal para completar o cartão. Verifique também a pasta Spam.' },
  'en': { before: 'After submitting, you will receive an email with a personal link to complete your Kardme card.', after: 'Next, open the email with your personal link to complete your card. Check your Spam folder too.' },
  'it': { before: 'Dopo aver inviato la richiesta, riceverai un’email con un link personale per completare la tua Kardme.', after: 'Ora apri l’email con il tuo link personale per completare la tua Kardme. Controlla anche la cartella Spam.' },
  'de': { before: 'Nach dem Absenden erhältst du eine E-Mail mit einem persönlichen Link zur Fertigstellung deiner Kardme-Karte.', after: 'Öffne die E-Mail mit deinem persönlichen Link. Prüfe auch deinen Spam-Ordner.' },
  'es': { before: 'Después de enviar la solicitud, recibirás un correo con un enlace personal para completar tu tarjeta Kardme.', after: 'Ahora abre el correo con tu enlace personal. Revisa también la carpeta de spam.' },
  'fr': { before: 'Après l’envoi, vous recevrez un e-mail avec un lien personnel pour compléter votre carte Kardme.', after: 'Ouvrez maintenant l’e-mail contenant votre lien personnel. Vérifiez également vos spams.' },
  'ar': { before: 'بعد إرسال الطلب، ستتلقى رسالة بريد إلكتروني تحتوي على رابط شخصي لإكمال بطاقة Kardme.', after: 'افتح رسالة البريد الإلكتروني التي تحتوي على رابطك الشخصي لإكمال بطاقتك. تحقق أيضًا من مجلد الرسائل غير المرغوب فيها.' },
} as const

type Lang = keyof typeof languages

export default function TeamPage() {
  const params = useParams()
  const slug = String(params.slug || '')
  const [lang, setLang] = useState<Lang>('it')
  const t = languages[lang]
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const idempotencyKey = useRef<string | null>(null)

  const labels: Record<Lang, {
    name: string; email: string; phone: string;
    consent: string; submit: string; success: string; error: string
  }> = {
    'pt-PT': { name: 'Nome completo', email: 'Email', phone: 'Telemóvel', consent: 'Li e aceito a Política de Privacidade e o tratamento dos meus dados para este pedido.', submit: 'Enviar pedido', success: 'Pedido recebido com sucesso!', error: 'Não foi possível enviar o pedido.' },
    'pt-BR': { name: 'Nome completo', email: 'E-mail', phone: 'Celular', consent: 'Li e aceito a Política de Privacidade e o tratamento dos meus dados para esta solicitação.', submit: 'Enviar solicitação', success: 'Solicitação recebida com sucesso!', error: 'Não foi possível enviar a solicitação.' },
    en: { name: 'Full name', email: 'Email', phone: 'Phone', consent: 'I have read and accept the Privacy Policy and the processing of my data for this request.', submit: 'Send request', success: 'Request received successfully!', error: 'Unable to send request.' },
    it: { name: 'Nome e cognome', email: 'Email', phone: 'Telefono', consent: 'Ho letto e accetto l’Informativa sulla Privacy e il trattamento dei miei dati per questa richiesta.', submit: 'Invia richiesta', success: 'Richiesta ricevuta con successo!', error: 'Impossibile inviare la richiesta.' },
    de: { name: 'Vollständiger Name', email: 'E-Mail', phone: 'Telefon', consent: 'Ich habe die Datenschutzerklärung gelesen und akzeptiere die Verarbeitung meiner Daten für diese Anfrage.', submit: 'Anfrage senden', success: 'Anfrage erfolgreich erhalten!', error: 'Anfrage konnte nicht gesendet werden.' },
    es: { name: 'Nombre completo', email: 'Correo electrónico', phone: 'Teléfono', consent: 'He leído y acepto la Política de Privacidad y el tratamiento de mis datos para esta solicitud.', submit: 'Enviar solicitud', success: '¡Solicitud recibida!', error: 'No se pudo enviar la solicitud.' },
    fr: { name: 'Nom complet', email: 'E-mail', phone: 'Téléphone', consent: 'J’ai lu et j’accepte la Politique de confidentialité et le traitement de mes données pour cette demande.', submit: 'Envoyer la demande', success: 'Demande reçue !', error: 'Impossible d’envoyer la demande.' },
    ar: { name: 'الاسم الكامل', email: 'البريد الإلكتروني', phone: 'الهاتف', consent: 'قرأت سياسة الخصوصية وأوافق على معالجة بياناتي لهذا الطلب.', submit: 'إرسال الطلب', success: 'تم استلام الطلب بنجاح!', error: 'تعذر إرسال الطلب.' },
  }

  const l = labels[lang]

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting || !consent) return

    setSubmitting(true)
    setMessage('')

    if (!idempotencyKey.current) {
      idempotencyKey.current = crypto.randomUUID()
    }

    try {
      const res = await fetch(`/api/teams/${encodeURIComponent(slug)}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, phone, language: lang,
          privacyConsent: consent,
          idempotencyKey: idempotencyKey.current,
        }),
      })

      if (!res.ok) throw new Error('Submission failed')

      setSuccess(true)
      setMessage(l.success)
    } catch {
      setMessage(l.error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main
      lang={lang}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg,#050b19,#111d40,#28114d)',
        color: '#fff',
        padding: '40px 20px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: 650, margin: 'auto' }}>
        <header style={{ textAlign: 'center', marginBottom: 35 }}>
          <h1 style={{
            fontSize: 48,
            fontWeight: 900,
            background: 'linear-gradient(90deg,#00d9ff,#e341ed)',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            KARDME
          </h1>
          <p style={{ letterSpacing: 4, fontSize: 12 }}>
            CONNECTING PEOPLE
          </p>
        </header>

        <section style={{
          background: 'rgba(255,255,255,.07)',
          border: '1px solid rgba(255,255,255,.15)',
          borderRadius: 20,
          padding: 30,
        }}>
          <div style={{ marginBottom: 25 }}>
            <label htmlFor="language">Language / Idioma</label>
            <select
              id="language"
              value={lang}
              onChange={e => setLang(e.target.value as Lang)}
              style={{
                display: 'block',
                width: '100%',
                padding: 12,
                marginTop: 8,
                borderRadius: 8,
                color: '#111',
                background: '#fff',
              }}
            >
              {Object.entries(languages).map(([code, item]) => (
                <option key={code} value={code}>{item.name}</option>
              ))}
            </select>
          </div>

          <p style={{ color: '#38bdf8', fontWeight: 700 }}>
            {slug.replace(/-/g, ' ').toUpperCase()}
          </p>

          <h2 style={{ fontSize: 28, marginTop: 15 }}>{t.title}</h2>
          <p style={{ color: '#cbd5e1', marginTop: 10 }}>{t.subtitle}</p>

          {success ? (
            <p role="status" style={{ marginTop: 30, color: '#67e8f9' }}>
              {message}
                <span style={{
                  display: 'block',
                  marginTop: 12,
                  lineHeight: 1.7,
                }}>
                  {emailInstructions[lang].after}
                </span>
            </p>
          ) : (
            <form onSubmit={submit} style={{ marginTop: 25 }}>
              {([
                ['name', l.name, name, setName, 'text', true],
                ['email', l.email, email, setEmail, 'email', true],
                ['phone', l.phone, phone, setPhone, 'tel', false],
              ] as const).map(([id, label, value, setter, type, required]) => (
                <div key={id} style={{ marginBottom: 18 }}>
                  <label htmlFor={id} style={{ display: 'block', marginBottom: 7 }}>
                    {label}
                  </label>
                  <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={e => setter(e.target.value)}
                    required={required}
                    maxLength={id === 'name' ? 150 : id === 'email' ? 254 : 40}
                    style={{
                      width: '100%', padding: 13, borderRadius: 8,
                      border: '1px solid #64748b', color: '#111',
                      background: '#fff', boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}

              <label style={{
                display: 'flex', alignItems: 'flex-start',
                gap: 12, marginTop: 20, fontSize: 14,
              }}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                  required
                />
                <span>
                  {l.consent}{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer"
                    style={{ color: '#67e8f9', textDecoration: 'underline' }}>
                    Privacy Policy
                  </a>
                </span>
              </label>

              {message && <p role="alert" style={{ color: '#fca5a5' }}>{message}</p>}

              <p style={{
                  marginTop: 20,
                  color: '#cbd5e1',
                  fontSize: 14,
                  lineHeight: 1.6,
                }}>
                  {emailInstructions[lang].before}
                </p>

                <button
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: 25, width: '100%', padding: 15,
                  border: 'none', borderRadius: 10, fontWeight: 700,
                  color: '#fff', cursor: submitting ? 'wait' : 'pointer',
                  background: 'linear-gradient(90deg,#0284c7,#9333ea)',
                  opacity: submitting ? 0.65 : 1,
                }}
              >
                {submitting ? '...' : l.submit}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}
