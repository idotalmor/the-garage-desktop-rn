/** GitHub device flow without a desktop client secret; honors polling and cancellation. */
import { setTimeout as delay } from 'timers/promises'
import type { DeviceAuthorization, ProviderCredential } from '../types'
import { githubRequest } from './request'

function clientId(): string {
  const id = import.meta.env.MAIN_VITE_GITHUB_CLIENT_ID
  if (!id)
    throw new Error(
      'Set MAIN_VITE_GITHUB_CLIENT_ID and enable device flow on your GitHub OAuth App, then restart The Garage.'
    )
  return id
}
export async function begin(signal: AbortSignal): Promise<DeviceAuthorization> {
  const result = await githubRequest<{
    device_code?: string
    user_code?: string
    verification_uri?: string
    expires_in?: number
    interval?: number
  }>('/login/device/code', {
    signal,
    form: new URLSearchParams({ client_id: clientId(), scope: 'repo read:org' })
  })
  if (
    !result.device_code ||
    !result.user_code ||
    result.verification_uri !== 'https://github.com/login/device' ||
    !result.expires_in ||
    !result.interval
  )
    throw new Error('GitHub returned invalid device authorization instructions.')
  return {
    deviceCode: result.device_code,
    userCode: result.user_code,
    verificationUri: result.verification_uri,
    expiresAt: Date.now() + result.expires_in * 1000,
    interval: result.interval * 1000
  }
}
export async function authorize(
  authorization: DeviceAuthorization,
  signal: AbortSignal
): Promise<ProviderCredential> {
  let interval = authorization.interval
  while (Date.now() < authorization.expiresAt) {
    await delay(Math.min(interval, authorization.expiresAt - Date.now()), undefined, { signal })
    if (Date.now() >= authorization.expiresAt) break
    const result = await githubRequest<{ access_token?: string; scope?: string; error?: string }>(
      '/login/oauth/access_token',
      {
        signal,
        form: new URLSearchParams({
          client_id: clientId(),
          device_code: authorization.deviceCode,
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
        })
      }
    )
    if (result.access_token)
      return {
        token: result.access_token,
        scopes: (result.scope ?? '').split(/[ ,]+/).filter(Boolean)
      }
    if (result.error === 'authorization_pending') continue
    if (result.error === 'slow_down') {
      interval += 5000
      continue
    }
    if (result.error === 'access_denied') throw new Error('GitHub authorization was declined.')
    if (result.error === 'expired_token') break
    throw new Error('GitHub device authorization failed. Start a new connection.')
  }
  throw new Error('GitHub authorization code expired. Connect again for a new code.')
}
