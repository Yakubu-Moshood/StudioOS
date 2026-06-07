'use client'

import { useState, useTransition } from 'react'
import { addKnowledgeEntry } from '@/app/actions/knowledge'
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
import { toast } from 'sonner'
import type { KnowledgeType } from '@studioos/shared'

const TYPE_OPTIONS: { value: KnowledgeType; label: string }[] = [
  { value: 'text',     label: 'Text'     },
  { value: 'url',      label: 'URL'      },
  { value: 'document', label: 'Document' },
  { value: 'other',    label: 'Other'    },
]

interface AddKnowledgeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

export function AddKnowledgeDialog({ open, onOpenChange, projectId }: AddKnowledgeDialogProps) {
  const [type, setType] = useState<KnowledgeType>('text')
  const [title, setTitle] = useState('')
  const [sourceTitle, setSourceTitle] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()

  function reset() {
    setType('text')
    setTitle('')
    setSourceTitle('')
    setSourceUrl('')
    setContent('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    startTransition(async () => {
      const result = await addKnowledgeEntry({
        projectId,
        title,
        content,
        type,
        sourceUrl,
        sourceTitle,
      })

      if (result.success) {
        toast.success('Entry added.')
        reset()
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isPending) { reset(); onOpenChange(o) } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Knowledge Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-type">Type</Label>
            <select
              id="entry-type"
              value={type}
              onChange={(e) => setType(e.target.value as KnowledgeType)}
              disabled={isPending}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              {TYPE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-title">Title</Label>
            <Input
              id="entry-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry title"
              disabled={isPending}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-source-title">
              Source Title <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="entry-source-title"
              value={sourceTitle}
              onChange={(e) => setSourceTitle(e.target.value)}
              placeholder="Name of the source"
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-source-url">
              Source URL <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="entry-source-url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-content">
              Content <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="entry-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Notes, excerpts, or key information…"
              rows={4}
              disabled={isPending}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { reset(); onOpenChange(false) }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isPending}>
              {isPending ? 'Saving…' : 'Add Entry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
