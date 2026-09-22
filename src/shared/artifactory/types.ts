export type {
  ArtifactoryItem,
  ArtifactoryItemId,
  ArtifactoryReference,
  ArtifactoryRelationType,
  ArtifactoryTag,
  MarkdownFileReference,
  RelatedArtifactoryItem,
  RichTextFileReference,
  UrlReference
} from './model'

export type Tag = {
  name: string
  color: string
}

export type MdFile = {
  path: string
  name: string
  content: string
  tags: Tag[]
}

export type ImportMode = 'copy' | 'copy-and-delete' | 'reference'
