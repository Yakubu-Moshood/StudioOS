import Link from 'next/link'
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Project } from '@studioos/shared'
import { formatRelativeDate } from '@studioos/shared'

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/workspace/${project.id}`} className="block h-full">
      <Card className="h-full cursor-pointer transition-colors hover:bg-accent/50">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="line-clamp-2 text-base font-medium leading-snug">
              {project.title}
            </CardTitle>
            <Badge variant="outline" className="mt-0.5 shrink-0 text-xs">
              {project.format}
            </Badge>
          </div>
        </CardHeader>
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">
            {formatRelativeDate(project.created_at)}
          </p>
        </CardFooter>
      </Card>
    </Link>
  )
}
