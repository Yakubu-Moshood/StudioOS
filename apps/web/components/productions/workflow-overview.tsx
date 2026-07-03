import type { ProductionStage } from '@studioos/shared'
import { Badge } from '@/components/ui/badge'

export function WorkflowOverview({ stages }: { stages: ProductionStage[] }) {
  return (
    <section className="rounded-lg border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-medium">Production Workflow</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This workflow was created from the selected production template.
          </p>
        </div>
        <Badge variant="outline">{stages.length} stages</Badge>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {stages.map((stage) => (
          <div key={stage.id} className="flex items-center gap-3 rounded-md border p-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {stage.position}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{stage.title}</p>
              <p className="text-xs capitalize text-muted-foreground">
                {stage.status.replace('_', ' ')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
