/** Concurrency limits for the scanner, so a scan doesn't spawn hundreds of git processes at once. */

/** Max parallel git processes per scan. */
export const GIT_CONCURRENCY = 6

/** Like `Promise.all(items.map(fn))`, but runs at most `limit` calls at a time. Keeps result order. */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await fn(items[index], index)
    }
  })
  await Promise.all(workers)
  return results
}
