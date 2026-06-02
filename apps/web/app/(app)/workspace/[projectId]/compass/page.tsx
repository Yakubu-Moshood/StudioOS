import type { Metadata } from 'next'
import { CompassView } from '@/components/compass/compass-view'

export const metadata: Metadata = {
  title: 'Compass — StudioOS',
}

interface CompassPageProps {
  params: Promise<{ projectId: string }>
}

export default async function CompassPage({ params }: CompassPageProps) {
  const { projectId } = await params
  return <CompassView projectId={projectId} />
}
