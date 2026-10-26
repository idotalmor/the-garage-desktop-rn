/** One pending device authorization shared across windows; cancellation aborts HTTP and polling. */
import type { GitSourcesSnapshot } from '../../../shared/git-sources/types'
import type { DeviceAuthorization, ProviderCredential, GitSourceAdapter } from '../providers/types'

type Pending = {
  controller: AbortController
  authorization: DeviceAuthorization | null
  completion: Promise<ProviderCredential> | null
  result: Promise<GitSourcesSnapshot> | null
}
let pending: Pending | null = null
export function startAuthorization(): Pending {
  pending?.controller.abort()
  pending = {
    controller: new AbortController(),
    authorization: null,
    completion: null,
    result: null
  }
  return pending
}
export function currentAuthorization(): Pending | null {
  return pending
}
export function cancelAuthorization(): void {
  pending?.controller.abort()
  pending = null
}
export function pollAuthorization(adapter: GitSourceAdapter): {
  pending: Pending
  completion: Promise<ProviderCredential>
} {
  const current = pending
  if (!current?.authorization) throw new Error('No pending GitHub authorization. Connect again.')
  current.completion ??= adapter.authorize(current.authorization, current.controller.signal)
  return { pending: current, completion: current.completion }
}
