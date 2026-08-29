import { BrowserWindow, Tray, nativeImage, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createMainWindow, getMainWindow } from './main-window'

let popoverWindow: BrowserWindow | null = null
let tray: Tray | null = null

function createPopoverWindow(): void {
  popoverWindow = new BrowserWindow({
    width: 360,
    height: 480,
    show: false,
    frame: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    transparent: true,
    hasShadow: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    popoverWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    popoverWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  popoverWindow.on('closed', () => {
    popoverWindow = null
  })

  popoverWindow.on('blur', () => {
    popoverWindow?.hide()
  })
}

function getPopoverPosition(): { x: number; y: number } {
  const bounds = tray?.getBounds() ?? { x: 0, y: 0, width: 0, height: 0 }
  const { width, height } = popoverWindow?.getBounds() ?? { width: 360, height: 480 }
  const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y })
  const workArea = display.workArea

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

export function showOrCreatePopover(): void {
  if (!popoverWindow) createPopoverWindow()
  if (!popoverWindow) return

  if (popoverWindow.isVisible()) {
    popoverWindow.hide()
    return
  }

  const { x, y } = getPopoverPosition()
  popoverWindow.setPosition(x, y, false)
  popoverWindow.show()
  popoverWindow.focus()
}

export function createTray(): void {
  const trayIcon = nativeImage.createFromPath(icon).resize({ width: 18, height: 18 })
  tray = new Tray(trayIcon)
  tray.setToolTip('DevFlow')
  tray.on('click', () => showOrCreatePopover())
}

export function hidePopover(): void {
  popoverWindow?.hide()
}

export function focusMainOrCreate(): void {
  let main = getMainWindow()
  if (!main) {
    main = createMainWindow()
  }
  main?.show()
  main?.focus()
}
