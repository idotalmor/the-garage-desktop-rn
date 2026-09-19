import { app, ipcMain, BrowserWindow, Menu } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import {
  createDuplicateWindow,
  createMainWindow,
  createReaderWindow,
  focusAppWindow,
  listAppWindows
} from './main-window'
import { WindowChannel } from '../shared/window-channels'
import { createTray, focusMainOrCreate, hidePopover } from './popover'
import { initNotesIpc } from './notes'
import { initFilesIpc } from './files'

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
    if (process.platform === 'darwin') app.dock?.show()
  })

  ipcMain.on('files:expand', () => {
    createReaderWindow()
  })

  ipcMain.handle(WindowChannel.Duplicate, () => {
    const window = createDuplicateWindow()
    return window.id
  })

  ipcMain.handle(WindowChannel.List, () => listAppWindows())

  ipcMain.on(WindowChannel.Focus, (_, id: number) => {
    focusAppWindow(id)
  })

  initNotesIpc()
  initFilesIpc()
  createTray()
  createMainWindow()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
