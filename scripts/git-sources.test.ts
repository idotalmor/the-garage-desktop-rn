/** Executable regression scenarios; HTTP and OS encryption are mocked, DB and composition are real. */
import assert from 'node:assert/strict'
import { checkCheckouts } from './checkout.test'
import { getDb } from '../src/main/git-sources/db/connection'
import { listSources, saveSource } from '../src/main/git-sources/db/tables/git-sources/queries'
import { readCredential } from '../src/main/git-sources/db/tables/credentials/queries'
import {
  saveRepos,
  listRepos as cachedRepos
} from '../src/main/git-sources/db/tables/repos/queries'
import { listFavorites } from '../src/main/git-sources/db/tables/favorites/queries'
import { setFavorite } from '../src/main/git-sources/use-cases/set-favorite.use-case'
import { disconnect } from '../src/main/git-sources/use-cases/disconnect.use-case'
import { listRepos } from '../src/main/git-sources/use-cases/list-repos.use-case'
import { connect } from '../src/main/git-sources/use-cases/connect.use-case'
import { completeConnection } from '../src/main/git-sources/use-cases/complete-connection.use-case'
import { cancelConnection } from '../src/main/git-sources/use-cases/cancel-connection.use-case'
import { openUrl } from '../src/main/git-sources/use-cases/open-url.use-case'
import { getSnapshot } from '../src/main/git-sources/sync'
import { authorize } from '../src/main/git-sources/providers/github/device-flow'
import { toRepo } from '../src/main/git-sources/providers/github/repos'
import { mergeRepos } from '../src/renderer/src/features/git-sources/repositories'
import { openGitHubUrl } from '../src/renderer/src/features/git-sources/open-url'
import { GitSourcesChannel } from '../src/shared/git-sources/channels'
import type { LocalRepo } from '../src/shared/local-repos/types'
import type { GitSource, GitSourceRepo } from '../src/shared/git-sources/types'

const source: GitSource = {
  id: 'github:1',
  provider: 'github',
  externalId: '1',
  login: 'alice',
  avatarUrl: '',
  scopes: ['repo'],
  connectedAt: 1
}
const rawRepo = {
  id: 10,
  name: 'project',
  full_name: 'Acme/Project',
  html_url: 'https://github.com/Acme/Project',
  clone_url: 'https://github.com/Acme/Project.git',
  ssh_url: 'git@github.com:Acme/Project.git',
  default_branch: 'main',
  private: true,
  archived: false,
  fork: true,
  description: null,
  pushed_at: null,
  updated_at: '2026-01-01T00:00:00Z'
}
const repo: GitSourceRepo = toRepo(source.id, rawRepo)
const local = {
  id: 'local-a',
  name: 'project',
  commonDir: '/tmp/project/.git',
  fullName: 'Acme/Project',
  slug: 'github.com/acme/project',
  defaultBranch: 'main',
  defaultBranchCommit: null,
  worktrees: [
    {
      path: '/tmp/project',
      name: 'project',
      branch: 'main',
      isMain: true,
      changedFiles: 2,
      ahead: 1,
      behind: 0,
      lastCommit: null
    }
  ],
  updatedAt: 2,
  position: 0
} as LocalRepo

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
async function run(): Promise<void> {
  await openUrl('https://github.com/acme/project')
  await openUrl('https://github.com/acme/project/pull/123')
  await openUrl('https://github.com/login/device')
  const externalUrls = Reflect.get(globalThis, '__gitSourcesExternalUrls') as string[]
  assert.deepEqual(externalUrls, [
    'https://github.com/acme/project',
    'https://github.com/acme/project/pull/123',
    'https://github.com/login/device'
  ])
  for (const url of [
    null,
    '',
    'javascript:alert(1)',
    'file:///tmp/test',
    'https://github.com.evil.test/acme/project',
    'http://github.com/acme/project',
    'https://secret@github.com/acme/project',
    'https://github.com:8443/acme/project'
  ])
    await assert.rejects(openUrl(url))
  assert.equal(externalUrls.length, 3, 'unsafe URLs never reach the OS browser opener')
  const originalWindow = Reflect.get(globalThis, 'window')
  const rendererCalls: unknown[][] = []
  Reflect.set(globalThis, 'window', {
    electron: {
      ipcRenderer: {
        invoke: async (...args: unknown[]) => {
          rendererCalls.push(args)
        }
      }
    }
  })
  try {
    openGitHubUrl('https://github.com/acme/project')
    await Promise.resolve()
    assert.deepEqual(
      rendererCalls,
      [[GitSourcesChannel.OpenUrl, 'https://github.com/acme/project']],
      'repo links dispatch through main instead of window.open'
    )
  } finally {
    if (originalWindow === undefined) Reflect.deleteProperty(globalThis, 'window')
    else Reflect.set(globalThis, 'window', originalWindow)
  }
  saveSource(source, Buffer.from('mock-encrypted:token').toString('base64'))
  saveSource(source, Buffer.from('mock-encrypted:token').toString('base64'))
  assert.equal(listSources().length, 1)
  saveRepos([repo, repo])
  assert.equal(cachedRepos().length, 1)
  assert.equal(mergeRepos([], getSnapshot()).length, 0, 'catalog does not populate desktop')
  setFavorite(source.id, repo.externalId, true)
  setFavorite(source.id, repo.externalId, true)
  assert.equal(listFavorites().length, 1)
  assert.equal(mergeRepos([], getSnapshot()).length, 1, 'remote-only favorite appears')
  const merged = mergeRepos([local], getSnapshot())
  assert.equal(merged.length, 1)
  assert.equal(merged[0].id, 'local-a', 'local history/actions retain local id')
  assert.equal(merged[0].worktrees[0].path, '/tmp/project')
  assert.equal(merged[0].gitSourceRepo?.externalId, '10')
  assert.equal(merged[0].githubUrl, repo.url)
  assert.equal(mergeRepos([], getSnapshot())[0].githubUrl, repo.url)
  assert.equal(
    mergeRepos([{ ...local, provider: 'github' }], null)[0].githubUrl,
    'https://github.com/acme/project'
  )
  assert.equal(
    mergeRepos([{ ...local, provider: 'none', slug: null }], null)[0].githubUrl,
    undefined
  )
  assert.equal(
    mergeRepos([local, { ...local, id: 'local-b' }], getSnapshot()).length,
    2,
    'two clones stay distinct'
  )
  assert.equal(
    mergeRepos([{ ...local, slug: 'github.com/fork/project' }], getSnapshot()).length,
    2,
    'upstream and fork do not merge'
  )
  const other = { ...source, id: 'github:2', externalId: '2', login: 'bob' }
  saveSource(other, 'other-encrypted')
  saveRepos([{ ...repo, sourceId: other.id }])
  setFavorite(other.id, repo.externalId, true)
  assert.equal(
    mergeRepos([], getSnapshot()).length,
    1,
    'same remote through two accounts is one card'
  )
  saveRepos([{ ...repo, fullName: 'Acme/Renamed' }])
  assert.equal(listFavorites().length, 2, 'rename preserves favorites')
  assert.equal(cachedRepos().length, 2)
  assert.throws(() => setFavorite(source.id, 'unknown', true))
  assert.ok(!JSON.stringify(getSnapshot()).includes('encryptedToken'))
  assert.ok(!JSON.stringify(getSnapshot()).includes('mock-encrypted'))
  setFavorite(source.id, repo.externalId, false)
  assert.equal(
    mergeRepos([local], getSnapshot()).filter((card) => card.isLocal).length,
    1,
    'unfavorite never hides local'
  )
  disconnect(other.id)
  assert.equal(cachedRepos().length, 1)
  assert.equal(listFavorites().length, 0)
  assert.equal(readCredential(other.id), undefined)
  assert.equal(getDb().$client.pragma('foreign_key_check').length, 0)

  let poll = 0
  globalThis.fetch = async () =>
    json(
      ++poll === 1
        ? { error: 'authorization_pending' }
        : { access_token: 'fake-token', scope: 'repo,read:org' }
    )
  const auth = {
    deviceCode: 'secret-device-code',
    userCode: 'ABCD-1234',
    verificationUri: 'https://github.com/login/device',
    expiresAt: Date.now() + 2000,
    interval: 1
  }
  assert.deepEqual(await authorize(auth, new AbortController().signal), {
    token: 'fake-token',
    scopes: ['repo', 'read:org']
  })
  globalThis.fetch = async () => json({ error: 'access_denied' })
  await assert.rejects(authorize(auth, new AbortController().signal), /declined/)
  await assert.rejects(
    authorize({ ...auth, expiresAt: 0 }, new AbortController().signal),
    /expired/
  )
  const abort = new AbortController()
  abort.abort()
  await assert.rejects(authorize(auth, abort.signal), /abort/i)
  globalThis.fetch = async () => json({ error: 'slow_down' })
  const slow = new AbortController()
  const slowResult = authorize({ ...auth, expiresAt: Date.now() + 10000 }, slow.signal)
  setTimeout(() => slow.abort(), 20)
  await assert.rejects(slowResult, /abort/i)

  globalThis.fetch = async () =>
    json(Array.from({ length: 100 }, (_, index) => ({ ...rawRepo, id: index + 100 })))
  assert.equal((await listRepos(source.id, 1)).nextPage, 2)
  await assert.rejects(listRepos(source.id, 0), /Invalid/)
  globalThis.fetch = async () => json({}, 401)
  const before = cachedRepos().length
  await assert.rejects(listRepos(source.id, 1), /revoked/)
  assert.equal(cachedRepos().length, before, 'failed requests preserve cache')
  let release: (value: Response) => void = () => {}
  globalThis.fetch = () =>
    new Promise<Response>((resolve) => {
      release = resolve
    })
  const stale = listRepos(source.id, 1)
  disconnect(source.id)
  release(json([rawRepo]))
  await assert.rejects(stale, /changed/)
  assert.equal(cachedRepos().length, 0, 'in-flight response cannot recreate disconnected data')

  globalThis.fetch = async (url) =>
    String(url).endsWith('/login/device/code')
      ? json({
          device_code: 'secret-device-code',
          user_code: 'ABCD-1234',
          verification_uri: 'https://github.com/login/device',
          expires_in: 60,
          interval: 0.001
        })
      : String(url).endsWith('/user')
        ? json({ id: 1, login: 'alice', avatar_url: '' })
        : json({ access_token: 'fake-token', scope: 'repo' })
  const pending = await connect()
  assert.equal(pending.authorization?.userCode, 'ABCD-1234')
  assert.ok(!JSON.stringify(pending).includes('secret-device-code'))
  const first = completeConnection()
  const second = completeConnection()
  assert.equal(first, second, 'all windows share the full completion pipeline')
  await first
  assert.equal(listSources().length, 1)
  assert.equal(getSnapshot().authorization, null)
  assert.notEqual(readCredential(source.id), 'fake-token')
  await connect()
  const canceled = completeConnection()
  cancelConnection()
  await assert.rejects(canceled, /abort/i)
  assert.equal(listSources().length, 1)
  console.log(
    'Git sources: persistence, favorites, clone merge, pagination, error/cache, cancellation and device authorization checks passed.'
  )
}
void run()
  .then(checkCheckouts)
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
