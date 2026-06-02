import type { Metadata } from 'next'
import { AssetsPanel } from '@/components/workspace/panels/assets-panel'

export const metadata: Metadata = {
  title: 'Assets — StudioOS',
}

export default function AssetsPage() {
  return <AssetsPanel />
}
