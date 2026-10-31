/** Checks a bundle manifest's ed25519 signature and shape, and hashes downloaded bytes. */
import { createHash, createPublicKey, verify } from 'crypto'
import type { BundleManifest } from './types'

const FILE_NAME = /^bundle-[\w.-]+\.tar\.gz$/

/** The manifest's payload if CI signed it with the key built into the app; throws otherwise. */
export function readManifest(raw: unknown, publicKey: string): BundleManifest {
  const { payload, signature } = (raw ?? {}) as { payload?: unknown; signature?: unknown }
  if (typeof payload !== 'string' || typeof signature !== 'string') {
    throw new Error('Bundle manifest has no payload or signature')
  }
  const key = createPublicKey({
    key: Buffer.from(publicKey, 'base64'),
    format: 'der',
    type: 'spki'
  })
  if (!verify(null, Buffer.from(payload), key, Buffer.from(signature, 'base64'))) {
    throw new Error('Bundle manifest signature is invalid')
  }
  return parseManifest(JSON.parse(payload))
}

function parseManifest(value: unknown): BundleManifest {
  const manifest = value as Partial<BundleManifest>
  const strings = ['baseVersion', 'version', 'commit', 'file', 'sha256', 'publishedAt'] as const
  const valid =
    strings.every((field) => typeof manifest[field] === 'string') &&
    Number.isInteger(manifest.build) &&
    Number.isInteger(manifest.size) &&
    FILE_NAME.test(manifest.file ?? '')
  if (!valid) throw new Error('Bundle manifest is malformed')
  return manifest as BundleManifest
}

export function sha256(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex')
}
