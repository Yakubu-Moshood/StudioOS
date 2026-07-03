import { notFound } from 'next/navigation'
import { getProductionWorkflow } from '@/app/actions/productions'
import { ProductionFlow } from '@/components/productions/production-flow'
import { Badge } from '@/components/ui/badge'

export default async function ProductionPage({
  params,
}: {
  params: Promise<{ projectId: string; productionId: string }>
}) {
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
      <ProductionFlow projectId={projectId} productionId={productionId} workflow={workflow} />
    </div>
  )
}
