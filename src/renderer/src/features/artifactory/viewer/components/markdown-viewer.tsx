import ReactMarkdown from 'react-markdown'

export function MarkdownViewer({ content }: { content: string }): React.JSX.Element {
  return (
    <article className="prose max-w-3xl">
      <ReactMarkdown>{content}</ReactMarkdown>
    </article>
  )
}
