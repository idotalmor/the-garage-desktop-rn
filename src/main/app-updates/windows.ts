/**
 * Loads the renderer into app windows: the bundle chosen in `sync`, else the UI inside the app.
 * Reloads them when that bundle changes, and watches a bundle's first load: if the UI doesn't report
 * ready in time (or fails to load or crashes) the bundle is rejected and the windows fall back.
 */
import { BrowserWindow, type WebContents } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { getRunning } from './sync'
import { confirmBundle, rejectBundle } from './use-cases'
import { READY_TIMEOUT_MS } from './utils/settings'

type FirstLoadWatch = { build: number; stop: () => void }

const rendererWindows = new Set<BrowserWindow>()
const watches = new Map<number, FirstLoadWatch>()

/** Loads the UI into `window` (`query` like `?view=popover`) and keeps it for later reloads. */
export function loadRenderer(window: BrowserWindow, query = ''): void {
  track(window)
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void window.loadURL(`${process.env['ELECTRON_RENDERER_URL']}${query}`)
    return
  }
  const bundle = getRunning()
  const entry = bundle ? join(bundle.dir, 'index.html') : join(__dirname, '../renderer/index.html')
  stopWatch(window.webContents.id)
  if (bundle?.status === 'downloaded') watchFirstLoad(window.webContents, bundle.build)
  void window.loadFile(entry, { query: Object.fromEntries(new URLSearchParams(query)) })
}

/** Loads the current bundle into every open window, keeping each window's query. */
export function reloadRendererWindows(): void {
  for (const window of rendererWindows) {
    if (!window.isDestroyed()) loadRenderer(window, new URL(window.webContents.getURL()).search)
  }
}

/** The UI in `webContents` rendered: confirms the bundle if this was its first load. */
export function onRendererReady(webContents: WebContents): void {
  const watch = watches.get(webContents.id)
  if (!watch) return
  stopWatch(webContents.id)
  confirmBundle(watch.build)
}

function track(window: BrowserWindow): void {
  if (rendererWindows.has(window)) return
  rendererWindows.add(window)
  const id = window.webContents.id
  window.once('closed', () => {
    rendererWindows.delete(window)
    stopWatch(id)
  })
}

function watchFirstLoad(webContents: WebContents, build: number): void {
  const id = webContents.id
  let timer: NodeJS.Timeout | undefined
  const fail = (reason: string): void => {
    if (watches.get(id) !== watch) return
    stopWatch(id)
    rejectBundle(build, reason)
  }
  const onFinish = (): void => {
    timer = setTimeout(
      () => fail(`no ready report within ${READY_TIMEOUT_MS / 1000} s`),
      READY_TIMEOUT_MS
    )
  }
  const onFail = (_event: unknown, code: number, description: string): void => {
    if (code !== -3) fail(`load failed: ${description}`)
  }
  const onGone = (_event: unknown, details: { reason: string }): void =>
    fail(`renderer ${details.reason}`)
  webContents.once('did-finish-load', onFinish)
  webContents.on('did-fail-load', onFail)
  webContents.on('render-process-gone', onGone)
  const watch: FirstLoadWatch = {
    build,
    stop: () => {
      clearTimeout(timer)
      if (webContents.isDestroyed()) return
      webContents.off('did-finish-load', onFinish)
      webContents.off('did-fail-load', onFail)
      webContents.off('render-process-gone', onGone)
    }
  }
  watches.set(id, watch)
}

function stopWatch(id: number): void {
  watches.get(id)?.stop()
  watches.delete(id)
}
