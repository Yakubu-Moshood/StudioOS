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
    // h-[calc(100vh-3.5rem)]: fills viewport below TopNav (h-14 = 3.5rem)
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <WorkspaceHeader project={project} />
      {project.archived_at !== null && (
        <ArchivedProjectBanner projectId={project.id} />
      )}
      <div className="flex flex-1 overflow-hidden">
        <WorkspaceSidebar projectId={project.id} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
