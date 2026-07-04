import { Badge } from '@/components/ui/badge'
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <section className="rounded-[1.75rem] border border-[#dce6e2] bg-white/85 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="outline" className="border-[#cbded8] bg-[#f3faf7] text-[#2f7f73]">
              Structure
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#0f2433]">Map</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667780]">
              Organise the project into clear blocks and track progress as the work develops.
            </p>
          </div>
          <AddBlockButton projectId={projectId} />
        </div>
      </section>

      {blocks.length === 0 ? (
        <MapEmptyState />
      ) : (
        <BlockList blocks={blocks} projectId={projectId} />
      )}
    </div>
  )
}
