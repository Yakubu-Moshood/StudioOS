'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

const FILTERS = [
  { value: 'active',   label: 'Active'   },
  { value: 'archived', label: 'Archived' },
  { value: 'all',      label: 'All'      },
] as const

export type ProjectFilterValue = 'active' | 'archived' | 'all'

interface ProjectFilterProps {
  activeFilter: ProjectFilterValue
}

export function ProjectFilter({ activeFilter }: ProjectFilterProps) {
  return (
    <div className="mb-6 flex border-b border-border">
      {FILTERS.map(({ value, label }) => (
        <Link
          key={value}
          href={value === 'active' ? '/dashboard' : `/dashboard?filter=${value}`}
          className={cn(
            '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors',
            activeFilter === value
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}
