import { createHash, randomBytes } from 'crypto'
import { createServer } from 'http'
import type { AddressInfo } from 'net'
import { shell } from 'electron'
import type { GoogleCredential } from '../../shared/auth/types'

const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPES = ['openid', 'email', 'profile']
const SIGN_IN_TIMEOUT_MS = 180_000

const SUCCESS_PAGE = `<!doctype html><html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><p>Signed in to The Garage. You can close this tab.</p><script>window.close()</script></body></html>`
const FAILURE_PAGE = `<!doctype html><html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><p>Sign-in did not complete. You can close this tab.</p></body></html>`

function base64Url(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function getOAuthConfig(): { clientId: string; clientSecret: string } {
  const clientId = import.meta.env.MAIN_VITE_GOOGLE_CLIENT_ID as string | undefined
  const clientSecret = import.meta.env.MAIN_VITE_GOOGLE_CLIENT_SECRET as string | undefined
  if (!clientId) {
    throw new Error('Google sign-in is not configured (missing MAIN_VITE_GOOGLE_CLIENT_ID)')
  }
  return { clientId, clientSecret: clientSecret ?? '' }
}

async function exchangeCode(
  code: string,
  redirectUri: string,
  codeVerifier: string
): Promise<GoogleCredential> {
  const { clientId, clientSecret } = getOAuthConfig()
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal: AbortSignal.timeout(30_000),
    body: new URLSearchParams({
      code,
      client_id: clientId,
      ...(clientSecret ? { client_secret: clientSecret } : {}),
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier
    })
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Google token exchange failed (${response.status}): ${body}`)
  }
  const tokens = (await response.json()) as { id_token?: string; access_token?: string }
  if (!tokens.id_token) throw new Error('Google token response did not include an id_token')
  return { idToken: tokens.id_token, accessToken: tokens.access_token }
}

let pendingSignIn: Promise<GoogleCredential | null> | null = null
let cancelPending: (() => void) | null = null

export function signInWithGoogle(): Promise<GoogleCredential | null> {
  if (!pendingSignIn) {
    pendingSignIn = runGoogleSignIn().finally(() => {
      pendingSignIn = null
    })
  }
  return pendingSignIn
}

export function cancelSignIn(): void {
  cancelPending?.()
}

function runGoogleSignIn(): Promise<GoogleCredential | null> {
  const { clientId } = getOAuthConfig()
  const state = base64Url(randomBytes(16))
  const codeVerifier = base64Url(randomBytes(32))
  const codeChallenge = base64Url(createHash('sha256').update(codeVerifier).digest())

  return new Promise((resolve, reject) => {
    let settled = false

    const finish = (settle: () => void): void => {
      if (settled) return
      settled = true
      cancelPending = null
      clearTimeout(timeout)
      server.close()
      settle()
    }

    const server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      const error = url.searchParams.get('error')
      const code = url.searchParams.get('code')

      if (error) {
        res.writeHead(200, { 'Content-Type': 'text/html' }).end(FAILURE_PAGE)
        finish(() => resolve(null))
        return
      }
      if (!code) {
        res.writeHead(404).end()
        return
      }
      if (url.searchParams.get('state') !== state) {
        res.writeHead(200, { 'Content-Type': 'text/html' }).end(FAILURE_PAGE)
        finish(() => reject(new Error('OAuth state mismatch')))
        return
      }

      res.writeHead(200, { 'Content-Type': 'text/html' }).end(SUCCESS_PAGE)
      const address = server.address() as AddressInfo
      console.log('[auth] received OAuth callback, exchanging code')
      void exchangeCode(code, `http://127.0.0.1:${address.port}`, codeVerifier)
        .then((credential) => {
          console.log('[auth] token exchange succeeded')
          finish(() => resolve(credential))
        })
        .catch((err) => finish(() => reject(err)))
    })

    server.listen(0, '127.0.0.1', () => {
      const address = server.address() as AddressInfo
      const authorizeUrl = new URL(GOOGLE_AUTHORIZE_URL)
      authorizeUrl.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: `http://127.0.0.1:${address.port}`,
        response_type: 'code',
        scope: SCOPES.join(' '),
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        access_type: 'offline',
        prompt: 'select_account'
      }).toString()
      void shell.openExternal(authorizeUrl.toString())
    })

    const timeout = setTimeout(() => {
      finish(() => reject(new Error('Sign-in timed out')))
    }, SIGN_IN_TIMEOUT_MS)

    cancelPending = () => finish(() => resolve(null))
  })
}
