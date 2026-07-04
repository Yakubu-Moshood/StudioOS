import { ExternalLink, FileText, ImageIcon, Music, Package, Video } from 'lucide-react'
import { getProjectAssets } from '@/app/actions/project-assets'
import { ProjectAssetUpload } from '@/components/assets/project-asset-upload'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

interface AssetsPageProps {
  params: Promise<{ projectId: string }>
}

function formatFileSize(size: number | null) {
  if (!size) return 'Unknown size'
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function assetTypeLabel(contentType: string | null) {
  if (!contentType) return 'File'
  if (contentType.startsWith('image/')) return 'Image'
  if (contentType.startsWith('video/')) return 'Video'
  if (contentType.startsWith('audio/')) return 'Audio'
  if (contentType === 'application/pdf') return 'PDF'
  if (contentType.includes('zip')) return 'Archive'
  if (contentType.startsWith('text/')) return 'Text'
  return 'File'
}

function AssetIcon({ contentType }: { contentType: string | null }) {
  if (contentType?.startsWith('image/')) return <ImageIcon className="h-4 w-4" />
  if (contentType?.startsWith('video/')) return <Video className="h-4 w-4" />
  if (contentType?.startsWith('audio/')) return <Music className="h-4 w-4" />
  if (contentType?.includes('zip')) return <Package className="h-4 w-4" />
  return <FileText className="h-4 w-4" />
}

export default async function AssetsPage({ params }: AssetsPageProps) {
  const { projectId } = await params
  const assets = await getProjectAssets(projectId)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 overflow-x-hidden px-4 py-6 sm:px-6">
      <section className="rounded-[1.75rem] border border-[#dce6e2] bg-white/85 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge variant="outline" className="border-[#cbded8] bg-[#f3faf7] text-[#2f7f73]">
              Project library
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#0f2433]">Assets</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667780]">
              Store reusable project files such as brand materials, research documents, logos, scripts, images, audio, and references.
            </p>
          </div>
          <div className="rounded-2xl border border-[#b9d8c8] bg-[#f0f8f3] p-4 text-center lg:min-w-40">
            <p className="text-2xl font-semibold text-[#235c43]">{assets.length}</p>
            <p className="mt-1 text-xs text-[#667780]">Project assets</p>
          </div>
        </div>
      </section>

      <ProjectAssetUpload projectId={projectId} />

      <section className="rounded-[1.5rem] border border-[#e1e7e4] bg-white/85 p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-semibold tracking-[-0.02em] text-[#0f2433]">Asset library</h2>
            <p className="mt-1 text-sm text-[#667780]">Uploaded files available to this project.</p>
          </div>
          <Badge variant="outline" className="w-fit">{assets.length} uploaded</Badge>
        </div>

        {assets.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
            No project assets uploaded yet. Upload a file above to start building this project library.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => (
              <article key={asset.id} className="rounded-2xl border border-[#e1e7e4] bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f2ee] text-[#2f7f73]">
                      <AssetIcon contentType={asset.content_type} />
                    </div>
                    <h3 className="line-clamp-2 text-sm font-semibold text-[#0f2433]">{asset.file_name}</h3>
                    <p className="mt-1 text-xs text-[#667780]">
                      {formatFileSize(asset.file_size)} · {new Date(asset.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">{assetTypeLabel(asset.content_type)}</Badge>
                </div>

                <div className="mt-4">
                  <Button asChild variant="outline" size="sm" className="w-full justify-center">
                    <a href={asset.file_url} target="_blank" rel="noreferrer">
                      Open asset
                      <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
