'use client'

import { useState, useTransition } from 'react'
import { Pencil, Trash2, Check, X, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateKnowledgeEntry, deleteKnowledgeEntry } from '@/app/actions/knowledge'
import { toast } from 'sonner'
import type { KnowledgeEntry, KnowledgeType } from '@studioos/shared'

const TYPE_OPTIONS: { value: KnowledgeType; label: string }[] = [
  { value: 'text',     label: 'Text'     },
  { value: 'url',      label: 'URL'      },
  { value: 'document', label: 'Document' },
  { value: 'other',    label: 'Other'    },
]

const TYPE_LABELS: Record<KnowledgeType, string> = {
  text:     'Text',
  url:      'URL',
  document: 'Document',
  other:    'Other',
}

interface KnowledgeCardProps {
  entry: KnowledgeEntry
  projectId: string
}

export function KnowledgeCard({ entry, projectId }: KnowledgeCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editType, setEditType] = useState<KnowledgeType>(entry.type)
  const [editTitle, setEditTitle] = useState(entry.title)
  const [editSourceTitle, setEditSourceTitle] = useState(entry.source_title ?? '')
  const [editSourceUrl, setEditSourceUrl] = useState(entry.source_url ?? '')
  const [editContent, setEditContent] = useState(entry.content ?? '')
  const [isPending, startTransition] = useTransition()

  function handleEdit() {
    setEditType(entry.type)
    setEditTitle(entry.title)
    setEditSourceTitle(entry.source_title ?? '')
    setEditSourceUrl(entry.source_url ?? '')
    setEditContent(entry.content ?? '')
    setIsEditing(true)
  }

  function handleCancel() {
    setIsEditing(false)
  }

  function handleSave() {
    if (!editTitle.trim()) return
    startTransition(async () => {
      const result = await updateKnowledgeEntry({
        entryId: entry.id,
        projectId,
        title: editTitle,
        content: editContent,
        type: editType,
        sourceUrl: editSourceUrl,
        sourceTitle: editSourceTitle,
      })
      if (result.success) {
        toast.success('Entry updated.')
        setIsEditing(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteKnowledgeEntry({ entryId: entry.id, projectId })
      if (result.success) {
        toast.success('Entry deleted.')
      } else {
        toast.error(result.error)
      }
    })
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`type-${entry.id}`}>Type</Label>
          <select
            id={`type-${entry.id}`}
            value={editType}
            onChange={(e) => setEditType(e.target.value as KnowledgeType)}
            disabled={isPending}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {TYPE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`title-${entry.id}`}>Title</Label>
          <Input
            id={`title-${entry.id}`}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            disabled={isPending}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`source-title-${entry.id}`}>
            Source Title <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id={`source-title-${entry.id}`}
            value={editSourceTitle}
            onChange={(e) => setEditSourceTitle(e.target.value)}
            placeholder="Name of the source"
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`source-url-${entry.id}`}>
            Source URL <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id={`source-url-${entry.id}`}
            value={editSourceUrl}
            onChange={(e) => setEditSourceUrl(e.target.value)}
            placeholder="https://example.com"
            disabled={isPending}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`content-${entry.id}`}>
            Content <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id={`content-${entry.id}`}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            disabled={isPending}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isPending}
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!editTitle.trim() || isPending}
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Badge variant="outline" className="w-fit text-xs">
            {TYPE_LABELS[entry.type]}
          </Badge>
          <h3 className="text-sm font-semibold leading-snug">{entry.title}</h3>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleEdit}
            disabled={isPending}
            title="Edit entry"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={isPending}
            title="Delete entry"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {(entry.source_title || entry.source_url) && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ExternalLink className="h-3 w-3 shrink-0" />
          {entry.source_url ? (
            <a
              href={entry.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate underline-offset-2 hover:underline"
            >
              {entry.source_title || entry.source_url}
            </a>
          ) : (
            <span className="truncate">{entry.source_title}</span>
          )}
        </div>
      )}

      {entry.content && (
        <p className="line-clamp-3 text-sm text-muted-foreground leading-relaxed">
          {entry.content}
        </p>
      )}
    </div>
  )
}
