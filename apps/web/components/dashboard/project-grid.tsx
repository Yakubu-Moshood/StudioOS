import type { Project } from '@studioos/shared'
import { ProjectCard } from './project-card'
import { CreateProjectButton } from './create-project-button'
import type { ProjectFilterValue } from './project-filter'

interface ProjectGridProps {
  projects: Project[]
  filter: ProjectFilterValue
}

const EMPTY_STATES: Record<ProjectFilterValue, { heading: string; body: string; showCreate: boolean }> = {
  active:   { heading: 'No projects yet',        body: 'Create your first project to start building your production workflow.', showCreate: true  },
  archived: { heading: 'No archived projects',   body: 'Archived projects will appear here.',                                   showCreate: false },
  all:      { heading: 'No projects yet',        body: 'Create your first project to start building your production workflow.', showCreate: true  },
}

export function ProjectGrid({ projects, filter }: ProjectGridProps) {
  if (projects.length === 0) {
    const { heading, body, showCreate } = EMPTY_STATES[filter]
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-lg font-semibold">{heading}</h2>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">{body}</p>
        {showCreate && (
          <div className="mt-6">
            <CreateProjectButton />
          </div>
        )}
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
