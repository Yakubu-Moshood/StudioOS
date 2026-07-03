import { getBriefVersions } from '@/app/actions/briefs'
import { getResearchVersions } from '@/app/actions/research'
import { getScriptVersions } from '@/app/actions/scripts'
import { getProductionPackageVersions } from '@/app/actions/production-packages'
import type { ProductionWorkflowView } from '@/app/actions/productions'
import { BriefPanel } from './brief-panel'
import { ResearchPanel } from './research-panel'
import { ScriptPanel } from './script-panel'
import { PkgPanel } from './pkg-panel'
import { PkgReview } from './pkg-review'
import { WorkflowOverview } from './workflow-overview'

export async function ProductionFlow(props: {
  projectId: string
  productionId: string
  workflow: ProductionWorkflowView
}) {
  const [briefs, research, scripts, packages] = await Promise.all([
    getBriefVersions(props.productionId),
    getResearchVersions(props.productionId),
    getScriptVersions(props.productionId),
    getProductionPackageVersions(props.productionId),
  ])

  const task = (key: string) =>
    props.workflow.stages.flatMap((stage) => stage.tasks).find((item) => item.task_key === key)
  const ready = (key: string) => ['ready', 'failed'].includes(task(key)?.status ?? '')
  const latestPackage = packages[0] ?? null

  return (
    <div className="grid gap-6">
      {props.workflow.production.production_type === 'advertising_campaign' ? (
        <WorkflowOverview stages={props.workflow.stages} />
      ) : null}
      <BriefPanel projectId={props.projectId} productionId={props.productionId} versions={briefs} />
      <ResearchPanel projectId={props.projectId} productionId={props.productionId} canGenerate={ready('generate_research')} versions={research} />
      <ScriptPanel projectId={props.projectId} productionId={props.productionId} canGenerate={ready('generate_script')} versions={scripts} />
      <PkgPanel
        projectId={props.projectId}
        productionId={props.productionId}
        enabled={ready('assemble_production_package')}
        versions={packages}
      />
      {latestPackage && !latestPackage.approval ? (
        <PkgReview projectId={props.projectId} productionId={props.productionId} version={latestPackage} />
      ) : null}
    </div>
  )
}
