import type { Metadata } from 'next'
import { getProjects } from '@/app/actions/projects'
import { ProjectGrid } from '@/components/dashboard/project-grid'
import { CreateProjectButton } from '@/components/dashboard/create-project-button'

export const metadata: Metadata = {
  title: 'Dashboard — StudioOS',
}

export default async function DashboardPage() {
  const projects = await getProjects()

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projects</h1>
        {projects.length > 0 && <CreateProjectButton />}
      </div>
      <ProjectGrid projects={projects} />
    </div>
  )
}
