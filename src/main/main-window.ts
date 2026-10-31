import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import type { OpenWindow } from '../shared/window-channels'
import { loadRenderer } from './app-updates/windows'

let mainWindow: BrowserWindow | null = null
const appWindows = new Set<BrowserWindow>()
const artifactoryWindows = new Set<BrowserWindow>()

function configureWindow(window: BrowserWindow): BrowserWindow {
  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })
  appWindows.add(window)
  window.on('closed', () => appWindows.delete(window))
  return window
}

function createWorkspaceWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    title: 'The Garage',
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

  configureWindow(window)
  loadRenderer(window)
  return window
}

export function createMainWindow(): BrowserWindow {
  mainWindow = createWorkspaceWindow()
  mainWindow.on('closed', () => {
    mainWindow = null
    if (process.platform === 'darwin' && appWindows.size === 0) app.dock?.hide()
  })
  return mainWindow
}

export function createDuplicateWindow(): BrowserWindow {
  const window = createWorkspaceWindow()
  window.once('ready-to-show', () => showAppWindow(window))
  return window
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function showAppWindow(window: BrowserWindow): void {
  if (window.isMinimized()) window.restore()
  if (process.platform === 'darwin') app.dock?.show()
  window.show()
  window.focus()
  if (process.platform === 'darwin') app.focus({ steal: true })
}

export function registerAppWindow(window: BrowserWindow): void {
  configureWindow(window)
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = window
    window.on('closed', () => {
      if (mainWindow === window) mainWindow = null
      if (process.platform === 'darwin' && appWindows.size === 0) app.dock?.hide()
    })
  }
}

export function listAppWindows(): OpenWindow[] {
  return Array.from(appWindows)
    .filter((window) => !window.isDestroyed())
    .map((window) => ({
      id: window.id,
      title: window.getTitle() || 'The Garage',
      isFocused: window.isFocused()
    }))
}

export function focusAppWindow(id: number): void {
  const window = Array.from(appWindows).find((item) => item.id === id && !item.isDestroyed())
  if (!window) return
  showAppWindow(window)
}

export function createArtifactoryWindow(): BrowserWindow {
  const artifactoryWindow = new BrowserWindow({
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

  configureWindow(artifactoryWindow)
  loadRenderer(artifactoryWindow, '?artifactoryWindow=1')
  showAppWindow(artifactoryWindow)
  artifactoryWindows.add(artifactoryWindow)
  artifactoryWindow.on('closed', () => {
    artifactoryWindows.delete(artifactoryWindow)
  })
  return artifactoryWindow
}
