export type ArtifactoryItemId = string

export type ArtifactoryTag = {
  name: string
  color: string
}

export type MarkdownFileReference = {
  type: 'markdown-file'
  path: string
}

export type RichTextFileReference = {
  type: 'rich-text-file'
  path: string
}

export type UrlReference = {
  type: 'url'
  url: string
}

export type ArtifactoryReference = MarkdownFileReference | RichTextFileReference | UrlReference

export type ArtifactoryRelationType = 'related' | 'source' | 'derived-from' | 'reference'

export type RelatedArtifactoryItem = {
  itemId: ArtifactoryItemId
  relation: ArtifactoryRelationType
}

export type ArtifactoryItem = {
  id: ArtifactoryItemId
  title: string
  description?: string
  reference: ArtifactoryReference
  tags: ArtifactoryTag[]
  related: RelatedArtifactoryItem[]
  createdAt: number
  updatedAt: number
}
