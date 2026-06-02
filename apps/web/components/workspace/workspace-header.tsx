import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Project } from '@studioos/shared'

interface WorkspaceHeaderProps {
  project: Project
}

export function WorkspaceHeader({ project }: WorkspaceHeaderProps) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      <Link
        href="/dashboard"
        className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Projects
      </Link>
      <div className="h-4 w-px shrink-0 bg-border" />
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-medium">{project.title}</span>
        <Badge variant="outline" className="shrink-0 text-xs">
          {project.format}
        </Badge>
      </div>
    </div>
  )
}
