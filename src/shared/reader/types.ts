export type MdFile = {
  path: string
  name: string
  content: string
  tags: string[]
}

export type ImportMode = 'copy' | 'copy-and-delete' | 'reference'
