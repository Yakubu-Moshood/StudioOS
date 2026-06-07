'use client'

import { useState, useTransition } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { archiveProject, restoreProject } from '@/app/actions/projects'
import { RenameProjectDialog } from './rename-project-dialog'
import { toast } from 'sonner'
import type { Project } from '@studioos/shared'

interface ProjectActionsMenuProps {
  project: Project
  onDeleteSelect: () => void
}

export function ProjectActionsMenu({ project, onDeleteSelect }: ProjectActionsMenuProps) {
  const [renameOpen, setRenameOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isArchived = project.archived_at !== null

  function handleArchive() {
    startTransition(async () => {
      const result = await archiveProject({ projectId: project.id })
      if (result.success) {
        toast.success('Project archived.')
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleRestore() {
    startTransition(async () => {
      const result = await restoreProject({ projectId: project.id })
      if (result.success) {
        toast.success('Project restored.')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={isPending}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Project actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
            Rename
          </DropdownMenuItem>
          {isArchived ? (
            <DropdownMenuItem onSelect={handleRestore} disabled={isPending}>
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={handleArchive} disabled={isPending}>
              Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={onDeleteSelect}
            className="text-destructive focus:text-destructive"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameProjectDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        project={project}
      />
    </>
  )
}
