// Renders an SVG asset to the app's icon PNGs.
// Usage: ELECTRON_RUN_AS_NODE= npx electron scripts/render-icons.mjs [svgPath]
//   svgPath defaults to src/renderer/src/assets/warehouse.svg
// Outputs:
//   resources/tray-icon.png  — transparent silhouette for the menu bar tray
//   build/icon.png           — 1024px white-squircle source for electron-builder
// Then regenerate icon.icns / icon.ico / resources/icon.png from build/icon.png.

import { app, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')
const svgPath = process.argv[2] || join(root, 'src/renderer/src/assets/warehouse.svg')
const svg = readFileSync(svgPath, 'utf8')

const jobs = [
  {
    out: join(root, 'resources/tray-icon.png'),
    size: 1024,
    body: `<div style="width:100%;height:100%;color:#000;display:flex">${svg}</div>`
  },
  {
    out: join(root, 'build/icon.png'),
    size: 1024,
    body: `<div style="width:100%;height:100%;background:#ffffff;border-radius:22%;display:flex;align-items:center;justify-content:center"><div style="width:82%;height:82%;color:#000;display:flex">${svg}</div></div>`
  }
]

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    width: 1024,
    height: 1024,
    transparent: true,
    frame: false,
    webPreferences: { offscreen: true }
  })
  for (const job of jobs) {
    const html = `<!doctype html><body style="margin:0;background:transparent;width:${job.size}px;height:${job.size}px">${job.body}</body>`
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
    await new Promise((resolve) => setTimeout(resolve, 400))
    const image = await win.webContents.capturePage()
    writeFileSync(job.out, image.toPNG())
    console.log('wrote', job.out, image.getSize())
  }
  app.exit(0)
})
