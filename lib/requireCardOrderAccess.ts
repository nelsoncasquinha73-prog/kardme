import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { validateCardOrderAccess } from '@/lib/cardOrderAccess'

export async function requireCardOrderAccess(
  req: Request,
  slug: string
) {
  const origin = req.headers.get('origin')

  const requestOrigin = new URL(req.url).origin

  if (origin !== requestOrigin) {
    return NextResponse.json(
      { error: 'Origem não autorizada' },
      { status: 403 }
    )
  }

  const cookieHeader = req.headers.get('cookie') || ''
  const cookieName = `card-order-${slug}`

  const cookieToken = cookieHeader
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1) || ''

  const headerToken = req.headers.get('x-card-order-token') || ''
  const token = cookieToken || headerToken

  if (token && await validateCardOrderAccess(slug, token)) {
    return null
  }

  const authHeader = req.headers.get('authorization') || ''

  if (authHeader.startsWith('Bearer ')) {
    const jwt = authHeader.slice(7).trim()

    const { data, error } = await supabaseAdmin.auth.getUser(jwt)

    if (!error && data.user) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === 'admin') {
        return null
      }
    }
  }

  return NextResponse.json(
    { error: 'Acesso não autorizado' },
    { status: 403 }
  )
}
