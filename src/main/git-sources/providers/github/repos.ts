/** Maps GitHub REST repo facts and browses accessible repos in bounded pages. */
import type { GitSourceRepo, GitSourceRepoPage } from '../../../../shared/git-sources/types'
import { githubRequest } from './request'

type GithubRepo = {
  id: number
  name: string
  full_name: string
  html_url: string
  clone_url: string
  ssh_url: string
  default_branch: string | null
  private: boolean
  archived: boolean
  fork: boolean
  description: string | null
  pushed_at: string | null
  updated_at: string
}
export function toRepo(sourceId: string, repo: GithubRepo): GitSourceRepo {
  return {
    sourceId,
    externalId: String(repo.id),
    name: repo.name,
    fullName: repo.full_name,
    host: 'github.com',
    url: repo.html_url,
    cloneUrl: repo.clone_url,
    sshUrl: repo.ssh_url,
    defaultBranch: repo.default_branch,
    isPrivate: repo.private,
    isArchived: repo.archived,
    isFork: repo.fork,
    description: repo.description,
    pushedAt: repo.pushed_at ? Date.parse(repo.pushed_at) : null,
    updatedAt: Date.parse(repo.updated_at)
  }
}
export async function listRepos(
  sourceId: string,
  token: string,
  page: number,
  signal: AbortSignal
): Promise<GitSourceRepoPage> {
  const repos = await githubRequest<GithubRepo[]>(
    `/user/repos?per_page=100&page=${page}&sort=full_name&affiliation=owner,collaborator,organization_member`,
    { token, signal }
  )
  return {
    repos: repos.map((repo) => toRepo(sourceId, repo)),
    nextPage: repos.length === 100 ? page + 1 : null
  }
}
export async function readRepo(
  sourceId: string,
  token: string,
  fullName: string,
  signal: AbortSignal
): Promise<GitSourceRepo> {
  const [owner, name] = fullName.split('/')
  if (!owner || !name || fullName.split('/').length !== 2)
    throw new Error('Invalid GitHub repo name.')
  return toRepo(
    sourceId,
    await githubRequest<GithubRepo>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
      { token, signal }
    )
  )
}
