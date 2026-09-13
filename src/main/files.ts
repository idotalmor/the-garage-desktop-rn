import { app, dialog, ipcMain, shell } from 'electron'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs'
import { basename, extname, join } from 'path'
import { ReaderChannel } from '../shared/reader/channels'
import type { ImportMode, MdFile, Tag } from '../shared/reader/types'
import { listReaderFiles, saveReaderFile } from './reader/repository'

const READER_DIR = join(app.getPath('home'), '.devflow', 'reader')

function ensureReaderDir(): void {
  if (!existsSync(READER_DIR)) mkdirSync(READER_DIR, { recursive: true })
}

function uniqueTargetPath(sourcePath: string): string {
  const name = basename(sourcePath)
  const base = name.slice(0, -extname(name).length) || name
  const suffix = extname(name)
  let target = join(READER_DIR, name)
  let i = 1
  while (existsSync(target)) {
    target = join(READER_DIR, `${base} (${i})${suffix}`)
    i++
  }
  return target
}

function readMarkdownContent(path: string): string {
  try {
    const stats = statSync(path)
    if (!stats.isFile()) return ''
    return path.toLowerCase().endsWith('.md') || path.toLowerCase().endsWith('.markdown')
      ? readFileSync(path, 'utf-8')
      : ''
  } catch {
    return ''
  }
}

export function initFilesIpc(): void {
  ipcMain.handle(ReaderChannel.List, () => listReaderFiles())

  ipcMain.handle(ReaderChannel.Open, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null

    const path = result.filePaths[0]
    const stored = listReaderFiles().find((file) => file.path === path)
    if (stored) return stored
    return saveReaderFile({
      path,
      name: basename(path),
      content: readFileSync(path, 'utf-8'),
      tags: []
    })
  })

  ipcMain.handle(
    ReaderChannel.Import,
    async (_, payload: { paths: string[]; mode: ImportMode; tag?: Tag }): Promise<MdFile[]> => {
      ensureReaderDir()
      const imported: MdFile[] = []
      for (const sourcePath of payload.paths) {
        if (!existsSync(sourcePath)) continue
        let targetPath = sourcePath
        if (payload.mode !== 'reference') {
          targetPath = uniqueTargetPath(sourcePath)
          cpSync(sourcePath, targetPath, { recursive: true })
          if (payload.mode === 'copy-and-delete')
            rmSync(sourcePath, { recursive: true, force: true })
        }
        imported.push(
          saveReaderFile({
            path: targetPath,
            name: basename(targetPath),
            content: readMarkdownContent(targetPath),
            tags: payload.tag ? [payload.tag] : []
          })
        )
      }
      return imported
    }
  )

  ipcMain.handle(
    ReaderChannel.Save,
    async (_, payload: { path: string; content: string }): Promise<{ path: string }> => {
      writeFileSync(payload.path, payload.content, 'utf-8')
      const current = listReaderFiles().find((file) => file.path === payload.path)
      if (current) saveReaderFile({ ...current, content: payload.content })
      return { path: payload.path }
    }
  )

  ipcMain.handle(ReaderChannel.ShowInFolder, (_, path: string): void => {
    shell.showItemInFolder(path)
  })
}
