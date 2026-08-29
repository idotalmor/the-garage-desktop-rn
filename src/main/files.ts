import { ipcMain, dialog } from 'electron'
import { readFileSync } from 'fs'
import { basename } from 'path'
import { ReaderChannel } from '../shared/reader/channels'

export type MarkdownFile = {
  path: string
  name: string
  content: string
}

export function initFilesIpc(): void {
  ipcMain.handle(ReaderChannel.Open, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null

    const path = result.filePaths[0]
    const content = readFileSync(path, 'utf-8')
    return { path, name: basename(path), content } as MarkdownFile
  })
}
