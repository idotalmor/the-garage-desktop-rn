/** Provider dispatch point; add future adapters here without changing connection use cases. */
import type { GitSourceProvider } from '../../../shared/git-sources/types'
import type { GitSourceAdapter } from './types'
import { github } from './github'
export function getProvider(provider: GitSourceProvider): GitSourceAdapter {
  if (provider !== 'github') throw new Error('Unsupported Git provider.')
  return github
}
