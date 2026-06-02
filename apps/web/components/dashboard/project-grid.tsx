import type { Project } from '@studioos/shared'
import { ProjectCard } from './project-card'
import { CreateProjectButton } from './create-project-button'

interface ProjectGridProps {
  projects: Project[]
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-lg font-semibold">No projects yet</h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Create your first project to start building your production workflow.
        </p>
        <div className="mt-6">
          <CreateProjectButton />
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
