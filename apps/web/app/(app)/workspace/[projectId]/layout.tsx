import { redirect } from 'next/navigation'
import { getProject } from '@/app/actions/projects'
import { WorkspaceHeader } from '@/components/workspace/workspace-header'
import { WorkspaceSidebar } from '@/components/workspace/workspace-sidebar'
import { ArchivedProjectBanner } from '@/components/workspace/archived-project-banner'

interface WorkspaceLayoutProps {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const { projectId } = await params
  const project = await getProject(projectId)

  if (!project) {
    redirect('/dashboard')
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-[#f6f3ea]">
      <WorkspaceHeader project={project} />
      {project.archived_at !== null && (
        <ArchivedProjectBanner projectId={project.id} />
      )}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <WorkspaceSidebar projectId={project.id} />
        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
