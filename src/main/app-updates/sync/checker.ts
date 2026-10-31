/** Runs the `findNewBase` and `downloadNewBundle` jobs together: once shortly after startup, then on an interval, never twice at once. */
import { downloadNewBundle } from '../use-cases/download-new-bundle.use-case'
import { findNewBase } from '../use-cases/find-new-base.use-case'
import { CHECK_INTERVAL_MS, FIRST_CHECK_DELAY_MS, updatesEnabled } from '../utils/settings'
import { setCheck } from './state'

let inFlight: Promise<void> | null = null

/** Checks now, or joins the check already running. Resolves when it is done (never rejects). */
export function runCheck(): Promise<void> {
  if (!updatesEnabled()) return Promise.resolve()
  inFlight ??= (async () => {
    setCheck({ checking: true })
    const [base, bundle] = await Promise.allSettled([findNewBase(), downloadNewBundle()])
    const failed = [base, bundle].find((result) => result.status === 'rejected')
    inFlight = null
    setCheck({
      ...(base.status === 'fulfilled' && { newBase: base.value }),
      lastError: failed ? errorMessage(failed.reason) : null,
      checking: false,
      lastCheckedAt: Date.now()
    })
  })()
  return inFlight
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function startChecks(): void {
  if (!updatesEnabled()) return
  setTimeout(() => void runCheck(), FIRST_CHECK_DELAY_MS)
  setInterval(() => void runCheck(), CHECK_INTERVAL_MS)
}
