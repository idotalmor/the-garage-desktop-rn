/** Real Git/filesystem checkout regression scenarios; all writes are under the harness's temporary home. */
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import {
  addWorktree,
  cloneRepo,
  listWorktrees,
  resolveCommonDir,
  validateBranch
} from '../src/main/git'
import {
  checkoutFolderName,
  parseCloneUrl,
  reserveCheckoutFolder,
  suggestedCheckoutParent,
  validateCheckoutParent
} from '../src/main/git-sources/checkout'
import type { LocalRepo } from '../src/shared/local-repos/types'
import { mergeRepos } from '../src/renderer/src/features/git-sources/repositories'
import { scanSource } from '../src/main/local-repos/scanner'
import {
  saveRepo,
  listRepos as savedLocalRepos
} from '../src/main/local-repos/db/tables/local-repos/queries'
import {
  insertSources,
  listSources as savedSources
} from '../src/main/local-repos/db/tables/sources/queries'

const exec = promisify(execFile)
export async function checkCheckouts(): Promise<void> {
  assert.deepEqual(parseCloneUrl(' https://github.com/Acme/Project.git '), {
    cloneUrl: 'https://github.com/Acme/Project.git',
    slug: 'github.com/acme/project',
    name: 'Project'
  })
  assert.equal(parseCloneUrl('git@github.com:Acme/Project.git').slug, 'github.com/acme/project')
  assert.equal(
    parseCloneUrl('git@github.com:Acme/Project.git').cloneUrl,
    'git@github.com:Acme/Project.git'
  )
  assert.equal(parseCloneUrl('ssh://git@github.com/Acme/Project').slug, 'github.com/acme/project')
  for (const url of [
    'file:///tmp/repo',
    'ext::bad',
    'https://github.com.evil.test/acme/repo',
    'https://user:secret@github.com/acme/repo',
    'https://github.com/acme/repo/pull/1',
    'https://github.com/acme/repo?token=secret'
  ])
    assert.throws(() => parseCloneUrl(url))
  const root = join(process.env.GIT_SOURCES_TEST_HOME!, 'checkout-scenarios')
  await fs.mkdir(root)
  const origin = join(root, 'origin')
  await exec('/usr/bin/git', ['init', '-b', 'main', origin])
  await exec('/usr/bin/git', [
    '-C',
    origin,
    '-c',
    'user.name=Checkout Test',
    '-c',
    'user.email=checkout@example.invalid',
    '-c',
    'commit.gpgsign=false',
    'commit',
    '--allow-empty',
    '-m',
    'Initial test commit'
  ])
  const destination = await reserveCheckoutFolder(root, 'project', [])
  await cloneRepo(root, origin, destination, 'main', 'Basic test-only-authorization')
  assert.ok(
    !(await fs.readFile(join(destination, '.git', 'config'), 'utf8')).includes(
      'test-only-authorization'
    )
  )
  insertSources([await fs.realpath(destination)])
  for (const scanned of await scanSource(destination, 4)) saveRepo(scanned)
  assert.equal(savedSources().length, 1)
  assert.equal(savedLocalRepos().length, 1)
  assert.equal(savedLocalRepos()[0].worktrees.length, 1)
  assert.equal(
    (await exec('/usr/bin/git', ['-C', destination, 'branch', '--show-current'])).stdout.trim(),
    'main'
  )
  const commonDir = (await resolveCommonDir(destination))!
  const repo = {
    id: 'checkout-local',
    name: 'project',
    commonDir,
    isBare: false,
    worktrees: [{ path: destination, isMain: true, branch: 'main', isPrunable: false }]
  } as LocalRepo
  const status = async (): Promise<string> =>
    (await exec('/usr/bin/git', ['-C', destination, 'status', '--porcelain'])).stdout
  assert.equal(await status(), '')
  assert.equal(await suggestedCheckoutParent(repo, [repo]), await fs.realpath(root))
  assert.equal(
    checkoutFolderName('project', 'feature/nested/name', true),
    'project-feature-nested-name'
  )
  assert.equal(checkoutFolderName('project', 'main', false), 'project')
  assert.throws(() => checkoutFolderName('CON', null, false))
  await assert.rejects(validateBranch(destination, '--force'))
  await assert.rejects(validateBranch(destination, '@{-1}'))
  await assert.rejects(validateBranch(destination, '../escape'))
  await assert.rejects(validateCheckoutParent(destination, [repo]), /outside/)
  const nested = join(destination, '.worktrees')
  await fs.mkdir(nested)
  await assert.rejects(validateCheckoutParent(nested, [repo]), /outside/)
  await assert.rejects(validateCheckoutParent(nested, []), /inside a Git repo/)
  await fs.rmdir(nested)
  const alias = join(root, 'alias-to-repo')
  await fs.symlink(destination, alias)
  await assert.rejects(validateCheckoutParent(alias, [repo]), /outside/)
  await assert.rejects(reserveCheckoutFolder(root, '..', [repo]), /Invalid/)
  const protectedFolder = join(root, 'protected')
  await fs.mkdir(protectedFolder)
  await fs.writeFile(join(protectedFolder, 'sentinel'), 'keep me')
  await assert.rejects(reserveCheckoutFolder(root, 'protected', [repo]), /already exists/)
  assert.equal(await fs.readFile(join(protectedFolder, 'sentinel'), 'utf8'), 'keep me')

  await exec('/usr/bin/git', ['-C', destination, 'branch', 'feature/local'])
  const linked = await reserveCheckoutFolder(
    root,
    checkoutFolderName('project', 'feature/local', true),
    [repo]
  )
  await addWorktree(commonDir, linked, 'feature/local')
  assert.equal(await resolveCommonDir(linked), commonDir)
  assert.equal((await listWorktrees(commonDir)).length, 2)
  assert.equal(await status(), '', 'sibling worktree does not dirty original checkout')
  for (const scanned of await scanSource(destination, 4)) saveRepo(scanned)
  assert.equal(savedSources().length, 1, 'a sibling worktree does not need another scan source')
  assert.equal(savedLocalRepos().length, 1, 'linked worktree shares the existing repo row')
  assert.equal(
    savedLocalRepos()[0].worktrees.length,
    2,
    'scanner discovers the sibling outside the source'
  )
  await assert.rejects(
    addWorktree(commonDir, join(root, 'duplicate-main'), 'main'),
    /already has a checkout/
  )

  await exec('/usr/bin/git', ['-C', origin, 'branch', 'feature/remote'])
  const remoteTree = await reserveCheckoutFolder(root, 'project-feature-remote', [repo])
  await addWorktree(commonDir, remoteTree, 'feature/remote')
  assert.equal(await resolveCommonDir(remoteTree), commonDir)
  assert.equal(
    (
      await exec('/usr/bin/git', ['-C', remoteTree, 'rev-parse', '--abbrev-ref', '@{upstream}'])
    ).stdout.trim(),
    'origin/feature/remote'
  )
  assert.equal(await status(), '', 'fetch and worktree add leave original files clean')

  await exec('/usr/bin/git', [
    '-C',
    destination,
    'remote',
    'set-url',
    'origin',
    'https://github.com/Acme/Project.git'
  ])
  for (const scanned of await scanSource(destination, 4)) saveRepo(scanned)
  const cards = mergeRepos(savedLocalRepos(), null)
  assert.equal(cards.length, 1, 'a URL-cloned local repo is shown without a connection or favorite')
  assert.equal(cards[0].worktrees.length, 3, 'sibling checkouts stay under the same repo')
  assert.equal(savedLocalRepos()[0].slug, parseCloneUrl('git@github.com:Acme/Project.git').slug)
  assert.equal(cards[0].githubUrl, 'https://github.com/acme/project')
  const bare = join(root, 'project.git')
  await exec('/usr/bin/git', ['clone', '--bare', origin, bare])
  const bareRepo = { ...repo, commonDir: bare, isBare: true, worktrees: [] }
  assert.equal(await suggestedCheckoutParent(bareRepo, [bareRepo]), await fs.realpath(root))
  const bareTree = await reserveCheckoutFolder(root, 'bare-main', [bareRepo])
  await addWorktree(bare, bareTree, 'main')
  assert.equal(await resolveCommonDir(bareTree), await fs.realpath(bare))
  console.log(
    'Checkout scenarios passed: real clone, sibling worktrees, remote branch fetch/tracking, bare repos, clean originals, symlink/nesting/collision rejection.'
  )
}
