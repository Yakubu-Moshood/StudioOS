'use client'

import Link from 'next/link'
import { useSelectedLayoutSegment } from 'next/navigation'
import { Layers, Compass, GitBranch, FolderOpen, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { segment: 'core',    label: 'Core',    icon: Layers },
  { segment: 'compass', label: 'Compass', icon: Compass },
  { segment: 'map',     label: 'Map',     icon: GitBranch },
  { segment: 'assets',  label: 'Assets',  icon: FolderOpen },
  { segment: 'ai',      label: 'AI',      icon: Sparkles },
] as const

interface WorkspaceSidebarProps {
  projectId: string
}

export function WorkspaceSidebar({ projectId }: WorkspaceSidebarProps) {
  const activeSegment = useSelectedLayoutSegment()

  return (
    <nav className="flex w-48 shrink-0 flex-col gap-0.5 border-r border-border bg-background p-2">
      {NAV_ITEMS.map(({ segment, label, icon: Icon }) => (
        <Link
          key={segment}
          href={`/workspace/${projectId}/${segment}`}
          className={cn(
            'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
            activeSegment === segment
              ? 'bg-accent font-medium text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
