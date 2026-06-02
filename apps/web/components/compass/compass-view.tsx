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
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Compass</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Creative direction — vision, tone, and guiding principles for your production.
          </p>
        </div>
        <AddSectionButton projectId={projectId} />
      </div>

      {sections.length === 0 ? (
        <CompassEmptyState />
      ) : (
        <SectionList sections={sections} projectId={projectId} />
      )}
    </div>
  )
}
