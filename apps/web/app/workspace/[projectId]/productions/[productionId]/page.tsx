import { notFound } from 'next/navigation'
import { getProductionWorkflow } from '@/app/actions/productions'
import { Badge } from '@/components/ui/badge'

const STAGE_LABELS = {
  brief: 'Brief',
  research: 'Research',
  script: 'Script',
  production_package: 'Production Package',
} as const

interface ProductionPageProps {
  params: Promise<{ projectId: string; productionId: string }>
}

export default async function ProductionPage({ params }: ProductionPageProps) {
  const { projectId, productionId } = await params
  const workflow = await getProductionWorkflow(projectId, productionId)

  if (!workflow) notFound()

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Production</p>
          <h1 className="text-2xl font-semibold">{workflow.production.title}</h1>
        </div>
        <Badge variant="secondary">{workflow.production.state.replace('_', ' ')}</Badge>
      </div>

      <div className="grid gap-4">
        {workflow.stages.map((stage) => (
          <section key={stage.id} className="rounded-lg border p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border text-sm font-medium">
                  {stage.position}
                </span>
                <h2 className="font-medium">{STAGE_LABELS[stage.stage_key]}</h2>
              </div>
              <Badge variant={stage.status === 'ready' ? 'default' : 'outline'}>
                {stage.status.replace('_', ' ')}
              </Badge>
            </div>

            <div className="mt-4 grid gap-2">
              {stage.tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
                  <span>{task.title}</span>
                  <span className="text-xs text-muted-foreground">{task.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        The workflow foundation is active. Brief editing and artifact-version approval are the next implementation gate.
      </div>
    </div>
  )
}
