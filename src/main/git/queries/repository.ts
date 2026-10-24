/** Questions about the repo a folder belongs to: its shared git dir and whether it is bare. */
import { promises as fs } from 'fs'
import { resolve } from 'path'
import { gitOrNull } from '../run'

/** The shared `.git` directory of a checkout. All checkouts of one repo return the same path. */
export async function resolveCommonDir(dir: string): Promise<string | null> {
  const output = await gitOrNull(dir, ['rev-parse', '--git-common-dir'])
  if (!output) return null
  try {
    return await fs.realpath(resolve(dir, output.trim()))
  } catch {
    return null
  }
}

/** True for a repo with no checked-out files (e.g. `git clone --bare`). */
export async function isBareRepository(dir: string): Promise<boolean> {
  return (await gitOrNull(dir, ['rev-parse', '--is-bare-repository']))?.trim() === 'true'
}
