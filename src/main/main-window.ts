import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null
const readerWindows = new Set<BrowserWindow>()

function configureWindow(window: BrowserWindow): BrowserWindow {
  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  return window
}

function loadRenderer(window: BrowserWindow, query = ''): void {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}${query}`)
  } else {
    const params = new URLSearchParams(query)
    window.loadFile(join(__dirname, '../renderer/index.html'), {
      query: Object.fromEntries(params.entries())
    })
  }
}

export function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    title: 'The Orchestrator',
    autoHideMenuBar: true,
    ...(process.platform === 'darwin'
      ? {
          titleBarStyle: 'hidden',
          trafficLightPosition: { x: 14, y: 14 }
        }
      : {}),
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  configureWindow(mainWindow)
  loadRenderer(mainWindow)

  mainWindow.on('closed', () => {
    mainWindow = null
    if (process.platform === 'darwin') app.dock?.hide()
  })

  return mainWindow
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function createReaderWindow(): BrowserWindow {
  const readerWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Artifactory',
    autoHideMenuBar: true,
    ...(process.platform === 'darwin'
      ? { titleBarStyle: 'hidden', trafficLightPosition: { x: 14, y: 14 } }
      : {}),
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  configureWindow(readerWindow)
  loadRenderer(readerWindow, '?readerWindow=1')
  readerWindows.add(readerWindow)
  readerWindow.on('closed', () => {
    readerWindows.delete(readerWindow)
  })
  return readerWindow
}
