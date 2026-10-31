/** CI versions are `1.0.<build>`; the build number orders bundles and releases. */

/** The build number of a version (its last part), 0 for local builds like `1.0.0`. */
export function buildOf(version: string): number {
  const build = Number(version.split('.').pop())
  return Number.isInteger(build) ? build : 0
}
