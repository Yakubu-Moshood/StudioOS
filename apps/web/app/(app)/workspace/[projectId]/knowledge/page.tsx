import type { Metadata } from 'next'
import { getProject } from '@/app/actions/projects'
import { KnowledgePanel } from '@/components/workspace/panels/knowledge-panel'

interface KnowledgePageProps {
  params: Promise<{
    projectId: string
  }>
}

export async function generateMetadata({ params }: KnowledgePageProps): Promise<Metadata> {
  const { projectId } = await params
  const project = await getProject(projectId)
  return {
    title: project ? `Knowledge — ${project.title} — StudioOS` : 'Knowledge — StudioOS',
  }
}

export default async function KnowledgePage({ params }: KnowledgePageProps) {
  const { projectId } = await params
  return <KnowledgePanel projectId={projectId} />
}
