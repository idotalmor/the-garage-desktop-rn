/** Starts a cancellable GitHub device flow after checking secure token storage. */
import { shell } from 'electron'
import type { GitSourcesSnapshot } from '../../../shared/git-sources/types'
import { assertSecureStorage } from '../credentials'
import { getProvider } from '../providers'
import { startAuthorization, currentAuthorization, cancelAuthorization, notify } from '../sync'
export async function connect(): Promise<GitSourcesSnapshot> {
  assertSecureStorage()
  const pending = startAuthorization()
  try {
    const authorization = await getProvider('github').begin(pending.controller.signal)
    pending.controller.signal.throwIfAborted()
    pending.authorization = authorization
    notify()
    await shell.openExternal(authorization.verificationUri)
    return notify()
  } catch (error) {
    if (currentAuthorization() === pending) {
      cancelAuthorization()
      notify()
    }
    throw error
  }
}
