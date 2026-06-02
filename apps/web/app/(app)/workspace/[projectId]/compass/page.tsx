import type { Metadata } from 'next'
import { CompassPanel } from '@/components/workspace/panels/compass-panel'

export const metadata: Metadata = {
  title: 'Compass — StudioOS',
}

export default function CompassPage() {
  return <CompassPanel />
}
