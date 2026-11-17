export const emailConfirmationPages = {
  "pt": {
    "successTitle": "Email confirmado ✅",
    "successText": "Obrigado! O teu email foi confirmado com sucesso.",
    "invalidTitle": "Link inválido",
    "invalidText": "Este link de confirmação é inválido ou já foi utilizado."
  },
  "pt-br": {
    "successTitle": "E-mail confirmado ✅",
    "successText": "Obrigado! Seu e-mail foi confirmado com sucesso.",
    "invalidTitle": "Link inválido",
    "invalidText": "Este link de confirmação é inválido ou já foi utilizado."
  },
  "en": {
    "successTitle": "Email confirmed ✅",
    "successText": "Thank you! Your email address has been successfully confirmed.",
    "invalidTitle": "Invalid link",
    "invalidText": "This confirmation link is invalid or has already been used."
  },
  "es": {
    "successTitle": "Correo confirmado ✅",
    "successText": "¡Gracias! Tu correo electrónico se ha confirmado correctamente.",
    "invalidTitle": "Enlace no válido",
    "invalidText": "Este enlace de confirmación no es válido o ya se ha utilizado."
  },
  "fr": {
    "successTitle": "Adresse e-mail confirmée ✅",
    "successText": "Merci ! Votre adresse e-mail a bien été confirmée.",
    "invalidTitle": "Lien invalide",
    "invalidText": "Ce lien de confirmation est invalide ou a déjà été utilisé."
  },
  "de": {
    "successTitle": "E-Mail bestätigt ✅",
    "successText": "Vielen Dank! Deine E-Mail-Adresse wurde erfolgreich bestätigt.",
    "invalidTitle": "Ungültiger Link",
    "invalidText": "Dieser Bestätigungslink ist ungültig oder wurde bereits verwendet."
  },
  "it": {
    "successTitle": "Email confermata ✅",
    "successText": "Grazie! Il tuo indirizzo email è stato confermato correttamente.",
    "invalidTitle": "Link non valido",
    "invalidText": "Questo link di conferma non è valido o è già stato utilizzato."
  },
  "ar": {
    "successTitle": "تم تأكيد البريد الإلكتروني ✅",
    "successText": "شكراً لك! تم تأكيد بريدك الإلكتروني بنجاح.",
    "invalidTitle": "رابط غير صالح",
    "invalidText": "رابط التأكيد هذا غير صالح أو تم استخدامه بالفعل."
  }
} as const

export function resolveConfirmationLanguage(value: unknown) {
  const lang = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return Object.prototype.hasOwnProperty.call(emailConfirmationPages, lang)
    ? lang as keyof typeof emailConfirmationPages
    : 'pt'
}
