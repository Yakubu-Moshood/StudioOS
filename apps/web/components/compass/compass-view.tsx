import { Badge } from '@/components/ui/badge'
import { getSections } from '@/app/actions/compass'
import { AddSectionButton } from './add-section-button'
import { CompassEmptyState } from './compass-empty-state'
import { SectionList } from './section-list'

interface CompassViewProps {
  projectId: string
}

export async function CompassView({ projectId }: CompassViewProps) {
  const sections = await getSections(projectId)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
      <section className="rounded-[1.75rem] border border-[#dce6e2] bg-white/85 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="outline" className="border-[#cbded8] bg-[#f3faf7] text-[#2f7f73]">
              Creative direction
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#0f2433]">Compass</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#667780]">
              Capture the vision, tone, influences, visual language, and boundaries that should guide this production.
            </p>
          </div>
          <AddSectionButton projectId={projectId} />
        </div>
      </section>

      {sections.length === 0 ? (
        <CompassEmptyState />
      ) : (
        <SectionList sections={sections} projectId={projectId} />
      )}
    </div>
  )
}
