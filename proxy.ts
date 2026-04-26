import { type NextRequest } from 'next/server'

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

  try {
    const res = await fetch(`${baseUrl}/api/public/resolve-domain?host=${encodeURIComponent(host.replace(/^www\./, ''))}`, {
      cache: 'no-store',
    })

    if (!res.ok) return undefined

    const data = await res.json().catch(() => null)
    const slug = data?.slug as string | undefined
    if (!slug) return undefined

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
