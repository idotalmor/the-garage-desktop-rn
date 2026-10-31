/** Reads and writes of `bundles`. */
import { desc, eq, inArray } from 'drizzle-orm'
import { getDb } from '../../connection'
import { bundles, type BundleDbEntity } from './schema'

/** Every downloaded bundle, newest first. */
export function listBundles(): BundleDbEntity[] {
  return getDb().select().from(bundles).orderBy(desc(bundles.build)).all()
}

/** Bundles built for the installed app version `baseVersion`, newest first. */
export function listBaseBundles(baseVersion: string): BundleDbEntity[] {
  return getDb()
    .select()
    .from(bundles)
    .where(eq(bundles.baseVersion, baseVersion))
    .orderBy(desc(bundles.build))
    .all()
}

export function findBundle(build: number): BundleDbEntity | null {
  return getDb().select().from(bundles).where(eq(bundles.build, build)).get() ?? null
}

/** Saves a freshly downloaded bundle, replacing a row with the same build. */
export function saveBundle(bundle: BundleDbEntity): void {
  getDb()
    .insert(bundles)
    .values(bundle)
    .onConflictDoUpdate({ target: bundles.build, set: bundle })
    .run()
}

export function setBundleStatus(
  build: number,
  status: BundleDbEntity['status'],
  error: string | null = null
): void {
  getDb().update(bundles).set({ status, error }).where(eq(bundles.build, build)).run()
}

export function deleteBundles(builds: number[]): void {
  if (builds.length === 0) return
  getDb().delete(bundles).where(inArray(bundles.build, builds)).run()
}
