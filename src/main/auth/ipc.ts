import { ipcMain } from 'electron'
import { AuthChannel } from '../../shared/auth/channels'
import { cancelSignIn, signInWithGoogle } from './service'

export function initAuthIpc(): void {
  ipcMain.handle(AuthChannel.SignInWithGoogle, () => signInWithGoogle())
  ipcMain.on(AuthChannel.CancelSignIn, () => cancelSignIn())
}
