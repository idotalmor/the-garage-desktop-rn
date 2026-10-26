/** Git source communication only: validate arguments, dispatch one action and broadcast snapshots. */
import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { isAbsolute } from 'path'
import type { CheckoutRequest } from '../../shared/git-sources/types'
import { GitSourcesChannel } from '../../shared/git-sources/channels'
import { getSnapshot, subscribe, cancelAuthorization } from './sync'
import {
  openUrl,
  connect,
  completeConnection,
  cancelConnection,
  listRepos,
  setFavorite,
  disconnect,
  refresh,
  prepareCheckout,
  createCheckout
} from './use-cases'
export function initGitSourcesIpc(): void {
  ipcMain.handle(GitSourcesChannel.OpenUrl, (_, url: unknown) => openUrl(url))
  ipcMain.handle(GitSourcesChannel.GetSnapshot, () => getSnapshot())
  ipcMain.handle(GitSourcesChannel.Connect, () => connect())
  ipcMain.handle(GitSourcesChannel.Complete, () => completeConnection())
  ipcMain.handle(GitSourcesChannel.Cancel, () => cancelConnection())
  ipcMain.handle(GitSourcesChannel.ListRepos, (_, sourceId: unknown, page: unknown) =>
    listRepos(id(sourceId), Number(page))
  )
  ipcMain.handle(
    GitSourcesChannel.SetFavorite,
    (_, sourceId: unknown, externalId: unknown, favorite: unknown) => {
      if (typeof favorite !== 'boolean') throw new Error('Invalid favorite flag.')
      return setFavorite(id(sourceId), id(externalId), favorite)
    }
  )
  ipcMain.handle(GitSourcesChannel.Disconnect, (_, sourceId: unknown) => disconnect(id(sourceId)))
  ipcMain.handle(GitSourcesChannel.Refresh, (_, sourceId: unknown) => refresh(id(sourceId)))
  ipcMain.handle(GitSourcesChannel.PrepareCheckout, (_, request: unknown) =>
    prepareCheckout(checkoutRequest(request))
  )
  ipcMain.handle(
    GitSourcesChannel.CreateCheckout,
    async (event, request: unknown, suggestedParent: unknown, folderName: unknown) => {
      const target = checkoutRequest(request)
      const options: Electron.OpenDialogOptions = {
        title: `Choose parent folder for ${typeof folderName === 'string' ? folderName.slice(0, 100) : 'checkout'}`,
        buttonLabel: 'Create checkout here',
        properties: ['openDirectory', 'createDirectory'],
        defaultPath:
          typeof suggestedParent === 'string' && isAbsolute(suggestedParent)
            ? suggestedParent
            : undefined
      }
      const window = BrowserWindow.fromWebContents(event.sender)
      const result = window
        ? await dialog.showOpenDialog(window, options)
        : await dialog.showOpenDialog(options)
      return result.canceled || !result.filePaths[0]
        ? null
        : createCheckout(target, result.filePaths[0])
    }
  )
  subscribe((snapshot) => {
    for (const window of BrowserWindow.getAllWindows())
      window.webContents.send(GitSourcesChannel.Changed, snapshot)
  })
  app.on('before-quit', cancelAuthorization)
}
function checkoutRequest(value: unknown): CheckoutRequest {
  if (!value || typeof value !== 'object') throw new Error('Invalid checkout request.')
  const { repo, branch } = value as Partial<CheckoutRequest>
  if (
    !repo ||
    typeof repo !== 'object' ||
    (branch !== null && (typeof branch !== 'string' || !branch || branch.length > 250))
  )
    throw new Error('Invalid checkout request.')
  if (repo.kind === 'url') {
    if (typeof repo.url !== 'string' || !repo.url.trim() || repo.url.length > 2048)
      throw new Error('Invalid clone URL.')
    return { repo: { kind: 'url', url: repo.url.trim() }, branch }
  }
  if (repo.kind === 'local') return { repo: { kind: 'local', id: id(repo.id) }, branch }
  if (repo.kind === 'remote')
    return {
      repo: { kind: 'remote', sourceId: id(repo.sourceId), externalId: id(repo.externalId) },
      branch
    }
  throw new Error('Unsupported checkout target.')
}
function id(value: unknown): string {
  if (typeof value !== 'string' || !value || value.length > 200)
    throw new Error('Invalid Git source id.')
  return value
}
