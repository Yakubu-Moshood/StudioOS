import type { Metadata } from 'next'
import { getProject } from '@/app/actions/projects'
import { MapPanel } from '@/components/workspace/panels/map-panel'

interface MapPageProps {
  params: Promise<{
    projectId: string
  }>
}

export async function generateMetadata({ params }: MapPageProps): Promise<Metadata> {
  const { projectId } = await params
  const project = await getProject(projectId)
  return {
    title: project ? `Map — ${project.title} — StudioOS` : 'Map — StudioOS',
  }
}

export default async function MapPage({ params }: MapPageProps) {
  const { projectId } = await params
  return <MapPanel projectId={projectId} />
}
