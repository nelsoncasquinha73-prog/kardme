export const cardOrderEmailTranslations = {
  'pt-PT': {
    subject: 'Kardme - Completa o teu cartão digital',
    welcome: 'Bem-vindo ao Kardme!',
    hello: 'Olá',
    received: 'Recebemos o teu pedido.',
    instructions: 'Podes completar o teu cartão digital aqui:',
    button: 'Completar o meu Kardme',
    expiry: 'Este link é pessoal e expira ao fim de 7 dias.',
    signature: 'A equipa Kardme',
  },
  'pt-BR': {
    subject: 'Kardme - Complete seu cartão digital',
    welcome: 'Boas-vindas à Kardme!',
    hello: 'Olá',
    received: 'Recebemos sua solicitação.',
    instructions: 'Você pode completar seu cartão digital aqui:',
    button: 'Completar meu Kardme',
    expiry: 'Este link é pessoal e expira em 7 dias.',
    signature: 'Equipe Kardme',
  },
  en: {
    subject: 'Kardme - Complete your digital business card',
    welcome: 'Welcome to Kardme!',
    hello: 'Hello',
    received: 'We have received your request.',
    instructions: 'You can complete your digital business card here:',
    button: 'Complete my Kardme',
    expiry: 'This link is personal and expires after 7 days.',
    signature: 'The Kardme team',
  },
  it: {
    subject: 'Kardme - Completa il tuo biglietto digitale',
    welcome: 'Benvenuto su Kardme!',
    hello: 'Ciao',
    received: 'La tua richiesta è stata ricevuta.',
    instructions: 'Puoi completare il tuo biglietto digitale qui:',
    button: 'Completa il tuo Kardme',
    expiry: 'Questo link è personale e scade dopo 7 giorni.',
    signature: 'Il team Kardme',
  },
  de: {
    subject: 'Kardme - Vervollständige deine digitale Visitenkarte',
    welcome: 'Willkommen bei Kardme!',
    hello: 'Hallo',
    received: 'Wir haben deine Anfrage erhalten.',
    instructions: 'Hier kannst du deine digitale Visitenkarte vervollständigen:',
    button: 'Mein Kardme vervollständigen',
    expiry: 'Dieser Link ist persönlich und läuft nach 7 Tagen ab.',
    signature: 'Dein Kardme-Team',
  },
  es: {
    subject: 'Kardme - Completa tu tarjeta digital',
    welcome: '¡Bienvenido a Kardme!',
    hello: 'Hola',
    received: 'Hemos recibido tu solicitud.',
    instructions: 'Puedes completar tu tarjeta digital aquí:',
    button: 'Completar mi Kardme',
    expiry: 'Este enlace es personal y caduca después de 7 días.',
    signature: 'El equipo Kardme',
  },
  fr: {
    subject: 'Kardme - Complète ta carte de visite numérique',
    welcome: 'Bienvenue chez Kardme !',
    hello: 'Bonjour',
    received: 'Nous avons bien reçu ta demande.',
    instructions: 'Tu peux compléter ta carte de visite numérique ici :',
    button: 'Compléter mon Kardme',
    expiry: 'Ce lien est personnel et expire après 7 jours.',
    signature: "L’équipe Kardme",
  },
  ar: {
    subject: 'Kardme - أكمل بطاقتك الرقمية',
    welcome: 'مرحباً بك في Kardme!',
    hello: 'مرحباً',
    received: 'لقد استلمنا طلبك.',
    instructions: 'يمكنك إكمال بطاقتك الرقمية هنا:',
    button: 'إكمال بطاقة Kardme',
    expiry: 'هذا الرابط شخصي وتنتهي صلاحيته بعد 7 أيام.',
    signature: 'فريق Kardme',
  },
} as const

export type CardOrderEmailLanguage =
  keyof typeof cardOrderEmailTranslations

export function getCardOrderEmailTranslation(language: string) {
  return cardOrderEmailTranslations[
    language in cardOrderEmailTranslations
      ? language as CardOrderEmailLanguage
      : 'en'
  ]
}
