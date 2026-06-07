'use client'

import { useState, useTransition } from 'react'
import { ChevronUp, ChevronDown, Pencil, Trash2, Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateBlock, deleteBlock, reorderBlock } from '@/app/actions/blocks'
import { toast } from 'sonner'
import type { Block, BlockType, BlockStatus } from '@studioos/shared'

const BLOCK_TYPE_OPTIONS: { value: BlockType; label: string }[] = [
  { value: 'act',      label: 'Act'      },
  { value: 'sequence', label: 'Sequence' },
  { value: 'scene',    label: 'Scene'    },
  { value: 'beat',     label: 'Beat'     },
  { value: 'note',     label: 'Note'     },
  { value: 'other',    label: 'Other'    },
]

const BLOCK_STATUS_OPTIONS: { value: BlockStatus; label: string }[] = [
  { value: 'draft',          label: 'Draft'          },
  { value: 'in_progress',    label: 'In Progress'    },
  { value: 'complete',       label: 'Complete'       },
  { value: 'needs_revision', label: 'Needs Revision' },
]

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  act:      'Act',
  sequence: 'Sequence',
  scene:    'Scene',
  beat:     'Beat',
  note:     'Note',
  other:    'Other',
}

const BLOCK_STATUS_LABELS: Record<BlockStatus, string> = {
  draft:          'Draft',
  in_progress:    'In Progress',
  complete:       'Complete',
  needs_revision: 'Needs Revision',
}

interface BlockCardProps {
  block: Block
  projectId: string
  isFirst: boolean
  isLast: boolean
}

export function BlockCard({ block, projectId, isFirst, isLast }: BlockCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editType, setEditType] = useState<BlockType>(block.type)
  const [editTitle, setEditTitle] = useState(block.title)
  const [editContent, setEditContent] = useState(block.content ?? '')
  const [editStatus, setEditStatus] = useState<BlockStatus>(block.status)
  const [isPending, startTransition] = useTransition()

  function handleEdit() {
    setEditType(block.type)
    setEditTitle(block.title)
    setEditContent(block.content ?? '')
    setEditStatus(block.status)
    setIsEditing(true)
  }

  function handleCancel() {
    setIsEditing(false)
  }

  function handleSave() {
    if (!editTitle.trim()) return
    startTransition(async () => {
      const result = await updateBlock({
        blockId:  block.id,
        projectId,
        type:     editType,
        title:    editTitle,
        content:  editContent,
        status:   editStatus,
      })
      if (result.success) {
        toast.success('Block updated.')
        setIsEditing(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteBlock({ blockId: block.id, projectId })
      if (result.success) {
        toast.success('Block deleted.')
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleReorder(direction: 'up' | 'down') {
    startTransition(async () => {
      const result = await reorderBlock({ blockId: block.id, projectId, direction })
      if (!result.success) {
        toast.error(result.error)
      }
    })
  }

  if (isEditing) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`type-${block.id}`}>Type</Label>
            <Select
              value={editType}
              onValueChange={(v) => setEditType(v as BlockType)}
              disabled={isPending}
            >
              <SelectTrigger id={`type-${block.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOCK_TYPE_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`status-${block.id}`}>Status</Label>
            <Select
              value={editStatus}
              onValueChange={(v) => setEditStatus(v as BlockStatus)}
              disabled={isPending}
            >
              <SelectTrigger id={`status-${block.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOCK_STATUS_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`title-${block.id}`}>Title</Label>
          <Input
            id={`title-${block.id}`}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            disabled={isPending}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`content-${block.id}`}>Content</Label>
          <Textarea
            id={`content-${block.id}`}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
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
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="shrink-0 text-xs">
              {BLOCK_TYPE_LABELS[block.type]}
            </Badge>
            <Badge variant="outline" className="shrink-0 text-xs">
              {BLOCK_STATUS_LABELS[block.status]}
            </Badge>
          </div>
          <h3 className="text-sm font-semibold leading-snug">{block.title}</h3>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleReorder('up')}
            disabled={isFirst || isPending}
            title="Move up"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleReorder('down')}
            disabled={isLast || isPending}
            title="Move down"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleEdit}
            disabled={isPending}
            title="Edit block"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={isPending}
            title="Delete block"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {block.content && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {block.content}
        </p>
      )}
    </div>
  )
}
