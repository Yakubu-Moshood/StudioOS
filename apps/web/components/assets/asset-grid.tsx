import { AssetCard } from './asset-card'
import type { AssetWithSignedUrl } from '@/app/actions/assets'
import type { AssetType } from '@studioos/shared'

const EMPTY_MESSAGES: Record<AssetType, string> = {
  image:     'No images yet.',
  video:     'No videos yet.',
  audio:     'No audio files yet.',
  document:  'No documents yet.',
  reference: 'No references yet.',
  other:     'No assets yet.',
}

interface AssetGridProps {
  assets: AssetWithSignedUrl[]
  projectId: string
  activeType: AssetType | undefined
}

export function AssetGrid({ assets, projectId, activeType }: AssetGridProps) {
  if (assets.length === 0) {
    const message = activeType ? EMPTY_MESSAGES[activeType] : 'No assets yet. Upload a file or add a reference to get started.'
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-16">
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {assets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} projectId={projectId} />
      ))}
    </div>
  )
}
