'use client'

import Link from 'next/link'
import { useSelectedLayoutSegment } from 'next/navigation'
import {
  Layers,
  Compass,
  GitBranch,
  Sparkles,
  BookOpen,
  Clapperboard,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { segment: 'productions', label: 'Productions', icon: Clapperboard },
  { segment: 'core', label: 'Core', icon: Layers },
  { segment: 'compass', label: 'Compass', icon: Compass },
  { segment: 'map', label: 'Map', icon: GitBranch },
  { segment: 'ai', label: 'AI', icon: Sparkles },
  { segment: 'knowledge', label: 'Knowledge', icon: BookOpen },
] as const

interface WorkspaceSidebarProps {
  projectId: string
}

export function WorkspaceSidebar({ projectId }: WorkspaceSidebarProps) {
  const activeSegment = useSelectedLayoutSegment()

  return (
    <nav className="flex w-full shrink-0 gap-1 overflow-x-auto border-b border-[#dce6e2] bg-white/80 p-2 md:w-52 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:p-3">
      <div className="hidden px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b9aa1] md:mb-2 md:block">
        Workspace
      </div>
      {NAV_ITEMS.map(({ segment, label, icon: Icon }) => (
        <Link
          key={segment}
          href={`/workspace/${projectId}/${segment}`}
          className={cn(
            'flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors md:shrink md:w-full',
            activeSegment === segment
              ? 'bg-[#e8f2ee] font-medium text-[#235c43] shadow-sm'
              : 'text-[#667780] hover:bg-[#f3faf7] hover:text-[#0f2433]'
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
