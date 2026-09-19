import { Bold, Italic, List, ListOrdered, Redo2, Undo2 } from 'lucide-react'
import { RichTextEditor } from '@heroui-pro/react/rich-text-editor'

function DefaultToolbar(): React.JSX.Element {
  return (
    <RichTextEditor.Toolbar aria-label="Meeting notes formatting">
      <RichTextEditor.ToolbarGroup>
        <RichTextEditor.ToggleButton command="bold" isIconOnly aria-label="Bold" tooltip="Bold">
          <Bold size={15} aria-hidden="true" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton
          command="italic"
          isIconOnly
          aria-label="Italic"
          tooltip="Italic"
        >
          <Italic size={15} aria-hidden="true" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton
          command="bulletList"
          isIconOnly
          aria-label="Bullet list"
          tooltip="Bullet list"
        >
          <List size={15} aria-hidden="true" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton
          command="orderedList"
          isIconOnly
          aria-label="Numbered list"
          tooltip="Numbered list"
        >
          <ListOrdered size={15} aria-hidden="true" />
        </RichTextEditor.ToggleButton>
      </RichTextEditor.ToolbarGroup>
      <RichTextEditor.ToolbarSeparator />
      <RichTextEditor.ToolbarGroup>
        <RichTextEditor.ActionButton action="undo" isIconOnly aria-label="Undo" tooltip="Undo">
          <Undo2 size={15} aria-hidden="true" />
        </RichTextEditor.ActionButton>
        <RichTextEditor.ActionButton action="redo" isIconOnly aria-label="Redo" tooltip="Redo">
          <Redo2 size={15} aria-hidden="true" />
        </RichTextEditor.ActionButton>
      </RichTextEditor.ToolbarGroup>
    </RichTextEditor.Toolbar>
  )
}

function BubbleToolbar(): React.JSX.Element {
  return (
    <RichTextEditor.BubbleMenu aria-label="Inline formatting">
      <RichTextEditor.Toolbar orientation="horizontal" aria-label="Inline formatting toolbar">
        <RichTextEditor.ToggleButton command="bold" isIconOnly aria-label="Bold" tooltip="Bold">
          <Bold size={14} aria-hidden="true" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton
          command="italic"
          isIconOnly
          aria-label="Italic"
          tooltip="Italic"
        >
          <Italic size={14} aria-hidden="true" />
        </RichTextEditor.ToggleButton>
      </RichTextEditor.Toolbar>
    </RichTextEditor.BubbleMenu>
  )
}

export function MeetingNotesEditor(): React.JSX.Element {
  return (
    <RichTextEditor
      className="w-full"
      defaultValue={{ type: 'doc', content: [] }}
      placeholder="Start writing meeting notes..."
    >
      <RichTextEditor.Shell className="overflow-hidden rounded-2xl border border-border shadow-none">
        <DefaultToolbar />
        <RichTextEditor.Content className="min-h-56 px-5 py-4 text-sm leading-6" />
        <BubbleToolbar />
        <RichTextEditor.Footer className="border-t border-separator px-4 py-2 text-xs text-muted">
          <span>Meeting notes</span>
          <RichTextEditor.CharacterCount showWords />
        </RichTextEditor.Footer>
      </RichTextEditor.Shell>
    </RichTextEditor>
  )
}
