/** Converts a `sources` row to the app's `Source`. */
import type { Source } from '../../../../../shared/local-repos/types'
import type { SourceDbEntity } from './schema'

export function toSource(row: SourceDbEntity): Source {
  return {
    id: row.id,
    path: row.path,
    maxDepth: row.max_depth,
    addedAt: row.added_at,
    lastScannedAt: row.last_scanned_at,
    lastError: row.last_error
  }
}
