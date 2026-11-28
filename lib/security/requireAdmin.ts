import type { SupabaseClient } from '@supabase/supabase-js'

const uuidPattern = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i

export async function requireAdmin(req: Request, client: SupabaseClient): Promise<Response | null> {
  const bearer = /^Bearer ([^\s]+)$/i.exec(req.headers.get('authorization') ?? '')
  if (!bearer) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let authenticatedId: string | undefined
  try {
    const { data, error } = await client.auth.getUser(bearer[1])
    if (error || !data.user) {
      return Response.json({ error: 'Sessão inválida' }, { status: 401 })
    }
    authenticatedId = data.user.id
  } catch {
    return Response.json({ error: 'Autenticação indisponível' }, { status: 503 })
  }

  const configuredIds = (process.env.KARDME_ADMIN_USER_IDS ?? '').split(',').map(id => id.trim().toLowerCase())
  if (!configuredIds.every(id => uuidPattern.test(id))) {
    return Response.json({ error: 'Autorização administrativa indisponível' }, { status: 503 })
  }

  if (!authenticatedId || !configuredIds.includes(authenticatedId.toLowerCase())) {
    return Response.json({ error: 'Sem permissões de administrador' }, { status: 403 })
  }

  return null
}
