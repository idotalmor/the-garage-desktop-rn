/** Runs isolated Git source scenarios with mocked HTTP/keychain and real SQLite in a temporary home. */
import { build } from 'esbuild'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const home = mkdtempSync(join(tmpdir(), 'garage-git-sources-'))
try {
  const outfile = join(home, 'checks.cjs')
  await build({
    entryPoints: ['scripts/git-sources.test.ts'],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    external: ['better-sqlite3', 'drizzle-orm', 'drizzle-orm/*'],
    define: { 'import.meta.env.MAIN_VITE_GITHUB_CLIENT_ID': '"test-client"' },
    plugins: [
      {
        name: 'electron-test-boundary',
        setup(build) {
          build.onResolve({ filter: /^electron$/ }, () => ({ path: 'electron', namespace: 'test' }))
          build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({
            contents: `
        export const app = { getPath: () => process.env.GIT_SOURCES_TEST_HOME, on: () => {} };
        export const BrowserWindow = { getAllWindows: () => [] };
        export const safeStorage = { isEncryptionAvailable: () => true, getSelectedStorageBackend: () => 'keychain', encryptString: (value) => Buffer.from('mock-encrypted:' + value), decryptString: (value) => value.toString().replace('mock-encrypted:', '') };
        export const shell = { openExternal: async (url) => { (globalThis.__gitSourcesExternalUrls ??= []).push(url); } };
      `
          }))
        }
      }
    ]
  })
  const result = spawnSync(require('electron'), [outfile], {
    stdio: 'inherit',
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      GIT_SOURCES_TEST_HOME: home,
      NODE_PATH: resolve('node_modules')
    }
  })
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
} finally {
  rmSync(home, { recursive: true, force: true })
}
