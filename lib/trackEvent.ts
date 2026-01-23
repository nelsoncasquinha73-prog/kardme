export async function trackEvent(
  cardId: string,
  type: 'view' | 'click' | 'lead',
  key?: string
) {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId,
        type,
        key,
        path: typeof window !== 'undefined' ? window.location.pathname : null,
        referrer: typeof document !== 'undefined' ? document.referrer : null,
      }),
    })
  } catch (err) {
    console.error('[trackEvent] error:', err)
  }
}
