import { supabase } from '@/lib/supabaseClient'

export async function cardOrderAdminFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session?.access_token) {
    throw new Error('Sessão expirada. Inicia sessão novamente.')
  }

  const headers = new Headers(options.headers)
  headers.set(
    'Authorization',
    `Bearer ${data.session.access_token}`
  )

  return fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
  })
}
