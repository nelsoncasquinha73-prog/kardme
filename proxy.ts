import { type NextRequest } from 'next/server'

// Cache em memória (simples, rápido)
const domainCache = new Map<string, { slug: string; ts: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export async function proxy(req: NextRequest) {
  const hostHeader = req.headers.get('host') || ''
  const host = hostHeader.split(':')[0].toLowerCase()

  // ✅ Não interferir com domínios principais, localhost, ou previews
  if (
    !host ||
    host === 'localhost' ||
    host === 'kardme.com' ||
    host === 'www.kardme.com' ||
    host.endsWith('.vercel.app') ||
    host.endsWith('.sintra.site')
  ) {
    return undefined
  }

  const url = req.nextUrl.clone()
  const baseUrl = `${url.protocol}//${hostHeader}`
  const cleanHost = host.replace(/^www\./, '')

  try {
    // ✅ Verifica cache primeiro
    const cached = domainCache.get(cleanHost)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      const slug = cached.slug
      if (url.pathname === `/${slug}` || url.pathname.startsWith(`/${slug}/`)) {
        return undefined
      }
      url.pathname = `/${slug}`
      return new Response(null, {
        status: 307,
        headers: { location: url.toString() },
      })
    }

    const res = await fetch(`${baseUrl}/api/public/resolve-domain?host=${encodeURIComponent(cleanHost)}`, {
      cache: 'no-store',
    })

    if (!res.ok) return undefined

    const data = await res.json().catch(() => null)
    const slug = data?.slug as string | undefined
    if (!slug) return undefined

    // ✅ Guarda em cache
    domainCache.set(cleanHost, { slug, ts: Date.now() })

    // ✅ Anti-loop: se já estamos no path certo, não fazer redirect
    if (url.pathname === `/${slug}` || url.pathname.startsWith(`/${slug}/`)) {
      return undefined
    }

    url.pathname = `/${slug}`
    return new Response(null, {
      status: 307,
      headers: { location: url.toString() },
    })
  } catch {
    return undefined
  }
}

export const config = {
  matchers: [
    '/((?!_next/static|_next/image|favicon.ico|api/|auth/|\\.well-known).*)',
  ],
}
