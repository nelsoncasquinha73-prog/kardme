export const welcomeLanguages = ['en', 'pt', 'pt-br', 'es', 'fr', 'de', 'it', 'ar'] as const
export type WelcomeLanguage = typeof welcomeLanguages[number]

export function resolveWelcomeLanguage(value: unknown): WelcomeLanguage {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return welcomeLanguages.includes(normalized as WelcomeLanguage) ? normalized as WelcomeLanguage : 'en'
}

type WelcomeTranslation = {
  subject: string
  body: string
  cardFallback: string
  confirmation: string
  button: string
  instructions: string
  notice: string
}

export const welcomeTranslations: Record<WelcomeLanguage, WelcomeTranslation> = {
  en: {
    subject: 'Welcome to {cardTitle}! 🎉',
    body: 'Hello {nome},\n\nThank you for registering and visiting our digital card!\n\nWe are delighted to have you with us.\n\nBest regards,\n{cardTitle}',
    cardFallback: 'my digital card',
    confirmation: 'Confirm your email address to receive the content and future updates:',
    button: 'Confirm email',
    instructions: 'If you cannot click the button, copy and paste this link into your browser:',
    notice: 'If you did not request this, ignore this email.',
  },
  pt: {
    subject: 'Bem-vindo à {cardTitle}! 🎉',
    body: 'Olá {nome},\n\nObrigado por se registar e visitar o nosso cartão digital!\n\nEstamos entusiasmados por te ter connosco.\n\nMelhores cumprimentos,\n{cardTitle}',
    cardFallback: 'o meu cartão digital',
    confirmation: 'Confirma o teu email para receberes o conteúdo e futuras atualizações:',
    button: 'Confirmar email',
    instructions: 'Se não conseguires clicar, copia e cola este link no browser:',
    notice: 'Se não pediste isto, ignora este email.',
  },
  'pt-br': {
    subject: 'Boas-vindas a {cardTitle}! 🎉',
    body: 'Olá {nome},\n\nObrigado por se cadastrar e visitar nosso cartão digital!\n\nEstamos felizes por ter você conosco.\n\nAtenciosamente,\n{cardTitle}',
    cardFallback: 'meu cartão digital',
    confirmation: 'Confirme seu email para receber o conteúdo e futuras atualizações:',
    button: 'Confirmar email',
    instructions: 'Se não conseguir clicar, copie e cole este link no navegador:',
    notice: 'Se você não solicitou isso, ignore este email.',
  },
  es: {
    subject: '¡Bienvenido a {cardTitle}! 🎉',
    body: 'Hola {nome}:\n\n¡Gracias por registrarte y visitar nuestra tarjeta digital!\n\nNos alegra tenerte con nosotros.\n\nUn saludo,\n{cardTitle}',
    cardFallback: 'mi tarjeta digital',
    confirmation: 'Confirma tu correo electrónico para recibir el contenido y futuras novedades:',
    button: 'Confirmar correo electrónico',
    instructions: 'Si no puedes hacer clic, copia y pega este enlace en tu navegador:',
    notice: 'Si no lo has solicitado, ignora este correo.',
  },
  fr: {
    subject: 'Bienvenue chez {cardTitle} ! 🎉',
    body: 'Bonjour {nome},\n\nMerci de vous être inscrit et d’avoir consulté notre carte numérique !\n\nNous sommes ravis de vous accueillir.\n\nCordialement,\n{cardTitle}',
    cardFallback: 'ma carte numérique',
    confirmation: 'Confirmez votre adresse email pour recevoir le contenu et les prochaines actualités :',
    button: 'Confirmer mon adresse email',
    instructions: 'Si vous ne pouvez pas cliquer sur le bouton, copiez et collez ce lien dans votre navigateur :',
    notice: 'Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.',
  },
  de: {
    subject: 'Willkommen bei {cardTitle}! 🎉',
    body: 'Hallo {nome},\n\nvielen Dank für deine Registrierung und deinen Besuch auf unserer digitalen Karte!\n\nWir freuen uns, dich bei uns zu begrüßen.\n\nViele Grüße\n{cardTitle}',
    cardFallback: 'meine digitale Karte',
    confirmation: 'Bestätige deine E-Mail-Adresse, um die Inhalte und zukünftige Neuigkeiten zu erhalten:',
    button: 'E-Mail-Adresse bestätigen',
    instructions: 'Falls du nicht auf den Button klicken kannst, kopiere diesen Link in deinen Browser:',
    notice: 'Wenn du dies nicht angefordert hast, ignoriere diese E-Mail.',
  },
  it: {
    subject: 'Benvenuto su {cardTitle}! 🎉',
    body: 'Ciao {nome},\n\ngrazie per esserti registrato e aver visitato il nostro biglietto digitale!\n\nSiamo felici di averti con noi.\n\nCordiali saluti,\n{cardTitle}',
    cardFallback: 'il mio biglietto digitale',
    confirmation: 'Conferma il tuo indirizzo email per ricevere i contenuti e i prossimi aggiornamenti:',
    button: 'Conferma email',
    instructions: 'Se non riesci a fare clic, copia e incolla questo link nel browser:',
    notice: 'Se non hai richiesto questa email, ignorala.',
  },
  ar: {
    subject: 'مرحباً بك في {cardTitle}! 🎉',
    body: 'مرحباً {nome}،\n\nشكراً لتسجيلك وزيارة بطاقتنا الرقمية!\n\nيسعدنا انضمامك إلينا.\n\nمع أطيب التحيات،\n{cardTitle}',
    cardFallback: 'بطاقتي الرقمية',
    confirmation: 'أكّد عنوان بريدك الإلكتروني لتلقي المحتوى والتحديثات القادمة:',
    button: 'تأكيد البريد الإلكتروني',
    instructions: 'إذا لم تتمكن من النقر على الزر، فانسخ هذا الرابط والصقه في متصفحك:',
    notice: 'إذا لم تطلب ذلك، فتجاهل هذه الرسالة.',
  },
}
