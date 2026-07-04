import { ExternalLink, FileText, PackageCheck, Star } from 'lucide-react'
import type { ArtifactLibraryItem } from '@/app/actions/artifact-library'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ArtifactLibraryPanelProps {
  items: ArtifactLibraryItem[]
}

const PRIMARY_ARTIFACT_TYPES = new Set([
  'generated_video',
  'post_production_master',
  'delivery_package',
  'production_package',
])

function labelForArtifactType(type: string) {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function statusLabel(item: ArtifactLibraryItem) {
  if (!item.latestVersion) return 'No versions yet'
  return item.approval?.decision?.replace('_', ' ') ?? 'awaiting approval'
}

function sortArtifacts(a: ArtifactLibraryItem, b: ArtifactLibraryItem) {
  const aPrimary = PRIMARY_ARTIFACT_TYPES.has(a.artifactType) ? 1 : 0
  const bPrimary = PRIMARY_ARTIFACT_TYPES.has(b.artifactType) ? 1 : 0
  if (aPrimary !== bPrimary) return bPrimary - aPrimary

  const aLinked = a.outputUrl ? 1 : 0
  const bLinked = b.outputUrl ? 1 : 0
  if (aLinked !== bLinked) return bLinked - aLinked

  return labelForArtifactType(a.artifactType).localeCompare(labelForArtifactType(b.artifactType))
}

function ArtifactCard({ item, compact = false }: { item: ArtifactLibraryItem; compact?: boolean }) {
  const isPrimary = PRIMARY_ARTIFACT_TYPES.has(item.artifactType)

  return (
    <article className={`rounded-2xl border bg-white p-4 shadow-sm ${isPrimary ? 'border-[#b9d8c8]' : 'border-[#e1e7e4]'} ${compact ? 'opacity-85' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${isPrimary ? 'bg-[#e8f2ee] text-[#2f7f73]' : 'bg-[#edf3f8] text-[#547896]'}`}>
            {isPrimary ? <Star className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          </div>
          <h3 className="line-clamp-1 text-sm font-semibold text-[#0f2433]">{labelForArtifactType(item.artifactType)}</h3>
          <p className="mt-1 text-xs text-[#667780]">Version {item.latestVersion?.version_number}</p>
        </div>
        <Badge variant="outline" className="capitalize">
          {statusLabel(item)}
        </Badge>
      </div>

      {item.outputUrl ? (
        <div className="mt-4">
          <Button asChild variant={isPrimary ? 'default' : 'outline'} size="sm" className="w-full justify-center">
            <a href={item.outputUrl} target="_blank" rel="noreferrer">
              Open artifact
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      ) : compact ? (
        <p className="mt-4 text-xs text-[#8a9a9f]">No direct link</p>
      ) : (
        <p className="mt-4 rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground">
          No direct output link found for this version.
        </p>
      )}
    </article>
  )
}

export function ArtifactLibraryPanel({ items }: ArtifactLibraryPanelProps) {
  const registeredItems = items.filter((item) => item.latestVersion).sort(sortArtifacts)
  const linkedItems = registeredItems.filter((item) => item.outputUrl || PRIMARY_ARTIFACT_TYPES.has(item.artifactType))
  const supportingItems = registeredItems.filter((item) => !linkedItems.includes(item))

  return (
    <section className="rounded-[1.5rem] border border-[#e1e7e4] bg-white/85 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#e8f2ee] text-[#2f7f73]">
              <PackageCheck className="h-4 w-4" />
            </div>
            <h2 className="font-semibold tracking-[-0.02em] text-[#0f2433]">Artifact Library</h2>
          </div>
          <p className="mt-2 text-sm text-[#667780]">
            Key production outputs appear first. Supporting stage artifacts are kept below for record keeping.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="w-fit">{registeredItems.length} registered</Badge>
          <Badge variant="outline" className="w-fit border-[#b9d8c8] bg-[#f0f8f3] text-[#235c43]">{linkedItems.length} priority</Badge>
        </div>
      </div>

      {registeredItems.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground">
          No artifact versions registered yet. Outputs will appear here after a stage creates or registers an artifact.
        </div>
      ) : (
        <div className="mt-5 grid gap-5">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#0f2433]">Priority outputs</h3>
              <p className="text-xs text-[#667780]">Files and packages you are most likely to open or share.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {linkedItems.map((item) => (
                <ArtifactCard key={`${item.artifactId}-${item.latestVersion?.id}`} item={item} />
              ))}
            </div>
          </div>

          {supportingItems.length > 0 ? (
            <details className="rounded-2xl border border-[#e1e7e4] bg-[#f8fbfa] p-4">
              <summary className="cursor-pointer text-sm font-semibold text-[#0f2433]">
                Supporting stage artifacts ({supportingItems.length})
              </summary>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {supportingItems.map((item) => (
                  <ArtifactCard key={`${item.artifactId}-${item.latestVersion?.id}`} item={item} compact />
                ))}
              </div>
            </details>
          ) : null}
        </div>
      )}
    </section>
  )
}
