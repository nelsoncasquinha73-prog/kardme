type SessionSource = {
  auth: {
    getSession(): Promise<{ data: { session: { access_token: string } | null }; error: unknown }>
  }
}

export async function adminApiFetch(client: SessionSource, path: `/api/admin/${string}`, init?: RequestInit) {
  const { data, error } = await client.auth.getSession()
  const token = data.session?.access_token
  if (error || !token) throw new Error('Sem autenticação')

  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${token}`)
  return fetch(path, { ...init, headers, redirect: 'error' })
}
