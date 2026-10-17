import { ElectronAPI } from '@electron-toolkit/preload'
import type { GoogleCredential } from '../shared/auth/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getPathForFile: (file: File) => string
      auth: {
        signInWithGoogle: () => Promise<GoogleCredential | null>
        cancelSignIn: () => void
      }
    }
  }
}
