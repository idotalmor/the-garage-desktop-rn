import { BrowserWindow, Tray, nativeImage, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import brainIcon from '../../resources/brain.png?asset'
import { createMainWindow, getMainWindow } from './main-window'

const POPOVER_WIDTH = process.platform === 'darwin' ? 500 : 360
const POPOVER_HEIGHT = process.platform === 'darwin' ? 700 : 480
const POPOVER_MARGIN = 10
const POPOVER_ANIMATION_DURATION = 420

let popoverWindow: BrowserWindow | null = null
let tray: Tray | null = null
let popoverAnimation: ReturnType<typeof setInterval> | null = null

function createPopoverWindow(): void {
  popoverWindow = new BrowserWindow({
    width: POPOVER_WIDTH,
    height: POPOVER_HEIGHT,
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
}

export function createTray(): void {
  const trayIcon = nativeImage.createFromPath(brainIcon).resize({ width: 18, height: 18 })
  if (process.platform === 'darwin') trayIcon.setTemplateImage(true)
  tray = new Tray(trayIcon)
  tray.setToolTip('The Orchestrator')
  tray.on('click', () => showOrCreatePopover())
}

export function hidePopover(): void {
  stopPopoverAnimation()
  popoverWindow?.setOpacity(1)
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
