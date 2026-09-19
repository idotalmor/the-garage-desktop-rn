import {
  Bold,
  Braces,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Paintbrush,
  Quote,
  Redo2,
  Strikethrough,
  Trash2,
  Underline,
  Undo2
} from 'lucide-react'
import { RichTextEditor } from '@heroui-pro/react/rich-text-editor'

const iconClassName = 'size-4'

function LinkControls(): React.JSX.Element {
  return (
    <RichTextEditor.LinkPopover>
      <RichTextEditor.LinkPopover.Trigger tooltip="Link">
        <LinkIcon className={iconClassName} aria-hidden="true" />
      </RichTextEditor.LinkPopover.Trigger>
      <RichTextEditor.LinkPopover.Content>
        <RichTextEditor.LinkPopover.Input />
        <RichTextEditor.LinkPopover.Actions>
          <RichTextEditor.LinkPopover.UnsetButton />
          <RichTextEditor.LinkPopover.ApplyButton />
        </RichTextEditor.LinkPopover.Actions>
      </RichTextEditor.LinkPopover.Content>
    </RichTextEditor.LinkPopover>
  )
}

function DefaultToolbar(): React.JSX.Element {
  return (
    <RichTextEditor.Toolbar aria-label="Meeting notes formatting">
      <RichTextEditor.ToolbarGroup aria-label="History">
        <RichTextEditor.ActionButton action="undo" tooltip="Undo">
          <Undo2 className={iconClassName} aria-hidden="true" />
        </RichTextEditor.ActionButton>
        <RichTextEditor.ActionButton action="redo" tooltip="Redo">
          <Redo2 className={iconClassName} aria-hidden="true" />
        </RichTextEditor.ActionButton>
      </RichTextEditor.ToolbarGroup>

      <RichTextEditor.ToolbarSeparator />

      <RichTextEditor.ToolbarGroup aria-label="Text style">
        <RichTextEditor.ToggleButton command="bold" tooltip="Bold">
          <Bold className={iconClassName} aria-hidden="true" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton command="italic" tooltip="Italic">
          <Italic className={iconClassName} aria-hidden="true" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton command="underline" tooltip="Underline">
          <Underline className={iconClassName} aria-hidden="true" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton command="strike" tooltip="Strikethrough">
          <Strikethrough className={iconClassName} aria-hidden="true" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton command="code" tooltip="Inline code">
          <Code2 className={iconClassName} aria-hidden="true" />
        </RichTextEditor.ToggleButton>
      </RichTextEditor.ToolbarGroup>

      <RichTextEditor.ToolbarSeparator />

      <RichTextEditor.ToolbarGroup aria-label="Blocks">
        <RichTextEditor.ToggleButton command="heading-1" tooltip="Heading 1">
          <Heading1 className={iconClassName} aria-hidden="true" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton command="heading-2" tooltip="Heading 2">
          <Heading2 className={iconClassName} aria-hidden="true" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton command="heading-3" tooltip="Heading 3">
          <Heading3 className={iconClassName} aria-hidden="true" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton command="blockquote" tooltip="Blockquote">
          <Quote className={iconClassName} aria-hidden="true" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton command="codeBlock" tooltip="Code block">
          <Braces className={iconClassName} aria-hidden="true" />
        </RichTextEditor.ToggleButton>
      </RichTextEditor.ToolbarGroup>

      <RichTextEditor.ToolbarSeparator />

      <RichTextEditor.ToolbarGroup aria-label="Lists and links">
        <RichTextEditor.ToggleButton command="bulletList" tooltip="Bulleted list">
          <List className={iconClassName} aria-hidden="true" />
        </RichTextEditor.ToggleButton>
        <RichTextEditor.ToggleButton command="orderedList" tooltip="Numbered list">
          <ListOrdered className={iconClassName} aria-hidden="true" />
        </RichTextEditor.ToggleButton>
        <LinkControls />
      </RichTextEditor.ToolbarGroup>

      <RichTextEditor.ToolbarSeparator />

      <RichTextEditor.ToolbarGroup aria-label="Clear">
        <RichTextEditor.ActionButton action="clearFormatting" tooltip="Clear formatting">
          <Paintbrush className={iconClassName} aria-hidden="true" />
        </RichTextEditor.ActionButton>
        <RichTextEditor.ActionButton action="clearContent" tooltip="Clear content">
          <Trash2 className={iconClassName} aria-hidden="true" />
        </RichTextEditor.ActionButton>
      </RichTextEditor.ToolbarGroup>
    </RichTextEditor.Toolbar>
  )
}

function BubbleToolbar(): React.JSX.Element {
  return (
    <RichTextEditor.BubbleMenu aria-label="Inline formatting">
      <RichTextEditor.ToggleButton command="bold" tooltip="Bold">
        <Bold className={iconClassName} aria-hidden="true" />
      </RichTextEditor.ToggleButton>
      <RichTextEditor.ToggleButton command="italic" tooltip="Italic">
        <Italic className={iconClassName} aria-hidden="true" />
      </RichTextEditor.ToggleButton>
      <RichTextEditor.ToggleButton command="underline" tooltip="Underline">
        <Underline className={iconClassName} aria-hidden="true" />
      </RichTextEditor.ToggleButton>
      <RichTextEditor.ToggleButton command="strike" tooltip="Strikethrough">
        <Strikethrough className={iconClassName} aria-hidden="true" />
      </RichTextEditor.ToggleButton>
      <LinkControls />
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
