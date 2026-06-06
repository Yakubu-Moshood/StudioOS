import type { Metadata } from 'next'
import { getProject } from '@/app/actions/projects'
import { CorePanel } from '@/components/workspace/panels/core-panel'

interface CorePageProps {
  params: Promise<{
    projectId: string
  }>
}

export async function generateMetadata({ params }: CorePageProps): Promise<Metadata> {
  const { projectId } = await params
  const project = await getProject(projectId)
  return {
    title: project ? `Core — ${project.title} — StudioOS` : 'Core — StudioOS',
  }
}

export default async function CorePage({ params }: CorePageProps) {
  const { projectId } = await params
  return <CorePanel projectId={projectId} />
}
