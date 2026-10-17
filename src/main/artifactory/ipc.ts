import { app, dialog, ipcMain, shell } from 'electron'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs'
import { basename, extname, join } from 'path'
import { ArtifactoryChannel } from '../../shared/artifactory/channels'
import type { ArtifactoryBox, ImportMode, MdFile, Tag } from '../../shared/artifactory/types'
import {
  listArtifactoryBoxes,
  listArtifactoryFiles,
  removeArtifactoryBox,
  saveArtifactoryBox,
  saveArtifactoryFile,
  updateArtifactoryFileTags
} from './repository'

const ARTIFACTORY_DIR = join(app.getPath('home'), '.devflow', 'artifactory')

function ensureArtifactoryDir(): void {
  if (!existsSync(ARTIFACTORY_DIR)) mkdirSync(ARTIFACTORY_DIR, { recursive: true })
}

function uniqueTargetPath(sourcePath: string): string {
  const name = basename(sourcePath)
  const base = name.slice(0, -extname(name).length) || name
  const suffix = extname(name)
  let target = join(ARTIFACTORY_DIR, name)
  let i = 1
  while (existsSync(target)) {
    target = join(ARTIFACTORY_DIR, `${base} (${i})${suffix}`)
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

export function initArtifactoryIpc(): void {
  ipcMain.handle(ArtifactoryChannel.List, () => listArtifactoryFiles())

  ipcMain.handle(ArtifactoryChannel.Open, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Markdown', extensions: ['md'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null

    const path = result.filePaths[0]
    const stored = listArtifactoryFiles().find((file) => file.path === path)
    if (stored) return stored
    return saveArtifactoryFile({
      path,
      name: basename(path),
      content: readFileSync(path, 'utf-8'),
      tags: []
    })
  })

  ipcMain.handle(
    ArtifactoryChannel.Import,
    async (_, payload: { paths: string[]; mode: ImportMode; tag?: Tag }): Promise<MdFile[]> => {
      ensureArtifactoryDir()
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
          saveArtifactoryFile({
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
    ArtifactoryChannel.Save,
    async (_, payload: { path: string; content: string }): Promise<{ path: string }> => {
      writeFileSync(payload.path, payload.content, 'utf-8')
      const current = listArtifactoryFiles().find((file) => file.path === payload.path)
      if (current) saveArtifactoryFile({ ...current, content: payload.content })
      return { path: payload.path }
    }
  )

  ipcMain.handle(ArtifactoryChannel.ShowInFolder, (_, path: string): void => {
    shell.showItemInFolder(path)
  })

  ipcMain.handle(ArtifactoryChannel.ListBoxes, () => listArtifactoryBoxes())

  ipcMain.handle(ArtifactoryChannel.SaveBox, (_, box: ArtifactoryBox) => saveArtifactoryBox(box))

  ipcMain.handle(ArtifactoryChannel.DeleteBox, (_, name: string) => removeArtifactoryBox(name))

  ipcMain.handle(
    ArtifactoryChannel.SetFileTags,
    (_, payload: { path: string; tags: Tag[] }): void => {
      updateArtifactoryFileTags(payload.path, payload.tags)
    }
  )
}
