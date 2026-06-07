'use client'

import { useEffect, useState, useTransition } from 'react'
import { renameProject } from '@/app/actions/projects'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { Project } from '@studioos/shared'

interface RenameProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
}

export function RenameProjectDialog({ open, onOpenChange, project }: RenameProjectDialogProps) {
  const [title, setTitle] = useState(project.title)
  const [isPending, startTransition] = useTransition()

  // Sync input from current project title each time the dialog opens.
  // Required because useState initialiser only runs once; the project prop
  // may have changed since the component was first mounted.
  useEffect(() => {
    if (open) setTitle(project.title)
  }, [open, project.title])

  function handleOpenChange(next: boolean) {
    if (isPending) return
    onOpenChange(next)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || trimmed === project.title) return

    startTransition(async () => {
      const result = await renameProject({ projectId: project.id, title: trimmed })
      if (result.success) {
        toast.success('Project renamed.')
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rename-title">Title</Label>
            <Input
              id="rename-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
              required
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
            <Button
              type="submit"
              disabled={!title.trim() || title.trim() === project.title || isPending}
            >
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
