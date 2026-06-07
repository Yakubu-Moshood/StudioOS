import { getBlocks } from '@/app/actions/blocks'
import { AddBlockButton } from './add-block-button'
import { BlockList } from './block-list'
import { MapEmptyState } from './map-empty-state'

interface MapViewProps {
  projectId: string
}

export async function MapView({ projectId }: MapViewProps) {
  const blocks = await getBlocks(projectId)

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Map</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Production structure — scenes, sequences, acts, and dependencies.
          </p>
        </div>
        <AddBlockButton projectId={projectId} />
      </div>

      {blocks.length === 0 ? (
        <MapEmptyState />
      ) : (
        <BlockList blocks={blocks} projectId={projectId} />
      )}
    </div>
  )
}
