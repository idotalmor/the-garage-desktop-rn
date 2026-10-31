/**
 * Prints the public half of `BUNDLE_SIGNING_KEY` (an ed25519 private key, PEM) as base64 SPKI DER.
 * CI builds it into the app as `MAIN_VITE_BUNDLE_PUBLIC_KEY`, so the app only runs bundles we signed.
 */
import { createPrivateKey, createPublicKey } from 'crypto'

const pem = process.env.BUNDLE_SIGNING_KEY
if (!pem) {
  console.error('BUNDLE_SIGNING_KEY is not set')
  process.exit(1)
}
const der = createPublicKey(createPrivateKey(pem)).export({ type: 'spki', format: 'der' })
process.stdout.write(der.toString('base64'))
