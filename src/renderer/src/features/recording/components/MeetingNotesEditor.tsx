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
import { useEffect, useMemo, useRef, useState } from 'react'
import type { JSONContent } from '@tiptap/core'
import { RichTextEditor } from '@heroui-pro/react/rich-text-editor'
import { AppStateChannel, type AppStateChange } from '../../../../../shared/app-state/channels'
import { RECORDING_SLICE, type RecordingSession } from '../../../../../shared/recording/types'

const iconClassName = 'size-4'

const EMPTY_DOC: JSONContent = { type: 'doc', content: [] }
const NOTES_DEBOUNCE_MS = 400

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
  const clientId = useMemo(() => crypto.randomUUID(), [])
  const [doc, setDoc] = useState<JSONContent>(EMPTY_DOC)
  const debounceRef = useRef<number | null>(null)

  useEffect(() => {
    const applyRemote = (session: RecordingSession | undefined): void => {
      if (session?.notes && session.lastWriter !== clientId) {
        setDoc(session.notes as JSONContent)
      }
    }
    const onChanged = (_event: Electron.IpcRendererEvent, change: AppStateChange): void => {
      if (change.name === RECORDING_SLICE) applyRemote(change.value as RecordingSession)
    }
    window.electron.ipcRenderer.on(AppStateChannel.Changed, onChanged)
    queueMicrotask(() => {
      void window.electron.ipcRenderer
        .invoke(AppStateChannel.Get, RECORDING_SLICE)
        .then((session) => applyRemote(session as RecordingSession | undefined))
    })
    return () => {
      window.electron.ipcRenderer.removeListener(AppStateChannel.Changed, onChanged)
      if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    }
  }, [clientId])

  const onValueChange = (value: JSONContent): void => {
    setDoc(value)
    if (debounceRef.current !== null) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => {
      void window.electron.ipcRenderer.invoke(AppStateChannel.Patch, RECORDING_SLICE, {
        notes: value,
        lastWriter: clientId
      })
    }, NOTES_DEBOUNCE_MS)
  }

  return (
    <RichTextEditor
      className="w-full"
      value={doc}
      onValueChange={onValueChange}
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
