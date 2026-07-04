import { ExternalLink, FileText, PackageCheck } from 'lucide-react'
import type { ArtifactLibraryItem } from '@/app/actions/artifact-library'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ArtifactLibraryPanelProps {
  items: ArtifactLibraryItem[]
}

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

export function ArtifactLibraryPanel({ items }: ArtifactLibraryPanelProps) {
  const registeredItems = items.filter((item) => item.latestVersion)

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
            Registered outputs for this production, collected from the workflow stages.
          </p>
        </div>
        <Badge variant="outline" className="w-fit">{registeredItems.length} registered</Badge>
      </div>

      {registeredItems.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground">
          No artifact versions registered yet. Outputs will appear here after a stage creates or registers an artifact.
        </div>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {registeredItems.map((item) => (
            <article key={`${item.artifactId}-${item.latestVersion?.id}`} className="rounded-2xl border border-[#e1e7e4] bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf3f8] text-[#547896]">
                    <FileText className="h-4 w-4" />
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
                  <Button asChild variant="outline" size="sm" className="w-full justify-center">
                    <a href={item.outputUrl} target="_blank" rel="noreferrer">
                      Open artifact
                      <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="mt-4 rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground">
                  No direct output link found for this version.
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
