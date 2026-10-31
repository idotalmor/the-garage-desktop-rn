/**
 * GitHub releases: the latest base release's `base.json`, a base release's signed bundle manifest,
 * and downloading + verifying + unpacking a bundle. No DB or state.
 */
import { mkdir, rm, writeFile } from 'fs/promises'
import { dirname } from 'path'
import { extractTarball } from './extract'
import { fetchBytes, fetchJson } from './http'
import { assetUrl, latestAssetUrl } from './urls'
import type { BaseInfo, BundleManifest } from './types'
import { readManifest, sha256 } from './verify'

export { releasePageUrl } from './urls'
export type { BaseInfo, BundleManifest } from './types'

/** `base.json` of the latest release, or null when there is no release yet. */
export async function fetchLatestBase(): Promise<BaseInfo | null> {
  const raw = (await fetchJson(latestAssetUrl('base.json'))) as Partial<BaseInfo> | null
  if (!raw) return null
  if (typeof raw.version !== 'string' || !Number.isInteger(raw.build)) {
    throw new Error('base.json is malformed')
  }
  return raw as BaseInfo
}

/** The verified bundle manifest of the base release `baseVersion`, or null when it has none. */
export async function fetchBundleManifest(
  baseVersion: string,
  publicKey: string
): Promise<BundleManifest | null> {
  const raw = await fetchJson(assetUrl(baseVersion, 'bundle-manifest.json'))
  return raw ? readManifest(raw, publicKey) : null
}

/** Downloads the bundle, checks it against the manifest and unpacks it into `dir`. */
export async function downloadBundle(manifest: BundleManifest, dir: string): Promise<void> {
  const data = await fetchBytes(assetUrl(manifest.baseVersion, manifest.file))
  if (data.length !== manifest.size || sha256(data) !== manifest.sha256) {
    throw new Error(`Bundle ${manifest.version} does not match its manifest`)
  }
  const file = `${dir}.tar.gz`
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, data)
  try {
    await extractTarball(file, dir)
  } finally {
    await rm(file, { force: true })
  }
}
