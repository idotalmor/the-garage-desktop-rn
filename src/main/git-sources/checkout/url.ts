/** Validates pasted GitHub repo roots and normalizes HTTPS/SSH URLs without embedded credentials. */
export function parseCloneUrl(input: string): {
  /** Validated clone URL preserving HTTPS or SSH transport. */
  cloneUrl: string
  /** Canonical host/owner/repo identity matching the local scanner. */
  slug: string
  /** Repo's final path segment used for the checkout folder. */
  name: string
} {
  const value = input.trim()
  const ssh = /^git@github\.com:([^\s]+)$/.exec(value)
  let path: string
  if (ssh) path = ssh[1]
  else {
    let url: URL
    try {
      url = new URL(value)
    } catch {
      throw new Error('Paste a GitHub repo URL (HTTPS or SSH).')
    }
    if (
      !['https:', 'ssh:'].includes(url.protocol) ||
      url.hostname !== 'github.com' ||
      url.port ||
      url.password ||
      (url.username && !(url.protocol === 'ssh:' && url.username === 'git')) ||
      url.search ||
      url.hash
    )
      throw new Error(
        'Use a GitHub HTTPS or SSH repo URL without credentials, query strings or fragments.'
      )
    path = url.pathname.replace(/^\//, '')
  }
  path = path.replace(/\/$/, '').replace(/\.git$/i, '')
  const match = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(path)
  if (!match || [match[1], match[2]].some((part) => part === '.' || part === '..'))
    throw new Error('Paste the repo root URL, not a branch, pull request or file URL.')
  return {
    cloneUrl:
      ssh || value.toLowerCase().startsWith('ssh://')
        ? `git@github.com:${path}.git`
        : `https://github.com/${path}.git`,
    slug: `github.com/${path}`.toLowerCase(),
    name: match[2]
  }
}
