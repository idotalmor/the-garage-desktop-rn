import { app, ipcMain, BrowserWindow, Menu } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import {
  createDuplicateWindow,
  createMainWindow,
  createArtifactoryWindow,
  focusAppWindow,
  listAppWindows,
  showAppWindow
} from './main-window'
import { WindowChannel } from '../shared/window-channels'
import { createTray, focusMainOrCreate, hidePopover, promotePopoverToWindow } from './popover'
import { initNotesIpc } from './notes'
import { initArtifactoryIpc } from './artifactory/ipc'
import { initIntegrationsIpc } from './integrations/ipc'
import { initAppStateIpc } from './app-state'
import { initRecordingIpc } from './recording'
import { initFocusModeIpc } from './focus-mode'

const APP_NAME = 'The Orchestrator'
app.setName(APP_NAME)

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        {
          label: APP_NAME,
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
          ]
        },
        { role: 'editMenu' },
        { role: 'viewMenu' },
        { role: 'windowMenu' }
      ])
    )
    app.dock?.hide()
  }

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('app:open-main', () => {
    focusMainOrCreate()
    hidePopover()
  })

  ipcMain.on('artifactory:expand', () => {
    createArtifactoryWindow()
  })

  ipcMain.handle(WindowChannel.Duplicate, () => {
    const window = createDuplicateWindow()
    return window.id
  })

  ipcMain.handle(WindowChannel.List, () => listAppWindows())

  ipcMain.on(WindowChannel.Focus, (_, id: number) => {
    focusAppWindow(id)
  })

  ipcMain.on(WindowChannel.Promote, () => {
    promotePopoverToWindow()
  })

  initNotesIpc()
  initArtifactoryIpc()
  initIntegrationsIpc()
  initAppStateIpc()
  initRecordingIpc()
  initFocusModeIpc()
  createTray()
  createMainWindow()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    showAppWindow(createMainWindow())
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
