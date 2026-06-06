import { CoreView } from '@/components/core/core-view'

interface CorePanelProps {
  projectId: string
}

export function CorePanel({ projectId }: CorePanelProps) {
  return <CoreView projectId={projectId} />
}