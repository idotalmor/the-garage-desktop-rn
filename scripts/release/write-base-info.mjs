/**
 * Writes `dist/base.json` for a base release: its version, build number, native fingerprint and
 * commit. CI compares the next build's fingerprint with it; the app reads it from the latest
 * release to tell the user a new .dmg is out. Env: VERSION, BUILD, FINGERPRINT, COMMIT.
 */
import { mkdirSync, writeFileSync } from 'fs'

const { VERSION, BUILD, FINGERPRINT, COMMIT } = process.env
for (const [name, value] of Object.entries({ VERSION, BUILD, FINGERPRINT, COMMIT })) {
  if (!value) {
    console.error(`${name} is not set`)
    process.exit(1)
  }
}
mkdirSync('dist', { recursive: true })
const info = {
  version: VERSION,
  build: Number(BUILD),
  fingerprint: FINGERPRINT,
  commit: COMMIT,
  publishedAt: new Date().toISOString()
}
writeFileSync('dist/base.json', JSON.stringify(info, null, 2))
console.log('wrote dist/base.json')
