/** OS-backed encryption boundary; tokens never leave the main process. */
import { safeStorage } from 'electron'
import { readCredential } from '../db/tables/credentials/queries'

export function assertSecureStorage(): void {
  if (
    !safeStorage.isEncryptionAvailable() ||
    (process.platform === 'linux' && safeStorage.getSelectedStorageBackend() === 'basic_text')
  ) {
    throw new Error(
      'Secure credential storage is unavailable. Unlock/configure your OS keychain before connecting GitHub.'
    )
  }
}
export function encryptToken(token: string): string {
  assertSecureStorage()
  return safeStorage.encryptString(token).toString('base64')
}
export function getToken(sourceId: string): string {
  assertSecureStorage()
  const encrypted = readCredential(sourceId)
  if (!encrypted) throw new Error('Git source is disconnected. Connect GitHub again.')
  try {
    return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
  } catch {
    throw new Error('Cannot unlock the GitHub credential. Reconnect GitHub.')
  }
}
