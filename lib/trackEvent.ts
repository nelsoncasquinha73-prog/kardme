export function trackEvent(
  cardId: string,
  type: 'view' | 'click' | 'lead',
  key?: string
) {
  // Fire and forget — não bloqueia o render nem o scroll
  setTimeout(() => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId,
        type,
        key,
        path: typeof window !== 'undefined' ? window.location.pathname : null,
        referrer: typeof document !== 'undefined' ? document.referrer : null,
      }),
      keepalive: true,
    }).catch(() => {}) // silencia erros
  }, 2000) // delay de 2s para não competir com o carregamento inicial
}
