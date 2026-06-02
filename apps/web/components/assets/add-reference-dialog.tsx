'use client'

import { useState, useTransition } from 'react'
import { addReference } from '@/app/actions/assets'
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

interface AddReferenceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

export function AddReferenceDialog({ open, onOpenChange, projectId }: AddReferenceDialogProps) {
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()

  function reset() {
    setUrl('')
    setName('')
    setNotes('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || !name.trim()) return

    startTransition(async () => {
      const result = await addReference({
        projectId,
        url: url.trim(),
        name: name.trim(),
        notes: notes.trim() || null,
      })

      if (result.success) {
        toast.success('Reference added.')
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
          <DialogTitle>Add Reference</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ref-url">URL</Label>
            <Input
              id="ref-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={isPending}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ref-name">Name</Label>
            <Input
              id="ref-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Reference name"
              disabled={isPending}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ref-notes">Notes <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="ref-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why this reference matters…"
              rows={3}
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
            <Button type="submit" disabled={!url.trim() || !name.trim() || isPending}>
              {isPending ? 'Saving…' : 'Add Reference'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
