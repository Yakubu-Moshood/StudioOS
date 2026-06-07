import type { Metadata } from 'next'
import { getProjects } from '@/app/actions/projects'
import { ProjectGrid } from '@/components/dashboard/project-grid'
import { ProjectFilter } from '@/components/dashboard/project-filter'
import { CreateProjectButton } from '@/components/dashboard/create-project-button'
import type { ProjectFilterValue } from '@/components/dashboard/project-filter'

export const metadata: Metadata = {
  title: 'Dashboard — StudioOS',
}

interface DashboardPageProps {
  searchParams: Promise<{ filter?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { filter: rawFilter } = await searchParams
  const filter: ProjectFilterValue =
    rawFilter === 'archived' ? 'archived' : rawFilter === 'all' ? 'all' : 'active'

  const projects = await getProjects(filter)

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projects</h1>
        <CreateProjectButton />
      </div>
      <ProjectFilter activeFilter={filter} />
      <ProjectGrid projects={projects} filter={filter} />
    </div>
  )
}
