/** Completes authorization, verifies identity and atomically stores the account and encrypted token. */
import type { GitSourcesSnapshot } from '../../../shared/git-sources/types'
import { encryptToken } from '../credentials'
import { saveSource } from '../db/tables/git-sources/queries'
import { getProvider } from '../providers'
import { pollAuthorization, currentAuthorization, cancelAuthorization, notify } from '../sync'
export function completeConnection(): Promise<GitSourcesSnapshot> {
  const provider = getProvider('github')
  const { pending, completion } = pollAuthorization(provider)
  pending.result ??= (async () => {
    try {
      const credential = await completion
      const account = await provider.account(credential.token, pending.controller.signal)
      pending.controller.signal.throwIfAborted()
      saveSource(
        { ...account, scopes: credential.scopes, connectedAt: Date.now() },
        encryptToken(credential.token)
      )
    } finally {
      if (currentAuthorization() === pending) {
        cancelAuthorization()
        notify()
      }
    }
    return notify()
  })()
  return pending.result
}
