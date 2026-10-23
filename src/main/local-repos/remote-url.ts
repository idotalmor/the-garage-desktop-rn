import type { GitProvider, GitRemote } from '../../shared/local-repos/types'

type ParsedRemote = Pick<GitRemote, 'host' | 'owner' | 'repo' | 'slug'>

const EMPTY: ParsedRemote = { host: null, owner: null, repo: null, slug: null }

/**
 * Normalizes git remote URLs (HTTPS, SSH, scp-like, SSH host aliases such as
 * `github.com-work`) into `{ host, owner, repo, slug }`. Local paths return nulls.
 */
export function parseRemoteUrl(url: string): ParsedRemote {
  const trimmed = url.trim()
  let host: string | null = null
  let path: string | null = null

  const scpLike = /^(?:[^@/\s]+@)?([^:/\s]+):(?!\/\/)(.+)$/.exec(trimmed)
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed)
      if (parsed.protocol === 'file:') return EMPTY
      host = parsed.hostname
      path = decodeURIComponent(parsed.pathname)
    } catch {
      return EMPTY
    }
  } else if (scpLike && !/^[a-z]:[\\/]/i.test(trimmed)) {
    host = scpLike[1]
    path = scpLike[2]
  } else {
    return EMPTY
  }

  host = normalizeHost(host)
  const segments = path
    .replace(/\/+$/, '')
    .replace(/\.git$/i, '')
    .split('/')
    .filter(Boolean)
  if (!host || segments.length < 2) return { ...EMPTY, host: host || null }

  const repo = segments[segments.length - 1]
  const owner = segments.slice(0, -1).join('/')
  return { host, owner, repo, slug: `${host}/${owner}/${repo}`.toLowerCase() }
}

function normalizeHost(host: string): string {
  const lower = host.toLowerCase()
  // SSH config aliases like `github.com-work` or `work.github.com` still mean github.com
  if (lower.startsWith('github.com') || lower.endsWith('.github.com')) return 'github.com'
  if (lower === 'ssh.github.com') return 'github.com'
  return lower
}

export function providerForHost(host: string | null): GitProvider {
  if (!host) return 'none'
  return host === 'github.com' || host.includes('github') ? 'github' : 'other'
}
