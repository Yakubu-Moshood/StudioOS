import { getProjectCore } from '@/app/actions/core'
import { CoreForm } from './core-form'

interface CoreViewProps {
  projectId: string
}

export async function CoreView({ projectId }: CoreViewProps) {
  const core = await getProjectCore(projectId)

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h2 className="text-base font-semibold">Core</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Project foundation — synopsis, genre, tone, and themes.
        </p>
      </div>
      <CoreForm projectId={projectId} initialCore={core} />
    </div>
  )
}
