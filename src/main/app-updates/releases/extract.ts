/** Unpacks a bundle tarball into its folder with the system `tar` (bsdtar on macOS skips `..` paths). */
import { execFile } from 'child_process'
import { existsSync } from 'fs'
import { mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

/** Replaces `dir` with the tarball's contents; throws if it has no `index.html`. */
export async function extractTarball(file: string, dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true })
  await mkdir(dir, { recursive: true })
  await execFileAsync('tar', ['-xzf', file, '-C', dir], { timeout: 60_000 })
  if (!existsSync(join(dir, 'index.html'))) throw new Error('Bundle has no index.html')
}
