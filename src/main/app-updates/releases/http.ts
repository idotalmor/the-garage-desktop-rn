/** HTTP through Electron's `net.fetch` (follows GitHub's redirects to its file host), with a timeout. */
import { net } from 'electron'

const TIMEOUT_MS = 60_000

async function get(url: string): Promise<Response | null> {
  const response = await net.fetch(url, {
    headers: { 'Cache-Control': 'no-cache' },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`GET ${url}: HTTP ${response.status}`)
  return response
}

/** The parsed JSON at `url`, or null when it doesn't exist (404). */
export async function fetchJson(url: string): Promise<unknown | null> {
  const response = await get(url)
  return response ? response.json() : null
}

/** The bytes at `url`; a missing file is an error. */
export async function fetchBytes(url: string): Promise<Buffer> {
  const response = await get(url)
  if (!response) throw new Error(`GET ${url}: HTTP 404`)
  return Buffer.from(await response.arrayBuffer())
}
