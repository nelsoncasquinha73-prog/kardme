import { NextRequest, NextResponse } from 'next/server'
import { validateCardOrderAccess } from '@/lib/cardOrderAccess'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const token = req.nextUrl.searchParams.get('token') || ''

  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(slug)) {
    return NextResponse.json(
      { error: 'Pedido inválido' },
      { status: 400 }
    )
  }

  const valid = await validateCardOrderAccess(slug, token)

  if (!valid) {
    return NextResponse.json(
      { error: 'Link inválido ou expirado' },
      { status: 403 }
    )
  }

  const destination = new URL(
    `/card-orders/${slug}`,
    req.nextUrl.origin
  )

  const response = NextResponse.redirect(destination, 303)

  response.cookies.set(`card-order-${slug}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  response.headers.set('Cache-Control', 'no-store')
  response.headers.set('Referrer-Policy', 'no-referrer')

  return response
}
