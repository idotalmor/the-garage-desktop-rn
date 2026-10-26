/** The only GitHub HTTP transport: fixed origins, bounded requests and secret-free errors. */
export async function githubRequest<T>(
  path: string,
  options: { token?: string; form?: URLSearchParams; signal: AbortSignal }
): Promise<T> {
  const url = options.form ? `https://github.com${path}` : `https://api.github.com${path}`
  const response = await fetch(url, {
    method: options.form ? 'POST' : 'GET',
    redirect: 'error',
    headers: {
      Accept: 'application/json',
      'User-Agent': 'The-Garage',
      ...(options.token
        ? { Authorization: `Bearer ${options.token}`, 'X-GitHub-Api-Version': '2022-11-28' }
        : {}),
      ...(options.form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {})
    },
    body: options.form,
    signal: AbortSignal.any([options.signal, AbortSignal.timeout(30_000)])
  })
  if (!response.ok) {
    if (response.status === 401)
      throw new Error('GitHub authorization was revoked or expired. Reconnect GitHub.')
    if (response.status === 403 || response.status === 429)
      throw new Error(
        'GitHub denied access or rate limited this request. Check org access or try again later.'
      )
    throw new Error(`GitHub request failed (${response.status}). Cached repos are unchanged.`)
  }
  return response.json() as Promise<T>
}
