/* eslint-disable @typescript-eslint/explicit-function-return-type -- plain JS script */
/**
 * Prints the native fingerprint of the built app: a hash of everything a JS bundle can't replace
 * (Electron, the main + preload output, the packages they require, packaging config, resources).
 * CI publishes a new base release (.dmg) when it changes; otherwise it ships only a JS bundle.
 * Run after `electron-vite build`. `--details` prints the inputs as JSON instead of only the hash.
 */
import { createHash } from 'crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'fs'
import { builtinModules } from 'module'
import { join, relative } from 'path'

const FILES = ['out/main', 'out/preload', 'resources', 'build', 'electron-builder.yml']
const TOOLS = ['electron', 'electron-builder']

const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'))
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))

function listFiles(path) {
  if (!existsSync(path)) return []
  if (!statSync(path).isDirectory()) return [path]
  return readdirSync(path)
    .sort()
    .flatMap((name) => listFiles(join(path, name)))
}

function sha256(data) {
  return createHash('sha256').update(data).digest('hex')
}

/** Bare package names that `out/main` and `out/preload` load at runtime (`require` / `import()`). */
function requiredPackages() {
  const names = new Set()
  const builtins = new Set(builtinModules)
  for (const file of [...listFiles('out/main'), ...listFiles('out/preload')]) {
    if (!file.endsWith('.js')) continue
    const code = readFileSync(file, 'utf8')
    for (const [, spec] of code.matchAll(/(?:require|import)\(\s*["']([^"'./][^"']*)["']\s*\)/g)) {
      const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]
      if (name === 'electron' || name.startsWith('node:') || builtins.has(name)) continue
      names.add(name)
    }
  }
  return [...names]
}

/** Lockfile path of `name` as Node would resolve it from the package at `from` ('' = the app). */
function resolveInLock(from, name) {
  let base = from
  for (;;) {
    const candidate = base ? `${base}/node_modules/${name}` : `node_modules/${name}`
    if (lock.packages[candidate]) return candidate
    if (!base) return null
    const index = base.lastIndexOf('/node_modules/')
    base = index === -1 ? '' : base.slice(0, index)
  }
}

/** `path@version` of every lockfile package the required packages pull in, sorted. */
function dependencyClosure(names) {
  const seen = new Set()
  const queue = names.map((name) => resolveInLock('', name)).filter(Boolean)
  while (queue.length > 0) {
    const path = queue.pop()
    if (seen.has(path)) continue
    seen.add(path)
    const entry = lock.packages[path]
    const deps = { ...entry.dependencies, ...entry.optionalDependencies }
    for (const dep of Object.keys(deps)) {
      const resolved = resolveInLock(path, dep)
      if (resolved) queue.push(resolved)
    }
  }
  return [...seen].sort().map((path) => `${path}@${lock.packages[path].version}`)
}

const inputs = {
  app: { name: pkg.name, productName: pkg.productName, main: pkg.main },
  tools: TOOLS.map((name) => `${name}@${lock.packages[`node_modules/${name}`]?.version}`),
  packages: dependencyClosure(requiredPackages()),
  files: Object.fromEntries(
    FILES.flatMap(listFiles).map((file) => [relative('.', file), sha256(readFileSync(file))])
  ),
  publicKey: process.env.MAIN_VITE_BUNDLE_PUBLIC_KEY ?? null
}
const fingerprint = sha256(JSON.stringify(inputs))

if (process.argv.includes('--details')) {
  console.log(JSON.stringify({ fingerprint, ...inputs }, null, 2))
} else {
  console.log(fingerprint)
}
