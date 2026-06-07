'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Project } from '@studioos/shared'
import { formatRelativeDate } from '@studioos/shared'
import { ProjectActionsMenu } from './project-actions-menu'
import { DeleteProjectDialog } from './delete-project-dialog'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const isArchived = project.archived_at !== null

  return (
    <>
      {/* `relative` establishes the stacking context for the stretched link overlay. */}
      <Card className="relative h-full transition-colors hover:bg-accent/50">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="line-clamp-2 text-base font-medium leading-snug">
              {/*
               * before:absolute before:inset-0 stretches a pseudo-element across the
               * entire card, making the whole surface navigable. The actions div sits
               * above it via relative z-10 and intercepts its own clicks correctly.
               */}
              <Link
                href={`/workspace/${project.id}`}
                className="before:absolute before:inset-0 before:content-['']"
              >
                {project.title}
              </Link>
            </CardTitle>
            <div className="relative z-10 mt-0.5 flex shrink-0 items-center gap-1.5">
              {isArchived && (
                <Badge variant="secondary" className="text-xs">
                  Archived
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {project.format}
              </Badge>
              <ProjectActionsMenu
                project={project}
                onDeleteSelect={() => setDeleteOpen(true)}
              />
            </div>
          </div>
        </CardHeader>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">
            {formatRelativeDate(project.created_at)}
          </p>
        </CardFooter>
      </Card>

      <DeleteProjectDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        project={project}
      />
    </>
  )
}
