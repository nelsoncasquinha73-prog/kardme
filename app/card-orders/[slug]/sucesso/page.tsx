'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { use } from 'react'

const successTranslations = {
  'pt-PT': {
    title: 'Pedido submetido',
    reference: 'Referência',
    description: 'Obrigado! Recebemos o teu pedido e vamos avançar com a produção. Se for preciso confirmar algum detalhe, vamos contactar-te em breve.',
    tip: 'Se te esqueceste de alguma coisa, envia-nos a informação por WhatsApp ou email.',
    whatsapp: 'Falar no WhatsApp',
    back: 'Voltar ao pedido',
    close: 'Fechar',
    whatsappMessage: 'Olá! Submeti o meu pedido Kardme. Referência:',
  },
  'pt-BR': {
    title: 'Pedido enviado',
    reference: 'Referência',
    description: 'Obrigado! Recebemos sua solicitação e vamos iniciar a produção. Entraremos em contato se precisarmos de mais informações.',
    tip: 'Esqueceu alguma informação? Envie-nos pelo WhatsApp ou e-mail.',
    whatsapp: 'Falar no WhatsApp',
    back: 'Voltar à solicitação',
    close: 'Fechar',
    whatsappMessage: 'Olá! Enviei meu pedido Kardme. Referência:',
  },
  'en': {
    title: 'Request submitted',
    reference: 'Reference',
    description: 'Thank you! We received your request and will proceed with production. We will contact you if we need further details.',
    tip: 'Forgot something? Send us the information via WhatsApp or email.',
    whatsapp: 'Chat on WhatsApp',
    back: 'Back to request',
    close: 'Close',
    whatsappMessage: 'Hello! I submitted my Kardme request. Reference:',
  },
  'it': {
    title: 'Richiesta inviata',
    reference: 'Riferimento',
    description: 'Grazie! Abbiamo ricevuto la tua richiesta e procederemo con la realizzazione. Ti contatteremo se avremo bisogno di ulteriori informazioni.',
    tip: 'Hai dimenticato qualcosa? Scrivici su WhatsApp o via email.',
    whatsapp: 'Scrivici su WhatsApp',
    back: 'Torna alla richiesta',
    close: 'Chiudi',
    whatsappMessage: 'Ciao! Ho inviato la mia richiesta Kardme. Riferimento:',
  },
  'de': {
    title: 'Anfrage gesendet',
    reference: 'Referenz',
    description: 'Vielen Dank! Wir haben deine Anfrage erhalten und beginnen mit der Erstellung. Bei Fragen melden wir uns.',
    tip: 'Etwas vergessen? Sende uns die Informationen per WhatsApp oder E-Mail.',
    whatsapp: 'Per WhatsApp schreiben',
    back: 'Zurück zur Anfrage',
    close: 'Schließen',
    whatsappMessage: 'Hallo! Ich habe meine Kardme-Anfrage gesendet. Referenz:',
  },
  'es': {
    title: 'Solicitud enviada',
    reference: 'Referencia',
    description: '¡Gracias! Hemos recibido tu solicitud y comenzaremos la producción. Te contactaremos si necesitamos más información.',
    tip: '¿Olvidaste algún dato? Envíanoslo por WhatsApp o correo electrónico.',
    whatsapp: 'Hablar por WhatsApp',
    back: 'Volver a la solicitud',
    close: 'Cerrar',
    whatsappMessage: '¡Hola! He enviado mi solicitud Kardme. Referencia:',
  },
  'fr': {
    title: 'Demande envoyée',
    reference: 'Référence',
    description: 'Merci ! Nous avons reçu votre demande et allons commencer la réalisation. Nous vous contacterons si nécessaire.',
    tip: 'Une information oubliée ? Envoyez-la-nous par WhatsApp ou e-mail.',
    whatsapp: 'Nous écrire sur WhatsApp',
    back: 'Retour à la demande',
    close: 'Fermer',
    whatsappMessage: 'Bonjour ! J’ai envoyé ma demande Kardme. Référence :',
  },
  'ar': {
    title: 'تم إرسال الطلب',
    reference: 'رقم المرجع',
    description: 'شكرًا لك! تلقينا طلبك وسنبدأ في إعداده. سنتواصل معك إذا احتجنا إلى معلومات إضافية.',
    tip: 'هل نسيت معلومة؟ أرسلها عبر واتساب أو البريد الإلكتروني.',
    whatsapp: 'تواصل عبر واتساب',
    back: 'العودة إلى الطلب',
    close: 'إغلاق',
    whatsappMessage: 'مرحبًا! أرسلت طلب Kardme. رقم المرجع:',
  },
} as const

export default function SucessoPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedLang = searchParams.get('lang') || 'pt-PT'
  const lang = requestedLang in successTranslations
    ? requestedLang as keyof typeof successTranslations
    : 'pt-PT'
  const t = successTranslations[lang]
  const { slug } = use(params)

  const whatsappMessage = encodeURIComponent(
    `${t.whatsappMessage} ${slug}`
  )
  const whatsappLink = `https://wa.me/?text=${whatsappMessage}`

  return (
    <div lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 16,
        padding: 40,
        maxWidth: 560,
        width: '100%',
        textAlign: 'left',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 900,
            color: '#fff',
          }}>
            ✓
          </div>
          <div>
            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: 0 }}>
              {t.title}
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: '4px 0 0 0', fontSize: 13 }}>
              {t.reference}: <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>{slug}</span>
            </p>
          </div>
        </div>

        <p style={{
          color: 'rgba(255,255,255,0.75)',
          fontSize: 14,
          lineHeight: 1.6,
          marginBottom: 18,
        }}>
          {t.description}
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 18,
        }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, margin: 0 }}>
            {t.tip}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '12px 14px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 13,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            💬 {t.whatsapp}
          </a>

          <button
            onClick={() => router.push(`/card-orders/${slug}`)}
            style={{
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ← {t.back}
          </button>

          <button
            onClick={() => router.push('/')}
            style={{
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  )
}
