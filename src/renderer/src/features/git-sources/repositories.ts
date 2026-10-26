/** Pure union of local clones and explicit remote favorites; catalog-only repos never become cards. */
import type { GitSourceRepo, GitSourcesSnapshot } from '../../../../shared/git-sources/types'
import type { LocalRepo } from '../../../../shared/local-repos/types'
import type { Repository } from '../github/components/types'
import { toUiRepository } from '../github/local-repositories'

export function repoIdentity(repo: GitSourceRepo): string {
  return `${repo.host}/${repo.fullName}`.toLowerCase()
}
export function mergeRepos(local: LocalRepo[], snapshot: GitSourcesSnapshot | null): Repository[] {
  const repos = snapshot?.repos ?? []
  const remoteBySlug = new Map(repos.map((repo) => [repoIdentity(repo), repo]))
  const localSlugs = new Set(local.flatMap((repo) => (repo.slug ? [repo.slug.toLowerCase()] : [])))
  const result: Repository[] = local.map((repo) => {
    const remote = repo.slug ? remoteBySlug.get(repo.slug.toLowerCase()) : undefined
    const githubUrl =
      remote?.url ||
      (repo.provider === 'github' && repo.slug?.startsWith('github.com/')
        ? `https://${repo.slug}`
        : undefined)
    return { ...toUiRepository(repo), gitSourceRepo: remote, githubUrl }
  })
  const favorites = new Set(
    (snapshot?.favorites ?? []).map((favorite) => `${favorite.sourceId}/${favorite.externalId}`)
  )
  const shown = new Set<string>()
  for (const repo of repos) {
    const identity = repoIdentity(repo)
    if (
      !favorites.has(`${repo.sourceId}/${repo.externalId}`) ||
      localSlugs.has(identity) ||
      shown.has(identity)
    )
      continue
    shown.add(identity)
    result.push({
      id: `remote:${repo.host}:${repo.externalId}`,
      name: repo.name,
      detail: repo.fullName,
      color: 'bg-accent',
      defaultBranch: repo.defaultBranch ?? 'HEAD',
      masterCi: 'none',
      masterCommits: [],
      prs: [],
      worktrees: [],
      isLocal: false,
      updatedAt: repo.pushedAt ?? repo.updatedAt,
      gitSourceRepo: repo,
      githubUrl: repo.url
    })
  }
  return result
}
