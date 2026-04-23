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
    return undefined // passa para o Next handler normal
  }

  const url = req.nextUrl.clone()
  const baseUrl = `${url.protocol}//${hostHeader}`

  try {
    const res = await fetch(`${baseUrl}/api/public/resolve-domain?host=${encodeURIComponent(host)}`, {
      cache: 'no-store',
    })

    if (!res.ok) return undefined

    const data = await res.json().catch(() => null)
    if (data?.slug) {
      url.pathname = `/${data.slug}`
      return new Response(null, {
        status: 307,
        headers: { location: url.toString() },
      })
    }
  } catch (err) {
    // nunca quebrar o app
  }

  return undefined
}

export const config = {
  matchers: [
    '/((?!_next/static|_next/image|favicon.ico|api/|auth/|\\.well-known).*)',
  ],
}
