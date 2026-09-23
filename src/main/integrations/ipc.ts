import { ipcMain } from 'electron'
import { IntegrationChannel } from '../../shared/integrations/channels'
import type { ChatMessage, MemoryState, ProviderId } from '../../shared/integrations/types'
import { memoryChat } from './chat'
import { refreshMemoryWatchers } from './memory-watch'
import {
  listProviders,
  providerMemoryPaths,
  setProviderInstalled,
  syncMemoryToProviders
} from './providers'
import { getSession, listSessions, watchSessionSources } from './sessions'
import {
  ensureDirs,
  getApiKey,
  readMemoryContent,
  readMemoryItems,
  setApiKey,
  writeMemoryContent
} from './store'

function memoryState(): MemoryState {
  return {
    items: readMemoryItems(),
    content: readMemoryContent(),
    syncedProviders: providerMemoryPaths().map((provider) => provider.id)
  }
}

export function initIntegrationsIpc(): void {
  ensureDirs()
  watchSessionSources()
  refreshMemoryWatchers()

  ipcMain.handle(IntegrationChannel.MemoryGet, () => memoryState())

  ipcMain.handle(IntegrationChannel.MemorySave, (_, content: string) => {
    writeMemoryContent(String(content ?? ''))
    return memoryState()
  })

  ipcMain.handle(IntegrationChannel.MemorySync, (_, content: string) => {
    writeMemoryContent(String(content ?? ''))
    syncMemoryToProviders()
    refreshMemoryWatchers()
    return memoryState()
  })

  ipcMain.handle(IntegrationChannel.MemoryChat, (_, messages: ChatMessage[]) => {
    return memoryChat(Array.isArray(messages) ? messages : [], readMemoryContent())
  })

  ipcMain.handle(IntegrationChannel.ProvidersList, () => listProviders())

  ipcMain.handle(
    IntegrationChannel.ProviderSetInstalled,
    (_, payload: { id: ProviderId; installed: boolean }) => {
      const providers = setProviderInstalled(payload.id, Boolean(payload.installed))
      refreshMemoryWatchers()
      return providers
    }
  )

  ipcMain.handle(IntegrationChannel.SessionsList, () => listSessions())

  ipcMain.handle(IntegrationChannel.SessionGet, (_, id: string) => getSession(String(id ?? '')))

  ipcMain.handle(IntegrationChannel.HasApiKey, () => Boolean(getApiKey()))

  ipcMain.handle(IntegrationChannel.SetApiKey, (_, key: string) => {
    setApiKey(String(key ?? '').trim())
    return Boolean(getApiKey())
  })
}
