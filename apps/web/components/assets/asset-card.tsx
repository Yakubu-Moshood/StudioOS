'use client'

import { useTransition } from 'react'
import { FileText, Music, Video, File, Link, Image, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { deleteAsset } from '@/app/actions/assets'
import type { AssetWithSignedUrl } from '@/app/actions/assets'
import { toast } from 'sonner'

const TYPE_ICONS = {
  image:     Image,
  video:     Video,
  audio:     Music,
  document:  FileText,
  reference: Link,
  other:     File,
}

interface AssetCardProps {
  asset: AssetWithSignedUrl
  projectId: string
}

export function AssetCard({ asset, projectId }: AssetCardProps) {
  const [isPending, startTransition] = useTransition()
  const Icon = TYPE_ICONS[asset.type] ?? File

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAsset({
        assetId: asset.id,
        projectId,
        storagePath: asset.storage_path,
      })
      if (result.success) {
        toast.success('Asset deleted.')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="group relative flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <div className="flex aspect-video items-center justify-center overflow-hidden rounded-md bg-muted">
        {asset.type === 'image' && asset.signedUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.signedUrl}
            alt={asset.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <Icon className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate text-sm font-medium leading-tight">{asset.name}</span>
          <Badge variant="outline" className="shrink-0 text-xs capitalize">
            {asset.type}
          </Badge>
        </div>

        {asset.external_url && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ExternalLink className="h-3 w-3 shrink-0" />
            <a
              href={asset.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate underline-offset-2 hover:underline"
            >
              {asset.external_url}
            </a>
          </div>
        )}

        {asset.notes && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{asset.notes}</p>
        )}
      </div>

      <Button
        variant="destructive"
        size="sm"
        className="mt-auto opacity-0 transition-opacity group-hover:opacity-100"
        onClick={handleDelete}
        disabled={isPending}
      >
        {isPending ? 'Deleting…' : 'Delete'}
      </Button>
    </div>
  )
}
