/**
 * Opens a checkout folder in an IDE (Cursor, VS Code) or Terminal. Uses macOS `open -a` so the app
 * is found even when its CLI (`cursor`, `code`) isn't on PATH.
 */
import { execFile } from 'child_process'

const IDE_APPS: Record<string, string> = {
  cursor: 'Cursor',
  vscode: 'Visual Studio Code',
  terminal: 'Terminal'
}

export async function openIde(ide: string, path: string): Promise<void> {
  const app = IDE_APPS[ide]
  if (!app) throw new Error(`Unknown IDE: ${ide}`)
  await new Promise<void>((resolve, reject) => {
    execFile('open', ['-a', app, path], { timeout: 15_000 }, (error, _stdout, stderr) => {
      if (error) reject(new Error(stderr.trim() || error.message))
      else resolve()
    })
  })
}
