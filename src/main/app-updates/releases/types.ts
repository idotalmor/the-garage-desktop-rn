/** What the GitHub releases hold, as the app reads them (written by `scripts/release/`). */

/** `base.json` of a base release (the .dmg). */
export type BaseInfo = {
  /** App version of the release, e.g. `1.0.42`. */
  version: string
  /** Its CI build number. */
  build: number
  /** Native fingerprint it was built with (CI compares it; the app doesn't use it). */
  fingerprint: string
  /** Commit it was built from. */
  commit: string
  /** When CI published it (ISO). */
  publishedAt: string
}

/** The signed payload of `bundle-manifest.json`: the newest JS bundle for one base release. */
export type BundleManifest = {
  /** App version the bundle runs on (the release it is attached to). */
  baseVersion: string
  /** Bundle version, e.g. `1.0.57`. */
  version: string
  /** Its CI build number; higher = newer. */
  build: number
  /** Commit it was built from. */
  commit: string
  /** Asset name of the tarball on the release, `bundle-<version>.tar.gz`. */
  file: string
  /** sha256 (hex) of the tarball. */
  sha256: string
  /** Size of the tarball in bytes. */
  size: number
  /** When CI published it (ISO). */
  publishedAt: string
}
