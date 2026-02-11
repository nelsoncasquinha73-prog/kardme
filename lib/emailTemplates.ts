export type SupportedLang = 'pt' | 'pt-br' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'ar'

function rtlWrap(lang: SupportedLang, html: string) {
  if (lang !== 'ar') return html
  return `<div dir="rtl" style="text-align:right">${html}</div>`
}

function baseLayout(content: string) {
  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color:#111827">
    <div style="max-width: 640px; margin: 0 auto; padding: 24px">
      <div style="padding: 18px 18px; border: 1px solid #e5e7eb; border-radius: 12px;">
        ${content}
      </div>
      <div style="margin-top: 14px; color:#6b7280; font-size: 12px">
        Kardme
      </div>
    </div>
  </div>
  `
}

export function getLang(input: string | null | undefined): SupportedLang {
  const v = (input || '').toLowerCase()
  const allowed: SupportedLang[] = ['pt', 'pt-br', 'en', 'es', 'fr', 'de', 'it', 'ar']
  return (allowed.includes(v as SupportedLang) ? (v as SupportedLang) : 'en')
}

export function paymentFailedEmail(params: { lang: SupportedLang; appUrl: string }) {
  const { lang, appUrl } = params

  const copy = {
    'pt': {
      subject: 'Falha no pagamento — atualize o seu método de pagamento',
      title: 'Falha no pagamento',
      p1: 'Não foi possível processar o pagamento da sua subscrição Kardme.',
      p2: 'Para evitar interrupção do seu cartão, atualize o seu método de pagamento:',
      cta: 'Gerir faturação',
      foot: 'Se já atualizou, pode ignorar este email.',
    },
    'pt-br': {
      subject: 'Falha no pagamento — atualize seu método de pagamento',
      title: 'Falha no pagamento',
      p1: 'Não foi possível processar o pagamento da sua assinatura Kardme.',
      p2: 'Para evitar interrupção do seu cartão, atualize seu método de pagamento:',
      cta: 'Gerenciar faturação',
      foot: 'Se você já atualizou, pode ignorar este email.',
    },
    'en': {
      subject: 'Payment failed — update your payment method',
      title: 'Payment failed',
      p1: 'We couldn’t process your Kardme subscription payment.',
      p2: 'To avoid interruption, please update your payment method:',
      cta: 'Manage billing',
      foot: 'If you already updated it, you can ignore this email.',
    },
    'es': {
      subject: 'Pago fallido — actualiza tu método de pago',
      title: 'Pago fallido',
      p1: 'No pudimos procesar el pago de tu suscripción de Kardme.',
      p2: 'Para evitar interrupciones, actualiza tu método de pago:',
      cta: 'Gestionar facturación',
      foot: 'Si ya lo actualizaste, puedes ignorar este correo.',
    },
    'fr': {
      subject: 'Paiement échoué — mettez à jour votre moyen de paiement',
      title: 'Paiement échoué',
      p1: 'Nous n’avons pas pu traiter le paiement de votre abonnement Kardme.',
      p2: 'Pour éviter une interruption, mettez à jour votre moyen de paiement :',
      cta: 'Gérer la facturation',
      foot: 'Si vous avez déjà mis à jour, vous pouvez ignorer cet email.',
    },
    'de': {
      subject: 'Zahlung fehlgeschlagen — Zahlungsmethode aktualisieren',
      title: 'Zahlung fehlgeschlagen',
      p1: 'Wir konnten die Zahlung für dein Kardme-Abo nicht verarbeiten.',
      p2: 'Um Unterbrechungen zu vermeiden, aktualisiere bitte deine Zahlungsmethode:',
      cta: 'Abrechnung verwalten',
      foot: 'Wenn du bereits aktualisiert hast, kannst du diese E-Mail ignorieren.',
    },
    'it': {
      subject: 'Pagamento non riuscito — aggiorna il metodo di pagamento',
      title: 'Pagamento non riuscito',
      p1: 'Non siamo riusciti a elaborare il pagamento del tuo abbonamento Kardme.',
      p2: 'Per evitare interruzioni, aggiorna il tuo metodo di pagamento:',
      cta: 'Gestisci fatturazione',
      foot: 'Se hai già aggiornato, puoi ignorare questa email.',
    },
    'ar': {
      subject: 'فشل الدفع — حدّث طريقة الدفع',
      title: 'فشل الدفع',
      p1: 'تعذّر علينا معالجة دفعة اشتراكك في Kardme.',
      p2: 'لتجنب انقطاع الخدمة، يرجى تحديث طريقة الدفع:',
      cta: 'إدارة الفوترة',
      foot: 'إذا قمت بالتحديث بالفعل، يمكنك تجاهل هذه الرسالة.',
    },
  }[lang]

  const content = `
    <h2 style="margin:0 0 10px 0">${copy.title}</h2>
    <p style="margin:0 0 10px 0">${copy.p1}</p>
    <p style="margin:0 0 14px 0">${copy.p2}</p>
    <p style="margin:0 0 14px 0">
      <a href="${appUrl}/dashboard/settings/billing"
         style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;font-weight:600">
        ${copy.cta}
      </a>
    </p>
    <p style="margin:0;color:#6b7280;font-size:12px">${copy.foot}</p>
  `

  return {
    subject: copy.subject,
    html: rtlWrap(lang, baseLayout(content)),
  }
}

export function paymentSucceededEmail(params: {
  lang: SupportedLang
  appUrl: string
  planLabel: string
  nextBillingDateText: string | null
}) {
  const { lang, appUrl, planLabel, nextBillingDateText } = params

  const copy = {
    'pt': {
      subject: 'Pagamento confirmado — subscrição Kardme ativa',
      title: 'Pagamento confirmado',
      p1: 'A tua subscrição Kardme está ativa.',
      plan: 'Plano',
      next: 'Próximo pagamento',
      cta: 'Gerir faturação',
    },
    'pt-br': {
      subject: 'Pagamento confirmado — assinatura Kardme ativa',
      title: 'Pagamento confirmado',
      p1: 'Sua assinatura Kardme está ativa.',
      plan: 'Plano',
      next: 'Próximo pagamento',
      cta: 'Gerenciar faturação',
    },
    'en': {
      subject: 'Payment confirmed — Kardme subscription active',
      title: 'Payment confirmed',
      p1: 'Your Kardme subscription is now active.',
      plan: 'Plan',
      next: 'Next payment',
      cta: 'Manage billing',
    },
    'es': {
      subject: 'Pago confirmado — suscripción Kardme activa',
      title: 'Pago confirmado',
      p1: 'Tu suscripción de Kardme está activa.',
      plan: 'Plan',
      next: 'Próximo pago',
      cta: 'Gestionar facturación',
    },
    'fr': {
      subject: 'Paiement confirmé — abonnement Kardme actif',
      title: 'Paiement confirmé',
      p1: 'Votre abonnement Kardme est actif.',
      plan: 'Forfait',
      next: 'Prochain paiement',
      cta: 'Gérer la facturation',
    },
    'de': {
      subject: 'Zahlung bestätigt — Kardme-Abo aktiv',
      title: 'Zahlung bestätigt',
      p1: 'Dein Kardme-Abo ist jetzt aktiv.',
      plan: 'Plan',
      next: 'Nächste Zahlung',
      cta: 'Abrechnung verwalten',
    },
    'it': {
      subject: 'Pagamento confermato — abbonamento Kardme attivo',
      title: 'Pagamento confermato',
      p1: 'Il tuo abbonamento Kardme è attivo.',
      plan: 'Piano',
      next: 'Prossimo pagamento',
      cta: 'Gestisci fatturazione',
    },
    'ar': {
      subject: 'تم تأكيد الدفع — اشتراك Kardme نشط',
      title: 'تم تأكيد الدفع',
      p1: 'اشتراكك في Kardme أصبح نشطًا.',
      plan: 'الخطة',
      next: 'الدفعة القادمة',
      cta: 'إدارة الفوترة',
    },
  }[lang]

  const content = `
    <h2 style="margin:0 0 10px 0">${copy.title}</h2>
    <p style="margin:0 0 14px 0">${copy.p1}</p>

    <table style="width:100%;border-collapse:collapse;margin:0 0 14px 0">
      <tr>
        <td style="padding:8px 0;color:#6b7280">${copy.plan}</td>
        <td style="padding:8px 0;text-align:right;font-weight:600">${planLabel}</td>
      </tr>
      ${
        nextBillingDateText
          ? `<tr>
              <td style="padding:8px 0;color:#6b7280">${copy.next}</td>
              <td style="padding:8px 0;text-align:right;font-weight:600">${nextBillingDateText}</td>
            </tr>`
          : ''
      }
    </table>

    <p style="margin:0">
      <a href="${appUrl}/dashboard/settings/billing"
         style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;font-weight:600">
        ${copy.cta}
      </a>
    </p>
  `

  return {
    subject: copy.subject,
    html: rtlWrap(lang, baseLayout(content)),
  }
}
