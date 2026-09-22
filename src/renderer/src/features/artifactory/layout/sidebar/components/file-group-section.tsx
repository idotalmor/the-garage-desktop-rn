import { FileText, Folder } from 'lucide-react'
import { Button } from '@heroui/react'
import type { MdFile } from '../../../../../../../shared/artifactory/types'

type FileGroup = {
  name: string
  files: MdFile[]
}

export function FileGroupSection({
  group,
  active,
  onSelect
}: {
  group: FileGroup
  active: string | null
  onSelect: (path: string) => void
}): React.JSX.Element {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 px-2 text-[11px] font-medium text-muted">
        <Folder size={13} aria-hidden="true" />
        {group.name}
      </div>
      <div className="space-y-0.5">
        {group.files.map((file) => (
          <Button
            key={file.path}
            fullWidth
            size="sm"
            variant={active === file.path ? 'secondary' : 'ghost'}
            className="justify-start rounded-lg px-2 text-xs"
            onPress={() => onSelect(file.path)}
          >
            <FileText size={14} className="shrink-0 text-muted" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{file.name}</span>
            {file.tags.length > 0 && (
              <div className="ml-1.5 flex items-center gap-1">
                {file.tags.map((tag) => (
                  <span
                    key={tag.name}
                    className="size-2 shrink-0 rounded-full border border-white/20"
                    style={{ backgroundColor: tag.color }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}
