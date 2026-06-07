'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { addBlock } from '@/app/actions/blocks'
import { toast } from 'sonner'
import type { BlockType, BlockStatus } from '@studioos/shared'

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

interface AddBlockDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddBlockDialog({ projectId, open, onOpenChange }: AddBlockDialogProps) {
  const [type, setType] = useState<BlockType>('scene')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<BlockStatus>('draft')
  const [isPending, startTransition] = useTransition()

  function reset() {
    setType('scene')
    setTitle('')
    setContent('')
    setStatus('draft')
  }

  function handleOpenChange(next: boolean) {
    if (isPending) return
    if (!next) reset()
    onOpenChange(next)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    startTransition(async () => {
      const result = await addBlock({ projectId, type, title, content, status })
      if (result.success) {
        toast.success('Block added.')
        handleOpenChange(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Block</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-block-type">Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as BlockType)}
                disabled={isPending}
              >
                <SelectTrigger id="add-block-type">
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
              <Label htmlFor="add-block-status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as BlockStatus)}
                disabled={isPending}
              >
                <SelectTrigger id="add-block-status">
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
            <Label htmlFor="add-block-title">Title</Label>
            <Input
              id="add-block-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Opening Scene"
              disabled={isPending}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-block-content">
              Content <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="add-block-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Notes, description, or script excerpt…"
              rows={3}
              disabled={isPending}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isPending}>
              {isPending ? 'Adding…' : 'Add Block'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
