import type { Metadata } from 'next'
import { CorePanel } from '@/components/workspace/panels/core-panel'

export const metadata: Metadata = {
  title: 'Core — StudioOS',
}

export default function CorePage() {
  return <CorePanel />
}
