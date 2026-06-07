import type { Metadata } from 'next'
import { getProject } from '@/app/actions/projects'
import { AiPanel } from '@/components/workspace/panels/ai-panel'

interface AiPageProps {
  params: Promise<{
    projectId: string
  }>
}

export async function generateMetadata({ params }: AiPageProps): Promise<Metadata> {
  const { projectId } = await params
  const project = await getProject(projectId)
  return {
    title: project ? `AI — ${project.title} — StudioOS` : 'AI — StudioOS',
  }
}

export default async function AiPage({ params }: AiPageProps) {
  const { projectId } = await params
  return <AiPanel projectId={projectId} />
}
