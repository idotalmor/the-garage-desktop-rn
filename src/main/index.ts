import { app, ipcMain, BrowserWindow } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { createMainWindow } from './main-window'
import { createTray, focusMainOrCreate, hidePopover } from './popover'
import { initNotesIpc } from './notes'

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  if (process.platform === 'darwin') app.dock?.hide()

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('app:open-main', () => {
    focusMainOrCreate()
    hidePopover()
    if (process.platform === 'darwin') app.dock?.show()
  })

  initNotesIpc()
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
