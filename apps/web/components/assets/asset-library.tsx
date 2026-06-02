import { AssetTypeFilter } from './asset-type-filter'
import { AssetGrid } from './asset-grid'
import { UploadButton } from './upload-button'
import { AddReferenceButton } from './add-reference-button'
import type { AssetWithSignedUrl } from '@/app/actions/assets'
import type { AssetType } from '@studioos/shared'

interface AssetLibraryProps {
  assets: AssetWithSignedUrl[]
  projectId: string
  userId: string
  activeType: AssetType | undefined
}

export function AssetLibrary({ assets, projectId, userId, activeType }: AssetLibraryProps) {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Assets</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Reference library — images, documents, and external references for this project.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <AddReferenceButton projectId={projectId} />
          <UploadButton projectId={projectId} userId={userId} />
        </div>
      </div>

      <AssetTypeFilter activeType={activeType} />

      <AssetGrid assets={assets} projectId={projectId} activeType={activeType} />
    </div>
  )
}
