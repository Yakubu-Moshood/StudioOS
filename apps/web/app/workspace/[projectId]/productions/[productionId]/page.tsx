import { notFound } from 'next/navigation'
import { getProductionWorkflow } from '@/app/actions/productions'
import { getBriefVersions } from '@/app/actions/briefs'
import { BriefPanel } from '@/components/productions/brief-panel'
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
  const [workflow, briefVersions] = await Promise.all([
    getProductionWorkflow(projectId, productionId),
    getBriefVersions(productionId),
  ])

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

      <div className="grid gap-4 md:grid-cols-4">
        {workflow.stages.map((stage) => (
          <section key={stage.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs text-muted-foreground">Stage {stage.position}</span>
                <h2 className="mt-1 font-medium">{STAGE_LABELS[stage.stage_key]}</h2>
              </div>
              <Badge variant={stage.status === 'ready' ? 'default' : 'outline'}>
                {stage.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="mt-4 grid gap-2">
              {stage.tasks.map((task) => (
                <div key={task.id} className="rounded-md bg-muted/40 px-3 py-2 text-sm">
                  <div>{task.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {task.status.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <BriefPanel
        projectId={projectId}
        productionId={productionId}
        versions={briefVersions}
      />

      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Research remains locked until the latest Brief version is explicitly approved.
      </div>
    </div>
  )
}
