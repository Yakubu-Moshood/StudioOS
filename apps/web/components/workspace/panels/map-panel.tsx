import { MapView } from '@/components/map/map-view'

interface MapPanelProps {
  projectId: string
}

export function MapPanel({ projectId }: MapPanelProps) {
  return <MapView projectId={projectId} />
}
