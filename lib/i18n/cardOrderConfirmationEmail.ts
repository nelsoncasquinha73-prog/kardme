export const confirmationEmailTranslations = {
  'pt-PT': {
    subject: 'Kardme — Recebemos o teu pedido',
    title: 'Pedido recebido com sucesso!',
    greeting: 'Olá',
    message: 'Recebemos o teu pedido de cartão digital e vamos analisar as informações enviadas.',
    followup: 'Se precisarmos de esclarecer algum detalhe, entraremos em contacto contigo.',
    signature: 'A equipa Kardme',
  },
  'pt-BR': {
    subject: 'Kardme — Recebemos seu pedido',
    title: 'Pedido recebido com sucesso!',
    greeting: 'Olá',
    message: 'Recebemos seu pedido de cartão digital e vamos analisar as informações enviadas.',
    followup: 'Se precisarmos esclarecer algum detalhe, entraremos em contato.',
    signature: 'Equipe Kardme',
  },
  en: {
    subject: 'Kardme — We received your request',
    title: 'Request received successfully!',
    greeting: 'Hello',
    message: 'We received your digital business card request and will review the information you submitted.',
    followup: 'If we need any clarification, we will contact you.',
    signature: 'The Kardme team',
  },
  it: {
    subject: 'Kardme — Abbiamo ricevuto la tua richiesta',
    title: 'Richiesta ricevuta con successo!',
    greeting: 'Ciao',
    message: 'Abbiamo ricevuto la tua richiesta per il biglietto da visita digitale e verificheremo le informazioni inviate.',
    followup: 'Se avremo bisogno di chiarimenti, ti contatteremo.',
    signature: 'Il team Kardme',
  },
  de: {
    subject: 'Kardme — Wir haben deine Anfrage erhalten',
    title: 'Anfrage erfolgreich erhalten!',
    greeting: 'Hallo',
    message: 'Wir haben deine Anfrage für eine digitale Visitenkarte erhalten und werden deine Angaben prüfen.',
    followup: 'Falls wir Rückfragen haben, werden wir dich kontaktieren.',
    signature: 'Das Kardme-Team',
  },
  es: {
    subject: 'Kardme — Hemos recibido tu solicitud',
    title: '¡Solicitud recibida correctamente!',
    greeting: 'Hola',
    message: 'Hemos recibido tu solicitud de tarjeta digital y revisaremos la información que has enviado.',
    followup: 'Si necesitamos alguna aclaración, nos pondremos en contacto contigo.',
    signature: 'El equipo Kardme',
  },
  fr: {
    subject: 'Kardme — Nous avons reçu ta demande',
    title: 'Demande reçue avec succès !',
    greeting: 'Bonjour',
    message: 'Nous avons reçu ta demande de carte de visite numérique et allons examiner les informations envoyées.',
    followup: 'Si nous avons besoin de précisions, nous te contacterons.',
    signature: 'L’équipe Kardme',
  },
  ar: {
    subject: 'Kardme — تم استلام طلبك',
    title: 'تم استلام الطلب بنجاح!',
    greeting: 'مرحباً',
    message: 'لقد استلمنا طلب بطاقتك الرقمية وسنراجع المعلومات التي أرسلتها.',
    followup: 'إذا احتجنا إلى أي توضيح، فسنتواصل معك.',
    signature: 'فريق Kardme',
  },
} as const

export function getConfirmationEmailTranslation(language: string) {
  return confirmationEmailTranslations[
    language in confirmationEmailTranslations
      ? language as keyof typeof confirmationEmailTranslations
      : 'pt-PT'
  ]
}
