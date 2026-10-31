import { app, BrowserWindow, Menu, Tray, nativeImage, screen } from 'electron'
import { join } from 'path'
import { loadRenderer } from './app-updates/windows'
import trayIconSource from '../../resources/tray-icon.png?asset'
import {
  createDuplicateWindow,
  createMainWindow,
  getMainWindow,
  registerAppWindow,
  showAppWindow
} from './main-window'

const POPOVER_WIDTH = process.platform === 'darwin' ? 500 : 360
const POPOVER_HEIGHT = process.platform === 'darwin' ? 700 : 480
const POPOVER_MARGIN = 10
const POPOVER_ANIMATION_DURATION = 420

let popoverWindow: BrowserWindow | null = null
let tray: Tray | null = null
let popoverAnimation: ReturnType<typeof setInterval> | null = null

function activateApp(): void {
  if (process.platform === 'darwin') app.focus({ steal: true })
}

function createPopoverWindow(): void {
  popoverWindow = new BrowserWindow({
    width: POPOVER_WIDTH,
    height: POPOVER_HEIGHT,
    show: false,
    resizable: true,
    minWidth: 320,
    minHeight: 360,
    skipTaskbar: true,
    transparent: true,
    hasShadow: true,
    backgroundColor: '#00000000',
    ...(process.platform === 'darwin'
      ? { titleBarStyle: 'hidden', trafficLightPosition: { x: 14, y: 14 } }
      : { frame: false, minimizable: false, maximizable: false }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  if (process.platform === 'darwin') {
    popoverWindow.setWindowButtonVisibility(false)
  }

  loadRenderer(popoverWindow)

  popoverWindow.on('closed', () => {
    stopPopoverAnimation()
    popoverWindow = null
  })

  popoverWindow.on('blur', () => {
    animatePopoverOut()
  })
}

function stopPopoverAnimation(): void {
  if (!popoverAnimation) return
  clearInterval(popoverAnimation)
  popoverAnimation = null
}

function getPopoverPosition(): { x: number; y: number } {
  const bounds = tray?.getBounds() ?? { x: 0, y: 0, width: 0, height: 0 }
  const { width, height } = popoverWindow?.getBounds() ?? {
    width: POPOVER_WIDTH,
    height: POPOVER_HEIGHT
  }
  const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y })
  const workArea = display.workArea

  if (process.platform === 'darwin') {
    return {
      x: workArea.x + workArea.width - width - POPOVER_MARGIN,
      y: workArea.y + POPOVER_MARGIN
    }
  }

  let x = Math.round(bounds.x + bounds.width / 2 - width / 2)
  let y = bounds.y + bounds.height

  if (x + width > workArea.x + workArea.width) {
    x = workArea.x + workArea.width - width
  }
  if (x < workArea.x) {
    x = workArea.x
  }
  if (y + height > workArea.y + workArea.height) {
    y = bounds.y - height
  }
  if (y < workArea.y) {
    y = workArea.y
  }

  return { x, y }
}

function animatePopoverIn(x: number, y: number): void {
  if (!popoverWindow || process.platform !== 'darwin') return

  const { width } = popoverWindow.getBounds()
  const startX = x + width + POPOVER_MARGIN
  const startedAt = Date.now()

  stopPopoverAnimation()
  popoverWindow.setOpacity(0)
  popoverWindow.setPosition(startX, y, false)
  popoverWindow.show()
  popoverWindow.focus()
  activateApp()

  popoverAnimation = setInterval(() => {
    if (!popoverWindow || popoverWindow.isDestroyed()) {
      stopPopoverAnimation()
      return
    }

    const progress = Math.min((Date.now() - startedAt) / POPOVER_ANIMATION_DURATION, 1)
    const easedProgress = 1 - Math.pow(1 - progress, 3)
    const currentX = Math.round(startX + (x - startX) * easedProgress)

    popoverWindow.setPosition(currentX, y, false)
    popoverWindow.setOpacity(easedProgress)

    if (progress >= 1) {
      stopPopoverAnimation()
      popoverWindow.setOpacity(1)
    }
  }, 16)
}

function animatePopoverOut(): void {
  if (!popoverWindow) return
  if (process.platform !== 'darwin') {
    popoverWindow.hide()
    return
  }
  if (popoverAnimation) return

  const { x, y, width } = popoverWindow.getBounds()
  const endX = x + width + POPOVER_MARGIN
  const startedAt = Date.now()

  popoverAnimation = setInterval(() => {
    if (!popoverWindow || popoverWindow.isDestroyed()) {
      stopPopoverAnimation()
      return
    }

    const progress = Math.min((Date.now() - startedAt) / POPOVER_ANIMATION_DURATION, 1)
    const easedProgress = 1 - Math.pow(1 - progress, 3)
    const currentX = Math.round(x + (endX - x) * easedProgress)

    popoverWindow.setPosition(currentX, y, false)
    popoverWindow.setOpacity(1 - progress)

    if (progress >= 1) {
      stopPopoverAnimation()
      popoverWindow.hide()
      popoverWindow.setOpacity(1)
    }
  }, 16)
}

export function showOrCreatePopover(): void {
  if (!popoverWindow) createPopoverWindow()
  if (!popoverWindow) return

  if (popoverWindow.isVisible()) {
    animatePopoverOut()
    return
  }

  const { x, y } = getPopoverPosition()

  if (process.platform === 'darwin') {
    animatePopoverIn(x, y)
    return
  }

  popoverWindow.setPosition(x, y, false)
  popoverWindow.show()
  popoverWindow.focus()
  activateApp()
}

export function createTray(): void {
  const trayIcon = nativeImage.createFromPath(trayIconSource).resize({ width: 18, height: 18 })
  if (process.platform === 'darwin') trayIcon.setTemplateImage(true)
  tray = new Tray(trayIcon)
  tray.setToolTip('The Garage')
  const contextMenu = Menu.buildFromTemplate([
    { label: 'New Window', click: () => createDuplicateWindow() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])
  tray.on('click', () => showOrCreatePopover())
  tray.on('right-click', () => tray?.popUpContextMenu(contextMenu))
}

export function hidePopover(): void {
  stopPopoverAnimation()
  popoverWindow?.setOpacity(1)
  popoverWindow?.hide()
}

export function promotePopoverToWindow(): void {
  const window = popoverWindow
  if (!window || window.isDestroyed()) {
    focusMainOrCreate()
    return
  }

  stopPopoverAnimation()
  window.removeAllListeners('blur')
  window.setOpacity(1)
  window.setResizable(true)
  window.setSkipTaskbar(false)
  if (process.platform === 'darwin') {
    try {
      window.setWindowButtonVisibility(true)
      window.setWindowButtonPosition({ x: 14, y: 14 })
    } catch {
      // frameless windows may not support window buttons
    }
  }

  const { x, y } = getPopoverPosition()
  const { workArea } = screen.getDisplayNearestPoint({ x, y })
  const width = 900
  const height = 670
  window.setBounds(
    {
      width,
      height,
      x: Math.round(workArea.x + (workArea.width - width) / 2),
      y: Math.round(workArea.y + (workArea.height - height) / 2)
    },
    true
  )

  popoverWindow = null
  registerAppWindow(window)
  showAppWindow(window)
}

export function focusMainOrCreate(): void {
  let main = getMainWindow()
  if (!main) {
    main = createMainWindow()
  }
  if (main) showAppWindow(main)
}
