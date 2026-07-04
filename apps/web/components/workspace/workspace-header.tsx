import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Project } from '@studioos/shared'

interface WorkspaceHeaderProps {
  project: Project
}

export function WorkspaceHeader({ project }: WorkspaceHeaderProps) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[#dce6e2] bg-white/90 px-4 backdrop-blur">
      <Link
        href="/dashboard"
        className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-sm text-[#667780] transition-colors hover:bg-[#f3faf7] hover:text-[#0f2433]"
      >
        <ArrowLeft className="h-4 w-4" />
        Projects
      </Link>
      <div className="h-5 w-px shrink-0 bg-[#dce6e2]" />
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-semibold text-[#0f2433]">{project.title}</span>
        <Badge variant="outline" className="shrink-0 border-[#cbded8] bg-[#f3faf7] text-xs text-[#2f7f73]">
          {project.format}
        </Badge>
      </div>
    </div>
  )
}
