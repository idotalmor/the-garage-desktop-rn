/**
 * Packs `out/renderer` into `dist/bundle-<VERSION>.tar.gz` and writes `dist/bundle-manifest.json`:
 * the bundle's facts as a JSON string (`payload`) plus its ed25519 `signature` by `BUNDLE_SIGNING_KEY`.
 * Env: VERSION (e.g. 1.0.57), BUILD (57), BASE_VERSION (the installed app it runs on), COMMIT.
 */
import { execFileSync } from 'child_process'
import { createHash, createPrivateKey, sign } from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const { VERSION, BUILD, BASE_VERSION, COMMIT, BUNDLE_SIGNING_KEY } = process.env
for (const [name, value] of Object.entries({
  VERSION,
  BUILD,
  BASE_VERSION,
  COMMIT,
  BUNDLE_SIGNING_KEY
})) {
  if (!value) {
    console.error(`${name} is not set`)
    process.exit(1)
  }
}
if (!existsSync('out/renderer/index.html')) {
  console.error('out/renderer/index.html is missing: run `electron-vite build` first')
  process.exit(1)
}

mkdirSync('dist', { recursive: true })
const file = `bundle-${VERSION}.tar.gz`
const path = join('dist', file)
execFileSync('tar', ['-czf', path, '-C', 'out/renderer', '.'], {
  env: { ...process.env, COPYFILE_DISABLE: '1' }
})
const data = readFileSync(path)

const payload = JSON.stringify({
  baseVersion: BASE_VERSION,
  version: VERSION,
  build: Number(BUILD),
  commit: COMMIT,
  file,
  sha256: createHash('sha256').update(data).digest('hex'),
  size: data.length,
  publishedAt: new Date().toISOString()
})
const signature = sign(null, Buffer.from(payload), createPrivateKey(BUNDLE_SIGNING_KEY))
writeFileSync(
  join('dist', 'bundle-manifest.json'),
  JSON.stringify({ payload, signature: signature.toString('base64') }, null, 2)
)
console.log(`wrote ${path} and dist/bundle-manifest.json`)
