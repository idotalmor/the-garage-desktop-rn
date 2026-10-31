/**
 * Background job (run by `sync`): reads the signed bundle manifest of the installed app's release and
 * downloads that bundle if it is newer than anything here and not seen before (so a `bad` one is
 * never fetched again). The windows switch to it on "Update" or the next launch.
 */
import { join } from 'path'
import { app } from 'electron'
import { findBundle, listBaseBundles, saveBundle } from '../db/tables/bundles/queries'
import { downloadBundle, fetchBundleManifest } from '../releases'
import { bundlePublicKey, bundlesDir } from '../utils/settings'
import { buildOf } from '../utils/versions'

export async function downloadNewBundle(): Promise<void> {
  const publicKey = bundlePublicKey()
  if (!publicKey) return
  const baseVersion = app.getVersion()
  const manifest = await fetchBundleManifest(baseVersion, publicKey)
  if (!manifest || manifest.baseVersion !== baseVersion) return
  const newest = Math.max(buildOf(baseVersion), ...listBaseBundles(baseVersion).map((b) => b.build))
  if (manifest.build <= newest || findBundle(manifest.build)) return

  const dir = join(bundlesDir(), String(manifest.build))
  await downloadBundle(manifest, dir)
  saveBundle({
    build: manifest.build,
    version: manifest.version,
    baseVersion,
    commit: manifest.commit,
    sha256: manifest.sha256,
    dir,
    status: 'downloaded',
    error: null,
    downloadedAt: Date.now()
  })
}
