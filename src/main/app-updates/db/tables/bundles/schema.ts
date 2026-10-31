/** `bundles` table: one row per JS bundle this Mac downloaded, keyed by its CI build number. */
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/** `downloaded`: verified and unpacked, not run yet. `confirmed`: its UI reported ready once. `bad`: it failed, never run again. */
export type BundleStatus = 'downloaded' | 'confirmed' | 'bad'

export const bundles = sqliteTable('bundles', {
  /** CI build number from the signed manifest (`1.0.57` → 57); higher = newer. */
  build: integer('build').primaryKey(),
  /** Bundle version from the manifest, e.g. `1.0.57`. */
  version: text('version').notNull(),
  /** Installed app version it was built for (the manifest's `baseVersion`); it only runs on that version. */
  baseVersion: text('base_version').notNull(),
  /** Commit CI built it from (manifest). */
  commit: text('commit').notNull(),
  /** sha256 of the downloaded tarball; matched the signed manifest. */
  sha256: text('sha256').notNull(),
  /** Folder it was unpacked into, `~/.devflow/app-updates/bundles/<build>`; holds `index.html`. */
  dir: text('dir').notNull(),
  /** Set by the download (`downloaded`), the first ready report (`confirmed`) or a failed first load (`bad`). */
  status: text('status').$type<BundleStatus>().notNull(),
  /** Why it was marked `bad` (timeout, load error, renderer crash). Null otherwise. */
  error: text('error'),
  /** When it was downloaded (epoch ms). */
  downloadedAt: integer('downloaded_at').notNull()
})

/** A `bundles` row as read from the DB. */
export type BundleDbEntity = typeof bundles.$inferSelect
