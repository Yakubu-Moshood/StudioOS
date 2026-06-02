import type { Metadata } from 'next'
import { MapPanel } from '@/components/workspace/panels/map-panel'

export const metadata: Metadata = {
  title: 'Map — StudioOS',
}

export default function MapPage() {
  return <MapPanel />
}
